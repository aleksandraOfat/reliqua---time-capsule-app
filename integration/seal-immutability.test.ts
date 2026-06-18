import { createClient } from '@supabase/supabase-js'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import crypto from 'crypto'

const admin = createClient(process.env.SUPABASE_URL!, process.env.SERVICE_ROLE_KEY!)
function anonClient() {
    return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
}

const ownerId = crypto.randomUUID()
const ownerEmail = `owner-${ownerId}@test.local`
let sealedId: string
let collectingId: string

beforeAll(async () => {
    const { error: eU } = await admin.auth.admin.createUser({
        id: ownerId, email: ownerEmail, password: 'password123', email_confirm: true,
    })
    if (eU) throw new Error('createUser: ' + eU.message)

    const { error: eP } = await admin.from('profiles').upsert({ id: ownerId, email: ownerEmail })
    if (eP) throw new Error('upsert profile: ' + eP.message)

    const sealed = await admin.from('capsules')
        .insert({ owner_id: ownerId, title: 'Sealed', status: 'sealed' })
        .select('id').single()
    if (sealed.error) throw new Error('insert sealed: ' + sealed.error.message)
    sealedId = sealed.data!.id

    const collecting = await admin.from('capsules')
        .insert({ owner_id: ownerId, title: 'Collecting', status: 'collecting' })
        .select('id').single()
    if (collecting.error) throw new Error('insert collecting: ' + collecting.error.message)
    collectingId = collecting.data!.id
})

afterAll(async () => {
    await admin.from('profiles').delete().eq('id', ownerId)
    await admin.auth.admin.deleteUser(ownerId)
})

describe('Niezmienność po zapieczętowaniu (RLS contents_insert)', () => {
    it('właściciel NIE może dopisać treści do zapieczętowanej kapsuły', async () => {
        const c = anonClient()
        await c.auth.signInWithPassword({ email: ownerEmail, password: 'password123' })
        const { error } = await c.from('capsule_contents')
            .insert({ capsule_id: sealedId, encrypted_message: 'iv:tag:x', author_id: ownerId })
        expect(error).not.toBeNull() // is_collecting = false → RLS blokuje INSERT
    })

    it('dla kontrastu: w fazie zbierania właściciel MOŻE dopisać treść', async () => {
        const c = anonClient()
        await c.auth.signInWithPassword({ email: ownerEmail, password: 'password123' })
        const { error } = await c.from('capsule_contents')
            .insert({ capsule_id: collectingId, encrypted_message: 'iv:tag:x', author_id: ownerId })
        expect(error).toBeNull()
    })
})