'use client'

import { useEffect, useRef} from 'react'
import 'leaflet/dist/leaflet.css'

type Memory = {
    id: string
    title:string
    note: string| null
    lat: number
    lng:number
    cover: string |null
}

export default function MemoryMap({ memories }: { memories: Memory[] }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<any>(null)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            const L =  (await import('leaflet')).default
            if (cancelled || !containerRef.current || mapRef.current) return

            const  map = L.map(containerRef.current).setView([52.0, 19.0], 5)
            mapRef.current = map

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
            }).addTo(map)

            memories.forEach((m) => {
                if (m.lat == null || m.lng == null) return
                const marker = L.circleMarker([m.lat, m.lng], {
                    radius: 8,
                    color:'#047857',
                    fillColor: '#10b981',
                    fillOpacity: 0.8,
                    weight: 2,
                }).addTo(map)
                const safeTitle = m.title.replace(/</g, '&lt;')
                const safeNote= (m.note ?? '').replace(/</g, '&lt;')
                const coverHtml =m.cover

                    ? `<img src="${m.cover}" alt="" style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:6px"/>`
                    : ''
                marker.bindPopup(
                    `<div style="min-width:160px">${coverHtml}<strong>${safeTitle}</strong>${safeNote ? `<br/>${safeNote}` : ''}</div>`
                )
            })
        })()

        return ()=> {
            cancelled = true
            if (mapRef.current){
                mapRef.current.remove()
                mapRef.current =null
            }
        }
    }, [memories])

    return <div ref={containerRef} className="h-[70vh] w-full rounded-xl border border-slate-200" />
}