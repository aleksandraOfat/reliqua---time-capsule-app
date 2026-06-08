'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BackLink() {
    const pathname = usePathname()
    if (pathname === '/dashboard') return null

    return (
        <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor"
                 strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
            </svg>
        </Link>
    )
}