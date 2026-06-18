'use server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import {encrypt, encryptBuffer} from '@/lib/crypto'
import { revalidatePath } from 'next/cache'
import {redirect } from 'next/navigation'
import { createClient} from '@/lib/supabase/server'
import {normalizeTags } from '@/lib/tags'
import { validateCapsuleForm, validateRequired, isValidMemoryInput } from '@/lib/validation'

export type CapsuleFormState = { error?: string }
export type WizardState = { error?: string }


export async function openCapsule(formData: FormData) {
    const id = formData.get('capsule_id') as string
    const submittedPassword = (formData.get('capsule_password') as string) ?? ''

    const supabase = await createClient()
    const {
        data: { user},
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const {data: capsule } = await supabase
        .from('capsules')
        .select('id, status, owner_id, capsule_password_hash, open_conditions(open_date)')
        .eq('id', id)
        .maybeSingle()

    if (!capsule) {
        redirect('/dashboard')
    }

    if (capsule.owner_id !== user.id) {
        redirect('/dashboard')
    }

    if (capsule.status !== 'opened'){
        const cond = Array.isArray(capsule.open_conditions)
            ? capsule.open_conditions[0]
            : capsule.open_conditions
        const openDate: string | null = cond?.open_date ?? null
        const openMs = openDate ? new Date(openDate).getTime() : null


        if (openMs === null || openMs > Date.now()) {
            redirect(`/capsules/${id}?locked=1` )
        }

        if (capsule.capsule_password_hash) {
            const passwordOk = submittedPassword
                ? await bcrypt.compare(submittedPassword, capsule.capsule_password_hash)
                : false
            if (!passwordOk) {
                redirect(`/capsules/${id}?error=password`)
            }
        }

        await supabase.from('capsules').update({ status: 'opened' }).eq('id', id)

        await supabase.from('open_history').insert({
            capsule_id: id,
            opened_by: user.id,
            conditions_met: capsule.capsule_password_hash
                ? 'Open date reached, password verified'
                : 'Open date reached',
        })

        await supabase.rpc('log_audit', {
            p_action: 'open',
            p_entity_type: 'capsule',
            p_entity_id: id,
        })
        await supabase.rpc('notify_capsule_members', {
            cap_id: id,
            p_type: 'condition_met',
            p_exclude: user.id,
        })
    }

    revalidatePath(`/capsules/${id}`)
    redirect(`/capsules/${id}`)
}

export async function inviteMember(formData: FormData) {
    const capsuleId = formData.get('capsule_id' ) as string
    const email = (formData.get('email') as string)?.trim( )
    const role = (formData.get('role') as string) === 'editor' ? 'editor' : 'viewer'

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    if (!email) {
        redirect(`/capsules/${capsuleId}?invite=empty`)
    }

    const { data: status, error } = await supabase.rpc('invite_member', {
        cap_id: capsuleId,
        invitee_email: email,
        invitee_role: role,
    })

    if (status === 'ok') {
        await supabase.rpc('log_audit', {
            p_action: 'invite_member',
            p_entity_type: 'capsule',
            p_entity_id: capsuleId,
        })
    }

    revalidatePath(`/capsules/${capsuleId}`)
    redirect(`/capsules/${capsuleId}?invite=${error ? 'error' : status}`)
}

export async function removeMember(formData: FormData) {
    const capsuleId = formData.get('capsule_id') as string
    const memberId = formData.get('member_id') as string

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login' )
    }

    await supabase.from( 'capsule_members').delete().eq('id', memberId)
    await supabase.rpc('log_audit', {
        p_action: 'remove_member',
        p_entity_type: 'capsule',
        p_entity_id: capsuleId,
    })

    revalidatePath(`/capsules/${capsuleId}`)
    redirect(`/capsules/${capsuleId}`)
}

