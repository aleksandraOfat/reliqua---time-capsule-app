import { LogOut } from 'lucide-react'

export default function LogoutButton() {
    return (
        <form action="/auth/logout" method="post">
            <button
                type="submit"
                className="mv-sans inline-flex items-center gap-1.5 rounded-lg border border-white/30 px-3.5 py-1.5 text-sm font-medium text-[#E8F0E8] transition hover:bg-white/10 hover:border-white/50"
            >
                <LogOut size={16} aria-hidden="true" />
                Sign out
            </button>
        </form>
    )
}