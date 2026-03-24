import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'

interface AddressResult {
  label: string
  coordinates: [number, number] // [lng, lat]
}

interface AddressSearchProps {
  onSelect: (center: [number, number]) => void
}

export function AddressSearch({ onSelect }: AddressSearchProps) {
  const [query, setQuery] = useState('Rue Frédéric Fays, 69100 Villeurbanne, France')
  const [results, setResults] = useState<AddressResult[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    try {
      const token = 'pk.eyJ1IjoibWFrZXJzb3VsIiwiYSI6ImNsbHhtd3V1dzBlMjYzcnAzNmVhdDRidjIifQ.Z4UswRfpsjf5pXByC4DN4A'
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${token}&country=fr&limit=5&language=fr&types=address,poi,place,locality`
      )
      const data = await res.json()
      const items: AddressResult[] = data.features.map(
        (f: { place_name: string; center: [number, number] }) => ({
          label: f.place_name,
          coordinates: f.center,
        })
      )
      setResults(items)
      setOpen(items.length > 0)
    } catch {
      setResults([])
    }
  }, [])

  function handleInput(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(value), 300)
  }

  function handleSelect(r: AddressResult) {
    setQuery(r.label)
    setOpen(false)
    setResults([])
    onSelect(r.coordinates)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <Input
        placeholder="Adresse, lieu, enseigne..."
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleSelect(r)}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
