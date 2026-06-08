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
                    markerRef.current = L.circleMarker([la, ln], {
                        radius: 9,
                        color: '#1f3a2e',
                        fillColor: '#d3895b',
                        fillOpacity: 0.9,
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
        'mv-sans w-full rounded-lg border border-mv-border bg-white px-3 py-2.5 text-mv-ink outline-none focus:border-mv-green focus:ring-2 focus:ring-mv-green/20'

    const errorParam =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('error')
            : null

    return (
        <div className="mx-auto max-w-2xl">
            <h1 className="mv-serif font-semibold text-mv-green" style={{ fontSize: '30px', lineHeight: 1.2 }}>
                Share as public memory
            </h1>
            <p className="mv-sans mt-2 text-sm text-mv-muted">
                Only the title, note and location become public. The capsule contents stay private.
            </p>

            {errorParam === 'exists' && (
                <p className="mv-sans mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    This capsule already has a public memory. Remove it first to share a new one.
                </p>
            )}
            {errorParam === '1' && (
                <p className="mv-sans mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    Something went wrong. Please try again.
                </p>
            )}

            <form action={shareMemory} className="mt-6 rounded-2xl border border-mv-border bg-mv-card p-6 shadow-sm">
                <input type="hidden" name="capsule_id" value={capsuleId} />
                <input type="hidden" name="lat" value={lat} />
                <input type="hidden" name="lng" value={lng} />

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="title" className="mv-sans text-sm font-medium text-mv-ink">Title</label>
                    <input id="title" name="title" defaultValue={defaultTitle} required className={inputCls} />
                </div>

                <div className="mt-4 flex flex-col gap-1.5">
                    <label htmlFor="note" className="mv-sans text-sm font-medium text-mv-ink">Note (optional)</label>
                    <textarea id="note" name="note" rows={3} className={`${inputCls} resize-none`} />
                </div>

                <div className="mt-4 flex flex-col gap-1.5">
                    <label htmlFor="cover" className="mv-sans text-sm font-medium text-mv-ink">
                        Cover photo (optional, public)
                    </label>
                    <input
                        id="cover"
                        name="cover"
                        type="file"
                        accept="image/*"
                        className="mv-sans block w-full text-sm text-mv-muted file:mr-3 file:rounded-lg file:border-0 file:bg-mv-sand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-mv-green"
                    />
                    <span className="mv-sans text-xs text-mv-muted">
                        Shown on the public map. Separate from the private capsule files.
                    </span>
                </div>

                <div className="mt-5">
                    <p className="mv-sans text-sm font-medium text-mv-ink">Choose the location</p>
                    <p className="mv-sans mb-2 text-xs text-mv-muted">Click on the map to place your memory.</p>
                    <div
                        ref={containerRef}
                        className="w-full overflow-hidden rounded-xl border border-mv-border"
                        style={{ height: '320px' }}
                    />
                    {lat && lng ? (
                        <p className="mv-sans mt-2 text-sm text-mv-green">Selected: {lat}, {lng}</p>
                    ) : (
                        <p className="mv-sans mt-2 text-sm text-mv-clay">No location selected yet.</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={!lat || !lng}
                    className="mv-sans mt-6 rounded-lg bg-mv-green px-5 py-2.5 font-semibold text-white transition hover:bg-mv-green-hover disabled:opacity-40"
                >
                    Share memory
                </button>
            </form>
        </div>
    )
}