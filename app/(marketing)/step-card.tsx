type StepCardProps = {
    number: string
    title: string
    description: string
    icon: 'folder' | 'camera' | 'mail'
}

function StepIcon({ type }: { type: StepCardProps['icon'] }) {
    if (type === 'camera') {
        return (
            <svg viewBox="0 0 32 32" className="mv-step-icon" aria-hidden="true">
                <path d="M9 11h4l2-3h4l2 3h2a3 3 0 013 3v9a3 3 0 01-3 3H9a3 3 0 01-3-3v-9a3 3 0 013-3z" />
                <circle cx="16" cy="19" r="5" />
            </svg>
        )
    }
    if (type === 'mail') {
        return (
            <svg viewBox="0 0 32 32" className="mv-step-icon" aria-hidden="true">
                <rect x="5" y="8" width="22" height="16" rx="2" />
                <path d="M6 10l10 8 10-8" />
            </svg>
        )
    }
    return (
        <svg viewBox="0 0 32 32" className="mv-step-icon" aria-hidden="true">
            <path d="M4 9h9l3 4h12v13H4z" />
            <path d="M16 17v6" />
            <path d="M13 20h6" />
        </svg>
    )
}

export default function StepCard({ number, title, description, icon }: StepCardProps) {
    return (
        <article className="mv-card">
            <p className="mv-card-number">— {number} —</p>
            <div className="mv-icon-box">
                <StepIcon type={icon} />
            </div>
            <h2>{title}</h2>
            <p className="mv-card-copy">{description}</p>
        </article>
    )
}