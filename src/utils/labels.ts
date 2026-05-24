export function statusPt(status?: string): string {
  if (!status) return '-'
  switch (status) {
    case 'active': return 'Ativo'
    case 'pending': return 'Pendente'
    case 'past_due': return 'Em atraso'
    case 'cancelled': return 'Cancelado'
    case 'trialing': return 'Em teste'
    case 'expired': return 'Expirado'
    default: return status
  }
}

export function rolePt(role?: string): string {
  if (!role) return '-'
  switch (role) {
    case 'member': return 'Aluno'
    case 'mentor': return 'Mentor'
    case 'admin': return 'Admin'
    case 'affiliate': return 'Afiliado'
    default: return role
  }
}

export function goalPt(goal?: string): string {
  if (!goal) return '-'
  switch (goal) {
    case 'hypertrophy': return 'Hipertrofia'
    case 'fat_loss': return 'Emagrecimento'
    case 'maintenance': return 'Manutenção'
    case 'strength': return 'Força'
    case 'recomposition': return 'Recomposição'
    case 'conditioning': return 'Condicionamento'
    case 'performance': return 'Performance'
    case 'health': return 'Saúde e Qualidade de Vida'
    case 'endurance': return 'Resistência'
    default: return goal
  }
}

export function levelPt(level?: string): string {
  if (!level) return '-'
  switch (level) {
    case 'beginner': return 'Iniciante'
    case 'intermediate': return 'Intermediário'
    case 'advanced': return 'Avançado'
    default: return level
  }
}

export function checkinStatusPt(status?: string): string {
  if (!status) return 'Pendente'
  switch (status) {
    case 'pending': return 'Pendente'
    case 'reviewed': return 'Revisado'
    case 'rejected': return 'Ajuste solicitado'
    default: return status
  }
}

export function checkinTypePt(type?: string): string {
  if (!type) return '-'
  switch (type) {
    case 'daily': return 'Diário'
    case 'weekly': return 'Semanal'
    default: return type
  }
}

export function moodPt(mood?: string): string {
  if (!mood) return '-'
  switch (mood) {
    case 'great': return 'Ótimo'
    case 'good': return 'Bom'
    case 'normal': return 'Normal'
    case 'bad': return 'Ruim'
    case 'terrible': return 'Péssimo'
    default: return mood
  }
}

export function assignmentStatusPt(status?: string): string {
  if (!status) return '-'
  switch (status) {
    case 'active': return 'Ativa'
    case 'superseded': return 'Substituída'
    default: return status
  }
}

export function prescriptionTypePt(type?: string): string {
  if (!type) return '-'
  switch (type) {
    case 'workout': return 'Treino'
    case 'diet': return 'Dieta'
    default: return type
  }
}

export function modalityPt(modality?: string): string {
  if (!modality) return '-'
  switch (modality) {
    case 'bodybuilding': return 'Musculação'
    case 'functional': return 'Funcional'
    case 'home': return 'Casa'
    case 'running': return 'Corrida'
    case 'crossfit': return 'CrossFit'
    case 'jiu_jitsu': return 'Jiu-jítsu'
    case 'martial_arts': return 'Artes marciais'
    case 'mixed': return 'Misto'
    default: return modality
  }
}

export function formatDaysPerWeek(days?: number): string {
  if (!days || days <= 0) return '-'
  return `${days} dia${days > 1 ? 's' : ''}`
}

export function trainingFrequencyPt(days?: number): string {
  if (!days || days <= 0) return '-'
  return `${days}x/semana`
}

export function sexPt(sex?: string): string {
  if (!sex) return '-'
  switch (sex) {
    case 'male': return 'Masculino'
    case 'female': return 'Feminino'
    case 'other': return 'Outro'
    default: return sex
  }
}

export function trainingLocationPt(location?: string): string {
  if (!location) return '-'
  switch (location) {
    case 'gym': return 'Academia'
    case 'home': return 'Casa'
    case 'mixed': return 'Misto'
    case 'outdoor': return 'Ar livre'
    default: return location
  }
}

