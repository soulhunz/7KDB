// การตั้งค่า backend — เปลี่ยนที่เดียวจบ
// ตอนนี้ใช้ Google Apps Script (เหมือนเวอร์ชัน HTML เดิม) โดยไม่มีระบบ login
// อนาคตย้ายไป Firestore / Supabase ได้โดยแก้แค่ src/api/index.js

export const BACKEND = 'appsScript' // 'appsScript' | 'firestore' | 'supabase'

// URL ของ Google Apps Script Web App (ดึงมาจากเวอร์ชัน HTML เดิม)
// override ได้ด้วยไฟล์ .env: VITE_SCRIPT_URL=...
export const SCRIPT_URL =
  import.meta.env.VITE_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbyxGb6jb_BotVYjJbPrnZ-SzoxWmHHR8QqP8mtbexQxuV6cP8ylhyobswJW6MdDxS85fQ/exec'

// --- Static snapshot (สำหรับ user อ่านอย่างเดียว) ---
// เปิดไว้ = ตอนโหลด จะลองอ่านไฟล์ static ก่อน (เร็ว/ฟรี/ไม่จำกัดคนพร้อมกัน)
// ถ้าไม่มีไฟล์/ไฟล์เสีย ค่อย fallback ไปดึงสดจาก Apps Script
export const USE_SNAPSHOT = true

// ที่อยู่ไฟล์ snapshot — วางไว้ใน public/data.json จะถูกเสิร์ฟที่ราก (BASE_URL)
// ใช้ BASE_URL เพื่อให้ resolve ถูกทุก route + รองรับ deploy ใต้ sub-path (เช่น GitHub Pages /7KDB/)
export const SNAPSHOT_URL =
  import.meta.env.VITE_SNAPSHOT_URL || import.meta.env.BASE_URL + 'data.json'
