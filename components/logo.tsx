export default function Logo({ small = false }: { small?: boolean }) {
    return (
        <svg
            className={small ? 'mv-logo mv-logo-small' : 'mv-logo'}
            viewBox="0 0 64 64"
            aria-hidden="true"
        >
            <rect x="6" y="8" width="52" height="38" fill="#efc9d9" stroke="#1f1f1f" strokeWidth="2" />
            <path d="M7 9l25 23L57 9" fill="none" stroke="#1f1f1f" strokeWidth="2" />
            <path d="M7 46l19-18" fill="none" stroke="#1f1f1f" strokeWidth="2" />
            <path d="M57 46L38 28" fill="none" stroke="#1f1f1f" strokeWidth="2" />
            <circle cx="32" cy="47" r="11" fill="#d2c681" />
            <text x="32" y="51" textAnchor="middle" fontSize="12" fontFamily="Georgia, serif" fill="#1f3a2e">
                M
            </text>
        </svg>
    )
}