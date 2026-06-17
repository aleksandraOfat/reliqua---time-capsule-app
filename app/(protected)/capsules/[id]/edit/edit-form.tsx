'use client'

import { useActionState } from 'react'
import { updateCapsuleMeta, type EditState } from '../../actions'
import Link from 'next/link'

const initialState: EditState = {}

const inputCls =
    'mv-sans w-full rounded-lg border border-mv-border bg-white px-3 py-2.5 text-mv-ink outline-none focus:border-mv-green focus:ring-2 focus:ring-mv-green/20'

export default function EditMetaForm({
                                         capsuleId,
                                         initialTitle,
                                         initialDescription,
                                     }: {
    capsuleId: string
    initialTitle: string
    initialDescription: string
}) {
    const [state, formAction, isPending] = useActionState(updateCapsuleMeta, initialState)

    return (
        <div className="mx-auto max-w-lg">
            <Link
                href={`/capsules/${capsuleId}`}
                className="mv-sans text-sm text-mv-muted transition hover:text-mv-green"
            >
                ← Back to capsule
            </Link>
            <h1 className="mv-serif font-semibold text-mv-green" style={{ fontSize: '28px', lineHeight: 1.2 }}>
                Edit capsule details
            </h1>
            <p className="mv-sans mt-2 text-sm text-mv-muted">
                You can change the name and description even after sealing. The sealed contents (messages and files)
                cannot be edited.
            </p>

            <form action={formAction} className="mt-6 rounded-2xl border border-mv-border bg-mv-card p-6 shadow-sm">
                <input type="hidden" name="capsule_id" value={capsuleId}/>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="title" className="mv-sans text-sm font-medium text-mv-ink">
                        Name
                    </label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        defaultValue={initialTitle}
                        required
                        className={inputCls}
                    />
                </div>

                <div className="mt-4 flex flex-col gap-1.5">
                    <label htmlFor="description" className="mv-sans text-sm font-medium text-mv-ink">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        defaultValue={initialDescription}
                        className={`${inputCls} resize-none`}
                    />
                </div>

                {state.error && (
                    <p className="mv-sans mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                        {state.error}
                    </p>
                )}
                {state.success && (
                    <p className="mv-sans mt-4 rounded-lg bg-[#e7efe9] px-3 py-2 text-sm text-mv-green">
                        {state.success}
                    </p>
                )}

                <div className="mt-5 flex justify-center gap-3">
                    <Link
                        href="/dashboard"
                        className="mv-sans inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-mv-border bg-white px-6 py-2.5 font-semibold text-mv-ink transition hover:bg-mv-sand"
                    >
                        Close
                    </Link>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="mv-sans inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-mv-green px-6 py-2.5 font-semibold text-white transition hover:bg-mv-green-hover disabled:opacity-50"
                    >
                        {isPending ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}