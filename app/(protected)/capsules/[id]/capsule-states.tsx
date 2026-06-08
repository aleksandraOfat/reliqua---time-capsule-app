import Link from 'next/link'
import { openCapsule, deleteMemory } from '../actions'
import ConfirmButton from '@/components/confirm-button'

type Contribution = { message: string; author_name: string }
type FileItem = { id: string; file_name: string; mime_type: string | null }

export function OpenedView({
                               id,
                               contributions,
                               files,
                               isOwner,
                               myMemoryId,
                           }: {
    id: string
    contributions: Contribution[]
    files: FileItem[]
    isOwner: boolean
    myMemoryId: string | null
}) {
    return (
        <div className="mt-6 flex flex-col gap-6">
            <div className="rounded-2xl border border-mv-border bg-mv-card p-6 shadow-sm">
                <p className="mv-serif text-lg font-semibold text-mv-green">Messages</p>
                {contributions.length === 0 ? (
                    <p className="mv-sans mt-3 text-sm text-mv-muted">This capsule has no messages.</p>
                ) : (
                    <ul className="mt-4 flex flex-col gap-3">
                        {contributions.map((c, i) => (
                            <li key={i} className="rounded-xl bg-mv-sand p-4">
                                <div className="flex items-start gap-3">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mv-pink text-sm font-semibold leading-none text-mv-green">
                                        {(c.author_name || '?').charAt(0).toUpperCase()}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="mv-sans whitespace-pre-wrap text-sm text-mv-ink">
                                            {c.message || '(empty)'}
                                        </p>
                                        <p className="mv-sans mt-1 text-xs text-mv-muted">{c.author_name}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {files.length > 0 && (
                <div className="rounded-2xl border border-mv-border bg-mv-card p-6 shadow-sm">
                    <p className="mv-serif text-lg font-semibold text-mv-green">Files</p>
                    <ul className="mt-4 flex flex-col gap-4">
                        {files.map((f) => {
                            const isImage = f.mime_type?.startsWith('image/')
                            return (
                                <li key={f.id} className="flex flex-col gap-2">
                                    {isImage && (
                                        <img src={`/capsules/${id}/files/${f.id}`} alt={f.file_name}
                                             className="max-h-80 rounded-lg border border-mv-border object-contain" />
                                    )}
                                    <a href={`/capsules/${id}/files/${f.id}`} download={f.file_name}
                                       className="mv-sans inline-flex items-center gap-2 text-sm font-medium text-mv-green hover:underline">
                                        ↓ {f.file_name}
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}

        </div>
    )
}

export function ReadyView({
                              id,
                              hasPassword,
                              locked,
                              passwordError,
                          }: {
    id: string
    hasPassword: boolean
    locked: boolean
    passwordError: boolean
}) {
    return (
        <div className="mt-6 rounded-2xl border border-mv-border bg-mv-card p-6 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-mv-pink text-mv-green">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor"
                         strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="6.5" width="16" height="11.5" rx="1.4" />
                        <path d="M4.8 7.2L12 12.8l7.2-5.6" />
                    </svg>
                </div>
                <div>
                    <p className="mv-serif text-lg font-semibold text-mv-green">Ready to open</p>
                    <p className="mv-sans mt-1 text-sm text-mv-muted">
                        {hasPassword
                            ? 'This capsule is password protected. Enter the password to open it.'
                            : 'The wait is over — open it whenever you are ready.'}
                    </p>
                </div>
            </div>

            {locked && (
                <p className="mv-sans mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    The open date has not been reached yet.
                </p>
            )}
            {passwordError && (
                <p className="mv-sans mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    Incorrect password. Please try again.
                </p>
            )}

            <form action={openCapsule} className="mt-5 flex flex-col gap-3">
                <input type="hidden" name="capsule_id" value={id} />
                {hasPassword && (
                    <input type="password" name="capsule_password" placeholder="Enter capsule password" required
                           className="mv-sans rounded-lg border border-mv-border px-3 py-2.5 text-mv-ink outline-none focus:border-mv-green focus:ring-2 focus:ring-mv-green/20" />
                )}
                <button type="submit"
                        className="mv-sans rounded-lg bg-mv-green px-4 py-2.5 font-semibold text-white transition hover:bg-mv-green-hover">
                    Open capsule
                </button>
            </form>
        </div>
    )
}

export function SealedView({ daysLeft }: { daysLeft: number | null }) {
    return (
        <div className="mt-6 rounded-2xl border border-mv-border bg-mv-card p-6 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#f1e4d8] text-mv-clay">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor"
                         strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7.5 10V8.3C7.5 5.8 9.4 4 12 4s4.5 1.8 4.5 4.3V10" />
                        <rect x="5.5" y="10" width="13" height="9.5" rx="1.7" />
                    </svg>
                </div>
                <div>
                    <p className="mv-serif text-lg font-semibold text-mv-green">Sealed</p>
                    <p className="mv-sans mt-1 text-sm text-mv-muted">
                        {daysLeft !== null
                            ? `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} until it can be opened.`
                            : 'This capsule is sealed.'}
                    </p>
                </div>
            </div>
        </div>
    )
}

export function ReadyNotOwner() {
    return (
        <div className="mt-6 rounded-2xl border border-mv-border bg-mv-card p-6 text-sm text-mv-muted shadow-sm">
            Only the owner can open this capsule.
        </div>
    )
}