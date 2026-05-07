#!/usr/bin/env node
/**
 * scripts/backfillMentorAssignments.mjs
 *
 * Backfill seguro de users/{studentId}.mentorId no Firestore.
 *
 * Uso:
 *   npm run backfill:mentor-assignments -- --dry-run
 *   npm run backfill:mentor-assignments -- --mentor=<MENTOR_UID> --students=<UID1,UID2>
 *   npm run backfill:mentor-assignments -- --from-file=mentor-assignments.csv
 *   npm run backfill:mentor-assignments -- --from-file=mentor-assignments.csv --dry-run
 *   npm run backfill:mentor-assignments -- --from-file=mentor-assignments.csv --force
 *
 * CSV format (sem header):
 *   studentId,mentorId
 *   uid_aluno_1,uid_mentor_1
 */

import admin from 'firebase-admin'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// ─── Parse args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const flags = {}
for (const arg of args) {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=')
    flags[key] = value ?? true
  }
}

const DRY_RUN = flags['dry-run'] === true || flags['dry-run'] === ''
const FORCE = flags['force'] === true || flags['force'] === ''
const FROM_FILE = flags['from-file']
const MENTOR_ID = flags['mentor']
const STUDENT_IDS = flags['students'] ? String(flags['students']).split(',').map(s => s.trim()) : []

// ─── Firebase init ──────────────────────────────────────────────────────────
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'expertcoaching-b91e2'
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : null

if (admin.apps.length === 0) {
  if (serviceAccountPath && existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    console.log(`\u2705  Autenticado via service account: ${serviceAccountPath}`)
  } else {
    // Application Default Credentials (gcloud auth application-default login)
    admin.initializeApp({ projectId: PROJECT_ID })
    console.log(`\u2139\uFE0F  Usando Application Default Credentials para projeto "${PROJECT_ID}"`)
  }
}

const db = admin.firestore()

// ─── Helpers ────────────────────────────────────────────────────────────────
function banner(msg) {
  console.log(`\n${'─'.repeat(60)}\n  ${msg}\n${'─'.repeat(60)}`)
}

async function getUserOrNull(uid) {
  const snap = await db.collection('users').doc(uid).get()
  if (!snap.exists) return null
  return { uid: snap.id, ...snap.data() }
}

async function parsePairs() {
  const pairs = []

  if (FROM_FILE) {
    const filePath = resolve(FROM_FILE)
    if (!existsSync(filePath)) {
      console.error(`\u274C  Arquivo não encontrado: ${filePath}`)
      process.exit(1)
    }
    const lines = readFileSync(filePath, 'utf8')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))

    for (const line of lines) {
      const [studentId, mentorId] = line.split(',').map(s => s.trim())
      if (!studentId || !mentorId) {
        console.warn(`\u26A0\uFE0F  Linha ignorada (formato invalido): "${line}"`)
        continue
      }
      pairs.push({ studentId, mentorId })
    }
    console.log(`\u{1F4C4}  Leu ${pairs.length} linha(s) de ${filePath}`)
  } else if (MENTOR_ID && STUDENT_IDS.length > 0) {
    for (const studentId of STUDENT_IDS) {
      pairs.push({ studentId, mentorId: MENTOR_ID })
    }
  } else {
    console.error('\u274C  Informe --from-file=arquivo.csv OU --mentor=UID --students=UID1,UID2')
    console.error('    Use --dry-run para pre-visualizar sem gravar.')
    process.exit(1)
  }

  return pairs
}

