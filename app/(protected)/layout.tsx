import {redirect} from 'next/navigation'
import {getUser} from '@/lib/supabase/auth'
import LogoutButton from '@/components/logout-button'
import {createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { headers } from 'next/headers'
import BackLink from '@/components/back-link'

export default async function ProtectedLayout({
                                                  children,
                                              }: {
    children: React.ReactNode
}) {
    const user = await getUser()
    const hdrs = await headers()
    const pathname = hdrs.get('x-pathname') ?? hdrs.get('x-invoke-path') ?? ''
    const isDashboard = pathname === '/dashboard' || pathname === ''

    if (!user) {
        redirect('/login')
    }

    const supabase = await createClient()

    const { count: unreadCount } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
        .eq('user_id', user.id)

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
    const isAdmin = adminProfile?.role === 'admin'
    const {data: activeCheck} = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', user.id)
        .maybeSingle()
    if (activeCheck && activeCheck.is_active === false) {
        redirect('/deactivated')
    }

    return (
        <div className="min-h-screen bg-mv-sand">
            <header className="sticky top-0 z-50 bg-mv-green shadow-sm">
                <div className="flex h-16 items-center justify-between px-4 sm:px-8 lg:px-16">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <BackLink/>
                        <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
                            <Logo className="h-8 w-8 shrink-0 sm:h-9 sm:w-9"/>
                            <span
                                className="mv-heading hidden truncate text-xl text-white sm:inline sm:text-2xl">Reliqua</span>
                        </Link>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        {isAdmin && (
                            <Link
                                href="/admin/users"
                                className="mv-sans text-sm font-medium text-white/80 transition hover:text-white"
                            >
                                Admin
                            </Link>
                        )}

                        <Link
                            href="/notifications"
                            className="relative grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                            aria-label="Notifications"
                        >
                            <BellIcon/>
                            {unreadCount ? (
                                <span
                                    className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-mv-clay px-1 text-[10px] font-semibold text-white">
                                    {unreadCount}
                                </span>
                            ) : null}
                        </Link>

                        <Link
                            href="/profile"
                            className="grid h-9 w-9 place-items-center rounded-full bg-mv-pink text-sm font-semibold text-mv-green transition hover:brightness-95"
                            aria-label="Profile"
                        >
                            {(user.email ?? '?').charAt(0).toUpperCase()}
                        </Link>

                        <LogoutButton/>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        </div>
    )
}

function Logo({className}: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
            <rect x="6" y="8" width="52" height="38" fill="#e8c4d4" stroke="#1f1f1f" strokeWidth="2"/>
            <path d="M7 9l25 23L57 9" fill="none" stroke="#1f1f1f" strokeWidth="2" />
            <path d="M7 46l19-18" fill="none" stroke="#1f1f1f" strokeWidth="2" />
            <path d="M57 46L38 28" fill="none" stroke="#1f1f1f" strokeWidth="2" />
            <circle cx="32" cy="47" r="11" fill="#d2c681" />
            <text x="32" y="51" textAnchor="middle" fontSize="12" fontFamily="Georgia, serif" fill="#1f1f1f">
                R
            </text>
        </svg>
    )
}

function BellIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
    )
}