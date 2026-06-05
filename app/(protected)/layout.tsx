import {redirect} from 'next/navigation'
import {getUser} from '@/lib/supabase/auth'
import LogoutButton from '@/components/logout-button'
import {createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ProtectedLayout({
                                                  children,
                                              }: {
    children: React.ReactNode
}) {
    const user = await getUser()

    if (!user) {
        redirect('/login')
    }

    const supabase = await createClient()

    const { count: unreadCount }= await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true})
        .eq('is_read', false)

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                <span className="font-semibold text-slate-900">Time Capsule</span>
                <div className="flex items-center gap-4">
                    <Link href="/notifications" className="relative text-slate-600 hover:text-slate-900">
                        🔔
                        {unreadCount ? (
                            <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">

                                {unreadCount}
                            </span>
                        ) : null}
                    </Link>

                    <Link
                        href="/profile"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-200 text-sm font-medium text-pink-800 hover:bg-pink-300"
                    >
                        {(user.email ?? '?').charAt(0).toUpperCase()}
                    </Link>

                    <LogoutButton />
                </div>
            </header>
            <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
        </div>
    )
}