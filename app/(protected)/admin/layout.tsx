import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
                                              children,
                                          }: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user!.id)
        .maybeSingle()

    if (profile?.role !== 'admin') {
        redirect('/dashboard')
    }

    return (
        <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-between gap-3">
                <h1 className="mv-serif font-semibold text-mv-green" style={{fontSize: '30px', lineHeight: 1.2}}>
                    Admin
                </h1>
                <Link
                    href="/dashboard"
                    className="mv-sans rounded-lg border border-mv-border bg-white px-4 py-2 text-sm font-medium text-mv-green transition hover:bg-mv-sand"
                >
                    ← Go to dashboard
                </Link>
            </div>
            <div className="mt-4 mb-8 flex gap-6 border-b border-mv-border">
                <Link
                    href="/admin/users"
                    className="mv-sans -mb-px border-b-2 border-transparent pb-3 text-sm font-medium text-mv-muted transition hover:text-mv-green"
                >
                    Users
                </Link>
                <Link
                    href="/admin/audit"
                    className="mv-sans -mb-px border-b-2 border-transparent pb-3 text-sm font-medium text-mv-muted transition hover:text-mv-green"
                >
                    Audit log
                </Link>
            </div>
            {children}
        </div>
    )
}