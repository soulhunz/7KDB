// จุดสลับ backend เพียงจุดเดียว
// อยากย้ายไป Firestore หรือ Supabase ในอนาคต: สร้างไฟล์ adapter ที่มี method
// หน้าตาเหมือน appsScriptApi (getAllData, saveOneItem, deleteOneItem, ...) แล้ว
// เปลี่ยน BACKEND ใน config.js — ส่วนที่เหลือของแอปไม่ต้องแก้เลย
import { BACKEND } from './config'
import { appsScriptApi } from './appsScript'

const backends = {
  appsScript: appsScriptApi,
  // firestore: firestoreApi,   // TODO: Phase หลัง
  // supabase: supabaseApi,     // TODO: Phase หลัง
}

export const api = backends[BACKEND] || appsScriptApi
