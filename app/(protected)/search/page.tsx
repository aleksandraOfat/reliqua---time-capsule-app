import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {parseSearchInput} from '@/lib/tags'

export const metadata = { title: 'Search' }

export default async function SearchPage({
                                             searchParams,
                                         }: {
    searchParams: Promise<{ q?: string }>
}) {
    const { q } = await searchParams
    const parsed = parseSearchInput(q)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: tagCounts } = await supabase.rpc('my_tag_counts')
    const tags: Array<{ name: string; capsule_count: number }> = tagCounts ?? []

    let results: Array<{ id: string; title: string; status: string }> = []
    if (parsed?.kind === 'text') {
        const { data } = await supabase.rpc('search_my_capsules', { q: parsed.query })
        results = data ?? []
    } else if (parsed?.kind === 'tags') {
        const { data } = await supabase.rpc('search_my_capsules_by_tags', { tag_names: parsed.tags })
        results = data ?? []
    }

    return (
        <div className="mx-auto max-w-2xl">
            <h1 className="mv-serif text-2xl font-semibold text-mv-green">Search capsules</h1>

            {tags.length > 0 && (
                <div className="mt-4">
                    <p className="mv-sans mb-2 text-sm font-medium text-mv-muted">Your tags</p>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((t) => (
                            <Link
                                key={t.name}
                                href={`/search?q=${encodeURIComponent(t.name)}`}
                                className="mv-sans rounded-full bg-[#e7efe9] px-3 py-1 text-xs font-medium text-mv-green transition hover:brightness-95"
                            >
                                #{t.name} <span className="text-mv-muted">({t.capsule_count})</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <form action="/search" method="get" className="mt-6 flex gap-2">
                <input
                    name="q"
                    type="text"
                    defaultValue={q ?? ''}
                    placeholder="e.g. greece — or several tags: family, vacation"
                    className="mv-sans flex-1 rounded-lg border border-mv-border bg-white px-3 py-2.5 text-mv-ink outline-none focus:border-mv-green focus:ring-2 focus:ring-mv-green/20"
                />
                <button
                    type="submit"
                    className="mv-sans rounded-lg bg-mv-green px-4 py-2.5 font-semibold text-white transition hover:bg-mv-green-hover"
                >
                    Search
                </button>
            </form>
            <p className="mv-sans mt-1.5 text-xs text-mv-muted">
                Type words to search titles and descriptions. To filter by tags, list them
                separated by commas (e.g. <span className="font-medium">family, vacation</span>) —
                only capsules that have all of those tags will be shown.
            </p>

            {parsed && (
                <ul className="mt-6 flex flex-col gap-2">
                    {results.length === 0 ? (
                        <li className="mv-sans text-sm text-mv-muted">No capsules match “{q}”.</li>
                    ) : (
                        results.map((c) => (
                            <li key={c.id}>
                                <Link
                                    href={`/capsules/${c.id}`}
                                    className="mv-sans block rounded-lg border border-mv-border bg-mv-card px-4 py-3 text-mv-ink transition hover:bg-mv-sand"
                                >
                                    {c.title}{' '}
                                    <span className="text-xs text-mv-muted">({c.status})</span>
                                </Link>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    )
}