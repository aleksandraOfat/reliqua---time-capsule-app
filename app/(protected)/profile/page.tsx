import { createClient } from '@/lib/supabase/server'
import ProfileForm from './profile-form'
import NotificationToggles from './notification-toggles'
import { deleteAccount } from './actions'
import ConfirmButton from '@/components/confirm-button'
import DeleteConfirm from '@/components/delete-confirm'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, username, avatar_url, notify_opening, notify_reminder, notify_invitations, notify_group_activity')
        .eq('id', user!.id)
        .maybeSingle()

    const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')

    return (
        <div className="mx-auto max-w-2xl">
            <h1 className="mv-serif mb-6 font-semibold text-mv-green" style={{fontSize: '30px', lineHeight: 1.2}}>
                Profile
            </h1>

            <ProfileForm
                avatarUrl={profile?.avatar_url ?? null}
                fullName={fullName}
                username={profile?.username ?? ''}
                email={user?.email ?? ''}
            />

            <div className="mt-6 rounded-2xl border border-mv-border bg-mv-card p-6 shadow-sm">
                <p className="mv-serif text-base font-semibold text-mv-green">Notifications</p>
                <NotificationToggles
                    prefs={{
                        notify_opening: profile?.notify_opening ?? true,
                        notify_reminder: profile?.notify_reminder ?? true,
                        notify_invitations: profile?.notify_invitations ?? true,
                        notify_group_activity: profile?.notify_group_activity ?? true,
                    }}
                />
            </div>

            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
                <p className="mv-serif text-base font-semibold text-red-800">Delete account</p>
                <p className="mv-sans mt-1 text-sm text-red-700">
                    This permanently deletes your account and all your capsules. This cannot be undone.
                </p>
                <DeleteConfirm
                    triggerLabel="Delete account"
                    title="Delete your account?"
                    description="This permanently deletes your account and all your capsules. This action is irreversible."
                    confirmValue={user?.email ?? ''}
                    confirmLabel="Delete account"
                >
                    <form action={deleteAccount}>
                        <button
                            type="submit"
                            className="mv-sans rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                            Delete account
                        </button>
                    </form>
                </DeleteConfirm>
            </div>
        </div>
    )
}