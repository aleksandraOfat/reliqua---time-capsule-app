import Link from 'next/link'
import Logo from './logo'

export default function SiteNavbar() {
    return (
        <header className="mv-navbar">
            <Link href="/" className="mv-brand">
                <Logo />
                <span className="mv-brand-name">Reliqua</span>
            </Link>

            <nav className="mv-actions" aria-label="Account">
                <Link href="/dashboard" className="mv-button">Log in</Link>
                <Link href="/dashboard" className="mv-button mv-button-primary">Register</Link>
            </nav>
        </header>
    )
}