export async function createCapsuleFull(
    _prevState: WizardState,
    formData: FormData
): Promise<WizardState> {
    const title = (formData.get('title') as string)?.trim()
    const description = (formData.get('description') as string)?.trim()
    const message = (formData.get('message') as string)?.trim()
    const openDate = formData.get('open_date') as string
    const invitesRaw = (formData.get('invites') as string) || '[]'
    const files = formData.getAll('files') as File[]
    const capsulePassword = (formData.get('capsule_password') as string)?.trim()
    const sealDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    const visibility = (formData.get('visibility') as string) || 'private'
    const memLat = parseFloat(formData.get('memory_lat')as string)
    const memLng = parseFloat(formData.get('memory_lng') as string)
    const isPublic = visibility === 'public'
    const memCover = formData.get('memory_cover') as File | null
    const tagsRaw = (formData.get('tags') as string) || ''

    const formCheck = validateCapsuleForm({ title, openDate }, Date.now())
    if (!formCheck.ok) return { error: formCheck.error }

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be signed in.' }

    let passwordHash: string | null = null
    if (capsulePassword) {
        passwordHash = await bcrypt.hash(capsulePassword, 10)
    }

    const { data: capsule, error: capsuleError } = await supabase
        .from('capsules')
        .insert({
            owner_id: user.id,
            title,
            description: description || null,
            status: 'collecting',
            is_public: isPublic,
            sealed_at: null, //new Date().toISOString(),
            seal_deadline: sealDeadline,
            capsule_password_hash: passwordHash,
        })
        .select('id')
        .single()

    if (capsuleError || !capsule) {
        return { error: 'Could not create the capsule. Please try again.' }
    }


    if (message) {
        await supabase
            .from('capsule_contents')
            .insert({
                capsule_id: capsule.id,
                encrypted_message: encrypt(message),
                author_id: user.id,
            })
    }


    await supabase
        .from('open_conditions' )
        .insert({ capsule_id: capsule.id, open_date: openDate })

    for (const file of files) {
        if (!file || file.size === 0) continue

        const bytes = Buffer.from(await file.arrayBuffer())
        const encrypted = encryptBuffer(bytes)
        const path = `${capsule.id}/${crypto.randomUUID()}-${file.name}`

        const { error: uploadError } = await supabase.storage
            .from('capsule-files')
            .upload(path, encrypted, { contentType: 'application/octet-stream' })

        if (!uploadError) {
            await supabase.from('capsule_files').insert({
                capsule_id: capsule.id,
                file_name: file.name,
                mime_type: file.type,
                size_bytes: file.size,
                storage_path: path,
                author_id: user.id,
            })
        }
    }
    await supabase.rpc('log_audit', {
        p_action: 'create',
        p_entity_type: 'capsule',
        p_entity_id: capsule.id,
    })

    if (isPublic && !Number.isNaN(memLat) && !Number.isNaN(memLng)) {
        let memCoverUrl: string | null = null
        if (memCover && memCover.size > 0) {
            const ext = memCover.name.split('.').pop() || 'jpg'
            const coverPath = `${user.id}/${crypto.randomUUID()}.${ext}`
            const bytes = Buffer.from(await memCover.arrayBuffer())
            const { error: coverErr } = await supabase.storage
                .from('memory-covers')
                .upload(coverPath, bytes, { contentType: memCover.type })
            if (!coverErr) {
                const { data: pub } = supabase.storage.from('memory-covers').getPublicUrl(coverPath)
                memCoverUrl = pub.publicUrl
            }
        }

        await supabase.from('public_memories').upsert(
            {
                capsule_id: capsule.id,
                owner_id: user.id,
                title,
                note: null,
                lat: memLat,
                lng: memLng,
                cover_url: memCoverUrl,
                memory_date: new Date().toISOString().slice(0, 10),
            },
            { onConflict: 'capsule_id' }
        )
    }

    try {
        const invites: string[] = JSON.parse(invitesRaw)
        for (const email of invites) {
            await supabase.rpc('invite_member', {
                cap_id: capsule.id,
                invitee_email: email,
                invitee_role: 'viewer',
            })
        }
    } catch {
    }
    const tags = normalizeTags(tagsRaw)
    for (const name of tags) {
        const { data: tagRow } = await supabase
            .from('tags')
            .upsert({ name }, { onConflict: 'name' })
            .select('id')
            .single()
        if (tagRow) {
            await supabase
                .from('capsule_tags')
                .upsert(
                    { capsule_id: capsule.id, tag_id: tagRow.id },
                    { onConflict: 'capsule_id,tag_id' }
                )
        }
    }

    revalidatePath('/dashboard')
     redirect('/dashboard')
}

export async function checkUserExists(email: string): Promise<boolean> {
    const supabase = await createClient()
    const { data } = await supabase.rpc('user_exists_by_email', {
        check_email: email,
    })
    return data === true
}


export type EditState = { error?: string; success?: string }

