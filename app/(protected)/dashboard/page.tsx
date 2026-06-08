import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage({
                                                searchParams,
                                            }: {
    searchParams: Promise<{ shared?: string }>
}) {
    const { shared } = await searchParams
    const supabase = await createClient()

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
        .order('created_at', { ascending: false })

    const { data: pendingInvites } = await supabase.rpc('get_my_invitations')
    const inviteCount = pendingInvites?.length ?? 0

    const { data: myMemberships } = await supabase
        .from('capsule_members')
        .select('capsule_id, status')
        .eq('user_id', user!.id)

    const acceptedSet = new Set(
        (myMemberships ?? [])
            .filter((m) => m.status === 'accepted')
            .map((m) => m.capsule_id)
    )

    const visibleList = (capsules ?? []).filter(
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
            openMs !== null ? Math.ceil((openMs - now) / 86_400_000) : null

        const createdMs = new Date(c.created_at).getTime()
        let progress = 100
        if (openMs !== null && openMs > createdMs) {
            progress = Math.min(100, Math.max(0, ((now - createdMs) / (openMs - createdMs)) * 100))
        }

        const isGroup = acceptedSet.has(c.id) && c.owner_id !== user!.id

        return { ...c, openDate, state, daysLeft, progress, isGroup }
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
        <div className="mx-auto w-full max-w-5xl">
            <h1 className="mv-serif text-4xl font-semibold text-mv-green">Hello {name}!</h1>
            <p className="mv-sans mt-2 text-lg font-light text-mv-muted">
                You have {readyCount} {readyCount === 1 ? 'capsule' : 'capsules'} ready to open.
            </p>

            {inviteCount > 0 && (
                <Link
                    href="/invitations"
                    className="mv-sans mt-4 inline-block rounded-lg bg-mv-pink px-4 py-2 text-sm font-medium text-mv-green transition hover:bg-mv-pink-hover"
                >
                    You have {inviteCount} pending invitation(s) →
                </Link>
            )}

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                <StatCard label="SEALED" value={sealedCount} caption="capsules" />
                <StatCard label="READY" value={readyCount} caption="capsules to view" />
                <StatCard label="GROUP" value={groupCount} caption="shared capsules" />
            </div>

            <Link
                href="/capsules/new"
                className="mv-sans mt-8 block rounded-xl bg-mv-clay px-4 py-3 text-center font-semibold text-white shadow-sm transition hover:brightness-95"
            >
                Create new capsule
            </Link>

            <Link
                href="/memories"
                className="mv-sans mt-3 block rounded-xl border border-mv-border bg-mv-card px-4 py-3 text-center font-medium text-mv-green transition hover:bg-mv-sand"
            >
                Explore public memories
            </Link>

            <h2 className="mv-serif mt-12 text-2xl font-semibold text-mv-green">My capsules</h2>

            {decorated.length === 0 ? (
                <p className="mv-sans mt-4 text-mv-muted">
                    You don&apos;t have any capsules yet. Create your first one above.
                </p>
            ) : (
                <ul className="mt-5 flex flex-col gap-4">
                    {decorated.map((c) => (
                        <li key={c.id}>
                            <Link
                                href={`/capsules/${c.id}`}
                                className="flex items-center gap-4 rounded-xl border border-mv-border bg-mv-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div
                                    className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl ${iconTone(c.state)}`}>
                                    {c.isGroup ? <GroupIcon/> : <CapsuleIcon state={c.state}/>}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="mv-serif truncate text-lg font-semibold text-mv-green">
                                        {c.title}
                                    </p>
                                    <p className="mv-sans mt-0.5 flex items-center gap-1.5 text-sm font-light text-mv-muted">
                                        <CalendarIcon/>
                                        {c.openDate
                                            ? `${c.state === 'opened' ? 'Opened' : 'Opens'} ${new Date(c.openDate).toLocaleDateString()}`
                                            : 'No open date'}
                                    </p>
                                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#ece5da]">
                                        <div
                                            className="h-full rounded-full bg-mv-clay transition-all"
                                            style={{width: `${Math.max(4, c.progress)}%`}}
                                        />
                                    </div>
                                </div>

                                <span
                                    className={`mv-serif shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badgeTone(c.state)}`}
                                >
                                    {c.state === 'ready'
                                        ? 'Ready!'
                                        : c.state === 'opened'
                                            ? 'Opened'
                                            : c.state === 'collecting'
                                                ? 'Collecting'
                                                : `${c.daysLeft} days`}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            {shared === '1' && (
                <div className="mv-sans fixed bottom-6 right-6 rounded-xl bg-mv-green px-4 py-3 text-sm font-medium text-white shadow-lg">
                    Your memory has been shared on the map.
                </div>
            )}
        </div>
    )
}

function StatCard({
                      label,
                      value,
                      caption,
                  }: {
    label: string
    value: number
    caption: string
}) {
    return (
        <div className="rounded-2xl border border-mv-border bg-mv-card p-6 shadow-sm">
            <p className="mv-serif text-sm font-semibold uppercase tracking-wide text-mv-clay">
                {label}
            </p>
            <p className="mv-serif mt-2 text-5xl font-semibold leading-none text-mv-ink">
                {value}
            </p>
            <p className="mv-sans mt-3 text-sm font-light text-mv-muted">{caption}</p>
        </div>
    )
}

function iconTone(state: string): string {
    if (state === 'ready') return 'bg-mv-pink text-mv-green'
    if (state === 'opened') return 'bg-mv-sand text-mv-muted'
    if (state === 'collecting') return 'bg-[#e7efe9] text-mv-green'
    return 'bg-[#f1e4d8] text-mv-clay'
}

function badgeTone(state: string): string {
    if (state === 'ready') return 'bg-mv-pink text-mv-green'
    if (state === 'opened') return 'bg-mv-sand text-mv-muted'
    if (state === 'collecting') return 'bg-[#e7efe9] text-mv-green'
    return 'bg-[#f1e4d8] text-mv-clay'
}

function CapsuleIcon({ state }: { state: string }) {
    const cls = 'h-6 w-6'
    const common = {
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
    }
    if (state === 'opened') {
        return (
            <svg viewBox="0 0 24 24" className={cls} {...common}>
                <path d="M7.5 10V8.3C7.5 5.8 9.4 4 12 4c1.9 0 3.5 1 4.2 2.6" />
                <rect x="5.5" y="10" width="13" height="9.5" rx="1.7" />
            </svg>
        )
    }
    if (state === 'ready') {
        return (
            <svg viewBox="0 0 24 24" className={cls} {...common}>
                <rect x="4" y="6.5" width="16" height="11.5" rx="1.4" />
                <path d="M4.8 7.2L12 12.8l7.2-5.6" />
            </svg>
        )
    }
    return (
        <svg viewBox="0 0 24 24" className={cls} {...common}>
            <path d="M7.5 10V8.3C7.5 5.8 9.4 4 12 4s4.5 1.8 4.5 4.3V10" />
            <rect x="5.5" y="10" width="13" height="9.5" rx="1.7" />
        </svg>
    )
}

function CalendarIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="5" y="6.5" width="14" height="12.5" rx="1.6" />
            <path d="M8.2 4.8v3.4M15.8 4.8v3.4M5.6 10.2h12.8" />
        </svg>
    )
}
function GroupIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="9" cy="9" r="3" />
            <path d="M3.5 19c0-3 2.5-4.8 5.5-4.8s5.5 1.8 5.5 4.8" />
            <path d="M16 6.5a2.8 2.8 0 0 1 0 5.4" />
            <path d="M17.5 14.4c2.2.5 3.8 2.1 3.8 4.6" />
        </svg>
    )
}