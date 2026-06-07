import Link from 'next/link'
import {createClient} from '@/lib/supabase/server'
import{deleteMemory} from '../capsules/actions'
import MemoryMap from './memory-map'
import ConfirmButton from "@/components/confirm-button";

export default async function MemoriesPage() {
    const supabase = await createClient()
    const {data: { user }} = await supabase.auth.getUser()

    const {data } =await supabase
        .from('public_memories')
        .select('id, title, note, lat,lng,cover_url,owner_id, capsule_id,capsules(status)')

    const statusOf = (m: any) => Array.isArray(m.capsules) ? m.capsules[0]?.status :m.capsules?.status

    const all = (data ?? []).filter((m: any) => m.lat != null && m.lng != null)

    const memories = all.filter((m: any) => statusOf(m) === 'opened')
        .map((m: any) => ({
        id: m.id,
        title: m.title,
        note: m.note,
        lat:m.lat,
        lng:m.lng,
        cover: m.cover_url,
    }))
    const myMemories = all.filter((m: any) => m.owner_id === user?.id)
        .map((m: any) => ({...m, visible: statusOf(m) === 'opened'}))


    return (
        <div>
            <h1 className="text-2xl font-semibold text-slate-900">Public memories</h1>
            <p className="mt-1 text-sm text-slate-500">
                Memories people chose to share with the world. Click a pin to read it.
            </p>

            <div className="mt-6">
                <MemoryMap memories={memories as any} />

                {myMemories.length > 0 && (
                    <div className="mt-6">
                        <h2 className="text-sm font-medium text-slate-700">Your shared memories</h2>
                        <ul className="mt-3 flex flex-col gap-2">
                            {myMemories.map((m: any) => (
                                <li key={m.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                    <span className="text-sm text-slate-700">{m.title}
                                        <span className="text-xs text-slate-400">
                                            {m.visible ? ' · visible' : ' · visible after opening'}
                                        </span>
                                    </span>
                                    <form action={deleteMemory}>
                                        <input type="hidden" name="memory_id" value={m.id} />
                                        <input type="hidden" name="capsule_id" value={m.capsule_id ?? ''} />
                                        <input type="hidden" name="return_to" value="/memories" />
                                        <ConfirmButton
                                            message="Remove this memory from the public map?"
                                            className="text-sm font-medium text-red-600 hover:text-red-700"
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

            <Link href="/dashboard" className="mt-6 inline-block text-sm text-slate-500 hover:text-slate-700">
                ← Back to dashboard
            </Link>
        </div>
    )
}