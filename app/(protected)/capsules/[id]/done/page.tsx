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

    const { data: myFiles } = await supabase
        .from('capsule_files')
        .select('id, file_name')
        .eq('capsule_id', id)
        .eq('author_id', user!.id)

    const myMessages = (myContents ?? []).map((c) => {
        try {
            return c.encrypted_message ? decrypt(c.encrypted_message) : ''
        } catch {
            return '[unreadable]'
        }
    })

    return (
        <div className="mx-auto max-w-lg">
            <div className="rounded-2xl border border-mv-border bg-mv-card p-8 shadow-sm">
                <div className="flex items-center justify-center gap-4">
                    <div
                        className="grid shrink-0 place-items-center rounded-full bg-[#e7efe9] text-mv-green"
                        style={{width: '58px', height: '58px', minWidth: '58px', minHeight: '58px', flex: 'none'}}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                             style={{width: '32px', height: '32px'}}>
                            <path d="M5 13l4 4L19 7"/>
                        </svg>
                    </div>
                    <h1 className="mv-serif text-2xl font-semibold text-mv-green">Thank you!</h1>
                </div>
                <p className="mv-sans mt-3 text-center text-sm text-mv-ink/75">
                    Your contributions to “{capsule.title}” have been saved. The owner will seal
                    the capsule, and the contents will be revealed on the opening date.
                </p>
            </div>

            <div className="mt-6 rounded-2xl border border-mv-border bg-mv-card p-6 text-left shadow-sm">
                <p className="mv-serif text-base font-semibold text-mv-green">What you added</p>

                {myMessages.length === 0 && (myFiles?.length ?? 0) === 0 ? (
                    <p className="mv-sans mt-3 text-sm text-mv-muted">You didn&apos;t add anything.</p>
                ) : (
                    <ul className="mt-4 flex flex-col gap-2">
                        {myMessages.map((m, i) => (
                            <li key={`m-${i}`} className="rounded-xl bg-mv-sand p-3 text-sm text-mv-ink">
                                <span className="mv-sans whitespace-pre-wrap">{m || '(empty message)'}</span>
                            </li>
                        ))}

                        {(myFiles ?? []).map((f) => (
                            <li key={f.id}
                                className="mv-sans flex items-center gap-2 rounded-xl bg-mv-sand px-3 py-2.5 text-sm text-mv-ink">
                                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-mv-muted" fill="none"
                                     stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"
                                     strokeLinejoin="round">
                                    <path
                                        d="M21 11.5l-8.5 8.5a5 5 0 0 1-7-7L13 5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.3-2.3L14 8"/>
                                </svg>
                                {f.file_name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="mt-6 flex justify-center gap-3">
                <Link
                    href={`/capsules/${id}`}
                    className="mv-sans inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-mv-border bg-white px-6 py-2.5 text-sm font-semibold text-mv-green transition hover:bg-mv-sand"
                >
                    Back to capsule
                </Link>

                <Link
                    href="/dashboard"
                    className="mv-sans inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-mv-green px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-mv-green-hover"
                >
                    Go to dashboard
                </Link>
            </div>
        </div>
    )
}