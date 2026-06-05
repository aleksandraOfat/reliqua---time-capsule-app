import { createClient } from '@/lib/supabase/server'
import ProfileForm from './profile-form'
import NotificationToggles from './notification-toggles'
import { deleteAccount } from './actions'
import ConfirmButton from '@/components/confirm-button'

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
            <ProfileForm
                avatarUrl={profile?.avatar_url ?? null}
                fullName={fullName}
                username={profile?.username ?? ''}
                email={user?.email ?? ''}
            />

            <h2 className="mt-10 text-sm font-medium uppercase tracking-wide text-slate-400">
                Notifications
            </h2>
            <NotificationToggles
                prefs={{
                    notify_opening: profile?.notify_opening ?? true,
                    notify_reminder: profile?.notify_reminder ?? true,
                    notify_invitations: profile?.notify_invitations ?? true,
                    notify_group_activity: profile?.notify_group_activity ?? true,
                }}
            />

            <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-6">
                <div>
                    <h2 className="text-sm font-medium text-slate-800">Delete account</h2>
                    <p className="text-sm text-slate-500">
                        This permanently deletes your account and all your capsules.
                    </p>
                </div>
                <form action={deleteAccount}>
                    <ConfirmButton
                        message="Delete your account permanently? All your capsules will be lost. This cannot be undone."
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                        Delete Account
                    </ConfirmButton>
                </form>
            </div>
        </div>
    )
}