import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageShell } from '../../components/ui/Premium'
import { V2Card, V2Badge, V2Button, cx } from '../../components/v2/ExpertClubV2Base'
import { adminCheckinService, type AdminCheckinRow } from '../../services/adminCheckinService'
import { checkinStatusPt, checkinTypePt } from '../../utils/labels'
import { Loader2 } from 'lucide-react'

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'reviewed', label: 'Revisados' },
  { id: 'rejected', label: 'Rejeitados' },
] as const

function formatDate(val: any) {
  if (!val) return '-'
  if (val.toDate) return val.toDate().toLocaleDateString('pt-BR')
  const d = new Date(val)
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR')
}

export function AdminCheckinsScreen() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filter = searchParams.get('filter') || 'pending'
  const navigate = useNavigate()

  const [rows, setRows] = useState<AdminCheckinRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await adminCheckinService.listCheckins({
        status: filter === 'all' ? undefined : filter
      })
      setRows(res.rows)
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filter])

  return (
    <PageShell wide>
      <div className="flex overflow-x-auto border-b border-white/10 scrollbar-hide mb-6">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setSearchParams({ filter: f.id })}
            className={cx(
              "px-6 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors",
              filter === f.id ? "border-ec-violet text-ec-violet" : "border-transparent text-text-muted hover:text-white"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {error && !loading && (
        <V2Card className="p-8 text-center text-accent-red">
          <p>Não foi possível carregar os check-ins.</p>
          <V2Button variant="secondary" onClick={loadData} className="mt-4">Tentar Novamente</V2Button>
        </V2Card>
      )}

      {!loading && !error && rows.length === 0 && (
        <V2Card className="p-8 text-center text-text-muted">
          <p>Nenhum check-in encontrado nesta visualização.</p>
        </V2Card>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="space-y-4">
          {rows.map(row => (
            <V2Card key={row.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-white text-sm">{row.studentName}</span>
                  <V2Badge tone={row.reviewStatus === 'pending' ? 'warning' : row.reviewStatus === 'reviewed' ? 'success' : 'danger'}>
                    {checkinStatusPt(row.reviewStatus)}
                  </V2Badge>
                  <V2Badge tone="neutral">{checkinTypePt(row.type)}</V2Badge>
                </div>
                <div className="text-xs text-text-muted flex gap-4">
                  <span>Enviado: {formatDate(row.createdAt)}</span>
                  {row.weight && <span>Peso: {row.weight}kg</span>}
                </div>
                {row.summary && <p className="text-sm text-text-secondary mt-2 italic truncate max-w-lg">"{row.summary}"</p>}
              </div>
              <div className="flex-shrink-0">
                <V2Button
                  variant={row.reviewStatus === 'pending' ? 'primary' : 'secondary'}
                  onClick={() => navigate(`/admin/checkins/${row.studentId}/${row.type}/${row.id}`)}
                >
                  {row.reviewStatus === 'pending' ? 'Revisar' : 'Visualizar'}
                </V2Button>
              </div>
            </V2Card>
          ))}
        </div>
      )}
    </PageShell>
  )
}
