import Logo from '@/components/logo'

export default function DeactivatedPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-mv-sand px-6">
            <div className="w-full max-w-md rounded-2xl border border-mv-border bg-mv-card p-8 text-center shadow-sm">

                    <div
                        className="mx-auto mt-5 grid h-14 w-14 place-items-center rounded-full bg-[#f1e4d8] text-mv-clay"
                        style={{width: '56px', height: '56px', minWidth: '56px', minHeight: '56px'}}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                             strokeLinecap="round" strokeLinejoin="round" style={{width: '28px', height: '28px'}}>
                            <circle cx="12" cy="12" r="9"/>
                            <path d="M8 12h8"/>
                        </svg>
                    </div>

                    <h1 className="mv-serif mt-5 text-xl font-semibold text-mv-green">Account deactivated</h1>
                    <p className="mv-sans mt-3 text-sm text-mv-ink/75">
                        Your account has been deactivated by an administrator. You can&apos;t access
                        your capsules right now. If you think this is a mistake, please contact support.
                    </p>

                    <form action="/auth/logout" method="post" className="mt-6">
                        <button
                            type="submit"
                            className="mv-sans w-full rounded-lg bg-mv-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-mv-green-hover"
                        >
                            Sign out
                        </button>
                    </form>
            </div>
        </div>
)
}