import { describe, it, expect } from 'vitest'
import {
    validateRequired,
    validateCapsuleForm,
    validatePasswordLength,
    validatePasswordsMatch,
    validateEmailChange,
    validateUsername,
    validateCredentials,
    isValidMemoryInput,
    MIN_PASSWORD_LENGTH,
} from './validation'

const DAY = 86_400_000
const now = Date.now()

describe('validateRequired', () => {
    it('puste / białe znaki → błąd z podanym komunikatem', () => {
        expect(validateRequired('', 'wymagane')).toEqual({ ok: false, error: 'wymagane' })
        expect(validateRequired('   ', 'wymagane')).toEqual({ ok: false, error: 'wymagane' })
        expect(validateRequired(null, 'wymagane')).toEqual({ ok: false, error: 'wymagane' })
    })
    it('niepusta wartość → ok', () => {
        expect(validateRequired('Kapsuła', 'wymagane')).toEqual({ ok: true })
    })
})

describe('validateCapsuleForm', () => {
    it('brak nazwy → błąd', () => {
        expect(validateCapsuleForm({ title: '', openDate: '2030-01-01' }, now))
            .toEqual({ ok: false, error: 'Please enter a capsule name.' })
    })
    it('brak daty otwarcia → błąd', () => {
        expect(validateCapsuleForm({ title: 'List', openDate: '' }, now))
            .toEqual({ ok: false, error: 'Please choose an opening date.' })
    })
    it('data w przeszłości → błąd', () => {
        const past = new Date(now - DAY).toISOString()
        expect(validateCapsuleForm({ title: 'List', openDate: past }, now))
            .toEqual({ ok: false, error: 'The opening date must be in the future.' })
    })
    it('przypadek graniczny: data otwarcia równa bieżącej chwili → błąd (warunek <=)', () => {
        const exact = new Date(now).toISOString()
        expect(validateCapsuleForm({ title: 'List', openDate: exact }, now))
            .toEqual({ ok: false, error: 'The opening date must be in the future.' })
    })
    it('data w przyszłości → ok', () => {
        const future = new Date(now + DAY).toISOString()
        expect(validateCapsuleForm({ title: 'List', openDate: future }, now))
            .toEqual({ ok: true })
    })
})

describe('validatePasswordLength', () => {
    it('puste hasło → błąd', () => {
        expect(validatePasswordLength('').ok).toBe(false)
    })
    it(`krótsze niż ${MIN_PASSWORD_LENGTH} znaków → błąd`, () => {
        expect(validatePasswordLength('abc').ok).toBe(false)
    })
    it('dokładnie minimalna długość → ok', () => {
        expect(validatePasswordLength('a'.repeat(MIN_PASSWORD_LENGTH))).toEqual({ ok: true })
    })
    it('pozwala nadpisać komunikat', () => {
        expect(validatePasswordLength('abc', 'za krótkie'))
            .toEqual({ ok: false, error: 'za krótkie' })
    })
})

describe('validatePasswordsMatch', () => {
    it('różne → błąd', () => {
        expect(validatePasswordsMatch('haslo1', 'haslo2'))
            .toEqual({ ok: false, error: 'Passwords do not match.' })
    })
    it('identyczne → ok', () => {
        expect(validatePasswordsMatch('haslo1', 'haslo1')).toEqual({ ok: true })
    })
})

describe('validateEmailChange', () => {
    it('pusty adres → błąd', () => {
        expect(validateEmailChange('', 'a@b.pl').ok).toBe(false)
    })
    it('taki sam jak bieżący (ignoruje wielkość liter) → błąd', () => {
        expect(validateEmailChange('A@B.PL', 'a@b.pl'))
            .toEqual({ ok: false, error: 'This is already your e-mail address.' })
    })
    it('inny niż bieżący → ok', () => {
        expect(validateEmailChange('nowy@b.pl', 'a@b.pl')).toEqual({ ok: true })
    })
})

describe('validateUsername', () => {
    it('pusta nazwa jest dozwolona (opcjonalna) → ok', () => {
        expect(validateUsername('')).toEqual({ ok: true })
        expect(validateUsername(null)).toEqual({ ok: true })
    })
    it('spacja → błąd', () => {
        expect(validateUsername('jan kowalski').ok).toBe(false)
    })
    it('niedozwolony znak → błąd', () => {
        expect(validateUsername('jan@kowalski').ok).toBe(false)
    })
    it('dozwolone znaki [A-Za-z0-9_-] → ok', () => {
        expect(validateUsername('Jan_Kowalski-27')).toEqual({ ok: true })
    })
})

describe('validateCredentials', () => {
    it('brak e-maila lub hasła → błąd', () => {
        expect(validateCredentials('', 'x').ok).toBe(false)
        expect(validateCredentials('a@b.pl', '').ok).toBe(false)
    })
    it('komplet danych → ok', () => {
        expect(validateCredentials('a@b.pl', 'haslo1')).toEqual({ ok: true })
    })
})

describe('isValidMemoryInput', () => {
    it('brak tytułu → false', () => {
        expect(isValidMemoryInput({ title: '', lat: 52, lng: 21 })).toBe(false)
    })
    it('współrzędne NaN → false', () => {
        expect(isValidMemoryInput({ title: 'Plaża', lat: NaN, lng: 21 })).toBe(false)
    })
    it('tytuł i poprawne współrzędne → true', () => {
        expect(isValidMemoryInput({ title: 'Plaża', lat: 52.2, lng: 21.0 })).toBe(true)
    })
})