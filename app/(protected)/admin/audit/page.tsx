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
    'mv-sans rounded-lg border border-mv-border bg-white px-3 py-2 text-sm text-mv-ink outline-none focus:border-mv-green focus:ring-2 focus:ring-mv-green/20'

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
            <p className="mv-sans text-sm text-mv-muted">{list.length} events.</p>

            <form method="get" className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-mv-border bg-mv-card p-4 shadow-sm">
                <div className="flex flex-col gap-1">
                    <label className="mv-sans text-xs font-medium text-mv-muted">Action</label>
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
                    <label className="mv-sans text-xs font-medium text-mv-muted">User email</label>
                    <input name="actor" defaultValue={actor ?? ''} placeholder="contains…" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="mv-sans text-xs font-medium text-mv-muted">From</label>
                    <input type="date" name="from" defaultValue={from ?? ''} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="mv-sans text-xs font-medium text-mv-muted">To</label>
                    <input type="date" name="to" defaultValue={to ?? ''} className={inputCls} />
                </div>
                <button
                    type="submit"
                    className="mv-sans rounded-lg bg-mv-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-mv-green-hover"
                >
                    Filter
                </button>
                <a
                    href="/admin/audit"
                    className="mv-sans rounded-lg border border-mv-border px-4 py-2 text-sm font-medium text-mv-green transition hover:bg-mv-sand"
                >
                    Clear
                </a>
            </form>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-mv-border bg-mv-card shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-mv-sand text-mv-muted">
                    <tr>
                        <th className="mv-sans px-4 py-3 font-medium">When</th>
                        <th className="mv-sans px-4 py-3 font-medium">Who</th>
                        <th className="mv-sans px-4 py-3 font-medium">Action</th>
                        <th className="mv-sans px-4 py-3 font-medium">Entity</th>
                    </tr>
                    </thead>
                    <tbody>
                    {list.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="mv-sans px-4 py-6 text-center text-mv-muted">
                                No events match these filters.
                            </td>
                        </tr>
                    ) : (
                        list.map((e: any) => (
                            <tr key={e.id} className="border-t border-mv-border">
                                <td className="mv-sans px-4 py-3 text-mv-muted">
                                    {new Date(e.created_at).toLocaleString()}
                                </td>
                                <td className="mv-sans px-4 py-3 text-mv-ink">{e.actor_email ?? '—'}</td>
                                <td className="mv-sans px-4 py-3 text-mv-ink">
                                    {ACTION_LABELS[e.action] ?? e.action}
                                </td>
                                <td className="mv-sans px-4 py-3 text-mv-muted">{e.entity_type}</td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}