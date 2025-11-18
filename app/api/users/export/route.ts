import {NextResponse} from "next/server"
import {getCurrentUser} from "@/lib/session"
import {query} from "@/lib/db"
import {hasPermission} from "@/lib/permissions"

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser()
        if (!user) return NextResponse.json({error: "Unauthorized"}, {status: 401})
        if (!hasPermission(user.role, "canViewAllUsers")) return NextResponse.json({error: "Forbidden"}, {status: 403})

        const {searchParams} = new URL(request.url)
        const format = (searchParams.get("format") || "csv").toLowerCase()
        const filterBags = searchParams.get("bags") // 'true', 'false', or null (all)
        const filterAttendance = searchParams.get("attendance") // 'true', 'false', or null (all)
        const filterDiet = searchParams.get("diet") // 'veg', 'nonveg', or null (all)
        const countOnly = (searchParams.get('mode') === 'count') || (searchParams.get('countOnly') === 'true')

        const whereClauses = ["r.name = 'user'", "u.approval_status = 'approved'"]
        const queryParams: any[] = []
        if (filterBags !== null) { whereClauses.push(`p.bags_checked = $${queryParams.length + 1}`); queryParams.push(filterBags === 'true') }
        if (filterAttendance !== null) { whereClauses.push(`p.attendance = $${queryParams.length + 1}`); queryParams.push(filterAttendance === 'true') }
        if (filterDiet !== null) { whereClauses.push(`p.diet = $${queryParams.length + 1}`); queryParams.push(filterDiet) }

        if (countOnly) {
            const totalRows = await query<{ count: string }>(
                `SELECT COUNT(*)::int as count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'user' AND u.approval_status = 'approved'`
            )
            const filteredRows = await query<{ count: string }>(
                `SELECT COUNT(*)::int as count FROM users u LEFT JOIN profiles p ON u.id = p.user_id JOIN roles r ON u.role_id = r.id WHERE ${whereClauses.join(' AND ')}`,
                queryParams
            )
            return NextResponse.json({ total: Number(totalRows[0]?.count || 0), filtered: Number(filteredRows[0]?.count || 0) })
        }

        if (!['csv','pdf'].includes(format)) {
            return NextResponse.json({error: 'Invalid format'}, {status: 400})
        }

        const rows = await query<any>(
            `SELECT u.name, u.email,
                    p.bags_checked, p.attendance, p.diet, p.allergens,
                    n.scan_count, n.uuid
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
            const header = ["name","email","bags_checked","attendance","received_food","diet","allergens","scan_count"]
            const lines = [header.join(',')]
            for (const r of rows) {
                const line = [
                    escapeCsv(r.name ?? ''),
                    r.email ?? '',
                    r.bags_checked ? 'true' : 'false',
                    r.attendance ? 'true' : 'false',
                    r.received_food ? 'true' : 'false',
                    r.diet ?? '',
                    r.allergens ? escapeCsv(r.allergens) : '',
                    r.scan_count ?? 0
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
            const { rgb } = pdfLib

            const margin = 40
            let x = margin
            let y = page.getHeight() - margin

            const drawText = (text: string, opts: { x?: number; y?: number; size?: number; color?: any; font?: any } = {}) => {
                page.drawText(String(text), {
                    x: opts.x ?? x,
                    y: opts.y ?? y,
                    size: opts.size ?? 10,
                    font: opts.font ?? font,
                    color: opts.color ?? rgb(0,0,0)
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
                {key: 'name', title: 'Name', width: 120},
                {key: 'email', title: 'Email', width: 150},
                {key: 'bags_checked', title: 'Bags', width: 35},
                {key: 'attendance', title: 'Attend', width: 40},
                {key: 'diet', title: 'Diet', width: 45},
                {key: 'allergens', title: 'Allergens', width: 100},
                {key: 'scan_count', title: 'Scans', width: 40},
                {key: 'nfc_link', title: 'NFC Link', width: 232}
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

            const drawRow = (r: any) => {
                x = margin
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nfc.wesmun.org'
                const nfcLink = r.uuid ? `${baseUrl}/nfc/${r.uuid}` : 'N/A'
                const cells = [
                    String(r.name ?? ''),
                    String(r.email ?? ''),
                    r.bags_checked ? '✓' : '✗',
                    r.attendance ? '✓' : '✗',
                    r.received_food ? '✓' : '✗',
                    String(r.diet ?? ''),
                    String(r.allergens ?? ''),
                    String(r.scan_count ?? 0),
                    nfcLink
                ]
                for (let i = 0; i < cols.length; i++) {
                    const c = cols[i]
                    const text = truncate(cells[i], Math.floor(c.width / 6))
                    drawText(text, {x, y, size: 9})
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
                            color: opts.color ?? rgb(0,0,0)
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
                }
                drawRow(r)
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
