import { createClient } from '@/lib/supabase/server'
import { setUserActive } from '../actions'

export default async function AdminUsersPage() {
    const supabase = await createClient()
    const { data: users } = await supabase.rpc('admin_list_users')
    const list = users ?? []

    return (
        <div>
            <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
            <p className="mt-1 text-sm text-slate-500">{list.length} registered users.</p>

            <ul className="mt-6 flex flex-col gap-2">
                {list.map((u: any) => (
                    <li
                        key={u.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
                    >
                        <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">
                                {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.email}
                            </p>
                            <p className="text-sm text-slate-500">{u.email}</p>
                        </div>

                        <div className="flex items-center gap-3">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {u.role}
              </span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                {u.is_active ? 'active' : 'inactive'}
              </span>

                            <form action={setUserActive}>
                                <input type="hidden" name="user_id" value={u.id} />
                                <input type="hidden" name="active" value={(!u.is_active).toString()} />
                                <button
                                    type="submit"
                                    className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
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