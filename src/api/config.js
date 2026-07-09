// การตั้งค่า backend — เปลี่ยนที่เดียวจบ
// ตอนนี้ใช้ Google Apps Script (เหมือนเวอร์ชัน HTML เดิม) โดยไม่มีระบบ login
// อนาคตย้ายไป Firestore / Supabase ได้โดยแก้แค่ src/api/index.js

export const BACKEND = 'appsScript' // 'appsScript' | 'firestore' | 'supabase'

// URL ของ Google Apps Script Web App (ดึงมาจากเวอร์ชัน HTML เดิม)
// override ได้ด้วยไฟล์ .env: VITE_SCRIPT_URL=...
export const SCRIPT_URL =
  import.meta.env.VITE_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbyxGb6jb_BotVYjJbPrnZ-SzoxWmHHR8QqP8mtbexQxuV6cP8ylhyobswJW6MdDxS85fQ/exec'
