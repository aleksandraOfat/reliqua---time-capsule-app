'use client'

import { useActionState } from 'react'
import { authenticate, type AuthState } from './actions'
import Logo from '@/components/logo'

const initialState: AuthState = {}

const inputCls =
    'mv-sans w-full rounded-lg border border-mv-border bg-white px-3 py-2.5 text-mv-ink outline-none focus:border-mv-green focus:ring-2 focus:ring-mv-green/20'

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(authenticate, initialState)

    return (
        <main className="flex min-h-screen items-center justify-center bg-mv-sand px-4">
            <div className="w-full max-w-sm">
                <div className="mb-6 flex items-center justify-center gap-3">
                    <Logo className="mv-login-logo"/>
                    <span className="mv-heading text-mv-green" style={{fontSize: '32px', lineHeight: 1}}>
                        Reliqua
                    </span>
                </div>

                <div className="rounded-2xl border border-mv-border bg-mv-card p-8 shadow-sm">
                    <h1 className="mv-serif text-xl font-semibold text-mv-green">Welcome back</h1>
                    <p className="mv-sans mt-1 text-sm text-mv-muted">
                        Sign in or create a new account.
                    </p>

                    <form action={formAction} className="mt-6 flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" className="mv-sans text-sm font-medium text-mv-ink">
                                E-mail address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                className={inputCls}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="password" className="mv-sans text-sm font-medium text-mv-ink">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                className={inputCls}
                            />
                        </div>

                        {state.error && (
                            <p className="mv-sans rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                                {state.error}
                            </p>
                        )}

                        {state.message && (
                            <p className="mv-sans rounded-lg bg-[#e7efe9] px-3 py-2 text-sm text-mv-green">
                                {state.message}
                            </p>
                        )}

                        <div className="mt-2 flex flex-col gap-2">
                            <button
                                type="submit"
                                name="intent"
                                value="login"
                                disabled={isPending}
                                className="mv-sans rounded-lg bg-mv-green px-4 py-2.5 font-semibold text-white transition hover:bg-mv-green-hover disabled:opacity-50"
                            >
                                {isPending ? 'Working…' : 'Sign in'}
                            </button>

                            <button
                                type="submit"
                                name="intent"
                                value="signup"
                                disabled={isPending}
                                className="mv-sans rounded-lg border border-mv-border bg-white px-4 py-2.5 font-medium text-mv-green transition hover:bg-mv-sand disabled:opacity-50"
                            >
                                Create account
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    )
}