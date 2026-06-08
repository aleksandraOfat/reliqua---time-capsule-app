import Link from 'next/link'
import {
    addContribution,
    addContributionFile,
    deleteContribution,
    deleteContributionFile,
    sealNow,
    finishContribution,
    deleteMemory,
} from '../actions'
import ConfirmButton from '@/components/confirm-button'
import AttachFileForm from './attach-file-form'

type Contribution = { content_id: string; message: string; author_name: string; author_id: string }
type FileItem = { id: string; file_name: string; mime_type: string | null; author_id: string }

export default function CollectingPanel({
                                            id,
                                            contributions,
                                            collectingFiles,
                                            canContribute,
                                            windowOpen,
                                            isOwner,
                                            userId,
                                            hoursLeft,
                                            myMemoryId,
                                        }: {
    id: string
    contributions: Contribution[]
    collectingFiles: FileItem[]
    canContribute: boolean
    windowOpen: boolean
    isOwner: boolean
    userId?: string
    hoursLeft: number | null
    myMemoryId: string | null
}) {
    const count = contributions.length + collectingFiles.length
    const daysToSeal = hoursLeft !== null ? Math.max(1, Math.ceil(hoursLeft / 24)) : null

    return (
        <div className="mt-6 flex flex-col gap-6">
            {/* Pamięci */}
            <div className="rounded-2xl border border-mv-border bg-mv-card p-6 shadow-sm">
                <p className="mv-serif text-lg font-semibold text-mv-green">
                    Memories <span className="text-mv-muted">· {count}</span>
                </p>

                {count === 0 ? (
                    <p className="mv-sans mt-3 text-sm text-mv-muted">
                        Nothing here yet. Be the first to add a memory.
                    </p>
                ) : (
                    <ul className="mt-4 flex flex-col gap-3">
                        {contributions.map((c) => (
                            <li key={c.content_id} className="rounded-xl bg-mv-sand p-4">
                                <div className="flex items-start gap-3">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mv-pink text-sm font-semibold leading-none text-mv-green">
                                        {(c.author_name || '?').charAt(0).toUpperCase()}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="mv-sans whitespace-pre-wrap text-sm text-mv-ink">
                                            {c.message || '(empty message)'}
                                        </p>
                                        <p className="mv-sans mt-1 text-xs text-mv-muted">{c.author_name}</p>
                                    </div>
                                    {c.author_id === userId && windowOpen && (
                                        <form action={deleteContribution}>
                                            <input type="hidden" name="capsule_id" value={id} />
                                            <input type="hidden" name="content_id" value={c.content_id} />
                                            <button type="submit" className="mv-sans shrink-0 text-xs font-medium text-red-600 hover:text-red-700">
                                                Delete
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </li>
                        ))}

                        {collectingFiles.map((f) => {
                            const isImage = f.mime_type?.startsWith('image/')
                            return (
                                <li key={f.id} className="rounded-xl bg-mv-sand p-4">
                                    {isImage && (
                                        <img src={`/capsules/${id}/files/${f.id}`} alt={f.file_name}
                                             className="mb-2 max-h-56 rounded-lg border border-mv-border object-contain" />
                                    )}
                                    <div className="flex items-center justify-between gap-3">
                                        <a href={`/capsules/${id}/files/${f.id}`} download={f.file_name}
                                           className="mv-sans truncate text-sm font-medium text-mv-green hover:underline">
                                            ↓ {f.file_name}
                                        </a>
                                        {f.author_id === userId && windowOpen && (
                                            <form action={deleteContributionFile}>
                                                <input type="hidden" name="capsule_id" value={id} />
                                                <input type="hidden" name="file_id" value={f.id} />
                                                <button type="submit" className="mv-sans shrink-0 text-xs font-medium text-red-600 hover:text-red-700">
                                                    Delete
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}

                {canContribute && windowOpen && (
                    <div className="mt-6 border-t border-mv-border pt-5">
                        <form action={addContribution}>
                            <input type="hidden" name="capsule_id" value={id} />
                            <label className="mv-sans text-sm font-medium text-mv-ink">Add a memory</label>
                            <textarea name="message" rows={3} placeholder="Write something…"
                                      className="mv-sans mt-2 w-full resize-none rounded-lg border border-mv-border bg-white px-3 py-2 text-mv-ink outline-none focus:border-mv-green focus:ring-2 focus:ring-mv-green/20" />
                            <div className="mt-3 flex justify-end">
                                <button type="submit"
                                        className="mv-sans inline-flex items-center gap-1.5 rounded-lg bg-mv-green px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-mv-green-hover">
                                    <span className="text-base leading-none">+</span> Add memory
                                </button>
                            </div>
                        </form>

                        <AttachFileForm capsuleId={id} />
                    </div>
                )}

                {!canContribute && (
                    <p className="mv-sans mt-5 border-t border-mv-border pt-5 text-sm text-mv-muted">
                        You don&apos;t have permission to add to this capsule.
                    </p>
                )}

                {!isOwner && canContribute && windowOpen && (
                    <form action={finishContribution} className="mt-5 border-t border-mv-border pt-5">
                        <input type="hidden" name="capsule_id" value={id}/>
                        <button type="submit"
                                className="mv-sans rounded-lg border border-mv-border px-4 py-2.5 text-sm font-medium text-mv-green transition hover:bg-mv-sand">
                            I&apos;m done contributing
                        </button>
                    </form>
                )}
            </div>


            {isOwner && (
                <div className="grid grid-cols-1 gap-6">

                    <div className="rounded-2xl border border-mv-border bg-mv-card p-6 shadow-sm">
                        <p className="mv-serif text-base font-semibold text-mv-green">Sealing</p>
                        <p className="mv-sans mt-2 text-sm text-mv-muted">
                            {daysToSeal !== null
                                ? `Auto-seals in ~${daysToSeal} ${daysToSeal === 1 ? 'day' : 'days'}, or seal now to lock it forever.`
                                : 'Seal now to lock this capsule now.'}
                        </p>
                        <form action={sealNow} className="mt-4">
                            <input type="hidden" name="capsule_id" value={id} />
                            <ConfirmButton
                                message="Seal this capsule now? After sealing, no more memories can be added and this cannot be undone."
                                className="mv-sans block w-full rounded-lg bg-mv-clay px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:brightness-95"
                            >
                                Seal now
                            </ConfirmButton>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}