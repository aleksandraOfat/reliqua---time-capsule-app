'use client'

import { useState } from 'react'
import { updateNotificationPrefs } from './actions'

const ITEMS = [
    { name: 'notify_opening', label: 'Capsule opening', desc: 'When the opening date arrives' },
    { name: 'notify_reminder', label: 'Reminder 7 days before', desc: 'One week before opening the capsule' },
    { name: 'notify_invitations', label: 'Capsule invitations', desc: 'When someone invites you' },
    { name: 'notify_group_activity', label: 'Activity in group capsules', desc: 'New content from participants' },
]

export default function NotificationToggles({ prefs }: { prefs: Record<string, boolean> }) {
    const [state, setState] = useState<Record<string, boolean>>(prefs)

    function toggle(name: string, form: HTMLFormElement | null) {
        setState((prev) => ({ ...prev, [name]: !prev[name] }))
        requestAnimationFrame(() => form?.requestSubmit())
    }

    return (
        <form action={updateNotificationPrefs} className="mt-3 flex flex-col">
            {ITEMS.map((it, i) => {
                const on = state[it.name]
                return (
                    <div
                        key={it.name}
                        className={`flex items-center justify-between py-4 ${i > 0 ? 'border-t border-mv-border' : ''}`}
                    >
                        <div>
                            <p className="mv-sans text-sm font-medium text-mv-ink">{it.label}</p>
                            <p className="mv-sans text-sm text-mv-muted">{it.desc}</p>
                        </div>

                        <input type="hidden" name={it.name} value={on ? 'on' : ''} />

                        <button
                            type="button"
                            role="switch"
                            aria-checked={on}
                            onClick={(e) => toggle(it.name, e.currentTarget.form)}
                            className="relative inline-flex shrink-0 rounded-full transition-colors"
                            style={{
                                width: '44px',
                                height: '24px',
                                backgroundColor: on ? '#1f3a2e' : '#e4ddd2',
                            }}
                        >
                            <span
                                className="absolute rounded-full bg-white shadow transition-transform"
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    top: '2px',
                                    left: '2px',
                                    transform: on ? 'translateX(20px)' : 'translateX(0)',
                                }}
                            />
                        </button>
                    </div>
                )
            })}
        </form>
    )
}