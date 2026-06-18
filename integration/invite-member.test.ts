import { createClient } from '@supabase/supabase-js'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import crypto from 'crypto'

const admin = createClient(process.env.SUPABASE_URL!, process.env.SERVICE_ROLE_KEY!)
function anonClient() {
    return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
}

const ownerId = crypto.randomUUID()
const inviteeId = crypto.randomUUID()
const outsiderId = crypto.randomUUID()
const ownerEmail = `owner-${ownerId}@test.local`
const inviteeEmail = `invitee-${inviteeId}@test.local`
const outsiderEmail = `outsider-${outsiderId}@test.local`
let capsuleId: string

async function signIn(email: string) {
    const c = anonClient()
    const { error } = await c.auth.signInWithPassword({ email, password: 'password123' })
    if (error) throw new Error('signIn ' + email + ': ' + error.message)
    return c
}

beforeAll(async () => {
    const users: [string, string][] = [
        [ownerId, ownerEmail], [inviteeId, inviteeEmail], [outsiderId, outsiderEmail],
    ]
    for (const [id, email] of users) {
        const { error } = await admin.auth.admin.createUser({ id, email, password: 'password123', email_confirm: true })
        if (error) throw new Error('createUser ' + email + ': ' + error.message)
    }
    const { error: eP } = await admin.from('profiles').upsert(
        users.map(([id, email]) => ({ id, email }))
    )
    if (eP) throw new Error('upsert profiles: ' + eP.message)

    const { data: cap, error: eC } = await admin.from('capsules')
        .insert({ owner_id: ownerId, title: 'Invite test', status: 'collecting' })
        .select('id').single()
    if (eC) throw new Error('insert capsule: ' + eC.message)
    capsuleId = cap!.id
})

afterAll(async () => {
    await admin.from('profiles').delete().in('id', [ownerId, inviteeId, outsiderId])
    await admin.auth.admin.deleteUser(ownerId)
    await admin.auth.admin.deleteUser(inviteeId)
    await admin.auth.admin.deleteUser(outsiderId)
})

describe('Funkcja invite_member', () => {
    it('nieistniejący użytkownik → notfound', async () => {
        const c = await signIn(ownerEmail)
        const { data, error } = await c.rpc('invite_member', {
            cap_id: capsuleId,
            invitee_email: `nieistnieje-${crypto.randomUUID()}@test.local`,
            invitee_role: 'viewer',
        })
        expect(error).toBeNull()
        expect(data).toBe('notfound')
    })

    it('zaproszenie samego siebie → self', async () => {
        const c = await signIn(ownerEmail)
        const { data } = await c.rpc('invite_member', {
            cap_id: capsuleId, invitee_email: ownerEmail, invitee_role: 'viewer',
        })
        expect(data).toBe('self')
    })

    it('poprawne zaproszenie → ok, a powtórne → exists', async () => {
        const c = await signIn(ownerEmail)
        const first = await c.rpc('invite_member', {
            cap_id: capsuleId, invitee_email: inviteeEmail, invitee_role: 'viewer',
        })
        expect(first.data).toBe('ok')
        const second = await c.rpc('invite_member', {
            cap_id: capsuleId, invitee_email: inviteeEmail, invitee_role: 'viewer',
        })
        expect(second.data).toBe('exists')
    })

    it('osoba niebędąca właścicielem → forbidden', async () => {
        const c = await signIn(outsiderEmail)
        const { data } = await c.rpc('invite_member', {
            cap_id: capsuleId, invitee_email: inviteeEmail, invitee_role: 'viewer',
        })
        expect(data).toBe('forbidden')
    })
})