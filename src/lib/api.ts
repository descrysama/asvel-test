const BASE_URL = 'https://recherche-entreprises.api.gouv.fr'

export interface Etablissement {
  siret: string
  adresse: string
  latitude: number | null
  longitude: number | null
  commune: string
  code_postal: string
  tranche_effectif_salarie: string | null
}

export interface Entreprise {
  siren: string
  nom_complet: string
  nombre_etablissements: number
  activite_principale: string
  categorie_entreprise: string | null
  etat_administratif: string
  tranche_effectif_salarie: string | null
  siege: Etablissement
  matching_etablissements: Etablissement[]
}

export interface SearchResponse {
  results: Entreprise[]
  total_results: number
  page: number
  per_page: number
  total_pages: number
}

export const TRANCHES_EFFECTIF = [
  { value: '00', label: '0 salarié' },
  { value: '01', label: '1 ou 2 salariés' },
  { value: '02', label: '3 à 5 salariés' },
  { value: '03', label: '6 à 9 salariés' },
  { value: '11', label: '10 à 19 salariés' },
  { value: '12', label: '20 à 49 salariés' },
  { value: '21', label: '50 à 99 salariés' },
  { value: '22', label: '100 à 199 salariés' },
  { value: '31', label: '200 à 249 salariés' },
  { value: '32', label: '250 à 499 salariés' },
  { value: '41', label: '500 à 999 salariés' },
  { value: '42', label: '1 000 à 1 999 salariés' },
  { value: '51', label: '2 000 à 4 999 salariés' },
  { value: '52', label: '5 000 à 9 999 salariés' },
  { value: '53', label: '10 000 salariés et plus' },
] as const

export async function searchNearPoint(params: {
  lat: number
  long: number
  radius?: number
  tranche_effectif_salarie?: string[]
  page?: number
  per_page?: number
}): Promise<SearchResponse> {
  const url = new URL(`${BASE_URL}/near_point`)
  url.searchParams.set('lat', params.lat.toString())
  url.searchParams.set('long', params.long.toString())
  if (params.radius) url.searchParams.set('radius', params.radius.toString())
  if (params.tranche_effectif_salarie?.length) {
    url.searchParams.set('tranche_effectif_salarie', params.tranche_effectif_salarie.join(','))
  }
  url.searchParams.set('page', (params.page ?? 1).toString())
  url.searchParams.set('per_page', (params.per_page ?? 25).toString())

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
