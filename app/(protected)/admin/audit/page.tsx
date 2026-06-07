import { createClient } from '@/lib/supabase/server'

const ACTION_LABELS: Record<string, string> = {
    create: 'Created capsule',
    seal: 'Sealed capsule',
    open: 'Opened capsule',
    delete: 'Deleted capsule',
    accept_invite: 'Accepted invitation',
    decline_invite: 'Declined invitation',
}

export default async function AdminAuditPage() {
    const supabase = await createClient()
    const { data: entries } = await supabase.rpc('admin_audit_log')
    const list = entries ?? []

    return (
        <div>
            <h1 className="text-2xl font-semibold text-slate-900">Audit log</h1>
            <p className="mt-1 text-sm text-slate-500">Most recent {list.length} events.</p>

            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                    <tr>
                        <th className="px-4 py-2 font-medium">When</th>
                        <th className="px-4 py-2 font-medium">Who</th>
                        <th className="px-4 py-2 font-medium">Action</th>
                        <th className="px-4 py-2 font-medium">Entity</th>
                    </tr>
                    </thead>
                    <tbody>
                    {list.map((e: any) => (
                        <tr key={e.id} className="border-t border-slate-100">
                            <td className="px-4 py-2 text-slate-500">
                                {new Date(e.created_at).toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-slate-700">{e.actor_email ?? '—'}</td>
                            <td className="px-4 py-2 text-slate-900">
                                {ACTION_LABELS[e.action] ?? e.action}
                            </td>
                            <td className="px-4 py-2 text-slate-400">{e.entity_type}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}