'use client'

import { useActionState } from 'react'
import { updateProfile, changeEmail, updateAvatar,changePassword, type ProfileState } from './actions'


const initial: ProfileState = {}
const inputCls =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'

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
    const [pwState, passwordAction, pwPending]= useActionState(changePassword, initial)

    const initialLetter = (fullName || email || '?').charAt(0).toUpperCase()

    return (
        <div>

            <div className="flex flex-col items-center gap-3">
                <div
                    className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-pink-200 text-2xl font-medium text-pink-800">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover"/>
                    ) : (
                        initialLetter
                    )}
                </div>
                <form action={updateAvatar}>
                    <label
                        className="cursor-pointer rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-300">
                        Change picture
                        <input
                            type="file"
                            name="avatar"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        />
                    </label>
                </form>
            </div>

            <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-slate-400">
                Personal information
            </h2>

            <form action={profileAction} className="mt-3 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <label htmlFor="full_name" className="text-sm font-medium text-slate-700">
                        Name and Surname
                    </label>
                    <input id="full_name" name="full_name" defaultValue={fullName} className={inputCls}/>
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="username" className="text-sm font-medium text-slate-700">
                        Username
                    </label>
                    <input id="username" name="username" defaultValue={username} className={inputCls}/>
                </div>

                {pState.error && <p className="text-sm text-red-700">{pState.error}</p>}
                {pState.success && <p className="text-sm text-emerald-700">{pState.success}</p>}

                <button
                    type="submit"
                    disabled={pPending}
                    className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                    {pPending ? 'Saving…' : 'Save profile'}
                </button>
            </form>


            <form action={emailAction} className="mt-6 flex flex-col gap-1">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                    E-mail address
                </label>
                <div className="flex gap-2">
                    <input id="email" name="email" type="email" defaultValue={email} className={inputCls}/>
                    <button
                        type="submit"
                        disabled={ePending}
                        className="shrink-0 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        {ePending ? '…' : 'Change'}
                    </button>
                </div>
                {eState.error && <p className="text-sm text-red-700">{eState.error}</p>}
                {eState.success && <p className="text-sm text-emerald-700">{eState.success}</p>}
            </form>

            <form action={passwordAction} className="mt-6 flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Change password</label>
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
                    className={`${inputCls} mt-2`}
                />
                {pwState.error && <p className="mt-1 text-sm text-red-700">{pwState.error}</p>}
                {pwState.success && <p className="mt-1 text-sm text-emerald-700">{pwState.success}</p>}
                <button
                    type="submit"
                    disabled={pwPending}
                    className="mt-2 self-start rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    {pwPending ? 'Saving…' : 'Change password'}
                </button>
            </form>
        </div>
    )
}