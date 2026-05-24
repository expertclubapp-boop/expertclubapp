import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collectionGroup,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

type Role = 'Admin' | 'Mentor' | 'Aluno' | 'Affiliate' | 'AlunoOutro'
type Result = {
  role: Role
  query: string
  expected: string
  result: string
  status: 'PASS' | 'FAIL'
}

const projectId = `expert-club-rules-${Date.now()}`
const rules = readFileSync('firestore.rules', 'utf8')
const collections = ['workoutSessions', 'dietDays', 'dailyCheckins', 'bodyCheckins', 'hydrationDays'] as const
const results: Result[] = []

async function expectPass(role: Role, queryName: string, expected: string, action: () => Promise<unknown>) {
  try {
    await assertSucceeds(action())
    results.push({ role, query: queryName, expected, result: 'permitido', status: 'PASS' })
  } catch (error) {
    results.push({ role, query: queryName, expected, result: error instanceof Error ? error.message : String(error), status: 'FAIL' })
  }
}

async function expectDeny(role: Role, queryName: string, expected: string, action: () => Promise<unknown>) {
  try {
    await assertFails(action())
    results.push({ role, query: queryName, expected, result: 'negado', status: 'PASS' })
  } catch (error) {
    results.push({ role, query: queryName, expected, result: error instanceof Error ? error.message : String(error), status: 'FAIL' })
  }
}

const testEnv = await initializeTestEnvironment({
  projectId,
  firestore: {
    rules,
    host: '127.0.0.1',
    port: 8080,
  },
})

