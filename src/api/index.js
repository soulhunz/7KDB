// จุดสลับ backend เพียงจุดเดียว + กลยุทธ์การอ่าน (snapshot-first)
// อยากย้ายไป Firestore หรือ Supabase ในอนาคต: สร้างไฟล์ adapter ที่มี method
// หน้าตาเหมือน appsScriptApi (getAllData, saveOneItem, deleteOneItem, ...) แล้ว
// เปลี่ยน BACKEND ใน config.js — ส่วนที่เหลือของแอปไม่ต้องแก้เลย
import { BACKEND } from './config'
import { appsScriptApi } from './appsScript'
import { fetchSnapshot } from './snapshot'

const backends = {
  appsScript: appsScriptApi,
  // firestore: firestoreApi,   // TODO: Phase หลัง
  // supabase: supabaseApi,     // TODO: Phase หลัง
}

const backend = backends[BACKEND] || appsScriptApi

export const api = {
  // ส่ง method อื่น ๆ ของ backend ต่อทั้งหมด (save/delete/getMemberInventory ...)
  ...backend,

  // อ่านข้อมูลทั้งหมด: ลอง static snapshot ก่อน (เร็ว/ไม่จำกัดคน) แล้ว fallback ไป backend สด
  async getAllData() {
    const snap = await fetchSnapshot()
    if (snap) return { ...snap, __fromSnapshot: true }
    return backend.getAllData()
  },

  // บังคับดึงสดจาก backend (ข้าม snapshot) — ใช้ตอน admin จะ export snapshot ให้ได้ข้อมูลล่าสุด
  getAllDataLive: () => backend.getAllData(),

  // ⚡ incremental — ไม่ผ่าน snapshot (เป็น delta อยู่แล้ว)
  getUpdates: (versions) => backend.getUpdates(versions),
  getVersions: () => backend.getVersions(),
}
