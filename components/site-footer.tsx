import Link from 'next/link'
import Logo from './logo'

export default function SiteFooter() {
    const year = new Date().getFullYear()
    return (
        <footer className="mv-footer">
            <div className="mv-footer-inner">
                <div className="mv-footer-brand">
                    <Logo small />
                    <div>
                        <span className="mv-footer-name">Reliqua</span>
                        <p className="mv-footer-tagline">A letter to your future.</p>
                    </div>
                </div>

                <nav className="mv-footer-links" aria-label="Footer">
                    <Link href="/dashboard">Log in</Link>
                    <Link href="/dashboard">Register</Link>
                    <Link href="/memories">Public memories</Link>
                </nav>
            </div>

            <p className="mv-footer-note">© {year} Reliqua — engineering thesis project</p>
        </footer>
    )
}