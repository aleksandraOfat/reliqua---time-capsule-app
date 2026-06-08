'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

type Memory = {
    id: string
    title: string
    note: string | null
    lat: number
    lng: number
    cover: string | null
}

export default function MemoryMap({ memories }: { memories: Memory[] }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<any>(null)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            const L = (await import('leaflet')).default
            if (cancelled || !containerRef.current || mapRef.current) return

            const map = L.map(containerRef.current).setView([52.0, 19.0], 5)
            mapRef.current = map

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
            }).addTo(map)

            memories.forEach((m) => {
                if (m.lat == null || m.lng == null) return
                const marker = L.circleMarker([m.lat, m.lng], {
                    radius: 9,
                    color: '#1f3a2e',
                    fillColor: '#d3895b',
                    fillOpacity: 0.9,
                    weight: 2,
                }).addTo(map)

                const safeTitle = m.title.replace(/</g, '&lt;')
                const safeNote = (m.note ?? '').replace(/</g, '&lt;')
                const coverHtml = m.cover
                    ? `<img src="${m.cover}" alt="" style="width:100%;height:96px;object-fit:cover;border-radius:8px;margin-bottom:8px"/>`
                    : ''
                marker.bindPopup(
                    `<div style="min-width:170px;font-family:'DM Sans',Arial,sans-serif">
                        ${coverHtml}
                        <strong style="font-family:'Ancizar Serif',Georgia,serif;color:#1f3a2e;font-size:15px">${safeTitle}</strong>
                        ${safeNote ? `<p style="margin:4px 0 0;color:#555;font-size:13px">${safeNote}</p>` : ''}
                     </div>`
                )
            })
        })()

        return () => {
            cancelled = true
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, [memories])

    return <div ref={containerRef} className="h-[70vh] w-full" />
}