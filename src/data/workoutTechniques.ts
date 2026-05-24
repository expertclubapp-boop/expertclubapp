import type { WorkoutTechnique } from '../types/domain'

export const BUILT_IN_TECHNIQUES: WorkoutTechnique[] = [
  {
    id: 'cluster_set',
    name: 'Cluster Set',
    description: 'Micro-pausas intra-série para manter carga alta e qualidade de execução.',
    instructions:
      'Execute 2–3 repetições → pause 10–20 segundos sem largar a barra → repita até completar o total de reps prescrito. Mantém tensão mecânica elevada sem acúmulo excessivo de fadiga metabólica. Ideal para movimentos técnicos como agachamento e terra.',
    isBuiltIn: true,
  },
  {
    id: 'rest_pause',
    name: 'Rest-Pause',
    description: 'Extende a série além da falha com mini-pausas de recuperação.',
    instructions:
      'Leve ao limite técnico (falha). Descanse 10–15 respirações profundas (≈ 20–30 seg) sem sair da posição. Execute mais reps. Repita 1–2 vezes. O total de reps acumula como 1 série. Excelente para acúmulo de volume em séries únicas.',
    isBuiltIn: true,
  },
  {
    id: 'back_off_set',
    name: 'Back-off Set',
    description: 'Série de volume com carga reduzida após o trabalho pesado.',
    instructions:
      'Após a(s) série(s) principal(is), reduza a carga em 15–25% e execute uma série com faixa de reps mais alta (geralmente o dobro das séries pesadas). Objetivo: acúmulo de volume sem comprometer a recuperação. Use no final do bloco de trabalho.',
    isBuiltIn: true,
  },
]