export async function updateCapsuleMeta(
    _prevState: EditState,
    formData: FormData
): Promise<EditState> {
    const id = formData.get('capsule_id') as string
    const title = (formData.get('title') as string)?.trim()
    const description = (formData.get('description') as string)?.trim()

    const titleCheck = validateRequired(title, 'Please enter a title.')
    if (!titleCheck.ok) return { error: titleCheck.error }

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be signed in.' }


    const { data: capsule } = await supabase
        .from('capsules')
        .select('owner_id, status')
        .eq('id', id)
        .maybeSingle()

    if (!capsule || capsule.owner_id !== user.id) {
        return { error: 'You are not allowed to edit this capsule.'}
    }
    if (capsule.status === 'collecting') {
        return {error: 'Use the collecting view to manage this capsule.' }
    }

    const { error: updateError } = await supabase
        .from('capsules')
        .update({ title, description: description || null })
        .eq('id', id)

    if (updateError) {
        return {  error: 'Could not update the capsule.' }
    }

    revalidatePath(`/capsules/${id}`)
    return { success: 'Changes saved.' }
    // redirect(`/capsules/${id}` )
}

async function canContribute(capsuleId: string): Promise<{ ok: boolean; userId?: string }> {
    const supabase = await createClient()
    const {
        data: {user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false }

    const { data: capsule } = await supabase
        .from('capsules')
        .select('owner_id, status')
        .eq('id', capsuleId)
        .maybeSingle()

    if (!capsule || capsule.status !== 'collecting') return { ok: false }
    if (capsule.owner_id === user.id) return {ok: true, userId:user.id }

    const { data: member } = await supabase
        .from('capsule_members')
        .select('status')
        .eq('capsule_id', capsuleId)
        .eq('user_id', user.id)
        .maybeSingle()

    return {  ok: member?.status === 'accepted', userId: user.id}
}

export async function addContribution(formData: FormData) {
    const capsuleId = formData.get('capsule_id') as string
    const message = (formData.get('message') as string)?.trim()

    const { ok, userId } = await  canContribute(capsuleId)
    if (!ok || !userId) {
        redirect(`/capsules/${capsuleId}?contrib=forbidden`)
    }
    if (!message) {
        redirect(`/capsules/${capsuleId}`)
    }

    const supabase = await createClient()
    await supabase.from('capsule_contents').insert({
        capsule_id: capsuleId,
        encrypted_message: encrypt(message),
        author_id: userId,
    })

    await supabase.rpc('notify_capsule_members', {
        cap_id:capsuleId,
        p_type: 'activity',
        p_exclude: userId,
    })

    revalidatePath(`/capsules/${capsuleId}`)
    redirect(`/capsules/${capsuleId}`)
}

export async function  addContributionFile(formData: FormData) {
    const capsuleId = formData.get('capsule_id') as string
    const file= formData.get('file') as File

    const { ok, userId } = await canContribute(capsuleId)
    if (!ok || !userId) {
        redirect(`/capsules/${capsuleId}?contrib=forbidden`)
    }
    if (!file || file.size === 0) {
        redirect(`/capsules/${capsuleId}`)
    }

    const supabase = await createClient()
    const bytes = Buffer.from(await file.arrayBuffer())
    const encrypted = encryptBuffer(bytes)
    const path= `${capsuleId}/${crypto.randomUUID()}-${file.name}`

    const { error: uploadError } = await supabase.storage
        .from('capsule-files')
        .upload(path, encrypted, { contentType:'application/octet-stream'})

    if (!uploadError) {
        await supabase.from('capsule_files').insert({
            capsule_id: capsuleId,
            file_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
            storage_path: path,
            author_id: userId,
        })
    }
    await supabase.rpc('notify_capsule_members', {
        cap_id: capsuleId,
        p_type: 'activity',
        p_exclude: userId,
    })

    revalidatePath(`/capsules/${capsuleId}`)
    redirect(`/capsules/${capsuleId}`)
}


export async function sealNow(formData: FormData) {
    const capsuleId = formData.get('capsule_id') as string

    const supabase = await createClient()
    const {
        data: { user},
    } = await supabase.auth.getUser()
    if (!user ) {
        redirect('/login')
    }

    const { data: capsule } = await supabase
        .from('capsules')
        .select('owner_id, status')
        .eq('id', capsuleId)
        .maybeSingle()

    if (!capsule || capsule.owner_id !== user.id || capsule.status !== 'collecting') {
        redirect(`/capsules/${capsuleId}`)
    }

    await supabase
        .from('capsules' )
        .update({ status: 'sealed', sealed_at:new Date().toISOString() })
        .eq('id', capsuleId)

    await supabase.rpc('log_audit', {
        p_action: 'seal',
        p_entity_type: 'capsule',
        p_entity_id:capsuleId,
    })

    revalidatePath(`/capsules/${capsuleId}`)
    redirect(`/capsules/${capsuleId}`)
}

export async function finishContribution(formData: FormData) {
    const capsuleId = formData.get('capsule_id') as string

    const supabase = await createClient()
    const {
        data: {user },
    } = await supabase.auth.getUser()
    if (!user){
        redirect('/login')
    }

    await supabase
        .from('capsule_members')
        .update({ contribution_done: true })
        .eq('capsule_id', capsuleId)
        .eq('user_id', user.id)

    revalidatePath(`/capsules/${capsuleId}` )
    redirect(`/capsules/${capsuleId}/done`)
}


export async function respondToInvitation(formData: FormData) {
    const memberId  = formData.get('member_id') as string
    const accept =formData.get('accept') === 'true'

    const supabase = await createClient()
    const {
        data: {user},
    } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const {data: result} = await supabase.rpc('respond_to_invitation', {
        member_row_id: memberId,
        accept,
    })
    await supabase.rpc('log_audit', {
        p_action: accept ? 'accept_invite' : 'decline_invite',
        p_entity_type: 'capsule_member',
        p_entity_id: memberId,
    })

    revalidatePath('/invitations')
    revalidatePath('/dashboard')

    if (result ==='accepted') {
        const { data: row } = await supabase
            .from('capsule_members')
            .select('capsule_id')
            .eq('id',memberId)
            .maybeSingle()
        if (row?.capsule_id) {
            redirect(`/capsules/${row.capsule_id}`)
        }
    }

    redirect('/invitations')
}


export async  function deleteContribution(formData: FormData){
    const capsuleId = formData.get('capsule_id') as string
    const contentId = formData.get('content_id') as string

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    await supabase.from('capsule_contents').delete().eq('id',contentId)

    revalidatePath(`/capsules/${capsuleId}`)
    redirect(`/capsules/${capsuleId}`)
}



export async function deleteContributionFile(formData: FormData) {
    const capsuleId = formData.get('capsule_id') as string
    const fileId = formData.get('file_id') as string

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: fileRow } = await supabase
        .from('capsule_files')
        .select('storage_path')
        .eq('id', fileId)
        .maybeSingle()

    if (fileRow) {
        await supabase.storage.from('capsule-files').remove([fileRow.storage_path])
        await supabase.from('capsule_files').delete().eq('id', fileId)
    }

    revalidatePath(`/capsules/${capsuleId}`)
    redirect(`/capsules/${capsuleId}`)
}

