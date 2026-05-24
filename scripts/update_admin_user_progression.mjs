import fs from 'fs'

const path = 'src/screens/admin/AdminUserDetailScreen.tsx'
let content = fs.readFileSync(path, 'utf8')

// Import progression service
if (!content.includes('workoutProgressionService')) {
  content = content.replace(
    `import { adminPrescriptionService } from '../../services/adminPrescriptionService'`,
    `import { adminPrescriptionService } from '../../services/adminPrescriptionService'\nimport { workoutProgressionService, type WorkoutProgressSummary } from '../../services/workoutProgressionService'`
  )
}

// Add state for progression summary
content = content.replace(
  `  const [historyLoading, setHistoryLoading] = useState(true)`,
  `  const [historyLoading, setHistoryLoading] = useState(true)\n  const [progressSummary, setProgressSummary] = useState<WorkoutProgressSummary | null>(null)`
)

// Fetch progression summary
content = content.replace(
  `adminPrescriptionService.listPrescriptionAssignments(data.user.uid, 'workout')
      .then(setHistory)
      .finally(() => setHistoryLoading(false))`,
  `adminPrescriptionService.listPrescriptionAssignments(data.user.uid, 'workout')
      .then(setHistory)
      .finally(() => setHistoryLoading(false))
    workoutProgressionService.getStudentWorkoutProgressSummary(data.user.uid)
      .then(setProgressSummary)`
)

// Add Progress Summary Card
const summaryCard = `        {progressSummary && (
          <V2Card className="p-6 border border-accent-lime/20 bg-accent-lime/5">
            <h3 className="text-xs font-black italic text-accent-lime uppercase tracking-widest mb-6">Métricas de Progressão</h3>
            <div className="grid grid-cols-2 gap-4">
              <Info label="Total de Sessões" value={progressSummary.totalSessions.toString()} />
              <Info label="Tonelagem Total" value={\`\${(progressSummary.totalTonnage / 1000).toFixed(1)}t\`} />
              <Info label="Última Sessão" value={progressSummary.lastSessionDate ? formatDate(progressSummary.lastSessionDate) : 'Nunca'} />
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
              <V2Button variant="secondary" className="text-xs h-8" title="Histórico completo em breve">Ver Histórico por Exercício</V2Button>
            </div>
          </V2Card>
        )}`

content = content.replace(
  `      <div className="lg:col-span-2 space-y-6">`,
  `      <div className="lg:col-span-2 space-y-6">\n${summaryCard}`
)

fs.writeFileSync(path, content)
console.log('AdminUserDetailScreen updated with progression metrics')
