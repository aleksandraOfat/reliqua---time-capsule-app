'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthErrorCatcher() {
    const router = useRouter()
    useEffect(() => {
        const hash = window.location.hash
        if (hash.includes('error=') || hash.includes('error_code=')) {
            router.replace('/auth/confirmed?status=invalid')
        }
    }, [router])
    return null
}