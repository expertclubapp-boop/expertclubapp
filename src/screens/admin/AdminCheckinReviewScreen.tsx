import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageShell } from '../../components/ui/Premium'
import { V2Card, V2Badge, V2Button } from '../../components/v2/ExpertClubV2Base'
import { adminCheckinService, type AdminCheckinDetail } from '../../services/adminCheckinService'
import { checkinStatusPt, checkinTypePt, moodPt } from '../../utils/labels'
import { Loader2, ArrowLeft } from 'lucide-react'
import { toastSuccess, toastError } from '../../components/ui/Toast'
import { useAuth } from '../../contexts/AuthContext'
import { Field } from './AdminShared'

function formatDate(val: any) {
  if (!val) return '-'
  if (val.toDate) return val.toDate().toLocaleDateString('pt-BR')
  const d = new Date(val)
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR')
}

export function AdminCheckinReviewScreen() {
  const { studentId, type, checkinId } = useParams()
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()

  const [detail, setDetail] = useState<AdminCheckinDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    if (!studentId || !type || !checkinId) return
    setLoading(true)
    setError(false)
    try {
      const res = await adminCheckinService.getCheckinDetail({
        studentId,
        type: type as 'daily' | 'weekly',
        checkinId
      })
      if (!res) {
        setError(true)
        return
      }
      setDetail(res)
      setFeedback(res.adminFeedback || '')
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [studentId, type, checkinId])

  const handleReview = async (status: 'reviewed' | 'rejected') => {
    if (!studentId || !type || !checkinId || !firebaseUser) return
    setSaving(true)
    try {
      await adminCheckinService.reviewCheckin({
        studentId,
        type: type as 'daily' | 'weekly',
        checkinId,
        feedback,
        status,
        adminEmail: firebaseUser.email || 'admin'
      })
      toastSuccess(`Check-in ${status === 'reviewed' ? 'revisado' : 'rejeitado'}.`)
      await loadData()
      navigate('/admin/checkins')
    } catch (e) {
      console.error(e)
      toastError('Erro ao salvar revisão.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageShell wide>
        <div className="flex items-center justify-center py-20 text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </PageShell>
    )
  }

  if (error || !detail) {
    return (
      <PageShell wide>
        <V2Card className="p-8 text-center text-accent-red">
          <p>Check-in não encontrado ou erro de permissão.</p>
          <V2Button variant="secondary" onClick={() => navigate('/admin/checkins')} className="mt-4">Voltar</V2Button>
        </V2Card>
      </PageShell>
    )
  }

  return (
    <PageShell wide>
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 text-text-muted hover:text-white bg-white/5 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div>
          <span className="text-[10px] font-black tracking-[0.2em] text-ec-violet uppercase mb-1 block">REVISÃO DE CHECK-IN</span>
          <h1 className="text-2xl font-black italic text-white uppercase">{detail.studentName}</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <V2Card className="p-6">
          <h3 className="text-xs font-black italic text-white uppercase tracking-widest mb-6">Dados do Aluno</h3>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <V2Badge tone="neutral">{checkinTypePt(detail.type)}</V2Badge>
            <V2Badge tone={detail.reviewStatus === 'pending' ? 'warning' : detail.reviewStatus === 'reviewed' ? 'success' : 'danger'}>
              {checkinStatusPt(detail.reviewStatus)}
            </V2Badge>
          </div>

          <div className="space-y-4">
            <Info label="Enviado em" value={formatDate(detail.createdAt)} />
            {detail.weight && <Info label="Peso" value={`${detail.weight} kg`} />}
            {detail.mood && <Info label="Humor" value={moodPt(detail.mood)} />}
            <div className="mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Observações do Aluno</p>
              <p className="mt-1 text-sm text-white italic whitespace-pre-wrap">{detail.notes || 'Nenhuma.'}</p>
            </div>
            
            {detail.photos && detail.photos.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Fotos Anexadas</p>
                <div className="flex gap-2">
                  {detail.photos.map((p, idx) => (
                    <a key={idx} href={p} target="_blank" rel="noreferrer" className="block w-16 h-16 bg-white/10 rounded-lg overflow-hidden relative group">
                      <img src={p} alt="Foto check-in" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </V2Card>

        <V2Card className="p-6 border border-ec-violet/30 bg-ec-violet/5">
          <h3 className="text-xs font-black italic text-ec-violet uppercase tracking-widest mb-6">Feedback do Administrador</h3>
          
          <Field label="Mensagem de retorno (visível para o aluno)">
            <textarea
              className="ec-input w-full rounded-xl p-4 text-sm text-white min-h-[160px]"
              placeholder="Escreva seu feedback sobre o envio..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              disabled={saving}
            />
          </Field>

          <div className="flex gap-4 mt-6">
            <V2Button
              variant="primary"
              className="flex-1"
              disabled={saving}
              onClick={() => handleReview('reviewed')}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aprovar Check-in'}
            </V2Button>
            <V2Button
              variant="secondary"
              className="flex-1 text-accent-red"
              disabled={saving}
              onClick={() => handleReview('rejected')}
            >
              Solicitar Ajuste
            </V2Button>
          </div>

          {detail.reviewedAt && (
            <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-text-muted uppercase tracking-widest">
              Última revisão por {detail.reviewedBy} em {formatDate(detail.reviewedAt)}.
            </div>
          )}
        </V2Card>
      </div>
    </PageShell>
  )
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</p>
      <p className="mt-1 text-sm text-white font-bold">{value || '-'}</p>
    </div>
  )
}
