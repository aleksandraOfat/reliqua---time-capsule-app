import { createClient } from '@/lib/supabase/server'

const ACTION_LABELS: Record<string, string> = {
    create: 'Created capsule',
    seal: 'Sealed capsule',
    open: 'Opened capsule',
    delete: 'Deleted capsule',
    invite_member: 'Invited collaborator',
    remove_member: 'Removed collaborator',
    accept_invite: 'Accepted invitation',
    decline_invite: 'Declined invitation',
    admin_activate_user: 'Activated user account',
    admin_deactivate_user: 'Deactivated user account',
}

const inputCls =
    'rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

export default async function AdminAuditPage({
                                                 searchParams,
                                             }: {
    searchParams: Promise<{ action?: string; actor?: string; from?: string; to?: string }>
}) {
    const { action, actor, from, to } = await searchParams

    const supabase = await createClient()

    const { data: entries } = await supabase.rpc('admin_audit_log', {
        p_action: action || null,
        p_actor: actor || null,
        p_date_from: from || null,
        p_date_to: to || null,
    })
    const list = entries ?? []

    const { data: actionRows } = await supabase.rpc('admin_audit_actions')
    const actions = actionRows ?? []

    return (
        <div>
            <h1 className="text-2xl font-semibold text-slate-900">Audit log</h1>
            <p className="mt-1 text-sm text-slate-500">{list.length} events.</p>
            <form method="get" className="mt-6 flex flex-wrap items-end gap-3">

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-500">Action</label>
                    <select name="action" defaultValue={action ?? ''} className={inputCls}>
                        <option value="">All actions</option>
                        {actions.map((a: any) => (
                            <option key={a.action} value={a.action}>
                                {ACTION_LABELS[a.action] ?? a.action}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-500">User email</label>
                    <input name="actor" defaultValue={actor ?? ''} placeholder="contains…" className={inputCls}/>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-500">From</label>
                    <input type="date" name="from" defaultValue={from ?? ''} className={inputCls}/>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-500">To</label>
                    <input type="date" name="to" defaultValue={to ?? ''} className={inputCls}/>
                </div>
                <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                    Filter
                </button>

                <a
                    href="/admin/audit"
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    Clear
                </a>


            </form>
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
                    {list.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                                No events match these filters.
                            </td>
                        </tr>
                    ) : (
                        list.map((e: any) => (
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
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}