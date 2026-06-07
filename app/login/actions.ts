'use server'

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
        return { error: 'Podaj adres e-mail i hasło.' }
    }

    const supabase = await createClient()

    if (intent === 'signup') {
        if (password.length < 6) {
            return { error: 'Hasło musi mieć co najmniej 6 znaków.' }
        }

        const { error } = await supabase.auth.signUp({ email, password })
        if (error) {
            return { error: error.message }
        }

        return {
            message: 'Konto utworzone. Sprawdź skrzynkę e-mail, aby potwierdzić adres.',
        }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
        return { error: 'Nieprawidłowy e-mail lub hasło.' }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}