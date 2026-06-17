import { describe, it, expect } from 'vitest'
import { canAccessCapsuleFile } from './capsule-access'

describe('canAccessCapsuleFile', () => {
    it('otwarta kapsuła: pliki dostępne (właściciel)', () => {
        expect(canAccessCapsuleFile({ status: 'opened', isOwner: true, isAcceptedMember: false })).toBe(true)
    })
    it('otwarta kapsuła: dostępne także dla zaakceptowanego członka', () => {
        expect(canAccessCapsuleFile({ status: 'opened', isOwner: false, isAcceptedMember: true })).toBe(true)
    })
    it('faza zbierania: właściciel ma dostęp', () => {
        expect(canAccessCapsuleFile({ status: 'collecting', isOwner: true, isAcceptedMember: false })).toBe(true)
    })
    it('faza zbierania: zaakceptowany członek ma dostęp', () => {
        expect(canAccessCapsuleFile({ status: 'collecting', isOwner: false, isAcceptedMember: true })).toBe(true)
    })
    it('faza zbierania: osoba postronna nie ma dostępu', () => {
        expect(canAccessCapsuleFile({ status: 'collecting', isOwner: false, isAcceptedMember: false })).toBe(false)
    })
    it('zapieczętowana: właściciel NIE ma dostępu (odroczony dostęp)', () => {
        expect(canAccessCapsuleFile({ status: 'sealed', isOwner: true, isAcceptedMember: false })).toBe(false)
    })
    it('zapieczętowana: zaakceptowany członek NIE ma dostępu', () => {
        expect(canAccessCapsuleFile({ status: 'sealed', isOwner: false, isAcceptedMember: true })).toBe(false)
    })
    it('gotowa do otwarcia (ready) przed otwarciem: brak dostępu nawet dla właściciela', () => {
        expect(canAccessCapsuleFile({ status: 'ready', isOwner: true, isAcceptedMember: true })).toBe(false)
    })
    it('nieznany status: brak dostępu (bezpieczny domyślny)', () => {
        expect(canAccessCapsuleFile({ status: 'whatever', isOwner: true, isAcceptedMember: true })).toBe(false)
    })
})