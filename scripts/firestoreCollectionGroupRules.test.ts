import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore'

type Role = 'Admin' | 'Mentor' | 'Aluno'
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
  })

  const adminDb = testEnv.authenticatedContext('adminUid').firestore()
  const mentorDb = testEnv.authenticatedContext('mentorUid').firestore()
  const studentDb = testEnv.authenticatedContext('studentA').firestore()

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

  console.table(results)
  const failures = results.filter((item) => item.status === 'FAIL')
  assert.equal(failures.length, 0, `${failures.length} Firestore rules cases failed`)
} finally {
  await testEnv.cleanup()
}
