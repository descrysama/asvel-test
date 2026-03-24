import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AddressSearch } from '@/components/AddressSearch'
import { TRANCHES_EFFECTIF } from '@/lib/api'

interface SearchPanelProps {
  radius: number
  onRadiusChange: (radius: number) => void
  selectedTranches: string[]
  onTranchesChange: (tranches: string[]) => void
  onSearch: () => void
  onCenterChange: (center: [number, number]) => void
  totalResults: number | null
  loading: boolean
  page: number
  totalPages: number
  onLoadMore: () => void
}

export function SearchPanel({
  radius,
  onRadiusChange,
  selectedTranches,
  onTranchesChange,
  onSearch,
  onCenterChange,
  totalResults,
  loading,
  page,
  totalPages,
  onLoadMore,
}: SearchPanelProps) {
  const [expanded, setExpanded] = useState(true)
  const [trancheRange, setTrancheRange] = useState<[number, number]>([0, TRANCHES_EFFECTIF.length - 1])

  function handleTrancheRangeChange(value: number | readonly number[]) {
    const arr = Array.isArray(value) ? value : [value]
    const min = arr[0]
    const max = arr[1] ?? arr[0]
    setTrancheRange([min, max])
    const selected = TRANCHES_EFFECTIF.slice(min, max + 1).map((t) => t.value)
    onTranchesChange(selected)
  }

  const minLabel = TRANCHES_EFFECTIF[trancheRange[0]].label
  const maxLabel = TRANCHES_EFFECTIF[trancheRange[1]].label
  const isFullRange = trancheRange[0] === 0 && trancheRange[1] === TRANCHES_EFFECTIF.length - 1
  const hasMore = page < totalPages

  return (
    <Card className="absolute top-4 left-4 z-10 w-80 max-h-[calc(100vh-2rem)] overflow-y-auto shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recherche entreprises</CardTitle>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
        {totalResults !== null && (
          <p className="text-sm text-muted-foreground">
            {totalResults} résultat{totalResults > 1 ? 's' : ''} trouvé{totalResults > 1 ? 's' : ''}
          </p>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Adresse</Label>
            <AddressSearch onSelect={onCenterChange} />
          </div>

          <div className="space-y-3">
            <Label>
              Rayon de recherche : {radius >= 1 ? `${radius} km` : `${Math.round(radius * 1000)} m`}
            </Label>
            <Slider
              value={[radius]}
              onValueChange={(v) => {
                const val = Array.isArray(v) ? v[0] : v
                onRadiusChange(Math.round(val * 10) / 10)
              }}
              min={0.1}
              max={50}
              step={0.1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>100 m</span>
              <span>50 km</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Effectif salarié</Label>
            <Slider
              value={trancheRange}
              onValueChange={handleTrancheRangeChange}
              min={0}
              max={TRANCHES_EFFECTIF.length - 1}
              step={1}
            />
            <div className="text-xs text-muted-foreground text-center">
              {isFullRange ? (
                <span>Toutes tailles</span>
              ) : trancheRange[0] === trancheRange[1] ? (
                <span>{minLabel}</span>
              ) : (
                <span>De <strong>{minLabel}</strong> à <strong>{maxLabel}</strong></span>
              )}
            </div>
          </div>

          <Button onClick={onSearch} disabled={loading} className="w-full">
            {loading ? 'Recherche...' : 'Rechercher'}
          </Button>

          {hasMore && (
            <Button
              onClick={onLoadMore}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Chargement...' : `Charger plus (page ${page + 1}/${totalPages})`}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  )
}
