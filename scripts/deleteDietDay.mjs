import { createRequire } from 'node:module'
const require = createRequire(new URL('../functions/package.json', import.meta.url))
const admin = require('firebase-admin')

admin.initializeApp({ projectId: 'expertcoaching-b91e2' })
const uid = '2GI57LeVLcWtyFqPdhUBlVeDJ202'
const today = new Date().toISOString().slice(0, 10)
admin.firestore().collection('users').doc(uid).collection('dietDays').doc(today).delete().then(() => {
  console.log('Deleted DietDay for today:', today)
  process.exit(0)
}).catch(e => {
  console.error(e)
  process.exit(1)
})
