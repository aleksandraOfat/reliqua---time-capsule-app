import {notFound} from 'next/navigation'
import Link from 'next/link'
import {createClient } from '@/lib/supabase/server'
//import { openCapsule } from '../actions'
import {decrypt} from '@/lib/crypto'
import {openCapsule, inviteMember, removeMember, addContribution,addContributionFile, sealNow, finishContribution, deleteContribution, deleteContributionFile,deleteCapsule,deleteMemory} from '../actions'
import ConfirmButton from '@/components/confirm-button'


export default async function CapsulePage({
                                              params,
                                              searchParams,
                                          }: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ locked?: string; error?: string; invite?: string }>
}) {
    const { id } = await params
    const { locked, error, invite } = await searchParams

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { data: capsule } = await supabase
        .from('capsules')
        .select('id, title, description, status, owner_id, capsule_password_hash, seal_deadline, created_at, open_conditions(open_date)')
        .eq('id', id)
        .maybeSingle()

    if (!capsule) {
        notFound()
    }

    const hasPassword = !!capsule.capsule_password_hash

    const cond = Array.isArray(capsule.open_conditions)
        ? capsule.open_conditions[0]
        : capsule.open_conditions
    const openDate: string | null = cond?.open_date ?? null
    const openMs = openDate ? new Date(openDate).getTime() : null
    const now = Date.now()

    const isOwner = capsule.owner_id === user?.id
    const isOpened = capsule.status === 'opened'
    const isReady = openMs !== null && openMs <= now
    const daysLeft =
        openMs !== null ? Math.ceil((openMs - now) / 86_400_000) : null


    const isCollecting = capsule.status === 'collecting'
    const sealDeadline = capsule.seal_deadline ? new Date(capsule.seal_deadline).getTime() : null
    const windowStarted = sealDeadline !== null
    const windowOpen = isCollecting && (sealDeadline === null || sealDeadline > now)
    const hoursLeft = sealDeadline ? Math.max(0, Math.ceil((sealDeadline - now) / 3_600_000)) : null

    let canContribute = false
    if (isCollecting && user) {
        if (isOwner) {
            canContribute = true
        } else {
            const { data: myMembership } = await supabase
                .from('capsule_members')
                .select('status')
                .eq('capsule_id', id)
                .eq('user_id', user.id)
                .maybeSingle()
            canContribute = myMembership?.status === 'accepted'
        }
    }

    let members: Array<{ member_id: string; email: string; member_role: string }> = []
    if (isOwner) {
        const { data } = await supabase.rpc('get_capsule_members', { cap_id: id })
        members = data ?? []
    }

    const inviteMessages: Record<string, { text: string; ok: boolean }> = {
        ok: { text: 'Collaborator added.', ok: true },
        notfound: { text: 'No user found with that email.', ok: false },
        self: { text: 'You cannot invite yourself.', ok: false },
        exists: { text: 'That user is already a collaborator.', ok: false },
        empty: { text: 'Please enter an email address.', ok: false },
        forbidden: { text: 'You are not allowed to manage this capsule.', ok: false },
        error: { text: 'Something went wrong. Please try again.', ok: false },
    }
    const inviteResult = invite ? inviteMessages[invite] : null

    let message: string | null = null
    if (isOpened) {
        const { data: content } = await supabase
            .from('capsule_contents')
            .select('encrypted_message')
            .eq('capsule_id', id)
            .maybeSingle()

        if (content?.encrypted_message) {
            try {
                message = decrypt(content.encrypted_message)
            } catch {
                message = '[Unable to decrypt this message.]'
            }
        }
    }

    let contributions: Array<{
        content_id: string
        message: string
        author_name: string
        author_id: string
        created_at: string
    }> = []
    let collectingFiles: Array<{ id: string; file_name: string; mime_type: string | null; author_id: string }> = []

    if (!isOpened) {
        const { data: rows } = await supabase.rpc('get_capsule_contents_with_authors', { cap_id: id })
        contributions = (rows ?? []).map((r: any) => {
            let text = ''
            try {
                text = r.encrypted_message ? decrypt(r.encrypted_message) : ''
            } catch {
                text = '[Unable to decrypt]'
            }
            return {
                content_id: r.content_id,
                message: text,
                author_name: r.author_name ?? 'Unknown',
                author_id: r.author_id,
                created_at: r.created_at,
            }
        })

        const { data: fileRows } = await supabase
            .from('capsule_files')
            .select('id, file_name, mime_type, author_id')
            .eq('capsule_id', id)

        collectingFiles = fileRows ?? []
    }


    let files: Array<{ id: string; file_name: string; mime_type: string | null }> = []
    if (isOpened) {
        const { data: fileRows } = await supabase
            .from('capsule_files')
            .select('id, file_name, mime_type, author_id')
            .eq('capsule_id', id)
        files = fileRows ?? []
    }

    let myMemoryId: string | null = null
    if (isOwner){
        const { data: mem } = await supabase
            .from('public_memories')
            .select('id')
            .eq('capsule_id', id)
            .maybeSingle()
        myMemoryId = mem?.id ?? null
    }


    return (
        <div className="mx-auto max-w-lg">
            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
                ← Back to dashboard
            </Link>

            <h1 className="mt-3 text-2xl font-semibold text-slate-900">{capsule.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
                {openDate ? `Opens ${new Date(openDate).toLocaleString()}` : 'No open date set'}
            </p>

            {capsule.description && (
                <p className="mt-2 text-slate-600">{capsule.description}</p>
            )}

            {isOwner && !isCollecting && (
                <Link
                    href={`/capsules/${id}/edit`}
                    className="mt-3 inline-block rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                    Edit details
                </Link>
            )}

            {isOpened && (
                <div className="mt-6 flex flex-col gap-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                            Message
                        </p>
                        <p className="whitespace-pre-wrap text-slate-800">
                            {message || 'This capsule has no message.'}
                        </p>
                    </div>

                    {files.length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                                Files
                            </p>
                            <ul className="flex flex-col gap-3">
                                {files.map((f) => {
                                    const isImage = f.mime_type?.startsWith('image/')
                                    return (
                                        <li key={f.id} className="flex flex-col gap-2">
                                            {isImage && (
                                                <img
                                                    src={`/capsules/${id}/files/${f.id}`}
                                                    alt={f.file_name}
                                                    className="max-h-80 rounded-lg border border-slate-200 object-contain"
                                                />
                                            )}

                                            <a
                                                href={`/capsules/${id}/files/${f.id}`}
                                                download={f.file_name}
                                                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                            >
                                                ↓ {f.file_name}
                                            </a>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {isOpened && isOwner && (
                myMemoryId ? (
                    <form action={deleteMemory} className="mt-4">
                        <input type="hidden" name="memory_id" value={myMemoryId} />
                        <input type="hidden" name="capsule_id" value={id} />
                        <input type="hidden" name="return_to" value={`/capsules/${id}`} />
                        <ConfirmButton
                            message="Remove this capsule's memory from the public map?"
                            className="inline-block rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                            Remove from public map
                        </ConfirmButton>
                    </form>
                ) : (
                    <Link
                        href={`/capsules/${id}/share`}
                        className="mt-4 inline-block rounded-lg border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                    >
                        Share as public memory
                    </Link>
                )
            )}

            {isCollecting && (
                <div className="mt-6 flex flex-col gap-4">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        This capsule is collecting memories. Everyone who joined can see what&apos;s
                        inside and keep adding.
                    </div>

                    {(contributions.length > 0 || collectingFiles.length > 0) && (
                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                                In this capsule so far
                            </p>

                            <ul className="flex flex-col gap-3">
                                {contributions.map((c) => (
                                    <li key={c.content_id} className="rounded-lg bg-slate-50 p-3">
                                        <p className="whitespace-pre-wrap text-sm text-slate-800">
                                            {c.message || '(empty message)'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            Added by {c.author_name}
                                        </p>
                                        {c.author_id === user?.id && windowOpen && (
                                            <form action={deleteContribution} className="mt-2">
                                                <input type="hidden" name="capsule_id" value={capsule.id} />
                                                <input type="hidden" name="content_id" value={c.content_id} />
                                                <button
                                                    type="submit"
                                                    className="text-xs font-medium text-red-600 hover:text-red-700"
                                                >
                                                    Delete
                                                </button>

                                            </form>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            {collectingFiles.length > 0 && (
                                <ul className="mt-3 flex flex-col gap-2">
                                    {collectingFiles.map((f) => {
                                        const isImage = f.mime_type?.startsWith('image/')
                                        return (
                                            <li key={f.id} className="flex flex-col gap-2">
                                                {isImage && (
                                                    <img
                                                        src={`/capsules/${id}/files/${f.id}`}
                                                        alt={f.file_name}
                                                        className="max-h-60 rounded-lg border border-slate-200 object-contain"
                                                    />
                                                )}

                                                <a
                                                    href={`/capsules/${id}/files/${f.id}`}
                                                    download={f.file_name}
                                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                                >
                                                    ↓ {f.file_name}
                                                </a>
                                                {f.author_id === user?.id && windowOpen && (
                                                    <form action={deleteContributionFile}>
                                                        <input type="hidden" name="capsule_id" value={capsule.id}/>
                                                        <input type="hidden" name="file_id" value={f.id}/>
                                                        <button
                                                            type="submit"
                                                            className="self-start text-xs font-medium text-red-600 hover:text-red-700"
                                                        >
                                                            Delete file
                                                        </button>
                                                    </form>
                                                )}
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </div>
                    )}


                    {canContribute ? (
                        <>
                            <form action={addContribution} className="rounded-xl border border-slate-200 bg-white p-5">
                                <input type="hidden" name="capsule_id" value={capsule.id} />
                                <label className="text-sm font-medium text-slate-700">
                                    Add your message
                                </label>
                                <textarea
                                    name="message"
                                    rows={3}
                                    className="mt-1 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                />
                                <button
                                    type="submit"
                                    className="mt-3 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                                >
                                    Add message
                                </button>
                            </form>

                            <form action={addContributionFile} className="rounded-xl border border-slate-200 bg-white p-5">
                                <input type="hidden" name="capsule_id" value={capsule.id} />
                                <label className="text-sm font-medium text-slate-700">
                                    Add a photo or file
                                </label>
                                <input
                                    type="file"
                                    name="file"
                                    className="mt-1 block w-full text-sm text-slate-600"
                                />
                                <button
                                    type="submit"
                                    className="mt-3 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                                >
                                    Add file
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                            You don&apos;t have permission to add to this capsule.
                        </div>
                    )}

                    {isOwner && (
                        <Link
                            href={`/capsules/${id}/share`}
                            className="inline-block rounded-lg border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                        >
                            Share as public memory
                        </Link>
                    )}
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                            <p className="text-sm text-amber-800">
                                {hoursLeft !== null
                                    ? `You can edit this capsule for about ${hoursLeft} more hour(s). After that it will be sealed automatically.`
                                    : 'This capsule will be sealed soon.'}
                                {' '}You can also seal it permanently now.
                            </p>
                            <form action={sealNow} className="mt-3">
                                <input type="hidden" name="capsule_id" value={capsule.id} />
                                <button
                                    type="submit"
                                    className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
                                >
                                    Seal now (final)
                                </button>
                            </form>
                        </div>
                    )

                    {!isOwner && canContribute && windowOpen &&(
                        <form action={finishContribution} className="rounded-xl border border-slate-200 bg-white p-5">
                            <input type="hidden" name="capsule_id" value={capsule.id} />
                            <p className="text-sm text-slate-600">
                                Done adding your memories? Let the owner know you&apos;ve finished.
                            </p>
                            <button
                                type="submit"
                                className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                I&apos;m done contributing
                            </button>
                        </form>
                    )}
                </div>
            )}

            {!isOpened && isReady && isOwner && (
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <p className="text-amber-800">This capsule is ready to be opened.</p>

                    {hasPassword && (
                        <p className="mt-1 text-sm text-slate-600">
                            This capsule is password protected.
                        </p>
                    )}

                    {locked && (
                        <p className="mt-2 text-sm text-red-700">
                            The open date has not been reached yet.
                        </p>
                    )}

                    {error === 'password' && (
                        <p className="mt-2 text-sm text-red-700">
                            Incorrect password. Please try again.
                        </p>
                    )}

                    <form action={openCapsule} className="mt-4 flex flex-col gap-3">
                        <input type="hidden" name="capsule_id" value={capsule.id} />
                        {hasPassword && (
                            <input
                                type="password"
                                name="capsule_password"
                                placeholder="Enter capsule password"
                                required
                                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                            />
                        )}
                        <button
                            type="submit"
                            className="rounded-lg bg-amber-700 px-4 py-2 font-medium text-white transition hover:bg-amber-800"
                        >
                            Open capsule
                        </button>
                    </form>
                </div>
            )}

            {!isOpened && isReady && !isOwner && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-slate-600">
                    Only the owner can open this capsule.
                </div>
            )}

            {!isOpened && !isReady && !isCollecting && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
                    <p className="text-slate-700">This capsule is still sealed.</p>
                    {daysLeft !== null && (
                        <p className="mt-1 text-sm text-slate-500">
                            {daysLeft} {daysLeft === 1 ? 'day' : 'days'} until it can be opened.
                        </p>
                    )}
                </div>
            )}

            {isOwner && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
                    <h2 className="text-lg font-medium text-slate-900">Collaborators</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Invite people to view this capsule once it is opened.
                    </p>

                    {inviteResult && (
                        <p
                            className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                                inviteResult.ok
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-red-50 text-red-700'
                            }`}
                        >
                            {inviteResult.text}
                        </p>
                    )}

                    <form
                        action={inviteMember}
                        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"
                    >
                        <input type="hidden" name="capsule_id" value={capsule.id} />
                        <input
                            type="email"
                            name="email"
                            placeholder="friend@example.com"
                            required
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                        <select
                            name="role"
                            defaultValue="viewer"
                            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                        </select>
                        <button
                            type="submit"
                            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700"
                        >
                            Invite
                        </button>
                    </form>

                    {members.length > 0 && (
                        <ul className="mt-4 flex flex-col gap-2">
                            {members.map((m) =>(
                                <li
                                    key={m.member_id}
                                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                                >
                  <span className="text-sm text-slate-700">
                    {m.email}
                      <span className="text-slate-400"> · {m.member_role}</span>
                  </span>
                                    <form action={removeMember}>
                                        <input type="hidden" name="capsule_id" value={capsule.id} />
                                        <input type="hidden" name="member_id" value={m.member_id} />
                                        <button
                                            type="submit"
                                            className="text-sm font-medium text-red-600 transition hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </form>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {isOwner && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
                    <h2 className="text-sm font-medium text-red-800">Danger zone</h2>
                    <p className="mt-1 text-sm text-red-700">
                        Deleting this capsule permanently removes all its messages and files.
                    </p>
                    <form action={deleteCapsule} className="mt-3">
                        <input type="hidden" name="capsule_id" value={capsule.id} />
                        <ConfirmButton

                            message="Delete this capsule permanently? This cannot be undone."
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                            Delete capsule
                        </ConfirmButton>
                    </form>
                </div>
            )}
        </div>
    )
    }