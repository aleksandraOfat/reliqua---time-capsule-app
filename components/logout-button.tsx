export default function LogoutButton() {
    return (
        <form action="/auth/logout" method="post">
            <button
                type="submit"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
                Sign out
            </button>
        </form>
    )
}