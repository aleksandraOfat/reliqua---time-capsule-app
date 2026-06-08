import { createClient } from '@/lib/supabase/server'
import { setUserActive } from '../actions'

export default async function AdminUsersPage() {
    const supabase = await createClient()
    const { data: users } = await supabase.rpc('admin_list_users')
    const list = users ?? []

    return (
        <div>
            <p className="mv-sans text-sm text-mv-muted">{list.length} registered users.</p>

            <ul className="mt-5 flex flex-col gap-3">
                {list.map((u: any) => (
                    <li
                        key={u.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-mv-border bg-mv-card p-4 shadow-sm"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <span
                                className="grid shrink-0 place-items-center rounded-full bg-mv-pink text-sm font-semibold text-mv-green"
                                style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' }}
                            >
                                {([u.first_name, u.last_name].filter(Boolean).join(' ') || u.email || '?').charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                                <p className="mv-sans truncate font-medium text-mv-ink">
                                    {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.email}
                                </p>
                                <p className="mv-sans truncate text-sm text-mv-muted">{u.email}</p>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                                u.role === 'admin' ? 'bg-[#e7efe9] text-mv-green' : 'bg-mv-sand text-mv-muted'
                            }`}>
                                {u.role}
                            </span>
                            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                                u.is_active ? 'bg-[#e7efe9] text-mv-green' : 'bg-red-100 text-red-700'
                            }`}>
                                {u.is_active ? 'active' : 'inactive'}
                            </span>

                            <form action={setUserActive}>
                                <input type="hidden" name="user_id" value={u.id} />
                                <input type="hidden" name="active" value={(!u.is_active).toString()} />
                                <button
                                    type="submit"
                                    className={`mv-sans rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                                        u.is_active
                                            ? 'border border-red-300 text-red-600 hover:bg-red-50'
                                            : 'bg-mv-green text-white hover:bg-mv-green-hover'
                                    }`}
                                >
                                    {u.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                            </form>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}