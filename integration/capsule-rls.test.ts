import { createClient } from '@supabase/supabase-js'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import crypto from 'crypto'

const admin = createClient(process.env.SUPABASE_URL!, process.env.SERVICE_ROLE_KEY!)

function anonClient() {
    return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
}

const ownerId = crypto.randomUUID()
const outsiderId = crypto.randomUUID()
const ownerEmail = `owner-${ownerId}@test.local`
const outsiderEmail = `outsider-${outsiderId}@test.local`
let capsuleId: string

beforeAll(async () => {
    const { error: e1 } = await admin.auth.admin.createUser({
        id: ownerId, email: ownerEmail, password: 'password123', email_confirm: true,
    })
    if (e1) throw new Error('createUser(owner): ' + e1.message)

    const { error: e2 } = await admin.auth.admin.createUser({
        id: outsiderId, email: outsiderEmail, password: 'password123', email_confirm: true,
    })
    if (e2) throw new Error('createUser(outsider): ' + e2.message)

    const { error: eP } = await admin.from('profiles').upsert([
        { id: ownerId, email: ownerEmail },
        { id: outsiderId, email: outsiderEmail },
    ])
    if (eP) throw new Error('upsert profiles: ' + eP.message)

    const { data: cap, error: e3 } = await admin.from('capsules')
        .insert({ owner_id: ownerId, title: 'RLS test', status: 'collecting' })
        .select('id').single()
    if (e3) throw new Error('insert capsule: ' + e3.message)
    capsuleId = cap!.id

    const { error: e4 } = await admin.from('capsule_contents').insert({
        capsule_id: capsuleId, encrypted_message: 'iv:tag:szyfrogram', author_id: ownerId,
    })
    if (e4) throw new Error('insert content: ' + e4.message)
})

afterAll(async () => {
    await admin.from('profiles').delete().in('id', [ownerId, outsiderId])
    await admin.auth.admin.deleteUser(ownerId)
    await admin.auth.admin.deleteUser(outsiderId)
})

afterAll(async () => {
    await admin.from('capsules').delete().eq('id', capsuleId)
    await admin.auth.admin.deleteUser(ownerId)
    await admin.auth.admin.deleteUser(outsiderId)
})

describe('RLS: capsule_contents', () => {
    it('właściciel widzi treść swojej kapsuły', async () => {
        const c = anonClient()
        await c.auth.signInWithPassword({ email: ownerEmail, password: 'password123' })
        const { data } = await c.from('capsule_contents').select('*').eq('capsule_id', capsuleId)
        expect(data ?? []).toHaveLength(1)
    })

    it('osoba postronna nie widzi cudzej treści (RLS = pusty wynik)', async () => {
        const c = anonClient()
        await c.auth.signInWithPassword({ email: outsiderEmail, password: 'password123' })
        const { data } = await c.from('capsule_contents').select('*').eq('capsule_id', capsuleId)
        expect(data ?? []).toHaveLength(0)
    })

    it('osoba postronna nie może dopisać treści', async () => {
        const c = anonClient()
        await c.auth.signInWithPassword({ email: outsiderEmail, password: 'password123' })
        const { error } = await c.from('capsule_contents')
            .insert({ capsule_id: capsuleId, encrypted_message: 'x', author_id: outsiderId })
        expect(error).not.toBeNull()
    })
})