import Link from 'next/link'
import {createClient} from '@/lib/supabase/server'
export default async function DashboardPage({searchParams,}:{
    searchParams: Promise<{ shared?: string }>
}) {
    const { shared } = await searchParams
    const supabase =await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user!.id)
        .maybeSingle()

    const { data: capsules } = await supabase
        .from('capsules')
        .select('id, title, status, is_public, owner_id, created_at, open_conditions(open_date)')
        .order('created_at', {ascending: false })

    const { data: pendingInvites } = await supabase.rpc('get_my_invitations')
    const inviteCount = pendingInvites?.length ?? 0

    const list = capsules ?? []
    const { data: myMemberships } = await supabase
        .from('capsule_members')
        .select('capsule_id, status')
        .eq('user_id', user!.id)

    const acceptedSet =new Set(
        (myMemberships ?? [])
            .filter((m) => m.status === 'accepted')
            .map((m) => m.capsule_id)
    )

    const  visibleList = (capsules ?? []).filter(
        (c: any) => c.owner_id === user!.id || c.is_public || acceptedSet.has(c.id)
    )
    const now = Date.now()

    const getOpenDate = (c: any): string | null => {
        const cond = Array.isArray(c.open_conditions)
            ? c.open_conditions[0]
            : c.open_conditions
        return cond?.open_date ?? null
    }

    const decorated = visibleList.map((c: any) => {
        const openDate = getOpenDate(c)
        const openMs = openDate ? new Date(openDate).getTime() : null

        let state: 'opened' | 'ready' | 'sealed' | 'collecting'
        if (c.status === 'opened') state = 'opened'
        else if (c.status === 'collecting') state = 'collecting'
        else if (openMs !== null && openMs <= now) state = 'ready'
        else state = 'sealed'

        const daysLeft =
            openMs !== null ? Math.ceil((openMs - now) / 86_400_000) :null

        const createdMs = new Date(c.created_at).getTime()
        let progress = 100
        if (openMs !== null && openMs > createdMs) {
            progress = Math.min(100, Math.max(0, ((now - createdMs) / (openMs - createdMs)) * 100))
        }

        return { ...c, openDate, state, daysLeft, progress}
    })

    const sealedCount = decorated.filter(
        (c) => c.state === 'sealed' || c.state === 'collecting'
    ).length
    const readyCount = decorated.filter((c) => c.state === 'ready').length
    const groupCount = decorated.filter(
        (c) => acceptedSet.has(c.id) && c.owner_id !== user!.id
    ).length

    const name = profile?.first_name || user?.email?.split('@')[0] || 'there'

    return (
        <div>

            <h1 className="text-3xl font-semibold text-slate-900">Hello {name}!</h1>
            <p className="mt-1 text-slate-500">
                You have {readyCount} {readyCount === 1 ? 'capsule' : 'capsules'} ready to open.
            </p>

            {inviteCount > 0 && (
                <Link
                    href="/invitations"
                    className="mt-3 inline-block rounded-lg bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-200"
                >
                    You have {inviteCount} pending invitation(s) →
                </Link>
            )}

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="SEALED" value={sealedCount} caption="capsules"/>
                <StatCard label="READY" value={readyCount} caption="capsules to view"/>
                <StatCard label="GROUP" value={groupCount} caption="shared capsules"/>
            </div>

            <Link
                href="/capsules/new"
                className="mt-6 block rounded-xl bg-amber-700 px-4 py-3 text-center font-medium text-white transition hover:bg-amber-800"
            >
                Create new capsule
            </Link>

            <Link
                href="/memories"
                className="mt-3 block rounded-xl border border-slate-300 px-4 py-3 text-center font-medium text-slate-700 transition hover:bg-slate-50"
            >
                Explore public memories
            </Link>

            <h2 className="mt-10 text-xl font-semibold text-slate-900">My capsules</h2>

            {decorated.length === 0 ? (
                <p className="mt-4 text-slate-500">
                    You don&apos;t have any capsules yet. Create your first one above.
                </p>
            ) : (
                <ul className="mt-4 flex flex-col gap-3">
                    {decorated.map((c) => (
                        <li key={c.id}>
                            <Link
                                href={`/capsules/${c.id}`}
                                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                <div className="h-12 w-12 shrink-0 rounded-lg bg-amber-100"/>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-slate-900">{c.title}</p>
                                    <p className="text-sm text-slate-500">
                                        {c.openDate
                                            ? `Opens ${new Date(c.openDate).toLocaleDateString()}`
                                            : 'No open date'}
                                    </p>
                                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-amber-600"
                                            style={{width: `${c.progress}%`}}
                                        />
                                    </div>
                                </div>

                                <span
                                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                                        c.state === 'ready'
                                            ? 'bg-amber-100 text-amber-800'
                                            : c.state === 'opened'
                                                ? 'bg-slate-100 text-slate-600'
                                                : c.state === 'collecting'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-purple-100 text-purple-700'
                                    }`}
                                >
                {c.state === 'ready'
                    ? 'Ready!'
                    : c.state === 'opened'
                        ? 'Opened'
                        : c.state === 'collecting'
                            ? 'Collecting'
                            : `${c.daysLeft} days`}
              </span>
                            </Link></li>
                    ))}
                </ul>
            )}
            {shared === '1' && (
                <div
                    className="fixed bottom-6 right-6 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-medium text-white shadow-lg">
                    Your memory has been shared on the map.
                </div>
            )}
        </div>
    )
}

function StatCard({label, value, caption,}: {
    label: string
    value:number
    caption: string
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{caption}</p>
        </div>
    )
}