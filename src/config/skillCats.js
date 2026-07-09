// หมวดหมู่คลังสกิล (อิงตาม SKILL_LIB_CATS ในเวอร์ชัน HTML เดิม)
export const SKILL_LIB_CATS = [
  { key: 'cc', label: '❄️ ควบคุม (CC)', color: 'blue' },
  { key: 'dot', label: '🔥 ดาเมจต่อเนื่อง', color: 'deep-orange' },
  { key: 'debuff', label: '⬇️ ลดค่า (Debuff)', color: 'red' },
  { key: 'buff', label: '⬆️ เพิ่มค่า (Buff)', color: 'green' },
  { key: 'special', label: '✨ พิเศษ', color: 'purple' },
  { key: 'other', label: '🔹 อื่นๆ', color: 'grey' },
]

const byKey = Object.fromEntries(SKILL_LIB_CATS.map((c) => [c.key, c]))
export const skillCatLabel = (key) => byKey[key]?.label || byKey.other.label
export const skillCatColor = (key) => byKey[key]?.color || 'grey'
