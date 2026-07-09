// ลำดับความหายาก (น้อย = มาก่อน): โบราณ → ตำนาน SP → ตำนาน → หายาก
export const RARITY_ORDER = ['โบราณ', 'ตำนาน SP', 'ตำนาน', 'หายาก']

const rank = (rarity) => {
  const i = RARITY_ORDER.indexOf(rarity)
  return i === -1 ? RARITY_ORDER.length : i // rarity ที่ไม่รู้จัก → ไปท้ายสุด
}

// เรียงตามความหายากก่อน แล้วตามด้วยชื่อ (ภาษาไทย) — คืน array ใหม่ ไม่แก้ต้นฉบับ
export function sortByRarityThenName(list) {
  return [...list].sort((a, b) => {
    const dr = rank(a.rarity) - rank(b.rarity)
    if (dr !== 0) return dr
    return String(a.name || '').localeCompare(String(b.name || ''), 'th')
  })
}

// ธีมสีตามความหายาก (ใช้ทำ banner/ขอบใน dialog)
export const RARITY_THEME = {
  โบราณ: { color: '#ef4444', grad: 'linear-gradient(135deg, rgba(127,29,29,0.95), rgba(17,20,28,0.75))' },
  'ตำนาน SP': { color: '#f59e0b', grad: 'linear-gradient(135deg, rgba(146,64,14,0.95), rgba(17,20,28,0.75))' },
  ตำนาน: { color: '#a855f7', grad: 'linear-gradient(135deg, rgba(88,28,135,0.95), rgba(17,20,28,0.75))' },
  หายาก: { color: '#3b82f6', grad: 'linear-gradient(135deg, rgba(30,58,138,0.95), rgba(17,20,28,0.75))' },
}
const DEFAULT_THEME = { color: '#6b7280', grad: 'linear-gradient(135deg, rgba(55,65,81,0.95), rgba(17,20,28,0.75))' }
export const rarityThemeOf = (r) => RARITY_THEME[r] || DEFAULT_THEME

// สร้างธีมจากสีที่กำหนดเอง (เช่น สีเกรดแหวน) ให้หน้าตาเข้าชุดกับ banner
export function themeFromColor(color) {
  return { color, grad: `linear-gradient(135deg, ${color}dd, rgba(17,20,28,0.8))` }
}
