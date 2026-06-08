'use client'

import { useActionState } from 'react'
import { updateProfile, changeEmail, changePassword, type ProfileState } from './actions'

const initial: ProfileState = {}
const inputCls =
    'mv-sans w-full rounded-lg border border-mv-border bg-white px-3 py-2.5 text-mv-ink outline-none focus:border-mv-green focus:ring-2 focus:ring-mv-green/20'

export default function ProfileForm({
                                        avatarUrl,
                                        fullName,
                                        username,
                                        email,
                                    }: {
    avatarUrl: string | null
    fullName: string
    username: string
    email: string
}) {
    const [pState, profileAction, pPending] = useActionState(updateProfile, initial)
    const [eState, emailAction, ePending] = useActionState(changeEmail, initial)
    const [pwState, passwordAction, pwPending] = useActionState(changePassword, initial)

    const initialLetter = (fullName || email || '?').charAt(0).toUpperCase()

    return (
        <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-mv-border bg-mv-card p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div
                        className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-mv-pink text-2xl font-semibold leading-none text-mv-green"
                        style={{width: '80px', height: '80px', minWidth: '80px', minHeight: '80px', flex: 'none'}}
                    >
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover"/>
                        ) : (
                            initialLetter
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="mv-serif truncate text-xl font-semibold text-mv-green">
                            {fullName || 'Your profile'}
                        </p>
                        <p className="mv-sans truncate text-sm text-mv-muted">{email}</p>
                    </div>
                </div>

                <form action={profileAction} className="mt-6 flex flex-col gap-4 border-t border-mv-border pt-6">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="full_name" className="mv-sans text-sm font-medium text-mv-ink">
                            Name and surname
                        </label>
                        <input id="full_name" name="full_name" defaultValue={fullName} className={inputCls}/>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="username" className="mv-sans text-sm font-medium text-mv-ink">
                            Username
                        </label>
                        <input id="username" name="username" defaultValue={username} className={inputCls}/>
                        <span className="mv-sans text-xs text-mv-muted">
                            Shown next to your messages and in shared capsules.
                        </span>
                    </div>

                    {pState.error && (
                        <p className="mv-sans rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{pState.error}</p>
                    )}
                    {pState.success && (
                        <p className="mv-sans rounded-lg bg-[#e7efe9] px-3 py-2 text-sm text-mv-green">{pState.success}</p>
                    )}

                    <button
                        type="submit"
                        disabled={pPending}
                        className="mv-sans inline-flex self-start shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-mv-green px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-mv-green-hover disabled:opacity-50"
                    >
                        {pPending ? 'Saving…' : 'Save profile'}
                    </button>
                </form>
            </div>

            <div className="rounded-2xl border border-mv-border bg-mv-card p-6 shadow-sm">
                <p className="mv-serif text-base font-semibold text-mv-green">E-mail address</p>
                <form action={emailAction} className="mt-3 flex flex-col gap-2">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <input id="email" name="email" type="email" defaultValue={email} className={inputCls}/>
                        <button
                            type="submit"
                            disabled={ePending}
                            className="mv-sans inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-mv-sand px-6 py-2.5 text-sm font-semibold text-mv-green ring-1 ring-mv-border transition hover:bg-[#f1e8dc] disabled:opacity-50"
                        >
                            {ePending ? '…' : 'Change'}
                        </button>
                    </div>
                    <p className="mv-sans text-xs text-mv-muted">
                        You&apos;ll need to confirm the change from your e-mail (check both your current and new address).
                    </p>
                    {eState.error && (
                        <p className="mv-sans rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{eState.error}</p>
                    )}
                    {eState.success && (
                        <p className="mv-sans rounded-lg bg-[#e7efe9] px-3 py-2 text-sm text-mv-green">{eState.success}</p>
                    )}
                </form>
            </div>

            <div className="rounded-2xl border border-mv-border bg-mv-card p-6 shadow-sm">
                <p className="mv-serif text-base font-semibold text-mv-green">Change password</p>
                <form action={passwordAction} className="mt-3 flex flex-col gap-2">
                    <input
                        name="password"
                        type="password"
                        placeholder="New password"
                        autoComplete="new-password"
                        className={inputCls}
                    />
                    <input
                        name="confirm"
                        type="password"
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        className={inputCls}
                    />
                    {pwState.error && (
                        <p className="mv-sans rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{pwState.error}</p>
                    )}
                    {pwState.success && (
                        <p className="mv-sans rounded-lg bg-[#e7efe9] px-3 py-2 text-sm text-mv-green">{pwState.success}</p>
                    )}
                    <button
                        type="submit"
                        disabled={pwPending}
                        className="mv-sans inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-mv-sand px-6 py-2.5 text-sm font-semibold text-mv-green ring-1 ring-mv-border transition hover:bg-[#f1e8dc] disabled:opacity-50"
                    >
                        {pwPending ? 'Saving…' : 'Change password'}
                    </button>
                </form>
            </div>
        </div>
    )
}