'use client'

import { useState, useTransition } from 'react'
import { addContributionFile } from '../actions'

export default function AttachFileForm({ capsuleId }: { capsuleId: string }) {
    const [file, setFile] = useState<File | null>(null)
    const [pending, startTransition] = useTransition()

    function submit() {
        if (!file) return
        const fd = new FormData()
        fd.set('capsule_id', capsuleId)
        fd.append('file', file)
        startTransition(() => {
            addContributionFile(fd)
        })
    }

    return (
        <div className="mt-4 border-t border-mv-border pt-4">
            <label className="mv-sans text-sm font-medium text-mv-ink">Attach a file</label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="mv-sans flex-1 text-sm text-mv-muted file:mr-3 file:rounded-lg file:border-0 file:bg-mv-sand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-mv-green"
                />
                <button
                    type="button"
                    onClick={submit}
                    disabled={!file || pending}
                    className="mv-sans inline-flex items-center gap-1.5 rounded-lg bg-mv-green px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-mv-green-hover disabled:opacity-50 sm:ml-auto"
                >
                    {pending ? 'Attaching…' : 'Attach file'}
                </button>
            </div>
        </div>
    )
}