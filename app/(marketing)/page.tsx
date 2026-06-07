import Link from 'next/link'
import StepCard from './step-card'

export default function MemovaultStartPage() {
    return (
        <main className="mv-page-content">
            <section className="mv-hero">
                <p className="mv-kicker">A letter to your future</p>
                <h1 className="mv-title">
                    Preserve memories
                    <br />
                    for the future
                </h1>
                <p className="mv-description">
                    Create time capsules with photos and messages, then unseal them months
                    or even years from now — alone or with people who matter.
                </p>
            </section>

            <section className="mv-cards" aria-label="How Memovault works">
                <StepCard
                    number="01"
                    icon="folder"
                    title="Create a capsule"
                    description="Name it, pick the day it opens, choose who can see it."
                />
                <StepCard
                    number="02"
                    icon="camera"
                    title="Fill with memories"
                    description="Drop in photos, write a message, invite people to add theirs."
                />
                <StepCard
                    number="03"
                    icon="mail"
                    title="Open in the future"
                    description="Get notified when your capsule is ready to be opened."
                />
            </section>

            <Link href="/login" className="mv-cta">
                Create your first capsule →
            </Link>
        </main>
    )
}