import "maplibre-gl/dist/maplibre-gl.css"

import {
  Map as MapLibre,
  Marker,
  NavigationControl,
  setWorkerUrl,
  type LngLat,
  type MapMouseEvent,
} from "maplibre-gl"
// MapLibre finds its worker next to its own file, which bundling breaks; let
// Vite build the worker and pass its URL.
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"
import { useEffect, useRef } from "react"

import { AspectRatio } from "@/components/ui/aspect-ratio"

setWorkerUrl(workerUrl)

// OpenFreeMap: OpenStreetMap tiles, no key. Fine for placing pins.
const STYLE = "https://tiles.openfreemap.org/styles/liberty"
const ADDIS: [number, number] = [38.7613, 9.0108]

const toPoint = (lat: string, lng: string): [number, number] | null => {
  const y = Number(lat)
  const x = Number(lng)
  return lat.trim() && lng.trim() && Number.isFinite(x) && Number.isFinite(y)
    ? [x, y]
    : null
}

/** Click the map or drag the pin to set a branch's location. */
export default function LocationPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: string
  longitude: string
  onChange: (latitude: string, longitude: string) => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<MapLibre | null>(null)
  const marker = useRef<Marker | null>(null)
  const placed = useRef(false)
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  // Create the map once.
  useEffect(() => {
    if (!container.current) return
    const start = toPoint(latitude, longitude)
    const m = new MapLibre({
      container: container.current,
      style: STYLE,
      center: start ?? ADDIS,
      zoom: start ? 16 : 12,
      attributionControl: { compact: true },
    })
    m.addControl(new NavigationControl({ showCompass: false }), "top-right")
    const pin = new Marker({ draggable: true }).setLngLat(start ?? ADDIS)
    if (start) {
      pin.addTo(m)
      placed.current = true
    }
    const report = (lngLat: LngLat) =>
      onChangeRef.current(lngLat.lat.toFixed(7), lngLat.lng.toFixed(7))
    pin.on("dragend", () => report(pin.getLngLat()))
    m.on("click", (e: MapMouseEvent) => {
      pin.setLngLat(e.lngLat).addTo(m)
      placed.current = true
      report(e.lngLat)
    })
    map.current = m
    marker.current = pin
    return () => m.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- created once; later values sync below
  }, [])

  // Follow coordinates typed into the fields.
  useEffect(() => {
    const point = toPoint(latitude, longitude)
    const m = map.current
    const pin = marker.current
    if (!m || !pin || !point) return
    const current = pin.getLngLat()
    if (
      Math.abs(current.lng - point[0]) < 1e-7 &&
      Math.abs(current.lat - point[1]) < 1e-7 &&
      placed.current
    )
      return
    pin.setLngLat(point).addTo(m)
    placed.current = true
    m.easeTo({ center: point, zoom: Math.max(m.getZoom(), 15) })
  }, [latitude, longitude])

  return (
    <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg border">
      {/* MapLibre makes its container position: relative, so it sits inside. */}
      <div className="absolute inset-0">
        <div
          ref={container}
          className="size-full"
          role="application"
          aria-label="Map: click or drag the pin to set the location"
        />
      </div>
    </AspectRatio>
  )
}
