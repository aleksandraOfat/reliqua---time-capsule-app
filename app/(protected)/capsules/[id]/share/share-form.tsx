'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { shareMemory } from '../../actions'

export default function ShareForm({
                                      capsuleId,
                                      defaultTitle,
                                  }: {
    capsuleId: string
    defaultTitle: string
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<any>(null)
    const markerRef = useRef<any>(null)
    const [lat, setLat] = useState('')
    const [lng, setLng] = useState('')

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

            map.on('click', (e: any) => {
                const { lat: la, lng: ln } = e.latlng
                setLat(la.toFixed(6))
                setLng(ln.toFixed(6))
                if (markerRef.current) {
                    markerRef.current.setLatLng([la, ln])
                } else {
                    markerRef.current =L.circleMarker([la, ln], {
                        radius: 8,
                        color: '#047857',
                        fillColor: '#10b981',
                        fillOpacity: 0.8,
                        weight: 2,
                    }).addTo(map)
                }
            })
        })()

        return () => {
            cancelled = true
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, [])

    const inputCls =
        'w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'

    const errorParam =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('error')
            : null

    return (
        <div className="mx-auto max-w-2xl">
            {errorParam === 'exists' && (
                <p className="text-sm text-red-700">
                    This capsule already has a public memory. Remove it first to share a new one.
                </p>
            )}
            {errorParam === '1' && (
                <p className="text-sm text-red-700">Something went wrong. Please try again.</p>
            )}
            <h1 className="text-2xl font-semibold text-slate-900">Share as public memory</h1>
            <p className="mt-1 text-sm text-slate-500">
                Only the title, note and location become public. The capsule contents stay private.
            </p>

            <form action={shareMemory} className="mt-6 flex flex-col gap-4">
                <input type="hidden" name="capsule_id" value={capsuleId}/>
                <input type="hidden" name="lat" value={lat}/>
                <input type="hidden" name="lng" value={lng}/>

                <div className="flex flex-col gap-1">
                    <label htmlFor="title" className="text-sm font-medium text-slate-700">Title</label>
                    <input id="title" name="title" defaultValue={defaultTitle} required className={inputCls}/>
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="note" className="text-sm font-medium text-slate-700">Note (optional)</label>
                    <textarea id="note" name="note" rows={3} className={inputCls}/>
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="cover" className="text-sm font-medium text-slate-700">
                        Cover photo (optional, public)
                    </label>
                    <input
                        id="cover"
                        name="cover"
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-slate-600"
                    />
                    <span className="text-xs text-slate-400">
            This image will be shown on the public map. It is separate from the private capsule files.
          </span>
                </div>

                <p className="text-sm font-medium text-slate-700">Click on the map to choose the location</p>
                <div ref={containerRef} className="h-80 w-full rounded-xl border border-slate-200"/>
                {lat && lng ? (
                    <p className="text-sm text-slate-500">Selected location: {lat}, {lng}</p>
                ) : (
                    <p className="text-sm text-amber-700">No location selected yet.</p>
                )}

                <button
                    type="submit"
                    disabled={!lat || !lng}
                    className="self-start rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-40"
                >
                    Share memory
                </button>
            </form>
        </div>
    )
}