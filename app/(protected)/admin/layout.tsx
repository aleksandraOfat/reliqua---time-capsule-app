import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({children,}: {
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
        <div>
            <div className="mb-6 flex gap-4 border-b border-slate-200 pb-3">
                <Link href="/admin/users" className="text-sm font-medium text-slate-700 hover:text-indigo-600">
                    Users
                </Link>
                <Link href="/admin/audit" className="text-sm font-medium text-slate-700 hover:text-indigo-600">
                    Audit log
                </Link>
            </div>
            {children}
        </div>
    )
}