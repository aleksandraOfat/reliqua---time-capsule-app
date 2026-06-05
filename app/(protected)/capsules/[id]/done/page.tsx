import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/crypto'

export default async function DonePage({
                                           params,
                                       }: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: capsule } = await supabase
        .from('capsules')
        .select('title')
        .eq('id', id)
        .maybeSingle()
    if (!capsule) notFound()

    const { data: myContents } = await supabase
        .from('capsule_contents')
        .select('id, encrypted_message')
        .eq('capsule_id', id)
        .eq('author_id', user!.id)

    const { data: myFiles } =await supabase
        .from('capsule_files')
        .select('id, file_name')
        .eq('capsule_id', id)
        .eq('author_id', user!.id)

    const myMessages = (myContents ?? []).map((c) => {
        try {
            return c.encrypted_message ? decrypt(c.encrypted_message) : ''
        } catch {
            return'[unreadable]'
        }
    })

    return (
        <div className="mx-auto max-w-lg text-center">
            <h1 className="text-2xl font-semibold text-slate-900">Thank you!</h1>
            <p className="mt-2 text-slate-600">
                Your contributions to “{capsule.title}” have been saved. The owner will seal
                the capsule, and the contents will be revealed on the opening date.
            </p>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-left">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    What you added
                </p>

                {myMessages.length === 0 && (myFiles?.length ?? 0) === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">You didn&apos;t add anything.</p>
                ):(
                    <ul className="mt-3 flex flex-col gap-2">
                        {myMessages.map((m, i) => (
                            <li key={`m-${i}`} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
                                <span className="whitespace-pre-wrap">{m || '(empty message)'}</span>
                            </li>
                        ))}

                        {(myFiles ?? []).map((f) => (
                            <li key={f.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                📎 {f.file_name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="mt-6 flex justify-center gap-3">
                <Link
                    href={`/capsules/${id}`}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    Back to capsule
                </Link>
                <Link
                    href="/dashboard"
                    className="rounded-lg bg-emerald-900 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-950"
                >
                    Go to dashboard
                </Link>
            </div>
        </div>
    )
}