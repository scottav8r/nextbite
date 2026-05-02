'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Memory, Wish } from '@/lib/types/domain'

type PinType = 'both' | 'memories' | 'wishes'

interface MapPin {
  id: string
  type: 'memory' | 'wish'
  lat: number
  lng: number
  label: string
  rating?: number
  priority?: string
  restaurantId: string
  restaurantName: string
}

declare global {
  interface Window {
    google: typeof google
    initGoogleMap?: () => void
  }
}

export function MapView() {
  const [pinType, setPinType] = useState<PinType>('both')
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
  }, [])

  // Load Google Maps JS API
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return
    if (window.google?.maps) { setMapReady(true); return }

    window.initGoogleMap = () => setMapReady(true)

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap`
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    return () => {
      delete window.initGoogleMap
    }
  }, [])

  // Fetch memories with restaurant coords
  const { data: memories = [] } = useQuery<Memory[]>({
    queryKey: ['memories', 'map'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('memories')
        .select(`id, overall_rating, restaurant_id, restaurant:restaurants(id, name, lat, lng)`)
        .not('restaurant.lat', 'is', null)
      if (error) throw error
      return (data ?? []) as Memory[]
    },
  })

  // Fetch wishes with restaurant coords
  const { data: wishes = [] } = useQuery<Wish[]>({
    queryKey: ['wishes', 'map'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('wishes')
        .select(`id, priority, restaurant_id, restaurant:restaurants(id, name, lat, lng)`)
        .not('restaurant.lat', 'is', null)
      if (error) throw error
      return (data ?? []) as Wish[]
    },
  })

  // Build pins
  const pins: MapPin[] = []
  if (pinType !== 'wishes') {
    for (const memory of memories) {
      const r = memory.restaurant as { id: string; name: string; lat: number; lng: number } | undefined
      if (r?.lat && r?.lng) {
        pins.push({ id: memory.id, type: 'memory', lat: r.lat, lng: r.lng, label: r.name, rating: memory.overall_rating, restaurantId: r.id, restaurantName: r.name })
      }
    }
  }
  if (pinType !== 'memories') {
    for (const wish of wishes) {
      const r = wish.restaurant as { id: string; name: string; lat: number; lng: number } | undefined
      if (r?.lat && r?.lng) {
        pins.push({ id: wish.id, type: 'wish', lat: r.lat, lng: r.lng, label: r.name, priority: wish.priority, restaurantId: r.id, restaurantName: r.name })
      }
    }
  }

  const center = userLocation ?? (pins[0] ? { lat: pins[0].lat, lng: pins[0].lng } : { lat: 40.7128, lng: -74.006 })

  // Init map
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google?.maps) return

    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
    })
  }, [center])

  useEffect(() => {
    if (mapReady) initMap()
  }, [mapReady, initMap])

  // Update markers when pins or map changes
  useEffect(() => {
    if (!googleMapRef.current || !window.google?.maps) return

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    pins.forEach((pin) => {
      const marker = new window.google.maps.Marker({
        position: { lat: pin.lat, lng: pin.lng },
        map: googleMapRef.current!,
        title: pin.restaurantName,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: pin.type === 'memory' ? '#7C2D3E' : '#D4A853',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      })

      marker.addListener('click', () => {
        setSelectedPin((prev) => (prev?.id === pin.id ? null : pin))
      })

      markersRef.current.push(marker)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins.length, pinType, mapReady])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toggle */}
      <div className="flex gap-2 px-4 pt-2 pb-3 shrink-0" role="group" aria-label="Toggle pin types">
        {(['both', 'memories', 'wishes'] as PinType[]).map((type) => (
          <button
            key={type}
            onClick={() => setPinType(type)}
            aria-pressed={pinType === type}
            className={`flex-1 rounded-xl py-2 text-xs font-medium capitalize transition ${
              pinType === type
                ? 'bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950'
                : 'bg-cream-100 dark:bg-charcoal-800 text-charcoal-900 dark:text-cream-50 hover:bg-cream-200'
            }`}
          >
            {type === 'both' ? 'All' : type}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="relative mx-4 rounded-2xl overflow-hidden bg-cream-200 dark:bg-charcoal-800" style={{ height: '55%', minHeight: '240px' }}>
        <div ref={mapRef} className="w-full h-full" />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" aria-label="Loading map" />
          </div>
        )}
        {mapReady && pins.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-charcoal-800/60 bg-white/80 dark:bg-charcoal-900/80 rounded-xl px-4 py-2">
              No locations to show
            </p>
          </div>
        )}
      </div>

      {/* Selected pin card */}
      {selectedPin && (
        <div className="mx-4 mt-3 rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 p-3 shrink-0">
          <p className="font-medium text-sm text-charcoal-900 dark:text-cream-50 mb-1">{selectedPin.restaurantName}</p>
          <div className="flex items-center justify-between">
            <span className={`text-xs rounded-full px-2 py-0.5 ${selectedPin.type === 'memory' ? 'bg-burgundy-600/10 text-burgundy-600' : 'bg-gold-400/20 text-gold-600'}`}>
              {selectedPin.type === 'memory' ? `★ ${selectedPin.rating}` : `${selectedPin.priority} priority`}
            </span>
            <Link
              href={selectedPin.type === 'memory' ? `/memories/${selectedPin.id}` : `/wishes/${selectedPin.id}`}
              className="text-xs text-gold-500 hover:underline"
            >
              {selectedPin.type === 'memory' ? 'View Memory →' : 'View Wish →'}
            </Link>
          </div>
        </div>
      )}

      {/* Pin list */}
      <div className="px-4 pt-3 pb-2 flex-1 overflow-y-auto">
        <p className="text-xs font-medium text-charcoal-800/50 dark:text-cream-100/40 mb-2">
          {pins.length} location{pins.length !== 1 ? 's' : ''}
        </p>
        <ul className="space-y-1" aria-label="Dining locations">
          {pins.map((pin) => (
            <li key={pin.id}>
              <button
                onClick={() => setSelectedPin((prev) => (prev?.id === pin.id ? null : pin))}
                className="w-full flex items-center gap-3 rounded-xl p-2.5 hover:bg-cream-50 dark:hover:bg-charcoal-900 transition text-left"
              >
                <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full shrink-0 ${pin.type === 'memory' ? 'bg-burgundy-600' : 'bg-gold-400'}`} />
                <span className="flex-1 text-sm text-charcoal-900 dark:text-cream-50 truncate">{pin.restaurantName}</span>
                {pin.type === 'memory' && pin.rating && (
                  <span className="text-xs text-charcoal-800/50 shrink-0">★ {pin.rating}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 pb-2 pt-1 text-xs text-charcoal-800/50 dark:text-cream-100/40 shrink-0 border-t border-cream-100 dark:border-charcoal-800">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-burgundy-600" aria-hidden="true" />Memories</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gold-400" aria-hidden="true" />Wishes</span>
      </div>
    </div>
  )
}
