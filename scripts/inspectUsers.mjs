import 'dotenv/config'
import { createRequire } from 'node:module'
const require = createRequire(new URL('../functions/package.json', import.meta.url))
const admin = require('firebase-admin')

const projectId = 'expertcoaching-b91e2'
admin.initializeApp({ projectId })
const db = admin.firestore()

async function inspect() {
  const users = await db.collection('users').get()
  console.log('--- USERS IN expertcoaching-b91e2 ---')
  users.docs.forEach(doc => {
    const data = doc.data()
    console.log(`${doc.id} | ${data.email} | ${data.role} | ${typeof data.createdAt === 'string' ? 'ISO' : 'Timestamp'}`)
  })
}

inspect().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); })
