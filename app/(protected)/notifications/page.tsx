import Link from 'next/link'
import { createClient} from '@/lib/supabase/server'
import {markNotificationsRead,openNotification } from '../capsules/actions'

const TYPE_TEXT: Record<string, string> = {
    upcoming: 'will open soon — get your memories ready',
    condition_met: 'has been opened',
    invitation: 'you were invited to join',
    activity: 'has new content from a participant',
    public: 'new public memory',
}

function label(type: string, title?: string) {
    const suffix = TYPE_TEXT[type] ?? 'notification'
    return title ? `Capsule “${title}” ${suffix}.` : `A capsule ${suffix}.`
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / 3_600_000)
    if (h < 1) return 'just now'
    if (h < 24) return `${h} hour(s) ago`
    return new Date(iso).toLocaleDateString()
}

export default async function NotificationsPage() {
    const supabase = await createClient()

    const { data: notifications } = await supabase
        .from('notifications')
        .select('id, type, is_read, scheduled_at, capsule_id, capsules(title)')
        .order('scheduled_at', { ascending: false })

    const all = notifications ?? []
    const recent = all.filter((n: any) => !n.is_read)
    const read = all.filter((n: any) => n.is_read)

    const titleOf = (n: any) =>
        Array.isArray(n.capsules) ? n.capsules[0]?.title : n.capsules?.title

    return (
        <div className="mx-auto max-w-2xl">
            <h1 className="text-center text-2xl font-semibold text-slate-900">Notifications</h1>

            {/* RECENT */}
            <div className="mt-8 flex items-center justify-between">
                <h2 className="text-sm font-medium text-slate-700">Recent</h2>
                {recent.length > 0 && (
                    <form action={markNotificationsRead}>
                        <button type="submit" className="text-sm font-medium text-emerald-700 underline hover:text-emerald-800">
                            set all as read
                        </button>
                    </form>
                )}
            </div>

            {recent.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">No new notifications.</p>
            ) : (
                <ul className="mt-3 flex flex-col gap-3">
                    {recent.map((n: any) => (
                        <li key={n.id} className="rounded-xl bg-stone-100">
                            <form action={openNotification}>
                                <input type="hidden" name="notif_id" value={n.id}/>
                                <input type="hidden" name="capsule_id" value={n.capsule_id ?? ''}/>

                                <button
                                    type="submit"
                                    className="flex w-full items-start justify-between p-4 text-left"
                                >
                  <span className="flex-1">
                    <span className="block font-medium text-slate-900">
                      {label(n.type, titleOf(n))}
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      {timeAgo(n.scheduled_at)}
                    </span>
                  </span>
                                    <span className="ml-3 mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500"/>
                                </button>
                            </form>
                        </li>
                    ))}
                </ul>
            )}

            {read.length > 0 && (
                <>
                    <h2 className="mt-10 text-sm font-medium text-slate-700">Read</h2>
                    <ul className="mt-3 flex flex-col gap-3">
                        {read.map((n: any) => (
                            <li key={n.id} className="rounded-xl border border-stone-200 p-4">
                                <Link href={n.capsule_id ? `/capsules/${n.capsule_id}` : '#'}>
                                    <p className="font-medium text-slate-400">{label(n.type, titleOf(n))}</p>
                                    <p className="mt-1 text-sm text-slate-400">
                                        {new Date(n.scheduled_at).toLocaleDateString()}
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            <Link href="/dashboard" className="mt-8 inline-block text-sm text-slate-500 hover:text-slate-700">
                ← Back to dashboard
            </Link>
        </div>
    )
}