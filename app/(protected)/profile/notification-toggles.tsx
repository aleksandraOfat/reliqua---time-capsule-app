'use client'

import { updateNotificationPrefs } from './actions'

const ITEMS = [
    { name: 'notify_opening', label: 'Capsule opening', desc: 'When the opening date arrives' },
    { name: 'notify_reminder', label: 'Reminder 7 days before', desc: 'One week before opening the capsule' },
    { name: 'notify_invitations', label: 'Capsule invitations', desc: 'When someone invites you' },
    { name: 'notify_group_activity', label: 'Activity in group capsules', desc: 'New content from participants' },
]

export default function NotificationToggles({ prefs }: { prefs: Record<string, boolean> }) {
    return (
        <form action={updateNotificationPrefs} className="mt-3 flex flex-col">
            {ITEMS.map((it, i) => (
                <label
                    key={it.name}
                    className={`flex items-center justify-between py-4 ${i > 0 ? 'border-t border-slate-100' : ''}`}
                >
          <span>
            <span className="block text-sm font-medium text-slate-800">{it.label}</span>
            <span className="block text-sm text-slate-500">{it.desc}</span>
          </span>
                    <span className="relative inline-flex shrink-0 cursor-pointer items-center">
            <input
                type="checkbox"
                name={it.name}
                defaultChecked={prefs[it.name]}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="peer sr-only"
            />
            <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
          </span>
                </label>
            ))}
        </form>
    )
}