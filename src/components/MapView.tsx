import { useRef, useEffect, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Entreprise } from '@/lib/api'

mapboxgl.accessToken = 'pk.eyJ1IjoibWFrZXJzb3VsIiwiYSI6ImNsbHhtd3V1dzBlMjYzcnAzNmVhdDRidjIifQ.Z4UswRfpsjf5pXByC4DN4A'

interface MapViewProps {
  center: [number, number]
  radius: number
  entreprises: Entreprise[]
}

function createCircleGeoJSON(center: [number, number], radiusKm: number) {
  const points = 64
  const coords: [number, number][] = []
  const earthRadius = 6371

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI
    const lat = Math.asin(
      Math.sin((center[1] * Math.PI) / 180) * Math.cos(radiusKm / earthRadius) +
        Math.cos((center[1] * Math.PI) / 180) * Math.sin(radiusKm / earthRadius) * Math.cos(angle)
    )
    const lng =
      ((center[0] * Math.PI) / 180 +
        Math.atan2(
          Math.sin(angle) * Math.sin(radiusKm / earthRadius) * Math.cos((center[1] * Math.PI) / 180),
          Math.cos(radiusKm / earthRadius) - Math.sin((center[1] * Math.PI) / 180) * Math.sin(lat)
        )) *
      (180 / Math.PI)
    coords.push([lng, (lat * 180) / Math.PI])
  }

  return {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: [coords] },
    properties: {},
  }
}

export function MapView({ center, radius, entreprises }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const centerMarkerRef = useRef<mapboxgl.Marker | null>(null)

  const updateCircle = useCallback(() => {
    if (!map.current?.isStyleLoaded()) return
    const source = map.current.getSource('radius-circle') as mapboxgl.GeoJSONSource | undefined
    if (source) {
      source.setData(createCircleGeoJSON(center, radius) as GeoJSON.Feature)
    }
  }, [center, radius])

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: center,
      zoom: 11,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

    map.current.on('load', () => {
      map.current!.addSource('radius-circle', {
        type: 'geojson',
        data: createCircleGeoJSON(center, radius) as GeoJSON.Feature,
      })

      map.current!.addLayer({
        id: 'radius-fill',
        type: 'fill',
        source: 'radius-circle',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.1,
        },
      })

      map.current!.addLayer({
        id: 'radius-border',
        type: 'line',
        source: 'radius-circle',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 2,
          'line-dasharray': [2, 2],
        },
      })
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update center marker
  useEffect(() => {
    if (!map.current) return

    map.current.flyTo({ center, zoom: Math.max(map.current.getZoom(), 13) })

    if (centerMarkerRef.current) {
      centerMarkerRef.current.setLngLat(center)
    } else {
      const el = document.createElement('div')
      el.className = 'center-marker'
      el.style.cssText =
        'width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.3);'
      centerMarkerRef.current = new mapboxgl.Marker(el).setLngLat(center).addTo(map.current)
    }

    updateCircle()
  }, [center, updateCircle])

  // Update circle on radius change
  useEffect(() => {
    updateCircle()
  }, [radius, updateCircle])

  // Update enterprise markers
  useEffect(() => {
    if (!map.current) return

    // Clear old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    entreprises.forEach((e) => {
      const etablissements = e.matching_etablissements?.length
        ? e.matching_etablissements
        : [e.siege]

      etablissements.forEach((etab) => {
        const lat = etab.latitude
        const lng = etab.longitude
        if (lat == null || lng == null) return

        const popup = new mapboxgl.Popup({ offset: 25, maxWidth: '280px' }).setHTML(`
          <div style="font-family:system-ui;font-size:13px;">
            <strong style="font-size:14px;">${e.nom_complet}</strong><br/>
            <span style="color:#666;">SIRET: ${etab.siret}</span><br/>
            <span style="color:#666;">📍 ${etab.adresse || 'Adresse inconnue'}</span><br/>
            ${e.categorie_entreprise ? `<span style="color:#666;">📊 ${e.categorie_entreprise}</span><br/>` : ''}
            ${etab.tranche_effectif_salarie ? `<span style="color:#666;">👥 Tranche étab: ${etab.tranche_effectif_salarie}</span>` : ''}
          </div>
        `)

        const el = document.createElement('div')
        el.style.cssText =
          'width:12px;height:12px;background:#ef4444;border:2px solid white;border-radius:50%;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.3);'
        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current!)

        markersRef.current.push(marker)
      })
    })
  }, [entreprises])

  return <div ref={mapContainer} className="w-full h-full" />
}
