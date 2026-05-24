import fs from 'fs'

const path = 'src/screens/workouts/WorkoutExecutionScreen.tsx'
let content = fs.readFileSync(path, 'utf8')

// Add previous session state
content = content.replace(
  'const { workout, isLoading: workoutLoading } = useWorkout(session?.workoutId)',
  `const { workout, isLoading: workoutLoading } = useWorkout(session?.workoutId)
  const [previousSession, setPreviousSession] = useState<any>(null)

  useEffect(() => {
    if (firebaseUser?.uid && session?.workoutId && sessionId) {
      workoutSessionService.getRecentSessions(firebaseUser.uid, 30).then(sessions => {
        const prev = sessions.find(s => s.id !== sessionId && s.workoutId === session.workoutId && s.status === 'completed')
        if (prev) setPreviousSession(prev)
      })
    }
  }, [firebaseUser?.uid, session?.workoutId, sessionId])`
)

// Add previous log calculations
const prevLogCalc = `const prevDone = i === 0 || session.logs?.some(l => l.exerciseId === exercise.id && l.setNumber === i)
                  const isActive = !isDone && prevDone
                  const inp = getInput(exercise.id, setNum)
                  
                  const prevLog = previousSession?.logs?.find((l: any) => l.exerciseId === exercise.id && l.setNumber === setNum)
                  const prevLoadLabel = prevLog ? \`\${prevLog.loadKg}kg\` : '--'
                  const prevRepsLabel = prevLog ? \`\${prevLog.reps}\` : exercise.reps`

content = content.replace(
  'const prevDone = i === 0 || session.logs?.some(l => l.exerciseId === exercise.id && l.setNumber === i)\n                  const isActive = !isDone && prevDone\n                  const inp = getInput(exercise.id, setNum)',
  prevLogCalc
)
content = content.replace(
  'const prevDone = i === 0 || session.logs?.some(l => l.exerciseId === exercise.id && l.setNumber === i)\r\n                  const isActive = !isDone && prevDone\r\n                  const inp = getInput(exercise.id, setNum)',
  prevLogCalc
)

// Update Reps placeholder
content = content.replace(
  `placeholder={exercise.reps}
                          type="number"
                          inputMode="numeric"`,
  `placeholder={prevRepsLabel}
                          type="number"
                          inputMode="numeric"`
)

// Update Load placeholder
content = content.replace(
  `placeholder="--"
                          type="number"
                          inputMode="decimal"`,
  `placeholder={prevLoadLabel}
                          type="number"
                          inputMode="decimal"`
)

fs.writeFileSync(path, content)
console.log('Update complete')
