import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { searchNearPoint, TRANCHES_EFFECTIF } from '@/lib/api'
import type { Entreprise } from '@/lib/api'
import * as XLSX from 'xlsx'

interface ExportModalProps {
  center: [number, number]
  radius: number
  selectedTranches: string[]
  totalResults: number | null
}

function getTrancheLabel(code: string | null): string {
  if (!code) return ''
  return TRANCHES_EFFECTIF.find((t) => t.value === code)?.label ?? code
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function ExportModal({ center, radius, selectedTranches, totalResults }: ExportModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ loaded: 0, total: 0 })

  async function handleExport() {
    setLoading(true)
    setProgress({ loaded: 0, total: totalResults ?? 0 })

    try {
      const allEntreprises: Entreprise[] = []
      let currentPage = 1
      let totalPages = 1

      while (currentPage <= totalPages) {
        const data = await searchNearPoint({
          lat: center[1],
          long: center[0],
          radius,
          tranche_effectif_salarie: selectedTranches.length > 0 ? selectedTranches : undefined,
          per_page: 25,
          page: currentPage,
        })

        allEntreprises.push(...data.results)
        totalPages = data.total_pages
        setProgress({ loaded: allEntreprises.length, total: data.total_results })

        currentPage++
        // Respect rate limit (7 req/s)
        if (currentPage <= totalPages) await delay(150)
      }

      exportToExcel(allEntreprises)
      setOpen(false)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setLoading(false)
    }
  }

  function exportToExcel(entreprises: Entreprise[]) {
    const rows = entreprises.flatMap((e) => {
      const etabs = e.matching_etablissements?.length
        ? e.matching_etablissements
        : [e.siege]

      return etabs.map((etab) => ({
        'SIREN': e.siren,
        'SIRET': etab.siret,
        'Nom': e.nom_complet,
        'Adresse': etab.adresse,
        'Code postal': etab.code_postal,
        'Commune': etab.commune,
        'Catégorie': e.categorie_entreprise ?? '',
        'Effectif entreprise': getTrancheLabel(e.tranche_effectif_salarie),
        'Effectif établissement': getTrancheLabel(etab.tranche_effectif_salarie),
        'Activité principale': e.activite_principale,
        'État': e.etat_administratif,
        'Latitude': etab.latitude ?? '',
        'Longitude': etab.longitude ?? '',
      }))
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Entreprises')
    XLSX.writeFile(wb, `entreprises_export_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (!totalResults) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Exporter en Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exporter les résultats</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {totalResults} résultat{totalResults > 1 ? 's' : ''} seront exportés.
            Toutes les pages seront chargées automatiquement.
          </p>

          {loading && (
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress.total ? (progress.loaded / progress.total) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {progress.loaded} / {progress.total} chargés...
              </p>
            </div>
          )}

          <Button onClick={handleExport} disabled={loading} className="w-full">
            {loading ? 'Export en cours...' : 'Exporter tout'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
