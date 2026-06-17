export const MAX_TAGS = 10
export const MAX_TAG_LENGTH = 30

export function normalizeTags(raw: string | null | undefined): string[] {
    if (!raw) return []

    const seen = new Set<string>()
    const result: string[] = []

    for (const piece of raw.split(/[,\n]/)) {
        const tag = piece.trim().toLowerCase().slice(0, MAX_TAG_LENGTH)
        if (!tag) continue
        if (seen.has(tag)) continue
        seen.add(tag)
        result.push(tag)
        if (result.length >= MAX_TAGS) break
    }

    return result
}


export function normalizeSearchQuery(raw: string | null | undefined): string | null {
    if (!raw) return null
    const trimmed = raw.replace(/\s+/g, ' ').trim()
    return trimmed.length > 0 ? trimmed : null
}


export function parseSearchInput(raw: string | null | undefined):
    | { kind: 'tags'; tags: string[] }
    | { kind: 'text'; query: string }
    | null {
    if (!raw) return null
    if (raw.includes(',')) {
        const tags = normalizeTags(raw)
        return tags.length > 0 ? { kind: 'tags', tags } : null
    }
    const query = normalizeSearchQuery(raw)
    return query ? { kind: 'text', query } : null
}