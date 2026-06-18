export type Validation = { ok: true } | { ok: false; error: string }

const ok: Validation = { ok: true }
const fail = (error: string): Validation => ({ ok: false, error })

export const MIN_PASSWORD_LENGTH = 6

export function validateRequired(
    value: string | null | undefined,
    error: string
): Validation {
    return value && value.trim() ? ok : fail(error)
}

export function validateCapsuleForm(
    input: { title?: string | null; openDate?: string | null },
    now: number
): Validation {
    if (!input.title || !input.title.trim()) {
        return fail('Please enter a capsule name.')
    }
    if (!input.openDate) {
        return fail('Please choose an opening date.')
    }
    const openMs = new Date(input.openDate).getTime()
    if (openMs <= now) {
        return fail('The opening date must be in the future.')
    }
    return ok
}

export function validatePasswordLength(
    password: string | null | undefined,
    error = 'Password must be at least 6 characters.'
): Validation {
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
        return fail(error)
    }
    return ok
}

export function validatePasswordsMatch(
    password: string,
    confirm: string
): Validation {
    return password === confirm ? ok : fail('Passwords do not match.')
}

export function validateEmailChange(
    newEmail: string | null | undefined,
    currentEmail: string | null | undefined
): Validation {
    const next = (newEmail ?? '').trim().toLowerCase()
    if (!next) {
        return fail('Please enter an e-mail address.')
    }
    if (next === (currentEmail ?? '').toLowerCase()) {
        return fail('This is already your e-mail address.')
    }
    return ok
}

export function validateUsername(
    username: string | null | undefined
): Validation {
    if (!username) return ok
    if (/\s/.test(username)) {
        return fail('Username cannot contain spaces.')
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return fail(
            'Username can only contain letters, numbers, hyphens and underscores.'
        )
    }
    return ok
}

export function validateCredentials(
    email: string | null | undefined,
    password: string | null | undefined
): Validation {
    if (!email || !password) {
        return fail('Please enter your email and password.')
    }
    return ok
}

export function isValidMemoryInput(input: {
    title?: string | null
    lat: number
    lng: number
}): boolean {
    if (!input.title || !input.title.trim()) return false
    if (Number.isNaN(input.lat) || Number.isNaN(input.lng)) return false
    return true
}