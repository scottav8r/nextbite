import { MapView } from '@/components/map/MapView'

export default function MapPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <div className="px-4 pt-6 pb-2">
        <h1 className="font-serif text-2xl text-charcoal-900 dark:text-cream-50">Dining Map</h1>
        <p className="text-sm text-charcoal-800/50 dark:text-cream-100/40 mt-0.5">
          Your memories and wishes on the map
        </p>
      </div>
      <MapView />
    </div>
  )
}
