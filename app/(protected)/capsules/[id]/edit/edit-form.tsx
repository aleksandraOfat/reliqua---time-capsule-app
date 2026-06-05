'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { updateCapsuleMeta, type EditState } from '../../actions'

const initialState: EditState = {}

export default function EditMetaForm({
                                         capsuleId,
                                         initialTitle,
                                         initialDescription,
                                     }: {
    capsuleId: string
    initialTitle: string
    initialDescription:string
}) {
    const [state, formAction, isPending] = useActionState(updateCapsuleMeta, initialState)

    return (
        <div className="mx-auto max-w-lg">
            <Link
                href={`/capsules/${capsuleId}`}
                className="text-sm text-slate-500 hover:text-slate-700"
            >
                ← Back to capsule
            </Link>

            <h1 className="mt-3 text-2xl font-semibold text-slate-900">Edit capsule details</h1>
            <p className="mt-1 text-sm text-slate-500">
                You can change the name and description. The sealed contents cannot be edited.
            </p>

            <form action={formAction} className="mt-6 flex flex-col gap-5">
                <input type="hidden" name="capsule_id" value={capsuleId} />

                <div className="flex flex-col gap-1">
                    <label htmlFor="title" className="text-sm font-medium text-slate-700">
                        Name
                    </label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        defaultValue={initialTitle}
                        required
                        className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="description" className="text-sm font-medium text-slate-700">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        defaultValue={initialDescription}
                        className="resize-none rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                </div>

                {state.error && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                        {state.error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                    {isPending ? 'Saving…' : 'Save changes'}
                </button>
            </form>
        </div>
    )
}