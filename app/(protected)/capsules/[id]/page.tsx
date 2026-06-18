import {notFound} from 'next/navigation'
import Link from 'next/link'
import {createClient } from '@/lib/supabase/server'
//import { openCapsule } from '../actions'
import {decrypt} from '@/lib/crypto'
import {openCapsule, inviteMember, removeMember, addContribution,addContributionFile, sealNow, finishContribution, deleteContribution, deleteContributionFile,deleteCapsule,deleteMemory, updateCapsuleTags} from '../actions'
import ConfirmButton from '@/components/confirm-button'
import CapsuleHeader from '@/components/capsule-header'
import CollectingPanel from './collecting-panel'
import { OpenedView, ReadyView, SealedView, ReadyNotOwner } from './capsule-states'
import OwnerTools from './owner-tools'
import { deriveCapsuleState } from '@/lib/capsule-state'


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
    const canEditTags = isOwner && capsule.status !== 'opened'
    const isReady = openMs !== null && openMs <= now
    const daysLeft =
        openMs !== null ? Math.ceil((openMs - now) / 86_400_000) : null


    const isCollecting = capsule.status === 'collecting'
    const sealDeadline = capsule.seal_deadline ? new Date(capsule.seal_deadline).getTime() : null
    const windowStarted = sealDeadline !== null
    const windowOpen = isCollecting && (sealDeadline === null || sealDeadline > now)
    const hoursLeft = sealDeadline ? Math.max(0, Math.ceil((sealDeadline - now) / 3_600_000)) : null
    // const lifecycleState: 'collecting' | 'sealed' | 'ready' | 'opened' =
    //     isOpened ? 'opened' : isCollecting ? 'collecting' : isReady ? 'ready' : 'sealed'
    const lifecycleState = deriveCapsuleState({ status: capsule.status, openDateMs: openMs, now })

    const createdMsCap = new Date(capsule.created_at).getTime()
    const pct = (from: number, to: number) =>
        to <= from ? 100 : Math.min(100, Math.max(0, ((now - from) / (to - from)) * 100))

    let progressPct: number | null = null
    let progressLabel = 'Status'
    let progressValue = ''

    if (lifecycleState === 'collecting') {
        progressLabel = 'Seals in'
        if (sealDeadline) {
            progressPct = pct(createdMsCap, sealDeadline)
            const totalH = Math.max(0, Math.ceil((sealDeadline - now) / 3_600_000))
            const d = Math.floor(totalH / 24)
            const h = totalH % 24
            progressValue = d > 0 ? `~${d} ${d === 1 ? 'day' : 'days'} ${h} h` : `~${h} h`
        } else {
            progressValue = 'soon'
            progressPct = 8
        }
    } else if (lifecycleState === 'sealed') {
        progressLabel = 'Opens in'
        if (openMs) {
            progressPct = pct(createdMsCap, openMs)
            progressValue = daysLeft !== null ? `~${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}` : ''
        }
    } else if (lifecycleState === 'ready') {
        progressLabel = 'Status'
        progressValue = 'Ready now'
        progressPct = 100
    } else {
        progressLabel = 'Status'
        progressValue = 'Opened'
        progressPct = 100
    }

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


    let openedContributions: Array<{ message: string; author_name: string }> = []
    if (isOpened) {
        const { data: rows } = await supabase.rpc('get_capsule_contents_with_authors', { cap_id: id })
        openedContributions = (rows ?? []).map((r: any) => {
            let text = ''
            try {
                text = r.encrypted_message ? decrypt(r.encrypted_message) : ''
            } catch {
                text = '[Unable to decrypt]'
            }
            return { message: text, author_name: r.author_name ?? 'Unknown' }
        })
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

    const { data: capsuleTagsRows } = await supabase
        .from('capsule_tags')
        .select('tags(name)')
        .eq('capsule_id', id)
    const tagNames: string[] = (capsuleTagsRows ?? [])
        .map((r: any) => r.tags?.name)
        .filter(Boolean)

    return (
        <div className="mx-auto max-w-2xl">
            <Link href="/dashboard" className="mv-sans text-sm text-mv-muted transition hover:text-mv-green">
                ← Back to dashboard
            </Link>

            <div className="mt-3">
                <CapsuleHeader
                    id={id}
                    title={capsule.title}
                    description={capsule.description}
                    openDate={openDate}
                    state={lifecycleState}
                    progressPct={progressPct}
                    progressLabel={progressLabel}
                    progressValue={progressValue}
                    canEdit={isOwner && !isCollecting}
                    isOwner={isOwner}
                    myMemoryId={myMemoryId}
                />
            </div>

            {(tagNames.length > 0 || canEditTags) && (
                <div className="mt-3 rounded-2xl border border-mv-border bg-mv-card p-4 shadow-sm">
                    {tagNames.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {tagNames.map((name) => (
                                <Link
                                    key={name}
                                    href={`/search?q=${encodeURIComponent(name)}`}
                                    className="mv-sans rounded-full bg-[#e7efe9] px-3 py-1 text-xs font-medium text-mv-green transition hover:brightness-95"
                                >
                                    #{name}
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="mv-sans text-sm text-mv-muted">No tags yet.</p>
                    )}

                    {canEditTags && (
                        <div className="mt-3">
                            <form action={updateCapsuleTags} className="flex gap-2">
                                <input type="hidden" name="capsule_id" value={id} />
                                <input
                                    name="tags"
                                    type="text"
                                    defaultValue={tagNames.join(', ')}
                                    placeholder="e.g. family, vacation, wedding"
                                    className="mv-sans flex-1 rounded-lg border border-mv-border bg-white px-3 py-2 text-sm text-mv-ink outline-none focus:border-mv-green focus:ring-2 focus:ring-mv-green/20"
                                />
                                <button
                                    type="submit"
                                    className="mv-sans shrink-0 rounded-lg bg-mv-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-mv-green-hover"
                                >
                                    Save tags
                                </button>
                            </form>
                            <p className="mv-sans mt-1.5 text-xs text-mv-muted">
                                Separate tags with commas. Saving replaces the current tags with this list.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {isOpened && (
                <OpenedView
                    id={id}
                    contributions={openedContributions}
                    files={files}
                    isOwner={isOwner}
                    myMemoryId={myMemoryId}
                />
            )}


            {isCollecting && (
                <CollectingPanel
                    id={id}
                    contributions={contributions}
                    collectingFiles={collectingFiles}
                    canContribute={canContribute}
                    windowOpen={windowOpen}
                    isOwner={isOwner}
                    userId={user?.id}
                    hoursLeft={hoursLeft}
                    myMemoryId={myMemoryId}
                />
            )}

            {!isOpened && isReady && isOwner && (
                <ReadyView
                    id={id}
                    hasPassword={hasPassword}
                    locked={!!locked}
                    passwordError={error === 'password'}
                />
            )}

            {!isOpened && isReady && !isOwner && <ReadyNotOwner />}

            {!isOpened && !isReady && !isCollecting && <SealedView daysLeft={daysLeft} />}

            {isOwner && (
                <OwnerTools id={id} title={capsule.title} members={members} inviteResult={inviteResult} />
            )}

        </div>
    )
    }