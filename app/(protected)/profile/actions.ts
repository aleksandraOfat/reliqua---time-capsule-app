'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import crypto from 'crypto'

export type ProfileState = { error?: string; success?: string }

export async function updateProfile(
    _prev: ProfileState,
    formData: FormData
): Promise<ProfileState> {
    const fullName = (formData.get('full_name') as string)?.trim()
    const username = (formData.get('username') as string)?.trim()
    if (username && /\s/.test(username)) {
        return { error: 'Username cannot contain spaces.' }
    }
    if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
        return { error: 'Username can only contain letters, numbers, hyphens and underscores.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not signed in.' }

    let first_name: string | null = null
    let last_name: string | null = null
    if (fullName) {
        const parts = fullName.split(' ')
        first_name = parts.shift() ?? null
        last_name = parts.join(' ') || null
    }

    const { error } = await supabase
        .from('profiles')
        .update({ first_name, last_name, username: username || null })
        .eq('id', user.id)

    if (error) {
        if (error.code === '23505') return { error: 'That username is already taken.' }
        return { error: 'Could not save your profile.' }
    }
    revalidatePath('/profile')
    return { success: 'Profile updated.' }
}

export async function changeEmail(
    _prev: ProfileState,
    formData: FormData
): Promise<ProfileState> {
    const email = (formData.get('email') as string)?.trim().toLowerCase()

    if (!email) {
        return { error: 'Please enter an e-mail address.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not signed in.' }

    if (email === (user.email ?? '').toLowerCase()) {
        return { error: 'This is already your e-mail address.' }
    }

    const { error } = await supabase.auth.updateUser({ email })
    if (error) return { error: error.message }

    return { success: 'Check your e-mail (including your current address) to confirm the change.' }
}

export async function updateAvatar(formData: FormData) {
    const file = formData.get('avatar') as File
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    if (!file || file.size === 0) {
        redirect('/profile')
    }

    const ext = file.name.split('.').pop() || 'png'
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`

    const bytes = Buffer.from(await file.arrayBuffer())

    const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, bytes, { contentType: file.type, upsert: true })


    if (upErr) {
    } else {
        const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
        await supabase.from('profiles').update({ avatar_url: pub.publicUrl }).eq('id', user.id)
    }
    revalidatePath('/profile')
    redirect('/profile')
}

export async function updateNotificationPrefs(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    await supabase.from('profiles').update({
        notify_opening: formData.get('notify_opening') === 'on',
        notify_reminder: formData.get('notify_reminder') === 'on',
        notify_invitations: formData.get('notify_invitations') === 'on',
        notify_group_activity: formData.get('notify_group_activity') === 'on',
    }).eq('id', user.id)

    revalidatePath('/profile')
}

export async function deleteAccount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: myCapsules } = await supabase
        .from('capsules')
        .select('id')
        .eq('owner_id', user.id)
    const ids = (myCapsules ?? []).map((c) => c.id)
    if (ids.length > 0) {
        const { data: files } = await supabase
            .from('capsule_files')
            .select('storage_path')
            .in('capsule_id', ids)
        if (files && files.length > 0) {
            await supabase.storage.from('capsule-files').remove(files.map((f) => f.storage_path))
        }
    }

    await supabase.rpc('delete_my_account')
    await supabase.auth.signOut()
    redirect('/login')
}

export async function changePassword(
    _prev: ProfileState,
    formData: FormData
): Promise<ProfileState> {
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (!password || password.length < 6) {
        return { error: 'Password must be at least 6 characters.' }
    }
    if (password !== confirm) {
        return { error: 'Passwords do not match.' }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: error.message }
    return { success: 'Password updated.' }
}