// ─── Validation ──────────────────────────────────────────────────────────────
async function validatePair({ studentId, mentorId }) {
  const errors = []

  const [student, mentor] = await Promise.all([getUserOrNull(studentId), getUserOrNull(mentorId)])

  if (!student) errors.push(`Student "${studentId}" nao encontrado no Firestore.`)
  if (!mentor)  errors.push(`Mentor "${mentorId}" nao encontrado no Firestore.`)

  if (student && !['member', 'student'].includes(student.role)) {
    errors.push(`"${studentId}" tem role "${student.role}" — esperado member ou student.`)
  }
  if (mentor && mentor.role !== 'mentor') {
    errors.push(`"${mentorId}" tem role "${mentor.role}" — esperado mentor.`)
  }

  return { student, mentor, errors }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  banner(DRY_RUN ? 'BACKFILL de mentorId — DRY RUN (nenhuma escrita sera feita)' : 'BACKFILL de mentorId')

  if (DRY_RUN)  console.log('\u{1F7E1}  Modo DRY RUN ativado.')
  if (FORCE)    console.log('\u26A0\uFE0F  Flag --force: mentorId existente sera sobrescrito.')

  const pairs = await parsePairs()

  const results = {
    skipped_exists: [],
    skipped_invalid: [],
    written: [],
    dry_run: [],
    errors: [],
  }

  for (const { studentId, mentorId } of pairs) {
    process.stdout.write(`  Validando ${studentId} → ${mentorId} ... `)

    const { student, mentor, errors } = await validatePair({ studentId, mentorId })

    if (errors.length > 0) {
      console.log('\u274C')
      for (const err of errors) console.error(`      \u274C ${err}`)
      results.skipped_invalid.push({ studentId, mentorId, errors })
      continue
    }

    const currentMentorId = student.mentorId || null
    const action = currentMentorId === mentorId
      ? 'NOOP (ja vinculado)'
      : currentMentorId && !FORCE
      ? 'SKIP (ja tem mentor — use --force para sobrescrever)'
      : currentMentorId
      ? `FORCE (era: ${currentMentorId})`
      : 'SET'

    console.log(action)
    console.log(
      `    Aluno: ${student.displayName || student.email}  |  Mentor atual: ${currentMentorId || 'nenhum'}  |  Mentor novo: ${mentor.displayName || mentor.email}`,
    )

    if (currentMentorId === mentorId) continue // noop

    if (currentMentorId && !FORCE) {
      results.skipped_exists.push({ studentId, mentorId, currentMentorId })
      continue
    }

    if (DRY_RUN) {
      results.dry_run.push({ studentId, mentorId, currentMentorId, action })
      continue
    }

    try {
      await db.collection('users').doc(studentId).update({
        mentorId,
        updatedAt: new Date().toISOString(),
      })
      results.written.push({ studentId, mentorId, previousMentorId: currentMentorId })
    } catch (err) {
      console.error(`  \u274C ERRO ao gravar: ${err.message}`)
      results.errors.push({ studentId, mentorId, error: err.message })
    }
  }

  // ─── Report ────────────────────────────────────────────────────────────────
  banner('RELATORIO FINAL')

  if (DRY_RUN) {
    console.log(`\u{1F7E1}  DRY RUN — nenhuma escrita foi feita.`)
    console.log(`   Seria gravado: ${results.dry_run.length}`)
    console.log(`   Ja vinculados (noop): ${pairs.length - results.dry_run.length - results.skipped_invalid.length - results.skipped_exists.length}`)
  } else {
    console.log(`\u2705  Gravados: ${results.written.length}`)
  }

  console.log(`\u23ED\uFE0F  Ignorados (ja tem mentor, sem --force): ${results.skipped_exists.length}`)
  console.log(`\u274C  Invalidos (nao encontrado ou role errada): ${results.skipped_invalid.length}`)

  if (results.skipped_invalid.length > 0) {
    console.log('\nDetalhes dos invalidos:')
    for (const { studentId, mentorId, errors } of results.skipped_invalid) {
      console.log(`  ${studentId} → ${mentorId}`)
      for (const e of errors) console.log(`    - ${e}`)
    }
  }

  if (results.errors.length > 0) {
    console.log(`\n\u274C  Erros de escrita: ${results.errors.length}`)
    for (const { studentId, error } of results.errors) {
      console.log(`  ${studentId}: ${error}`)
    }
    process.exit(1)
  }

  console.log('\nConcluido.\n')
  process.exit(0)
}

main().catch(err => {
  console.error('\u274C  Erro fatal:', err)
  process.exit(1)
})
