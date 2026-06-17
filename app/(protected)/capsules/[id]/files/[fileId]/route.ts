import { createClient } from '@/lib/supabase/server'
import { decryptBuffer } from '@/lib/crypto'
import { canAccessCapsuleFile } from '@/lib/capsule-access'
import { NextResponse } from 'next/server'

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string; fileId: string }> }
) {
    const { id, fileId } = await params

    const supabase = await createClient()
    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data: capsule } = await supabase
        .from('capsules')
        .select('id, status')
        .eq('id', id)
        .maybeSingle()

    if (!capsule) {
        return new NextResponse('Not found', { status: 404 })
    }
    if (capsule.status !== 'opened') {
        const { data: isOwnerData } = await supabase.rpc('is_capsule_owner', { cap_id: id })
        const { data: isMemberData } = await supabase.rpc('is_accepted_member',{ cap_id:id })
        const allowed = canAccessCapsuleFile({
            status: capsule.status,
            isOwner: !!isOwnerData,
            isAcceptedMember: !!isMemberData,
        })
        if (!allowed) {
            return new NextResponse('Not allowed yet', { status: 403 })
        }
    }

    const {data: fileRow } = await supabase
        .from('capsule_files')
        .select('file_name, mime_type, storage_path, capsule_id')
        .eq('id', fileId)
        .maybeSingle()

    if (!fileRow || fileRow.capsule_id !== id) {
        return new NextResponse('Not found', { status: 404 })
    }


    const { data: blob, error: downloadError} = await supabase.storage
        .from('capsule-files')
        .download(fileRow.storage_path)

    if (downloadError || !blob) {
        return new NextResponse('Could not read the file', { status: 500 })
    }

    const encryptedBuffer= Buffer.from(await blob.arrayBuffer())
    let decrypted: Buffer
    try {
        decrypted = decryptBuffer(encryptedBuffer)
    } catch {
        return new NextResponse('Could not decrypt the file', { status: 500 })
    }

    return new NextResponse(new Uint8Array(decrypted), {
        status: 200,
        headers: {
            'Content-Type': fileRow.mime_type || 'application/octet-stream',
            'Content-Disposition': `inline; filename="${encodeURIComponent(fileRow.file_name)}"`,
        },
    })
}