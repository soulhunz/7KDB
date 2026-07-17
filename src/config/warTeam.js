// ค่าตั้งต้นของทีมวอ (อิงตาม 7k-commander)
// front/back = จำนวนช่องแถวหน้า/หลัง (รวม 5 ช่อง)
export const FORMATIONS = [
  { id: 'basic', name: 'รูปแบบพื้นฐาน', sub: 'หน้า 2 – หลัง 3', front: 2, back: 3 },
  { id: 'balanced', name: 'รูปแบบสมดุล', sub: 'หน้า 3 – หลัง 2', front: 3, back: 2 },
  { id: 'attack', name: 'รูปแบบโจมตี', sub: 'หน้า 1 – หลัง 4', front: 1, back: 4 },
  { id: 'defense', name: 'รูปแบบป้องกัน', sub: 'หน้า 4 – หลัง 1', front: 4, back: 1 },
]
export const formationDef = (id) => FORMATIONS.find((f) => f.id === id) || FORMATIONS[0]
export const formationName = (id) => formationDef(id).name

// สกิลที่ใส่ในคอมโบได้ — เฉพาะสกิล 1 / สกิล 2 / สกิลตื่นรู้
export const QUEUE_SIZE = 3
export const QUEUE_SKILLS = [
  { key: 's1', label: 'สกิล 1', color: 'orange' },
  { key: 's2', label: 'สกิล 2', color: 'deep-purple' },
  { key: 'aw', label: 'สกิลตื่นรู้', color: 'amber' },
]
export const skillLabel = (k) => QUEUE_SKILLS.find((s) => s.key === k)?.label || k
export const skillColor = (k) => QUEUE_SKILLS.find((s) => s.key === k)?.color || 'grey'

/** คิวสกิล 1 แบบ = 3 ช่องเสมอ */
export function fixSkillQueue(q) {
  const a = Array.isArray(q) ? q.slice(0, QUEUE_SIZE) : []
  while (a.length < QUEUE_SIZE) a.push(null)
  return a
}
