import { createRequire } from 'node:module'
const require = createRequire(new URL('../functions/package.json', import.meta.url))
const admin = require('firebase-admin')
const { getFunctions, httpsCallable } = require('firebase/functions')

admin.initializeApp({ projectId: 'expertcoaching-b91e2' })
const db = admin.firestore()

async function testCheckout() {
  console.log("We can't easily call httpsCallable from admin SDK without client SDK credentials.")
  // We can just check the secrets in Firebase to see if it's configured.
  process.exit(0)
}
testCheckout()
