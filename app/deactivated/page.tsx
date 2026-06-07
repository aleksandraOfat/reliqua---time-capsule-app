import LogoutButton from '@/components/logout-button'

export default function DeactivatedPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
            <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <h1 className="text-xl font-semibold text-slate-900">Account deactivated</h1>
                <p className="mt-3 text-sm text-slate-600">
                    Your account has been deactivated by an administrator. You can&apos;t access
                    your capsules right now. If you think this is a mistake, please contact support.
                </p>
                <div className="mt-6">
                    <LogoutButton />
                </div>
            </div>
        </div>
    )
}