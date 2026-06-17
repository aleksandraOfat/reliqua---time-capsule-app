import { describe, it, expect } from 'vitest'
import { normalizeTags, normalizeSearchQuery, MAX_TAGS, MAX_TAG_LENGTH } from './tags'

describe('normalizeTags', () => {
    it('puste wejście → pusta lista', () => {
        expect(normalizeTags('')).toEqual([])
        expect(normalizeTags(null)).toEqual([])
        expect(normalizeTags(undefined)).toEqual([])
    })
    it('rozdziela po przecinkach i nowych liniach', () => {
        expect(normalizeTags('rodzina, wakacje\nślub')).toEqual(['rodzina', 'wakacje', 'ślub'])
    })
    it('przycina spacje i sprowadza do małych liter', () => {
        expect(normalizeTags('  Rodzina ,  WAKACJE ')).toEqual(['rodzina', 'wakacje'])
    })
    it('usuwa duplikaty (bez względu na wielkość liter)', () => {
        expect(normalizeTags('Lato, lato, LATO')).toEqual(['lato'])
    })
    it('pomija puste segmenty', () => {
        expect(normalizeTags('a,,  ,b')).toEqual(['a', 'b'])
    })
    it('ogranicza liczbę tagów do MAX_TAGS', () => {
        const many = Array.from({ length: MAX_TAGS + 5 }, (_, i) => `tag${i}`).join(',')
        expect(normalizeTags(many)).toHaveLength(MAX_TAGS)
    })
    it('przycina pojedynczy tag do MAX_TAG_LENGTH', () => {
        const long = 'x'.repeat(MAX_TAG_LENGTH + 20)
        expect(normalizeTags(long)[0]).toHaveLength(MAX_TAG_LENGTH)
    })
})

describe('normalizeSearchQuery', () => {
    it('puste / białe znaki → null', () => {
        expect(normalizeSearchQuery('')).toBeNull()
        expect(normalizeSearchQuery('   ')).toBeNull()
        expect(normalizeSearchQuery(null)).toBeNull()
    })
    it('zwija wielokrotne spacje i przycina', () => {
        expect(normalizeSearchQuery('  list   do   przyszłości ')).toBe('list do przyszłości')
    })
})

import { parseSearchInput } from './tags'

describe('parseSearchInput', () => {
    it('przecinek → tryb tagów (AND)', () => {
        expect(parseSearchInput('rodzina, wakacje')).toEqual({ kind: 'tags', tags: ['rodzina', 'wakacje'] })
    })
    it('brak przecinka → tryb tekstowy', () => {
        expect(parseSearchInput('list do przyszłości')).toEqual({ kind: 'text', query: 'list do przyszłości' })
    })
    it('puste → null', () => {
        expect(parseSearchInput('')).toBeNull()
        expect(parseSearchInput('   ')).toBeNull()
    })
})