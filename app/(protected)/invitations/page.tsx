import { createClient } from '@/lib/supabase/server'
import { respondToInvitation } from '../capsules/actions'

function CalendarIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none"
             stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="6.5" width="14" height="12.5" rx="1.6" />
            <path d="M8.2 4.8v3.4M15.8 4.8v3.4M5.6 10.2h12.8" />
        </svg>
    )
}

export default async function InvitationsPage() {
    const supabase = await createClient()

    const { data: invitations } = await supabase.rpc('get_my_invitations')
    const list = invitations ?? []

    return (
        <div className="mx-auto max-w-xl">
            <h1 className="mv-serif font-semibold text-mv-green" style={{ fontSize: '30px', lineHeight: 1.2 }}>
                Invitations
            </h1>
            <p className="mv-sans mt-2 text-sm text-mv-muted">
                Capsules other people have invited you to join.
            </p>

            {list.length === 0 ? (
                <div className="mt-8 rounded-2xl border border-mv-border bg-mv-card p-10 text-center shadow-sm">
                    <p className="mv-sans text-mv-muted">You don&apos;t have any pending invitations.</p>
                </div>
            ) : (
                <ul className="mt-6 flex flex-col gap-4">
                    {list.map((inv: any) => (
                        <li
                            key={inv.member_id}
                            className="rounded-2xl border border-mv-border bg-mv-card p-6 shadow-sm"
                        >
                            <div className="text-center">
                                <span className="mv-sans inline-block rounded-full bg-mv-pink px-3 py-1 text-xs font-semibold text-mv-green">
                                    New invitation
                                </span>
                                <h2 className="mv-serif mt-3 text-xl font-semibold text-mv-green">
                                    You&apos;ve been invited!
                                </h2>
                                <p className="mv-sans mt-1 text-sm text-mv-muted">
                                    {inv.owner_name} has invited you to join a shared time capsule.
                                </p>
                            </div>

                            <div className="mt-4 rounded-xl bg-mv-sand p-4">
                                <p className="mv-serif font-semibold text-mv-green">{inv.capsule_title}</p>
                                <p className="mv-sans mt-1 flex items-center gap-1.5 text-sm text-mv-muted">
                                    <CalendarIcon />
                                    {inv.open_date
                                        ? `Opens ${new Date(inv.open_date).toLocaleDateString()}`
                                        : 'No open date set'}
                                </p>
                            </div>

                            <p className="mv-sans mt-4 text-sm text-mv-ink/75">
                                As a participant, you can add photos and messages to the capsule.
                                The contents stay hidden from non-participants until the opening date.
                            </p>

                            <div className="mt-5 flex gap-3">
                                <form action={respondToInvitation} className="flex-1">
                                    <input type="hidden" name="member_id" value={inv.member_id} />
                                    <input type="hidden" name="accept" value="true" />
                                    <button
                                        type="submit"
                                        className="mv-sans w-full rounded-lg bg-mv-green px-4 py-2.5 font-semibold text-white transition hover:bg-mv-green-hover"
                                    >
                                        Join capsule
                                    </button>
                                </form>
                                <form action={respondToInvitation}>
                                    <input type="hidden" name="member_id" value={inv.member_id} />
                                    <input type="hidden" name="accept" value="false" />
                                    <button
                                        type="submit"
                                        className="mv-sans rounded-lg border border-mv-border bg-white px-6 py-2.5 font-medium text-mv-muted transition hover:bg-mv-sand hover:text-mv-green"
                                    >
                                        Decline
                                    </button>
                                </form>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}