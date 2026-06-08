import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { deleteMemory } from '../capsules/actions'
import MemoryMap from './memory-map'
import ConfirmButton from '@/components/confirm-button'

export default async function MemoriesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data } = await supabase
        .from('public_memories')
        .select('id, title, note, lat, lng, cover_url, owner_id, capsule_id, capsules(status)')

    const statusOf = (m: any) =>
        Array.isArray(m.capsules) ? m.capsules[0]?.status : m.capsules?.status

    const all = (data ?? []).filter((m: any) => m.lat != null && m.lng != null)

    const memories = all
        .filter((m: any) => statusOf(m) === 'opened')
        .map((m: any) => ({
            id: m.id,
            title: m.title,
            note: m.note,
            lat: m.lat,
            lng: m.lng,
            cover: m.cover_url,
        }))

    const myMemories = all
        .filter((m: any) => m.owner_id === user?.id)
        .map((m: any) => ({ ...m, visible: statusOf(m) === 'opened' }))

    return (
        <div className="mx-auto max-w-5xl">
            <h1 className="mv-serif text-3xl font-semibold text-mv-green" style={{ fontSize: '30px', lineHeight: 1.2 }}>
                Public memories
            </h1>
            <p className="mv-sans mt-2 text-sm text-mv-muted">
                Memories people chose to share with the world. Click a pin to read it.
            </p>

            <div className="mt-6 overflow-hidden rounded-2xl border border-mv-border shadow-sm">
                <MemoryMap memories={memories as any} />
            </div>

            {memories.length === 0 && (
                <p className="mv-sans mt-4 rounded-xl bg-mv-sand px-4 py-3 text-sm text-mv-muted">
                    No public memories on the map yet. Memories appear here once their capsule has been opened.
                </p>
            )}

            {myMemories.length > 0 && (
                <div className="mt-8 rounded-2xl border border-mv-border bg-mv-card p-6 shadow-sm">
                    <p className="mv-serif text-lg font-semibold text-mv-green">Your shared memories</p>
                    <ul className="mt-4 flex flex-col gap-2">
                        {myMemories.map((m: any) => (
                            <li
                                key={m.id}
                                className="flex items-center justify-between gap-3 rounded-xl bg-mv-sand px-4 py-3"
                            >
                                <span className="mv-sans min-w-0 text-sm text-mv-ink">
                                    <span className="truncate font-medium">{m.title}</span>
                                    <span
                                        className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                                            m.visible
                                                ? 'bg-[#e7efe9] text-mv-green'
                                                : 'bg-[#f1e4d8] text-mv-clay'
                                        }`}
                                    >
                                        {m.visible ? 'Visible' : 'Visible after opening'}
                                    </span>
                                </span>
                                <form action={deleteMemory}>
                                    <input type="hidden" name="memory_id" value={m.id} />
                                    <input type="hidden" name="capsule_id" value={m.capsule_id ?? ''} />
                                    <input type="hidden" name="return_to" value="/memories" />
                                    <ConfirmButton
                                        message="Remove this memory from the public map?"
                                        className="mv-sans shrink-0 text-sm font-medium text-red-600 transition hover:text-red-700"
                                    >
                                        Remove
                                    </ConfirmButton>
                                </form>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}