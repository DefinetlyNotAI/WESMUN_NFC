import {NextResponse} from "next/server"
import {getCurrentUser} from "@/lib/session"
import {query} from "@/lib/db"
import {hasPermission} from "@/lib/permissions"

// Helper to extract params from either GET query or POST body
async function getExportParams(request: Request) {
    let format: string
    let filterBags: string | null
    let filterAttendance: string | null
    let filterDiet: string | null
    let countOnly: boolean

    if (request.method === 'POST') {
        const body = await request.json()
        format = (body.format || "csv").toLowerCase()
        filterBags = body.bags ?? null
        filterAttendance = body.attendance ?? null
        filterDiet = body.diet ?? null
        countOnly = body.mode === 'count'
    } else {
        const {searchParams} = new URL(request.url)
        format = (searchParams.get("format") || "csv").toLowerCase()
        filterBags = searchParams.get("bags")
        filterAttendance = searchParams.get("attendance")
        filterDiet = searchParams.get("diet")
        countOnly = (searchParams.get('mode') === 'count') || (searchParams.get('countOnly') === 'true')
    }

    return {format, filterBags, filterAttendance, filterDiet, countOnly}
}

async function handleExport(request: Request) {
    try {
        const user = await getCurrentUser()
        if (!user) return NextResponse.json({error: "Unauthorized"}, {status: 401})
        if (!hasPermission(user.role, "canViewAllUsers")) return NextResponse.json({error: "Forbidden"}, {status: 403})

        const {format, filterBags, filterAttendance, filterDiet, countOnly} = await getExportParams(request)

        const whereClauses = ["r.name = 'user'", "u.approval_status = 'approved'"]
        const queryParams: any[] = []
        if (filterBags !== null) {
            whereClauses.push(`p.bags_checked = $${queryParams.length + 1}`);
            queryParams.push(filterBags === 'true')
        }
        if (filterAttendance !== null) {
            whereClauses.push(`p.attendance = $${queryParams.length + 1}`);
            queryParams.push(filterAttendance === 'true')
        }
        if (filterDiet !== null) {
            whereClauses.push(`p.diet = $${queryParams.length + 1}`);
            queryParams.push(filterDiet)
        }

        if (countOnly) {
            const totalRows = await query<{ count: string }>(
                `SELECT COUNT(*)::int as count
                 FROM users u
                          JOIN roles r ON u.role_id = r.id
                 WHERE r.name = 'user'
                   AND u.approval_status = 'approved'`
            )
            const filteredRows = await query<{ count: string }>(
                `SELECT COUNT(*)::int as count
                 FROM users u
                          LEFT JOIN profiles p ON u.id = p.user_id
                          JOIN roles r ON u.role_id = r.id
                 WHERE ${whereClauses.join(' AND ')}`,
                queryParams
            )
            return NextResponse.json({
                total: Number(totalRows[0]?.count || 0),
                filtered: Number(filteredRows[0]?.count || 0)
            })
        }

        if (!['csv', 'pdf'].includes(format)) {
            return NextResponse.json({error: 'Invalid format'}, {status: 400})
        }

        const rows = await query<any>(
            `SELECT u.name,
                    u.email,
                    p.bags_checked,
                    p.attendance,
                    p.received_food,
                    p.diet,
                    p.allergens,
                    n.scan_count,
                    n.uuid
             FROM users u
                      LEFT JOIN profiles p ON u.id = p.user_id
                      LEFT JOIN nfc_links n ON u.id = n.user_id
                      JOIN roles r ON u.role_id = r.id
             WHERE ${whereClauses.join(' AND ')}
             ORDER BY u.created_at ASC`,
            queryParams
        )

        const dateStr = new Date().toISOString().split('T')[0]

        if (format === 'csv') {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nfc.wesmun.com'
            const header = ["name", "email", "bags_checked", "attendance", "received_food", "diet", "allergens", "scan_count", "nfc_link"]
            const lines = [header.join(',')]
            for (const r of rows) {
                const nfcLink = r.uuid ? `${baseUrl}/nfc/${r.uuid}` : 'N/A'
                const line = [
                    escapeCsv(r.name ?? ''),
                    r.email ?? '',
                    r.bags_checked ? 'Y' : 'N',
                    r.attendance ? 'Y' : 'N',
                    r.received_food ? 'Y' : 'N',
                    r.diet ?? '',
                    r.allergens ? escapeCsv(r.allergens) : '',
                    r.scan_count ?? 0,
                    nfcLink
                ].join(',')
                lines.push(line)
            }
            const csv = lines.join('\n')
            return new NextResponse(csv, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename=WESMUN_DELEGATE_DATA_${dateStr}.csv`
                }
            })
        }

        // PDF
        try {
            const pdfLib: any = await import('pdf-lib')
            const pdfDoc = await pdfLib.PDFDocument.create()
            const page = pdfDoc.addPage([842, 595]) // A4 landscape
            const font = await pdfDoc.embedFont(pdfLib.StandardFonts.Helvetica)
            const bold = await pdfDoc.embedFont(pdfLib.StandardFonts.HelveticaBold)
            const {rgb} = pdfLib

            const margin = 40
            let x = margin
            let y = page.getHeight() - margin

            const drawText = (text: string, opts: {
                x?: number;
                y?: number;
                size?: number;
                color?: any;
                font?: any
            } = {}) => {
                page.drawText(String(text), {
                    x: opts.x ?? x,
                    y: opts.y ?? y,
                    size: opts.size ?? 10,
                    font: opts.font ?? font,
                    color: opts.color ?? rgb(0, 0, 0)
                })
            }

            // Header
            drawText('WESMUN Delegate Data', {size: 18, font: bold})
            y -= 22
            drawText(`Generated: ${new Date().toLocaleString()}`, {size: 10})
            y -= 14
            const filters: string[] = []
            if (filterBags) filters.push(`Bags: ${filterBags}`)
            if (filterAttendance) filters.push(`Attendance: ${filterAttendance}`)
            if (filterDiet) filters.push(`Diet: ${filterDiet}`)
            if (filters.length) {
                drawText(`Filters: ${filters.join(' | ')}`, {size: 10})
                y -= 14
            }

            const cols = [
                {key: 'name', title: 'Name', width: 100},
                {key: 'email', title: 'Email', width: 130},
                {key: 'bags_checked', title: 'Bags', width: 30},
                {key: 'attendance', title: 'Attend', width: 35},
                {key: 'received_food', title: 'Food', width: 30},
                {key: 'diet', title: 'Diet', width: 40},
                {key: 'allergens', title: 'Allergens', width: 80},
                {key: 'scan_count', title: 'Scans', width: 35},
                {key: 'nfc_link', title: 'NFC Link', width: 162}
            ]

            // Draw header row
            x = margin
            y -= 6
            for (const c of cols) {
                drawText(c.title, {x, y, font: bold, size: 10})
                x += c.width
            }
            y -= 14

            const rowHeight = 12
            const maxY = margin + 20

            const drawRow = (r: any, currentPage: any) => {
                x = margin
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nfc.wesmun.com'
                const nfcLink = r.uuid ? `${baseUrl}/nfc/${r.uuid}` : 'N/A'
                const cells = [
                    String(r.name ?? ''),
                    String(r.email ?? ''),
                    r.bags_checked ? 'Y' : 'N',
                    r.attendance ? 'Y' : 'N',
                    r.received_food ? 'Y' : 'N',
                    String(r.diet ?? ''),
                    String(r.allergens ?? ''),
                    String(r.scan_count ?? 0),
                    nfcLink
                ]
                for (let i = 0; i < cols.length; i++) {
                    const c = cols[i]
                    const cellValue = cells[i]
                    const isNfcLink = i === cols.length - 1 && r.uuid // Last column and has UUID
                    const text = isNfcLink ? 'Click Here' : truncate(cellValue, Math.floor(c.width / 6))

                    // Apply color for Y/N values and links
                    let color = rgb(0, 0, 0) // default black
                    if (cellValue === 'Y') {
                        color = rgb(0, 0.6, 0) // green
                    } else if (cellValue === 'N') {
                        color = rgb(0.8, 0, 0) // red
                    } else if (isNfcLink) {
                        color = rgb(0, 0, 0.8) // blue for links
                    }

                    drawText(text, {x, y, size: 9, color})

                    // Add clickable link annotation for NFC links
                    if (isNfcLink) {
                        const textWidth = text.length * 5 // approximate width
                        currentPage.drawRectangle({
                            x: x,
                            y: y - 2,
                            width: textWidth,
                            height: 11,
                            borderColor: rgb(0, 0, 0.8),
                            borderWidth: 0,
                            opacity: 0
                        })

                        // Add link annotation
                        currentPage.node.set(pdfLib.PDFName.of('Annots'),
                            currentPage.node.get(pdfLib.PDFName.of('Annots')) || pdfDoc.context.obj([]))

                        const annots = currentPage.node.get(pdfLib.PDFName.of('Annots'))
                        const linkAnnot = pdfDoc.context.obj({
                            Type: 'Annot',
                            Subtype: 'Link',
                            Rect: [x, y - 2, x + textWidth, y + 9],
                            Border: [0, 0, 0],
                            A: {
                                S: 'URI',
                                URI: pdfLib.PDFString.of(nfcLink)
                            }
                        })
                        annots.push(pdfDoc.context.register(linkAnnot))
                    }

                    x += c.width
                }
            }

            for (const r of rows) {
                if (y < maxY) {
                    const p = pdfDoc.addPage([842, 595])
                    y = p.getHeight() - margin
                    x = margin
                    const pDrawText = (text: string, opts: any = {}) => {
                        p.drawText(String(text), {
                            x: opts.x ?? x,
                            y: opts.y ?? y,
                            size: opts.size ?? 10,
                            font: opts.font ?? font,
                            color: opts.color ?? rgb(0, 0, 0)
                        })
                    }
                    // re-draw header
                    for (const c of cols) {
                        pDrawText(c.title, {x, y, font: bold, size: 10})
                        x += c.width
                    }
                    y -= 14
                    // rebind drawText to page p
                    ;(drawText as any) = pDrawText
                    drawRow(r, p)
                } else {
                    drawRow(r, page)
                }
                y -= rowHeight
            }

            const pdfBytes = await pdfDoc.save()
            return new NextResponse(pdfBytes, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename=WESMUN_DELEGATE_DATA_${dateStr}.pdf`
                }
            })
        } catch (e) {
            console.error('[WESMUN] PDF export unavailable', e)
            return NextResponse.json({error: 'PDF export temporarily unavailable. Please use CSV or install pdf-lib.'}, {status: 501})
        }
    } catch (e) {
        console.error('[WESMUN] Export users error', e)
        return NextResponse.json({error: 'Internal server error'}, {status: 500})
    }
}

function escapeCsv(value: string) {
    const v = String(value)
    if (v.includes(',') || v.includes('"') || v.includes('\n')) {
        return '"' + v.replace(/"/g, '""') + '"'
    }
    return v
}

function truncate(str: string, maxLen: number) {
    return str.length > maxLen ? str.substring(0, maxLen - 1) + '…' : str
}

// Export both GET and POST handlers
export async function GET(request: Request) {
    return handleExport(request)
}

export async function POST(request: Request) {
    return handleExport(request)
}
