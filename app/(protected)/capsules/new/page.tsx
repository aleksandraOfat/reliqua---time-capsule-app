'use client'

import {useActionState, useState,startTransition } from 'react'
import {createCapsuleFull, checkUserExists, type WizardState } from '../actions'
import LocationPicker from './location-picker'
import Link from 'next/link'

const initialState: WizardState = {}

const STEPS = ['General Information', 'Add contents', 'Summary']

export default function NewCapsuleWizard() {
    const [state, formAction, isPending] = useActionState(createCapsuleFull, initialState)
    const [step, setStep] = useState(0)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [localDate, setLocalDate] = useState('')
    const [message, setMessage] = useState('')
    const [files, setFiles] = useState<File[]>([])
    const [invites, setInvites] = useState<string[]>([])
    const [emailInput, setEmailInput] = useState('')
    const [readyToSubmit, setReadyToSubmit] = useState(false)
    const [capsulePassword, setCapsulePassword] = useState('')
    const [inviteError, setInviteError] = useState('')
    const [checking, setChecking] = useState(false)
    const [visibility, setVisibility] = useState<'private' | 'public'>('private')
    const [memLat, setMemLat]= useState('')
    const [memLng, setMemLng] = useState('')
    const [memCover, setMemCover] = useState<File | null>(null)
    const [stepError, setStepError] = useState('')

    const isoDate = localDate ? new Date(localDate).toISOString() : ''

    const canNextFrom0 = title.trim() && localDate && new Date(localDate) > new Date()

    function addFiles(list: FileList | null) {
        if (!list) return
        setFiles((prev) => [...prev, ...Array.from(list)])
    }
    async function addInvite() {
        const e = emailInput.trim()
        setInviteError('')
        if (!e) return
        if (invites.includes(e)) {
            setInviteError('That email is already on the list.')
            return
        }
        setChecking(true)
        const exists = await checkUserExists(e)
        setChecking(false)
        if (!exists) {
            setInviteError('No user found with that email address.')
            return
        }
        setInvites((prev) => [...prev, e])
        setEmailInput('')
    }

    function handleSeal() {
        const fd = new FormData()
        fd.set('title', title)
        fd.set('description', description)
        fd.set('open_date', isoDate)
        fd.set('message', message)
        fd.set('invites', JSON.stringify(invites))
        fd.set('capsule_password', capsulePassword)
        fd.set('visibility', visibility)
        fd.set('memory_lat', memLat)
        fd.set('memory_lng', memLng)
        if (memCover) fd.set('memory_cover', memCover)
        files.forEach((f) => fd.append('files', f))
        startTransition(() => {
            formAction(fd)
        })
    }

    function goNext() {
        if (step === 0) {
            const problems: string[] = []
            if (!title.trim()) problems.push('enter a capsule name')
            if (!localDate) problems.push('choose an opening date')
            else if (new Date(localDate) <= new Date()) problems.push('set the opening date in the future')
            if (visibility === 'public' && (!memLat || !memLng)) {
                problems.push('pick a location on the map for the public memory')
            }
            if (problems.length > 0) {
                setStepError('Please ' + problems.join(', and ') + '.')
                return
            }
        }
        setStepError('')
        setStep((s) => s + 1)
    }

    return (
        <div className="mx-auto max-w-2xl">
            <ol className="mb-8 flex items-center gap-2 text-sm">
                {STEPS.map((label, i) => (
                    <li key={label} className="flex flex-1 items-center gap-2">
                        <span
                            className={`mv-serif flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                i === step
                                    ? 'bg-mv-green text-white'
                                    : i < step
                                        ? 'bg-[#e7efe9] text-mv-green'
                                        : 'bg-mv-sand text-mv-muted ring-1 ring-mv-border'
                            }`}
                        >
                            {i < step ? '✓' : i + 1}
                        </span>
                        <span className={`mv-sans ${i === step ? 'font-medium text-mv-green' : 'text-mv-muted'}`}>
                            {label}
                        </span>
                        {i < STEPS.length - 1 && <span className="h-px flex-1 bg-mv-border"/>}
                    </li>
                ))}
            </ol>


            <form
                className="rounded-2xl border border-mv-border bg-mv-card p-6 shadow-sm sm:p-8"
                onSubmit={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                        e.preventDefault()
                    }
                }}
            >
                {/*/!* Ukryte pola: niosą stan kreatora do akcji serwerowej *!/*/}
                {/*<input type="hidden" name="title" value={title}/>*/}
                {/*<input type="hidden" name="description" value={description}/>*/}
                {/*<input type="hidden" name="open_date" value={isoDate}/>*/}
                {/*<input type="hidden" name="message" value={message}/>*/}
                {/*<input type="hidden" name="invites" value={JSON.stringify(invites)}/>*/}
                {/*<input type="hidden" name="capsule_password" value={capsulePassword}/>*/}

                {/* KROK 1 */}
                {step === 0 && (
                    <div className="flex flex-col gap-5">
                        <Field label="Capsule name">
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={inputCls}
                                placeholder="Vacation 2025 – Greece"
                            />
                        </Field>
                        <Field label="Capsule description">
              <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className={inputCls}
              />
                        </Field>
                        <Field label="Opening date">
                            <input
                                type="datetime-local"
                                value={localDate}
                                onChange={(e) => setLocalDate(e.target.value)}
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Visibility">
                            <div className="grid grid-cols-2 gap-3">
                                {(['private', 'public'] as const).map((v) => (
                                    <button
                                        type="button"
                                        key={v}
                                        onClick={() => setVisibility(v)}
                                        className={`mv-sans rounded-lg border px-3 py-2.5 text-sm transition ${
                                            visibility === v
                                                ? 'border-mv-green bg-[#e7efe9] text-mv-green'
                                                : 'border-mv-border text-mv-muted hover:bg-mv-sand'
                                        }`}
                                    >
                                        {v === 'private'
                                            ? 'Private — only you and invited people'
                                            : 'Public — show on the map after opening'}
                                    </button>
                                ))}
                            </div>
                        </Field>

                        {visibility === 'public' && (
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-slate-700">
                                    Pick the memory location
                                </span>
                                <LocationPicker
                                    onPick={(la, ln) => {
                                        setMemLat(la.toFixed(6))
                                        setMemLng(ln.toFixed(6))
                                    }}
                                />
                                {memLat && memLng ? (
                                    <span className="text-xs text-slate-500">
                                        Selected: {memLat}, {memLng}
                                    </span>
                                ) : (
                                    <span className="text-xs text-amber-700">
                                        Click on the map to choose where this memory will appear.
                                    </span>
                                )}
                                <label className="mt-3 text-sm font-medium text-slate-700">
                                    Cover photo (optional, public)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setMemCover(e.target.files?.[0] ?? null)}
                                    className="block w-full text-sm text-slate-600"
                                />
                                {memCover && (
                                    <span className="text-xs text-slate-500">{memCover.name}</span>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* KROK 2 */}
                {step === 1 && (
                    <div className="flex flex-col gap-6">
                        <Field label="Message to your future self">
              <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className={inputCls}
              />
                        </Field>
                        <div>
                            <p className="mb-1 text-sm font-medium text-slate-700">
                                Upload pictures and files
                            </p>
                            <label
                                className="mv-sans flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-mv-border bg-mv-sand px-4 py-10 text-center text-sm text-mv-muted transition hover:bg-[#f1e8dc]">
                                <span className="mb-2 text-2xl">↑</span>
                                Click to add photos and files
                                <input
                                    type="file"
                                    name="files"
                                    multiple
                                    onChange={(e) => addFiles(e.target.files)}
                                    className="hidden"
                                />
                            </label>
                            {files.length > 0 && (
                                <ul className="mt-3 flex flex-col gap-2">
                                    {files.map((f, i) => (
                                        <li
                                            key={i}
                                            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                                        >
                                            <span className="truncate">{f.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                ✕
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}


                {step === 2 && (
                    <div className="flex flex-col gap-6">
                        <div className="rounded-xl border border-mv-border bg-mv-card p-5 shadow-sm">
                            <p className="mv-serif mb-2 text-base font-semibold text-mv-green">Summary</p>
                            <SummaryRow label="Name" value={title || '—'}/>
                            <SummaryRow
                                label="Open date"
                                value={localDate ? new Date(localDate).toLocaleString() : '—'}
                            />
                            <SummaryRow
                                label="What's inside"
                                value={`${files.length} file(s) · ${message ? '1 message' : 'no message'}`}
                            />
                            <SummaryRow label="Visibility" value={visibility === 'public' ? 'Public' : 'Private'}/>
                        </div>

                        <div className="rounded-xl bg-mv-sand p-5">
                            <div className="flex flex-col gap-1.5">
                                <span className="mv-sans text-sm font-medium text-mv-ink">
                                    Capsule password <span className="text-mv-muted">(optional)</span>
                                </span>
                                <input
                                    type="password"
                                    value={capsulePassword}
                                    onChange={(e) => setCapsulePassword(e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="Required to open the capsule"
                                    className={inputCls}
                                />
                                <span className="mv-sans text-xs text-mv-muted">
                                    If set, this password will be required to open the capsule.
                                </span>
                            </div>
                        </div>

                        <div>
                            <p className="mb-1 text-sm font-medium text-slate-700">
                                Invite people (optional)
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    placeholder="e-mail address"
                                    className={inputCls}
                                />
                                <button
                                    type="button"
                                    onClick={addInvite}
                                    disabled={checking}
                                    className="mv-sans inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-mv-green px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-mv-green-hover disabled:opacity-50"
                                >
                                    {checking ? 'Checking…' : '+ Add'}
                                </button>
                            </div>

                            {inviteError && (
                                <p className="mt-2 text-sm text-red-700">{inviteError}</p>
                            )}
                            {invites.length > 0 && (
                                <ul className="mt-3 flex flex-col gap-2">
                                    {invites.map((e, i) => (
                                        <li
                                            key={i}
                                            className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700"
                                        >
                                            <span>{e}</span>
                                            <button
                                                type="button"
                                                onClick={() => setInvites((prev) => prev.filter((_, j) => j !== i))}
                                                className="text-slate-500 hover:text-slate-700"
                                            >
                                                ✕
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <p className="mt-2 text-xs text-slate-400">
                                Only people who already have an account can be invited.
                            </p>
                        </div>

                        {state.error && (
                            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                                {state.error}
                            </p>
                        )}
                    </div>
                )}


                {stepError && (
                    <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                        {stepError}
                    </p>
                )}
                <div className="mt-8 flex justify-center gap-3">
                    {step === 0 && (
                        <Link
                            href="/dashboard"
                            className="mv-sans rounded-lg border border-mv-border bg-white px-6 py-2.5 font-medium text-mv-muted transition hover:bg-mv-sand hover:text-mv-green"
                        >
                            Cancel
                        </Link>
                    )}

                    {step > 0 && (
                        <button
                            type="button"
                            onClick={() =>{ setStepError('');setStep((s) => s - 1)}}
                            className="mv-sans rounded-lg border border-mv-border bg-white px-6 py-2.5 font-medium text-mv-green transition hover:bg-mv-sand"
                        >
                            ← Back
                        </button>
                    )}
                    {step < 2 ? (
                        <button
                            type="button"
                            onClick={goNext}
                            className="mv-sans rounded-lg bg-mv-green px-10 py-2.5 font-semibold text-white transition hover:bg-mv-green-hover"
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={handleSeal}
                            className="mv-sans rounded-lg bg-mv-clay px-10 py-2.5 font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
                        >
                            {isPending ? 'Sealing…' : 'Seal Your Capsule'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    )
}

const inputCls =
    'mv-sans w-full rounded-lg border border-mv-border bg-white px-3 py-2.5 text-mv-ink outline-none focus:border-mv-green focus:ring-2 focus:ring-mv-green/20'

function Field({label, children}: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="mv-sans text-sm font-medium text-mv-ink">{label}</span>
            {children}
        </div>
    )
}

function SummaryRow({label, value}: { label: string; value: string }) {
    return (
        <div className="mv-sans flex items-center justify-between border-b border-mv-border py-2 last:border-0">
            <span className="text-mv-muted">{label}</span>
            <span className="font-medium text-mv-ink">{value}</span>
        </div>
    )
}