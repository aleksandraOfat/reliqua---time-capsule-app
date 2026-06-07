'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

export default function LocationPicker({onPick,}:{
    onPick: (lat: number, lng: number) => void
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<any>(null)
    const markerRef = useRef<any>(null)
    const cbRef = useRef(onPick)
    cbRef.current = onPick

    useEffect(() => {
        let cancelled =false
        ;(async () => {
            const L = (await import('leaflet')).default
            if (cancelled || !containerRef.current || mapRef.current) return

            const map = L.map(containerRef.current).setView([52.0, 19.0], 5)
            mapRef.current = map
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
            }).addTo(map)

            map.on('click', (e: any) => {
                const { lat, lng } = e.latlng
                cbRef.current(lat, lng)
                if (markerRef.current) markerRef.current.setLatLng([lat, lng])
                else
                    markerRef.current = L.circleMarker([lat, lng], {
                        radius: 8, color: '#047857', fillColor: '#10b981', fillOpacity: 0.8, weight: 2,
                    }).addTo(map)
            })
        })()

        return ()=> {
            cancelled = true
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, [])

    return <div ref={containerRef} className="h-64 w-full rounded-xl border border-slate-200" />
}