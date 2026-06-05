'use client'

import { useActionState } from 'react'
import { authenticate, type AuthState } from './actions'

const initialState: AuthState = {}

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(authenticate, initialState)

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h1 className="mb-1 text-2xl font-semibold text-slate-900">
                    Kapsuła Czasu
                </h1>
                <p className="mb-6 text-sm text-slate-500">
                    Zaloguj się lub załóż nowe konto.
                </p>

                <form action={formAction} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="email" className="text-sm font-medium text-slate-700">
                            Adres e-mail
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="password" className="text-sm font-medium text-slate-700">
                            Hasło
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>

                    {state.error && (
                        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                            {state.error}
                        </p>
                    )}

                    {state.message && (
                        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                            {state.message}
                        </p>
                    )}

                    <div className="mt-2 flex flex-col gap-2">
                        <button
                            type="submit"
                            name="intent"
                            value="login"
                            disabled={isPending}
                            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isPending ? 'Pracuję…' : 'Zaloguj się'}
                        </button>

                        <button
                            type="submit"
                            name="intent"
                            value="signup"
                            disabled={isPending}
                            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            Załóż konto
                        </button>
                    </div>
                </form>
            </div>
        </main>
    )
}