export function dietPreferencePt(preference?: string): string {
  if (!preference) return '-'
  switch (preference) {
    case 'flexible': return 'Flexível'
    case 'simple': return 'Simples'
    case 'economic': return 'Econômica'
    case 'low_carb': return 'Low carb'
    case 'vegetarian': return 'Vegetariana'
    case 'carnivore': return 'Carnívora'
    case 'intermittent_fasting': return 'Jejum intermitente'
    case 'meal_prep': return 'Meal prep'
    case 'busy_routine': return 'Rotina corrida'
    case 'with_whey': return 'Com whey'
    case 'without_whey': return 'Sem whey'
    case 'everything': return 'Sem restrição'
    case 'vegan': return 'Vegana'
    case 'paleo': return 'Paleo'
    default: return preference
  }
}

export function recommendationBadgePt(badge?: string): string {
  switch (badge) {
    case 'best_match': return 'Melhor encaixe'
    case 'good_option': return 'Boa opção'
    case 'alternative': return 'Alternativa'
    default: return 'Recomendação'
  }
}

export function recommendationReasonPt(reason?: string): string {
  return reason || '-'
}

export function recommendationSexPt(sex?: string): string {
  if (!sex) return '-'
  switch (sex) {
    case 'male': return 'Masculino'
    case 'female': return 'Feminino'
    case 'unisex': return 'Unissex'
    default: return sex
  }
}

export function churnRiskPt(level?: string): string {
  if (!level) return '-'
  switch (level) {
    case 'low': return 'Baixo'
    case 'medium': return 'Médio'
    case 'high': return 'Alto'
    default: return level
  }
}

export function adherenceStatusPt(value?: number): string {
  if (!Number.isFinite(value)) return 'Sem dados'
  if ((value || 0) >= 80) return 'Boa'
  if ((value || 0) >= 50) return 'Moderada'
  return 'Baixa'
}

export function insightPeriodPt(days?: number): string {
  if (!days || days <= 0) return 'Período recente'
  if (days === 7) return 'Últimos 7 dias'
  if (days === 15) return 'Últimos 15 dias'
  if (days === 30) return 'Últimos 30 dias'
  return `Últimos ${days} dias`
}

export function consistencyLevelPt(level?: string): string {
  if (!level) return 'Sem dados'
  switch (level) {
    case 'low': return 'Baixa'
    case 'medium': return 'Média'
    case 'high': return 'Alta'
    default: return level
  }
}

export function evolutionPeriodPt(days?: number): string {
  if (!days || days <= 0) return 'Relatório recente'
  if (days === 15) return 'Relatório dos últimos 15 dias'
  if (days === 30) return 'Relatório dos últimos 30 dias'
  return `Relatório dos últimos ${days} dias`
}

export function bodyMetricPt(metric?: string): string {
  if (!metric) return '-'
  switch (metric) {
    case 'weight': return 'Peso'
    case 'body_fat': return 'Gordura corporal'
    case 'waist': return 'Cintura'
    case 'abdomen': return 'Abdômen'
    case 'hips': return 'Quadril'
    case 'arm': return 'Braço'
    case 'thigh': return 'Coxa'
    default: return metric
  }
}

export function workoutEquipmentProfilePt(profile?: string): string {
  if (!profile) return '-'
  switch (profile) {
    case 'full_gym': return 'Academia completa'
    case 'basic_gym': return 'Academia básica'
    case 'dumbbells': return 'Halteres'
    case 'bodyweight': return 'Peso corporal'
    case 'mixed': return 'Misto'
    default: return profile
  }
}

export function dietComplexityPt(complexity?: string): string {
  if (!complexity) return '-'
  switch (complexity) {
    case 'easy': return 'Fácil'
    case 'medium': return 'Intermediária'
    case 'advanced': return 'Avançada'
    default: return complexity
  }
}
