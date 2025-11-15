import {Dispatch, SetStateAction} from "react";

export const copyUuid = (
    uuid: string,
    userId: string,
    setCopiedUuid: Dispatch<SetStateAction<string | null>>
) => {
    const fullUrl = `${window.location.origin}/nfc/${uuid}`
    navigator.clipboard.writeText(fullUrl).catch(console.error)
    setCopiedUuid(userId)
    setTimeout(() => setCopiedUuid(null), 2000)
}
