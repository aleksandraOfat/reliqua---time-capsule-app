import SiteNavbar from '@/components/site-navbar'
import SiteFooter from '@/components/site-footer'
import './landing.css'

export default function MarketingLayout({children,}: {
    children: React.ReactNode
}) {
    return (
        <div className="mv-shell">
            <SiteNavbar />
            <div className="mv-content">{children}</div>
            <SiteFooter />
        </div>
    )
}