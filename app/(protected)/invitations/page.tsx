import Link from 'next/link'
import {createClient} from '@/lib/supabase/server'
import {respondToInvitation } from '../capsules/actions'

export default async function InvitationsPage() {
    const supabase = await createClient()

    const { data: invitations } = await supabase.rpc('get_my_invitations')
    const list= invitations ?? []

    return (
        <div className="mx-auto max-w-xl">
            <h1 className="text-2xl font-semibold text-slate-900">Invitations</h1>
            <p className="mt-1 text-sm text-slate-500">
                Capsules other people have invited you to join.
            </p>

            {list.length === 0 ? (
                <p className="mt-8 text-center text-slate-500">
                    You don&apos;t have any pending invitations.
                </p>
            ) : (
                <ul className="mt-6 flex flex-col gap-4">
                    {list.map((inv: any) => (
                        <li
                            key={inv.member_id}
                            className="rounded-2xl border border-slate-200 bg-white p-6 text-center"
                        >
                            <h2 className="text-lg font-semibold text-slate-900">
                                You&apos;ve been invited!
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {inv.owner_name} has invited you to join a shared time capsule.
                            </p>

                            <div className="mt-4 rounded-xl bg-amber-50 p-4 text-left">
                                <p className="font-medium text-slate-900">{inv.capsule_title}</p>
                                <p className="text-sm text-slate-500">
                                    {inv.open_date
                                        ? `Opens ${new Date(inv.open_date).toLocaleDateString()}`
                                        : 'No open date set'}
                                </p>
                            </div>

                            <p className="mt-4 text-sm text-slate-600">
                                As a participant, you can add photos and messages to the capsule.
                                The contents will remain hidden until the opening date.
                            </p>

                            <div className="mt-5 flex gap-3">
                                <form action={respondToInvitation} className="flex-1">
                                    <input type="hidden" name="member_id" value={inv.member_id} />
                                    <input type="hidden" name="accept" value="true" />
                                    <button
                                        type="submit"
                                        className="w-full rounded-lg bg-emerald-900 px-4 py-2.5 font-medium text-white hover:bg-emerald-950"
                                    >
                                        Join capsule
                                    </button>
                                </form>
                                <form action={respondToInvitation}>
                                    <input type="hidden" name="member_id" value={inv.member_id} />
                                    <input type="hidden" name="accept" value="false" />
                                    <button
                                        type="submit"
                                        className="rounded-lg bg-amber-600 px-6 py-2.5 font-medium text-white hover:bg-amber-700"
                                    >
                                        Decline
                                    </button>
                                </form>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <Link href="/dashboard" className="mt-6 inline-block text-sm text-slate-500 hover:text-slate-700">

                ← Back to dashboard
            </Link>
        </div>
    )
}