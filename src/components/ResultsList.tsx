import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Entreprise } from '@/lib/api'
import { TRANCHES_EFFECTIF } from '@/lib/api'

interface ResultsListProps {
  entreprises: Entreprise[]
  loading: boolean
  totalResults: number | null
  page: number
  totalPages: number
  onLoadMore: () => void
}

function getTrancheLabel(code: string | null): string | null {
  if (!code) return null
  return TRANCHES_EFFECTIF.find((t) => t.value === code)?.label ?? code
}

function EntrepriseRow({ e }: { e: Entreprise }) {
  const etab = e.matching_etablissements?.[0] ?? e.siege
  return (
    <div className="p-3 rounded-md hover:bg-muted/50 transition-colors cursor-default">
      <p className="font-medium text-sm leading-tight">{e.nom_complet}</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {etab.adresse || etab.commune}
      </p>
      <div className="flex gap-1 mt-1 flex-wrap">
        {e.categorie_entreprise && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {e.categorie_entreprise}
          </Badge>
        )}
        {getTrancheLabel(etab.tranche_effectif_salarie) && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {getTrancheLabel(etab.tranche_effectif_salarie)}
          </Badge>
        )}
      </div>
    </div>
  )
}

export function ResultsList({
  entreprises,
  loading,
  totalResults,
  page,
  totalPages,
  onLoadMore,
}: ResultsListProps) {
  const [modalOpen, setModalOpen] = useState(false)

  if (loading && entreprises.length === 0) {
    return (
      <div className="absolute bottom-20 left-4 z-10 w-80">
        <Card>
          <CardContent className="py-3 text-center text-sm text-muted-foreground">
            Chargement...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (entreprises.length === 0) return null

  const hasMore = page < totalPages

  return (
    <>
      <div className="absolute bottom-20 left-4 z-10 w-80">
        <Card>
          <CardContent className="p-2">
            <div className="max-h-48 overflow-y-auto space-y-1">
              {entreprises.slice(0, 5).map((e) => (
                <EntrepriseRow key={e.siren} e={e} />
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-2 text-xs"
              onClick={() => setModalOpen(true)}
            >
              {entreprises.length > 5
                ? `Voir les ${totalResults ?? entreprises.length} résultats`
                : 'Agrandir'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {totalResults ?? entreprises.length} entreprise{(totalResults ?? entreprises.length) > 1 ? 's' : ''} trouvée{(totalResults ?? entreprises.length) > 1 ? 's' : ''}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {entreprises.length} chargée{entreprises.length > 1 ? 's' : ''} sur {totalResults}
            </p>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 -mx-2 divide-y divide-border">
            {entreprises.map((e, i) => (
              <EntrepriseRow key={`${e.siren}-${i}`} e={e} />
            ))}
          </div>
          {hasMore && (
            <div className="pt-3 border-t">
              <Button
                onClick={onLoadMore}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Chargement...' : `Charger plus (page ${page + 1}/${totalPages})`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