export async function deleteCapsule(formData: FormData) {
    const capsuleId = formData.get('capsule_id') as string

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: capsule } = await supabase
        .from('capsules')
        .select('owner_id')
        .eq('id', capsuleId)
        .maybeSingle()

    if (!capsule || capsule.owner_id !== user.id){
        redirect(`/capsules/${capsuleId}`)
    }

    const { data: files} = await supabase
        .from('capsule_files')
        .select('storage_path')
        .eq('capsule_id', capsuleId)

    if (files &&  files.length > 0) {
        await supabase.storage.from('capsule-files').remove(files.map((f) => f.storage_path))
    }
    await supabase.rpc('log_audit', {
        p_action: 'delete',
        p_entity_type: 'capsule',
        p_entity_id:capsuleId,
    })


    await supabase.from('capsules').delete().eq('id', capsuleId)

    revalidatePath('/dashboard')
    redirect('/dashboard')
}

export async function markNotificationsRead() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.rpc('mark_notifications_read')
    revalidatePath('/notifications')
}

export async function openNotification(formData: FormData) {
    const notifId = formData.get('notif_id') as string
    const capsuleId = formData.get('capsule_id') as string

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    await supabase.rpc('mark_one_notification_read', { notif_id: notifId })

    revalidatePath('/notifications')
    redirect(capsuleId ? `/capsules/${capsuleId}` : '/notifications' )
}

