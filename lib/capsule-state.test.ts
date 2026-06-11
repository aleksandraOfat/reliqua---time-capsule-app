import { describe, it, expect } from 'vitest'
import { deriveCapsuleState } from './capsule-state'

const DAY = 86_400_000
const now = Date.now()

describe('deriveCapsuleState', () => {
    it('status opened ma pierwszeństwo niezależnie od dat', () => {
        expect(deriveCapsuleState({ status: 'opened', openDateMs: now + DAY, now })).toBe('opened')
        expect(deriveCapsuleState({ status: 'opened', openDateMs: null, now })).toBe('opened')
    })

    it('status collecting ma pierwszeństwo przed datami', () => {
        expect(deriveCapsuleState({ status: 'collecting', openDateMs: now - DAY, now })).toBe('collecting')
    })

    it('zapieczętowana z datą w przyszłości → sealed', () => {
        expect(deriveCapsuleState({ status: 'sealed', openDateMs: now + DAY, now })).toBe('sealed')
    })

    it('zapieczętowana z datą w przeszłości → ready', () => {
        expect(deriveCapsuleState({ status: 'sealed', openDateMs: now - 1, now })).toBe('ready')
    })

    it('dokładnie w momencie daty otwarcia → ready (warunek <=)', () => {
        expect(deriveCapsuleState({ status: 'sealed', openDateMs: now, now })).toBe('ready')
    })

    it('brak daty otwarcia nigdy nie daje ready (bezpieczny domyślny: sealed)', () => {
        expect(deriveCapsuleState({ status: 'sealed', openDateMs: null, now })).toBe('sealed')
    })
})