'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AuthState = { error?: string; message?: string }

export async function authenticate(
    _prevState: AuthState,
    formData: FormData
): Promise<AuthState> {
    const intent = formData.get('intent') as string
    const email = (formData.get('email') as string)?.trim()
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Please enter your email and password.' }
    }

    const supabase = await createClient()

    if (intent === 'signup') {
        if (password.length < 6) {
            return { error: 'Password must be at least 6 characters long.' }
        }

        const headerList = await headers()
        const origin = headerList.get('origin') ?? `https://${headerList.get('host') ?? ''}`

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/auth/confirm`,
            },
        })
        if (error) {
            return { error: error.message }
        }

        return {
            message: 'Account created. Check your inbox to confirm your email address.',
        }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
        return { error: 'Invalid email or password.' }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}