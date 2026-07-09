// จัดการ static snapshot: อ่านไฟล์ data.json (สำหรับ user) + export (สำหรับ admin)
import { USE_SNAPSHOT, SNAPSHOT_URL } from './config'

// อ่าน snapshot — คืน object ข้อมูล หรือ null ถ้าไม่มี/ไม่ใช่ snapshot จริง
// (ต้องกันกรณี SPA fallback ส่ง index.html กลับมาแทนไฟล์ที่ไม่มีจริง)
export async function fetchSnapshot() {
  if (!USE_SNAPSHOT) return null
  try {
    const res = await fetch(SNAPSHOT_URL, { cache: 'no-store' })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    // ถ้าไฟล์ไม่มีจริง โฮสต์ SPA มักส่ง index.html (text/html) กลับมา → ไม่ใช่ snapshot
    if (!ct.includes('json')) return null
    const data = await res.json()
    // ยอมรับเฉพาะที่หน้าตาเหมือนข้อมูลจริง
    if (data && (data.__snapshot || data.heroes || data.timestamp)) return data
    return null
  } catch {
    return null
  }
}

// สร้างไฟล์ data.json ให้ดาวน์โหลด (admin เอาไปวางใน public/ หรืออัปโหลดขึ้นโฮสต์)
export function downloadSnapshot(rawData) {
  const payload = {
    __snapshot: true,
    __publishedAt: (rawData && rawData.timestamp) || 0,
    ...rawData,
  }
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'data.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
