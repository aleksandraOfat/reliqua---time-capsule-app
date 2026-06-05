import Link from 'next/link'
import {createClient} from '@/lib/supabase/server'
import MemoryMap from './memory-map'

export default async function MemoriesPage() {
    const supabase = await createClient()

    const {data } =await supabase
        .from('public_memories')
        .select('id, title, note, lat,lng,cover_url')

    const memories = (data ?? [])
        .filter((m: any) => m.lat != null && m.lng != null)
        .map((m: any) =>({
            id: m.id,
            title: m.title,
            note: m.note,
            lat:m.lat,
            lng: m.lng,
            cover: m.cover_url,
        }))



    return (
        <div>
            <h1 className="text-2xl font-semibold text-slate-900">Public memories</h1>
            <p className="mt-1 text-sm text-slate-500">
                Memories people chose to share with the world. Click a pin to read it.
            </p>

            <div className="mt-6">
                <MemoryMap memories={memories as any} />
            </div>

            <Link href="/dashboard" className="mt-6 inline-block text-sm text-slate-500 hover:text-slate-700">
                ← Back to dashboard
            </Link>
        </div>
    )
}