try {
  await testEnv.clearFirestore()

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await Promise.all([
      setDoc(doc(db, 'users/adminUid'), { uid: 'adminUid', email: 'admin@example.com', role: 'admin' }),
      setDoc(doc(db, 'users/mentorUid'), { uid: 'mentorUid', email: 'mentor@example.com', role: 'mentor' }),
      setDoc(doc(db, 'users/otherMentorUid'), { uid: 'otherMentorUid', email: 'other@example.com', role: 'mentor' }),
      setDoc(doc(db, 'users/affiliateUid'), { uid: 'affiliateUid', email: 'affiliate@example.com', role: 'affiliate' }),
      setDoc(doc(db, 'users/studentA'), { uid: 'studentA', email: 'a@example.com', role: 'member', mentorId: 'mentorUid' }),
      setDoc(doc(db, 'users/studentB'), { uid: 'studentB', email: 'b@example.com', role: 'member', mentorId: 'otherMentorUid' }),
      setDoc(doc(db, 'subscriptions/studentA'), { uid: 'studentA', status: 'active' }),
      setDoc(doc(db, 'subscriptions/studentB'), { uid: 'studentB', status: 'active' }),
    ])

    for (const name of collections) {
      await Promise.all([
        setDoc(doc(db, `users/studentA/${name}/owned`), { uid: 'studentA', createdAt: new Date('2026-05-01') }),
        setDoc(doc(db, `users/studentB/${name}/foreign`), { uid: 'studentB', createdAt: new Date('2026-05-01') }),
        setDoc(doc(db, `users/studentA/${name}/missingUid`), { createdAt: new Date('2026-05-01') }),
      ])
    }

    await Promise.all([
      setDoc(doc(db, 'users/studentA/prescriptionAssignments/workout-active'), {
        studentId: 'studentA',
        type: 'workout',
        templateId: 'workout-1',
        templateTitle: 'Treino A',
        previousTemplateId: null,
        previousTemplateTitle: null,
        reason: 'Teste',
        notes: '',
        assignedBy: 'admin@example.com',
        assignedByName: 'Admin',
        assignedAt: new Date('2026-05-01'),
        effectiveFrom: new Date('2026-05-01'),
        status: 'active',
        snapshot: { title: 'Treino A' },
      }),
      setDoc(doc(db, 'users/studentB/prescriptionAssignments/diet-active'), {
        studentId: 'studentB',
        type: 'diet',
        templateId: 'diet-1',
        templateTitle: 'Dieta B',
        previousTemplateId: null,
        previousTemplateTitle: null,
        reason: 'Teste',
        notes: '',
        assignedBy: 'admin@example.com',
        assignedByName: 'Admin',
        assignedAt: new Date('2026-05-02'),
        effectiveFrom: new Date('2026-05-02'),
        status: 'active',
        snapshot: { title: 'Dieta B', calories: 2000, protein: 150, carbs: 200, fat: 60 },
      }),
      setDoc(doc(db, 'users/studentA/planSelections/workout-selection'), {
        id: 'workout-selection',
        uid: 'studentA',
        type: 'workout',
        templateId: 'workout-1',
        selectedBy: 'student',
        selectedAt: new Date('2026-05-01'),
        source: 'recommendation',
        score: 82,
        reasons: ['Combina com seu objetivo'],
      }),
    ])
  })

  const adminDb = testEnv.authenticatedContext('adminUid').firestore()
  const mentorDb = testEnv.authenticatedContext('mentorUid').firestore()
  const studentDb = testEnv.authenticatedContext('studentA').firestore()
  const otherStudentDb = testEnv.authenticatedContext('studentB').firestore()
  const affiliateDb = testEnv.authenticatedContext('affiliateUid').firestore()

  for (const name of collections) {
    await expectPass('Admin', `collectionGroup('${name}') global`, 'admin pode ler global', () =>
      getDocs(collectionGroup(adminDb, name)),
    )

    await expectDeny('Mentor', `collectionGroup('${name}') global`, 'mentor nao pode query global livre', () =>
      getDocs(collectionGroup(mentorDb, name)),
    )

    await expectPass('Mentor', `collectionGroup('${name}') where uid == studentA`, 'mentor pode ler aluno vinculado por resource.data.uid', () =>
      getDocs(query(collectionGroup(mentorDb, name), where('uid', '==', 'studentA'))),
    )

    await expectDeny('Mentor', `collectionGroup('${name}') where uid == studentB`, 'mentor nao pode ler aluno de outro mentor', () =>
      getDocs(query(collectionGroup(mentorDb, name), where('uid', '==', 'studentB'))),
    )

    await expectDeny('Mentor', `doc users/studentA/${name}/missingUid`, 'mentor nao deve ler doc sem uid confiavel no campo', () =>
      getDoc(doc(mentorDb, `users/studentA/${name}/missingUid`)),
    )

    await expectDeny('Aluno', `collectionGroup('${name}') global`, 'aluno nao pode collectionGroup global', () =>
      getDocs(collectionGroup(studentDb, name)),
    )

    await expectPass('Aluno', `doc users/studentA/${name}/owned`, 'aluno pode ler proprio path', () =>
      getDoc(doc(studentDb, `users/studentA/${name}/owned`)),
    )

    await expectDeny('Aluno', `doc users/studentB/${name}/foreign`, 'aluno nao pode ler path de outro aluno', () =>
      getDoc(doc(studentDb, `users/studentB/${name}/foreign`)),
    )
  }

  await expectPass('Admin', "list users/studentA/prescriptionAssignments", 'admin pode listar assignments de qualquer aluno', () =>
    getDocs(query(collection(adminDb, 'users', 'studentA', 'prescriptionAssignments'))),
  )

  await expectPass('Admin', "create users/studentA/prescriptionAssignments/new-admin", 'admin pode criar assignment', () =>
    setDoc(doc(adminDb, 'users/studentA/prescriptionAssignments/new-admin'), {
      studentId: 'studentA',
      type: 'workout',
      templateId: 'workout-2',
      templateTitle: 'Treino B',
      previousTemplateId: 'workout-1',
      previousTemplateTitle: 'Treino A',
      reason: 'Progressão',
      notes: '',
      assignedBy: 'admin@example.com',
      assignedByName: 'Admin',
      assignedAt: new Date('2026-05-03'),
      effectiveFrom: new Date('2026-05-03'),
      status: 'active',
      snapshot: { title: 'Treino B' },
    }),
  )

  await expectPass('Admin', "update users/studentA/prescriptionAssignments/workout-active", 'admin pode atualizar assignment', () =>
    updateDoc(doc(adminDb, 'users/studentA/prescriptionAssignments/workout-active'), {
      status: 'superseded',
    }),
  )

  await expectPass('Aluno', "get users/studentA/prescriptionAssignments/workout-active", 'student pode ler proprio assignment', () =>
    getDoc(doc(studentDb, 'users/studentA/prescriptionAssignments/workout-active')),
  )

  await expectPass('Aluno', "list users/studentA/prescriptionAssignments", 'student pode listar proprio historico', () =>
    getDocs(query(collection(studentDb, 'users', 'studentA', 'prescriptionAssignments'))),
  )

  await expectDeny('Aluno', "create users/studentA/prescriptionAssignments/student-write", 'student nao pode criar assignment', () =>
    setDoc(doc(studentDb, 'users/studentA/prescriptionAssignments/student-write'), {
      studentId: 'studentA',
      type: 'workout',
      templateId: 'workout-3',
      templateTitle: 'Treino C',
      previousTemplateId: null,
      previousTemplateTitle: null,
      reason: '',
      notes: '',
      assignedBy: 'student@example.com',
      assignedByName: 'Aluno',
      assignedAt: new Date('2026-05-03'),
      effectiveFrom: new Date('2026-05-03'),
      status: 'active',
      snapshot: { title: 'Treino C' },
    }),
  )

  await expectDeny('Aluno', "update users/studentA/prescriptionAssignments/workout-active", 'student nao pode atualizar assignment', () =>
    updateDoc(doc(studentDb, 'users/studentA/prescriptionAssignments/workout-active'), {
      status: 'superseded',
    }),
  )

  await expectDeny('AlunoOutro', "get users/studentA/prescriptionAssignments/workout-active", 'outro aluno nao pode ler assignment alheio', () =>
    getDoc(doc(otherStudentDb, 'users/studentA/prescriptionAssignments/workout-active')),
  )

  await expectDeny('Affiliate', "get users/studentA/prescriptionAssignments/workout-active", 'affiliate nao acessa assignments', () =>
    getDoc(doc(affiliateDb, 'users/studentA/prescriptionAssignments/workout-active')),
  )

  await expectDeny('Mentor', "get users/studentA/prescriptionAssignments/workout-active", 'mentor puro nao ganha permissao nova', () =>
    getDoc(doc(mentorDb, 'users/studentA/prescriptionAssignments/workout-active')),
  )

  await expectPass('Aluno', "get users/studentA/planSelections/workout-selection", 'student pode ler propria selecao', () =>
    getDoc(doc(studentDb, 'users/studentA/planSelections/workout-selection')),
  )

  await expectPass('Aluno', "create users/studentA/planSelections/new-selection", 'student pode criar propria selecao de recomendacao', () =>
    setDoc(doc(studentDb, 'users/studentA/planSelections/new-selection'), {
      id: 'new-selection',
      uid: 'studentA',
      type: 'diet',
      templateId: 'diet-2',
      selectedBy: 'student',
      selectedAt: new Date('2026-05-03'),
      source: 'recommendation',
      score: 77,
      reasons: ['Faixa calórica compatível'],
    }),
  )

  await expectDeny('AlunoOutro', "get users/studentA/planSelections/workout-selection", 'outro aluno nao pode ler selecao alheia', () =>
    getDoc(doc(otherStudentDb, 'users/studentA/planSelections/workout-selection')),
  )

  await expectDeny('Affiliate', "get users/studentA/planSelections/workout-selection", 'affiliate nao acessa selecao de plano', () =>
    getDoc(doc(affiliateDb, 'users/studentA/planSelections/workout-selection')),
  )

  await expectDeny('Mentor', "get users/studentA/planSelections/workout-selection", 'mentor puro nao acessa selecao de plano', () =>
    getDoc(doc(mentorDb, 'users/studentA/planSelections/workout-selection')),
  )

  console.table(results)
  const failures = results.filter((item) => item.status === 'FAIL')
  assert.equal(failures.length, 0, `${failures.length} Firestore rules cases failed`)
} finally {
  await testEnv.cleanup()
}
