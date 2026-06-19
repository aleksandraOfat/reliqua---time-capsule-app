import { inviteMember, removeMember, deleteCapsule } from '../actions'
import ConfirmButton from '@/components/confirm-button'
import DeleteConfirm from '@/components/delete-confirm'

type Member = { member_id: string; email: string; member_role: string }

export default function OwnerTools({
                                       id,
                                       title,
                                       members,
                                       inviteResult,
                                   }: {
    id: string
    title: string
    members: Member[]
    inviteResult: { text: string; ok: boolean } | null
}) {
    return (
        <>
            <div className="mt-6 rounded-2xl border border-mv-border bg-mv-card p-6 shadow-sm">
                <p className="mv-serif text-lg font-semibold text-mv-green">Collaborators</p>
                <p className="mv-sans mt-1 text-sm text-mv-muted">
                    Invite people to view this capsule once it is opened.
                </p>

                {inviteResult && (
                    <p className={`mv-sans mt-4 rounded-lg px-3 py-2 text-sm ${
                        inviteResult.ok ? 'bg-[#e7efe9] text-mv-green' : 'bg-red-50 text-red-700'
                    }`}>
                        {inviteResult.text}
                    </p>
                )}

                <form action={inviteMember} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input type="hidden" name="capsule_id" value={id}/>
                    <input type="email" name="email" placeholder="friend@example.com" required
                           className="mv-sans min-w-0 flex-1 rounded-lg border border-mv-border px-3 py-2.5 text-mv-ink outline-none focus:border-mv-green focus:ring-2 focus:ring-mv-green/20"/>
                    <button
                        type="submit"
                        className="mv-sans inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-mv-green px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-mv-green-hover"
                    >
                        Invite
                    </button>
                </form>

                {members.length > 0 && (
                    <ul className="mt-4 flex flex-col gap-2">
                        {members.map((m) => (
                            <li key={m.member_id}
                                className="flex items-center justify-between rounded-lg bg-mv-sand px-3 py-2.5">
                                <span className="mv-sans text-sm text-mv-ink">
                                    {m.email}
                                </span>
                                <form action={removeMember}>
                                    <input type="hidden" name="capsule_id" value={id}/>
                                    <input type="hidden" name="member_id" value={m.member_id}/>
                                    <button type="submit"
                                            className="mv-sans text-sm font-medium text-red-600 transition hover:text-red-700">
                                        Remove
                                    </button>
                                </form>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
                <p className="mv-serif text-base font-semibold text-red-800">Danger zone</p>
                <p className="mv-sans mt-1 text-sm text-red-700">
                Deleting this capsule permanently removes all its messages and files. This cannot be undone.
                </p>
                <DeleteConfirm
                    triggerLabel="Delete capsule"
                    title="Delete this capsule?"
                    description="This permanently removes the capsule and all its messages and files. This action is irreversible."
                    confirmValue={title}
                    confirmLabel="Delete capsule"
                >
                    <form action={deleteCapsule}>
                        <input type="hidden" name="capsule_id" value={id} />
                        <button
                            type="submit"
                            className="mv-sans rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                            Delete capsule
                        </button>
                    </form>
                </DeleteConfirm>
            </div>
        </>
    )
}