export async function shareMemory(formData: FormData) {
    const capsuleId = formData.get('capsule_id') as string
    const title = (formData.get('title') as string)?.trim()
    const note = (formData.get('note') as string)?.trim()
    const lat = parseFloat(formData.get('lat') as string)
    const lng = parseFloat(formData.get('lng') as string)
    const cover = formData.get('cover') as File | null

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    if (!isValidMemoryInput({ title, lat, lng })) {
        redirect(`/capsules/${capsuleId}/share?error=1`)
    }
    const { data: capsule } = await supabase
        .from('capsules')
        .select('owner_id')
        .eq('id', capsuleId)
        .maybeSingle()
    if (!capsule || capsule.owner_id !== user.id) {
        redirect(`/capsules/${capsuleId}`)
    }
    let coverUrl: string | null = null
    if (cover && cover.size > 0) {
        const ext = cover.name.split('.').pop() || 'jpg'
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`
        const bytes = Buffer.from(await cover.arrayBuffer())
        const { error: upErr } = await supabase.storage
            .from('memory-covers')
            .upload(path, bytes, { contentType: cover.type })
        if (upErr) {
        } else {
            const { data: pub } = supabase.storage.from('memory-covers').getPublicUrl(path)
            coverUrl = pub.publicUrl
            console.log('cover url:', coverUrl)
        }
    } else {
    }

    if (!coverUrl) {
        const { data: existing } = await supabase
            .from('public_memories')
            .select('cover_url')
            .eq('capsule_id', capsuleId)
            .maybeSingle()
        coverUrl = existing?.cover_url ?? null
    }

    const { error: upsertError } = await supabase
        .from('public_memories')
        .upsert(
            {
                capsule_id: capsuleId,
                owner_id: user.id,
                title,
                note: note || null,
                lat:lat,
                lng: lng,
                cover_url: coverUrl,
                memory_date: new Date().toISOString().slice(0, 10),
            },
            { onConflict: 'capsule_id'}
        )

    if (upsertError){
        redirect(`/capsules/${capsuleId}/share?error=1`)
    }

    await  supabase.from('capsules').update({ is_public: true }).eq('id', capsuleId)

    await supabase.rpc('notify_capsule_members', {
        cap_id: capsuleId,
        p_type: 'public',
        p_exclude:user.id,
    })

    revalidatePath('/memories')
    revalidatePath('/dashboard')
    redirect('/dashboard?shared=1')
}

export async function deleteMemory(formData: FormData) {
    const memoryId = formData.get('memory_id') as string
    const capsuleId = (formData.get('capsule_id') as string) || ''
    const returnTo= (formData.get('return_to') as string)|| '/memories'

    const supabase = await createClient()
    const { data: { user }} =  await supabase.auth.getUser()
    if (!user) redirect('/login')

    await supabase.from('public_memories').delete().eq('id', memoryId)

    if (capsuleId){
        await supabase
            .from('capsules')
            .update({ is_public: false })
            .eq('id', capsuleId)
            .eq('owner_id', user.id)
    }

    revalidatePath('/memories')
    if (capsuleId) revalidatePath(`/capsules/${capsuleId}`)
    redirect(returnTo)
}

export async function updateCapsuleTags(formData: FormData) {
    const capsuleId = formData.get('capsule_id') as string
    const tagsRaw = (formData.get('tags') as string) || ''

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: capsule } = await supabase
        .from('capsules')
        .select('owner_id, status')
        .eq('id', capsuleId)
        .maybeSingle()

    if (!capsule || capsule.owner_id !== user.id) {
        redirect(`/capsules/${capsuleId}`)
    }

    if (capsule.status === 'opened') {
        redirect(`/capsules/${capsuleId}`)
    }

    const tags = normalizeTags(tagsRaw)

    const tagIds: string[] = []
    for (const name of tags) {

        const { data: existing } = await supabase
            .from('tags')
            .select('id')
            .eq('name', name)
            .maybeSingle()

        if (existing) {
            tagIds.push(existing.id)
            continue
        }

        const { data: created, error: createErr } = await supabase
            .from('tags')
            .insert({ name })
            .select('id')
            .single()
        console.log('TAG create:', name, 'err:', createErr)
        if (created) tagIds.push(created.id)
    }
    console.log('TAGS resolved tagIds:', tagIds)

    const { error: delErr } = await supabase.from('capsule_tags').delete().eq('capsule_id', capsuleId)
    console.log('TAGS delete error:', delErr)

    if (tagIds.length > 0) {

        const { error: insErr } = await supabase.from('capsule_tags').upsert(
            tagIds.map((tag_id) => ({ capsule_id: capsuleId, tag_id })),
            { onConflict: 'capsule_id,tag_id' }
        )
        if (insErr) {
            redirect(`/capsules/${capsuleId}?tags=error`)
        }
        await supabase
            .from('capsule_tags')
            .delete()
            .eq('capsule_id', capsuleId)
            .not('tag_id', 'in', `(${tagIds.join(',')})`)
    } else {
        await supabase.from('capsule_tags').delete().eq('capsule_id', capsuleId)
    }

    revalidatePath(`/capsules/${capsuleId}`)
    redirect(`/capsules/${capsuleId}`)
}