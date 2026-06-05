'use client'

import {useActionState, useState,startTransition } from 'react'
import {createCapsuleFull, checkUserExists, type WizardState } from '../actions'

const initialState: WizardState = {}

const STEPS = ['General Information', 'Add contents', 'Summary']

export default function NewCapsuleWizard() {
    const [state, formAction, isPending] = useActionState(createCapsuleFull, initialState)
    const [step, setStep] = useState(0)

    // Stan formularza zachowywany między krokami
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
        files.forEach((f) => fd.append('files', f))
        startTransition(() => {
            formAction(fd)
        })
    }

    return (
        <div className="mx-auto max-w-2xl">
            {/* Pasek kroków */}
            <ol className="mb-8 flex items-center gap-2 text-sm">
                {STEPS.map((label, i) => (
                    <li key={label} className="flex flex-1 items-center gap-2">
            <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    i === step
                        ? 'bg-emerald-700 text-white'
                        : i < step
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-500'
                }`}
            >
              {i < step ? '✓' : i + 1}
            </span>
                        <span className={i === step ? 'text-emerald-800' : 'text-slate-500'}>
              {label}
            </span>
                        {i < STEPS.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
                    </li>
                ))}
            </ol>


            <form
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
                        <Field label="Visibility (coming soon)">
                            <div className="grid grid-cols-3 gap-3 opacity-60">
                                {['Private', 'Public', 'Group'].map((v) => (
                                    <div key={v}
                                         className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600">
                                        {v}
                                    </div>
                                ))}
                            </div>
                        </Field>
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
                                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-200 bg-amber-50 px-4 py-10 text-center text-sm text-slate-500 transition hover:bg-amber-100">
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

                {/* KROK 3 */}
                {step === 2 && (
                    <div className="flex flex-col gap-6">
                        <div className="rounded-xl bg-amber-50 p-5">
                            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">
                Capsule password <span className="text-slate-400">(optional)</span>
              </span>
                                <input
                                    type="password"
                                    value={capsulePassword}
                                    onChange={(e) => setCapsulePassword(e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="Required to open the capsule"
                                    className={inputCls}
                                />
                                <span className="text-xs text-slate-400">
                If set, this password will be required to open the capsule.
              </span>
                            </div>
                            <SummaryRow label="Name" value={title || '—'}/>
                            <SummaryRow
                                label="Open Date"
                                value={localDate ? new Date(localDate).toLocaleString() : '—'}
                            />
                            <SummaryRow
                                label="What's Inside"
                                value={`${files.length} file(s) · ${message ? '1 message' : 'no message'}`}
                            />
                            <SummaryRow label="Visibility" value="Private"/>
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
                                    className="shrink-0 rounded-lg bg-emerald-800 px-4 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
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

                {/* Nawigacja */}
                <div className="mt-8 flex justify-center gap-3">
                    {step > 0 && (
                        <button
                            type="button"
                            onClick={() => setStep((s) => s - 1)}
                            className="rounded-lg bg-amber-600 px-6 py-2.5 font-medium text-white hover:bg-amber-700"
                        >
                            ← Back
                        </button>
                    )}
                    {step < 2 ? (
                        <button
                            type="button"
                            disabled={step === 0 && !canNextFrom0}
                            onClick={() => setStep((s) => s + 1)}
                            className="rounded-lg bg-emerald-900 px-10 py-2.5 font-medium text-white hover:bg-emerald-950 disabled:opacity-40"
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={handleSeal}
                            className="rounded-lg bg-emerald-900 px-10 py-2.5 font-medium text-white hover:bg-emerald-950 disabled:opacity-50"
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
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'

function Field({label, children}: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            {children}
        </div>
    )
}

function SummaryRow({label, value}: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between border-b border-amber-200/60 py-2 last:border-0">
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-900">{value}</span>
        </div>
    )
}