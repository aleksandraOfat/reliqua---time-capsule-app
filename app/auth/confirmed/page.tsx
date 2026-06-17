import Link from 'next/link'
import Logo from '@/components/logo'

export const metadata = {
    title: 'Account confirmation',
}

export default async function ConfirmedPage({
                                                searchParams,
                                            }: {
    searchParams: Promise<{ status?: string }>
}) {
    const { status } = await searchParams
    const success = status === 'success'

    return (
        <div className="flex min-h-screen items-center justify-center bg-mv-sand px-6">
            <div className="w-full max-w-md rounded-2xl border border-mv-border bg-mv-card p-8 text-center shadow-sm">
                <div className="mb-6 flex items-center justify-center gap-3">
                    <Logo className="mv-login-logo" />
                    <span className="mv-heading text-mv-green" style={{ fontSize: '28px', lineHeight: 1 }}>
                        Reliqua
                    </span>
                </div>

                {success ? (
                    <>
                        <div
                            className="mx-auto grid place-items-center rounded-full bg-[#e7efe9] text-mv-green"
                            style={{ width: '56px', height: '56px' }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                                 strokeLinecap="round" strokeLinejoin="round" style={{ width: '28px', height: '28px' }}>
                                <circle cx="12" cy="12" r="9" />
                                <path d="M8.5 12.2l2.3 2.3 4.7-4.9" />
                            </svg>
                        </div>
                        <h1 className="mv-serif mt-5 text-xl font-semibold text-mv-green">
                            Your account is now active
                        </h1>
                        <p className="mv-sans mt-3 text-sm text-mv-ink/75">
                            Your email address has been confirmed. You can sign in now and start
                            creating time capsules.
                        </p>
                    </>
                ) : (
                    <>
                        <div
                            className="mx-auto grid place-items-center rounded-full bg-[#f1e4d8] text-mv-clay"
                            style={{ width: '56px', height: '56px' }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                                 strokeLinecap="round" strokeLinejoin="round" style={{ width: '28px', height: '28px' }}>
                                <circle cx="12" cy="12" r="9" />
                                <path d="M12 8v4.5M12 15.5v.5" />
                            </svg>
                        </div>
                        <h1 className="mv-serif mt-5 text-xl font-semibold text-mv-green">
                            This link is no longer valid
                        </h1>
                        <p className="mv-sans mt-3 text-sm text-mv-ink/75">
                            This confirmation link is invalid, expired, or has already been used.
                            If your account is already active, just sign in.
                        </p>
                    </>
                )}

                <Link
                    href="/login"
                    className="mv-sans mt-6 inline-flex w-full items-center justify-center rounded-lg bg-mv-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-mv-green-hover"
                >
                    Go to sign in
                </Link>
            </div>
        </div>
    )
}