import { useState, useCallback } from 'react'
import { MapView } from '@/components/MapView'
import { SearchPanel } from '@/components/SearchPanel'
import { ResultsList } from '@/components/ResultsList'
import { searchNearPoint } from '@/lib/api'
import type { Entreprise } from '@/lib/api'

// Default: Lyon center
const DEFAULT_CENTER: [number, number] = [4.905469, 45.760866]

function App() {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const [radius, setRadius] = useState(0.5)
  const [selectedTranches, setSelectedTranches] = useState<string[]>([])
  const [entreprises, setEntreprises] = useState<Entreprise[]>([])
  const [totalResults, setTotalResults] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const fetchPage = useCallback(async (pageNum: number, append = false) => {
    setLoading(true)
    try {
      const data = await searchNearPoint({
        lat: center[1],
        long: center[0],
        radius,
        tranche_effectif_salarie: selectedTranches.length > 0 ? selectedTranches : undefined,
        per_page: 25,
        page: pageNum,
      })
      setEntreprises((prev) => append ? [...prev, ...data.results] : data.results)
      setTotalResults(data.total_results)
      setTotalPages(data.total_pages)
      setPage(pageNum)
    } catch (err) {
      console.error('Search failed:', err)
      if (!append) {
        setEntreprises([])
        setTotalResults(0)
      }
    } finally {
      setLoading(false)
    }
  }, [center, radius, selectedTranches])

  const handleSearch = useCallback(() => {
    setEntreprises([])
    fetchPage(1)
  }, [fetchPage])

  const handleLoadMore = useCallback(() => {
    if (page < totalPages) {
      fetchPage(page + 1, true)
    }
  }, [fetchPage, page, totalPages])

  return (
    <div className="relative w-screen h-screen">
      <MapView
        center={center}
        radius={radius}
        entreprises={entreprises}
      />
      <SearchPanel
        radius={radius}
        onRadiusChange={setRadius}
        selectedTranches={selectedTranches}
        onTranchesChange={setSelectedTranches}
        onSearch={handleSearch}
        onCenterChange={setCenter}
        totalResults={totalResults}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onLoadMore={handleLoadMore}
      />
      <ResultsList
        entreprises={entreprises}
        loading={loading}
        totalResults={totalResults}
        page={page}
        totalPages={totalPages}
        onLoadMore={handleLoadMore}
      />
    </div>
  )
}

export default App
