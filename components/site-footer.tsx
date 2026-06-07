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
                        <span className="mv-footer-name">Memovault</span>
                        <p className="mv-footer-tagline">A letter to your future.</p>
                    </div>
                </div>

                <nav className="mv-footer-links" aria-label="Footer">
                    <Link href="/login">Log in</Link>
                    <Link href="/login">Register</Link>
                    <Link href="/memories">Public memories</Link>
                </nav>
            </div>

            <p className="mv-footer-note">© {year} Memovault — engineering thesis project</p>
        </footer>
    )
}