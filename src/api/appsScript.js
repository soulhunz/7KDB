// Adapter สำหรับ Google Apps Script backend
// หุ้ม action ต่าง ๆ ที่เวอร์ชัน HTML เดิมใช้ไว้ในรูปแบบ function ที่เรียกง่าย
// ไม่มี login/permission แล้ว — ทุกคนเข้าถึงข้อมูลได้เต็มที่
import { SCRIPT_URL } from './config'

// Apps Script Web App รับ POST แบบ text/plain (เลี่ยง CORS preflight)
async function post(payload) {
  if (!SCRIPT_URL) throw new Error('ยังไม่ได้ตั้งค่า SCRIPT_URL')
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Apps Script ตอบกลับ HTTP ${res.status}`)
  return res.json()
}

// การเขียนบางอย่าง (เช่นบันทึกทับหลายรายการ) เดิมใช้ mode:'no-cors' แบบ fire-and-forget
async function postNoCors(payload) {
  if (!SCRIPT_URL) return
  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    console.warn('postNoCors failed (fire-and-forget):', e)
  }
}

export const appsScriptApi = {
  // โหลดข้อมูลทั้งหมดในคราวเดียว (heroes, pets, rings, teams, guilds, ...)
  getAllData: () => post({ action: 'getAllData' }),

  // ⚡ incremental: ส่งเวอร์ชันที่ client มี → ได้เฉพาะ category ที่เปลี่ยน { versions, changed }
  getUpdates: (versions) => post({ action: 'getUpdates', versions: versions || {} }),
  // เวอร์ชันปัจจุบันของทุก category (เล็กมาก) — ไว้ seed baseline
  getVersions: () => post({ action: 'getVersions' }).then((r) => r.versions || {}),

  // เข้าสู่ระบบ — ตรวจ username/password ที่ Users sheet, คืน { status, user }
  login: (username, password) => post({ action: 'login', username, password }),

  // เช็คระดับสมาชิกจากอีเมล (sheet Premium) → 'premium' | 'vip' | 'free'
  getUserTier: (email) => post({ action: 'getUserTier', email }).then((r) => r.tier || 'free'),

  // ⚔️ ทีมบุก/ทีมรับ (แชร์ + สิทธิ์ตาม email)
  getWarTeams: (email) => post({ action: 'getWarTeams', email }).then((r) => r.teams || []),
  saveWarTeam: (team, email) => post({ action: 'saveWarTeam', team, email }),
  deleteWarTeam: (id, email) => post({ action: 'deleteWarTeam', id, email }),

  // บันทึก/ลบ รายการเดียว (category = 'heroes' | 'pets' | 'rings' | ...)
  saveOneItem: (category, item) => post({ action: 'saveOneItem', category, item }),
  deleteOneItem: (category, id) => post({ action: 'deleteOneItem', category, id }),

  // คลังสกิล / รูปแบบศัตรู (บันทึกทีละหลายรายการ)
  saveManySkillLib: (items) => postNoCors({ action: 'saveManySkillLib', items }),
  saveManyEnemyPatterns: (items) => post({ action: 'saveManyEnemyPatterns', items }),
  deleteOneEnemyPattern: (id) => post({ action: 'deleteOneEnemyPattern', id }),

  // ข้อมูลลูกกิล (inventory ต่อสมาชิก)
  getMemberInventory: (guildId, memberId) =>
    post({ action: 'getMemberInventory', guildId, memberId }),
  saveMemberInventory: (payload) =>
    post({ action: 'saveMemberInventory', ...payload }),

  // ทีมที่แชร์ / แกลเลอรี
  getAllSharedTeams: () => post({ action: 'getAllSharedTeams' }),
  getSharedTeam: (id) => post({ action: 'getSharedTeam', id }),

  // ฟอร์มรับสมัคร
  submitApplication: (payload) => post({ action: 'submitApplication', ...payload }),
}
