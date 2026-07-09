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
