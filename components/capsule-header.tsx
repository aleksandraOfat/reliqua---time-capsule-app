import Link from 'next/link'
import { deleteMemory } from '../app/(protected)/capsules/actions'
import ConfirmButton from './confirm-button'

type State = 'collecting' | 'sealed' | 'ready' | 'opened'

function CalendarIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none"
             stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="6.5" width="14" height="12.5" rx="1.6" />
            <path d="M8.2 4.8v3.4M15.8 4.8v3.4M5.6 10.2h12.8" />
        </svg>
    )
}

function StateIcon({ state }: { state: State }) {
    const common = {
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.7,
        strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    }
    if (state === 'opened') {
        return (
            <svg viewBox="0 0 24 24" className="h-6 w-6" {...common}>
                <path d="M7.5 10V8.3C7.5 5.8 9.4 4 12 4c1.9 0 3.5 1 4.2 2.6" />
                <rect x="5.5" y="10" width="13" height="9.5" rx="1.7" />
            </svg>
        )
    }
    if (state === 'ready') {
        return (
            <svg viewBox="0 0 24 24" className="h-6 w-6" {...common}>
                <rect x="4" y="6.5" width="16" height="11.5" rx="1.4" />
                <path d="M4.8 7.2L12 12.8l7.2-5.6" />
            </svg>
        )
    }
    return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" {...common}>
            <path d="M7.5 10V8.3C7.5 5.8 9.4 4 12 4s4.5 1.8 4.5 4.3V10" />
            <rect x="5.5" y="10" width="13" height="9.5" rx="1.7" />
        </svg>
    )
}

function meta(state: State) {
    switch (state) {
        case 'collecting':
            return { label: 'Collecting', pill: 'bg-[#e7efe9] text-mv-green', box: 'bg-[#e7efe9] text-mv-green',
                sentence: "Everyone who joined can see what's inside and keep adding memories until it seals." }
        case 'ready':
            return { label: 'Ready to open', pill: 'bg-mv-pink text-mv-green', box: 'bg-mv-pink text-mv-green',
                sentence: 'The wait is over — this capsule can be opened now.' }
        case 'opened':
            return { label: 'Opened', pill: 'bg-mv-sand text-mv-muted', box: 'bg-mv-sand text-mv-muted',
                sentence: 'This capsule has been opened.' }
        default:
            return { label: 'Sealed', pill: 'bg-[#f1e4d8] text-mv-clay', box: 'bg-[#f1e4d8] text-mv-clay',
                sentence: 'This capsule is sealed and waiting for its open date.' }
    }
}

export default function CapsuleHeader({
                                          id, title, description, openDate, state,
                                          progressPct, progressLabel, progressValue, canEdit,
                                          isOwner,
                                          myMemoryId,
                                      }: {
    id: string
    title: string
    description: string | null
    openDate: string | null
    state: State
    progressPct: number | null
    progressLabel: string
    progressValue: string
    canEdit: boolean
    isOwner: boolean
    myMemoryId: string | null
}) {
    const m = meta(state)

    return (
        <div className="rounded-2xl border border-mv-border bg-mv-card p-6 shadow-sm">
            <div className="flex items-start gap-4">
                <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl ${m.box}`}>
                    <StateIcon state={state} />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <h1 className="mv-serif truncate text-2xl font-semibold text-mv-green">{title}</h1>
                        <span className={`mv-serif shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${m.pill}`}>
                            {m.label}
                        </span>
                    </div>
                    <p className="mv-sans mt-2 text-sm text-mv-ink/75">{m.sentence}</p>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-mv-border pt-4">
                <div>
                    <p className="mv-sans text-xs font-medium uppercase tracking-wide text-mv-muted">Opens</p>
                    <p className="mv-sans mt-1 flex items-center gap-1.5 text-sm font-medium text-mv-ink">
                        <CalendarIcon />
                        {openDate ? new Date(openDate).toLocaleString() : 'No open date'}
                    </p>
                </div>
                <div>
                    <p className="mv-sans text-xs font-medium uppercase tracking-wide text-mv-muted">{progressLabel}</p>
                    <p className="mv-sans mt-1 text-sm font-medium text-mv-ink">{progressValue}</p>
                </div>
            </div>

            {progressPct !== null && (
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#ece5da]">
                    <div className="h-full rounded-full bg-mv-clay transition-all"
                         style={{ width: `${Math.max(4, progressPct)}%` }} />
                </div>
            )}

            {description && (
                <p className="mv-sans mt-4 border-t border-mv-border pt-4 text-mv-ink/80">{description}</p>
            )}
            {isOwner && (
                <div className="mt-4 border-t border-mv-border pt-4">
                    {myMemoryId ? (
                        <form action={deleteMemory}>
                            <input type="hidden" name="memory_id" value={myMemoryId} />
                            <input type="hidden" name="capsule_id" value={id} />
                            <input type="hidden" name="return_to" value={`/capsules/${id}`} />
                            <div className="flex items-center justify-between gap-3">
                                <span className="mv-sans text-sm text-mv-muted">Shared on the public map</span>
                                <ConfirmButton
                                    message="Remove this capsule's memory from the public map?"
                                    className="mv-sans shrink-0 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                >
                                    Remove
                                </ConfirmButton>
                            </div>
                        </form>
                    ) : (
                        <div className="flex items-center justify-between gap-3">
                            <span className="mv-sans text-sm text-mv-muted">Currently private</span>
                            <Link href={`/capsules/${id}/share`}
                                  className="mv-sans shrink-0 rounded-lg bg-mv-pink px-4 py-2 text-sm font-semibold text-mv-green transition hover:brightness-95">
                                Share as public memory
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {canEdit && (
                <Link href={`/capsules/${id}/edit`}
                      className="mv-sans mt-4 inline-block rounded-lg border border-mv-border px-3 py-1.5 text-sm font-medium text-mv-green transition hover:bg-mv-sand">
                    Edit details
                </Link>
            )}
        </div>
    )
}