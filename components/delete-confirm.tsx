'use client'

import { useState } from 'react'

export default function DeleteConfirm({
                                          triggerLabel,
                                          title,
                                          description,
                                          confirmValue,
                                          confirmLabel,
                                          children,
                                      }: {
    triggerLabel: string
    title: string
    description: string
    confirmValue: string
    confirmLabel: string
    children: React.ReactNode
}) {
    const [open, setOpen] = useState(false)
    const [typed, setTyped] = useState('')

    const matches = typed.trim().toLowerCase() === confirmValue.trim().toLowerCase()

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="mv-sans rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
                {triggerLabel}
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="w-full max-w-md rounded-2xl border border-mv-border bg-mv-card p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="mv-serif text-lg font-semibold text-red-700">{title}</p>
                        <p className="mv-sans mt-2 text-sm text-mv-ink/80">{description}</p>

                        <p className="mv-sans mt-4 text-sm text-mv-ink">
                            To confirm, type <span className="font-semibold text-mv-ink">{confirmValue}</span> below:
                        </p>
                        <input
                            type="text"
                            value={typed}
                            onChange={(e) => setTyped(e.target.value)}
                            autoComplete="off"
                            className="mv-sans mt-2 w-full rounded-lg border border-mv-border bg-white px-3 py-2.5 text-mv-ink outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        />

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => { setOpen(false); setTyped('') }}
                                className="mv-sans rounded-lg border border-mv-border bg-white px-4 py-2.5 text-sm font-medium text-mv-green transition hover:bg-mv-sand"
                            >
                                Cancel
                            </button>

                            <span className={matches ? '' : 'pointer-events-none opacity-40'}>
                                {children}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}