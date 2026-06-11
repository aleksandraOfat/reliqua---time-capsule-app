import { describe, it, expect } from 'vitest'
import { encrypt, decrypt, encryptBuffer, decryptBuffer } from './crypto'

describe('szyfrowanie tekstu (encrypt/decrypt)', () => {
    it('odszyfrowuje to, co zaszyfrował (własność odwrotności)', () => {
        const original = 'Wiadomość do przyszłości'
        expect(decrypt(encrypt(original))).toBe(original)
    })

    it('obsługuje polskie znaki i emoji (unicode)', () => {
        const original = 'Zażółć gęślą jaźń 🎁 — list na 2030 rok'
        expect(decrypt(encrypt(original))).toBe(original)
    })

    it('obsługuje pusty łańcuch', () => {
        expect(decrypt(encrypt(''))).toBe('')
    })

    it('obsługuje długi tekst (10 000 znaków)', () => {
        const original = 'a'.repeat(10_000)
        expect(decrypt(encrypt(original))).toBe(original)
    })

    it('dwa szyfrogramy tej samej wiadomości różnią się (losowy IV)', () => {
        const msg = 'ta sama wiadomość'
        expect(encrypt(msg)).not.toBe(encrypt(msg))
    })

    it('odrzuca zmodyfikowany szyfrogram (znacznik uwierzytelniający GCM)', () => {
        const encrypted = encrypt('treść chroniona')
        const tampered =
            encrypted.slice(0, -1) + (encrypted.endsWith('0') ? '1' : '0')
        expect(() => decrypt(tampered)).toThrow()
    })

    it('odrzuca dane w błędnym formacie', () => {
        expect(() => decrypt('to-nie-jest-szyfrogram')).toThrow()
    })
})

describe('szyfrowanie plików (encryptBuffer/decryptBuffer)', () => {
    it('odszyfrowuje bufor binarny do identycznej zawartości', () => {
        const original = Buffer.from(
            Array.from({ length: 4096 }, (_, i) => (i * 31 + 7) % 256)
        )
        const roundTripped = decryptBuffer(encryptBuffer(original))
        expect(Buffer.compare(roundTripped, original)).toBe(0)
    })

    it('obsługuje pusty bufor', () => {
        const empty = Buffer.alloc(0)
        expect(Buffer.compare(decryptBuffer(encryptBuffer(empty)), empty)).toBe(0)
    })

    it('odrzuca zmodyfikowany bufor', () => {
        const enc = encryptBuffer(Buffer.from('zawartość pliku'))
        enc[enc.length - 1] = enc[enc.length - 1] ^ 0xff // odwracamy bity ostatniego bajtu
        expect(() => decryptBuffer(enc)).toThrow()
    })
})