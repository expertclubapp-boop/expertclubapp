import fs from 'fs'

const path = 'src/screens/workouts/WorkoutExecutionScreen.tsx'
let content = fs.readFileSync(path, 'utf8')

// Update Reps placeholder
content = content.replace(
  `placeholder={exercise.reps}
                          type="number"
                          inputMode="numeric"`,
  `placeholder={prevRepsLabel}
                          type="number"
                          inputMode="numeric"`
)
content = content.replace(
  `placeholder={exercise.reps}\r
                          type="number"\r
                          inputMode="numeric"`,
  `placeholder={prevRepsLabel}\r
                          type="number"\r
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
content = content.replace(
  `placeholder="--"\r
                          type="number"\r
                          inputMode="decimal"`,
  `placeholder={prevLoadLabel}\r
                          type="text"\r
                          inputMode="decimal"`
)

fs.writeFileSync(path, content)
console.log('Update complete')
