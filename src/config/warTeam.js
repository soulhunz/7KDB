// ค่าตั้งต้นของทีมวอ (อิงตาม 7k-commander)
export const FORMATIONS = [
  { id: 'basic', name: 'Basic (B3/F2)' },
  { id: 'balanced', name: 'Balance (B2/F3)' },
  { id: 'attack', name: 'Attack (B4/F1)' },
  { id: 'defense', name: 'Defense (B1/F4)' },
]
export const formationName = (id) => FORMATIONS.find((f) => f.id === id)?.name || id || '—'

// สกิลที่ใส่ในคิวได้ (ลำดับการปล่อยสกิล)
export const QUEUE_SKILLS = [
  { key: 'n', label: 'ปกติ', color: 'blue-grey' },
  { key: 's1', label: 'สกิล 1', color: 'orange' },
  { key: 's2', label: 'สกิล 2', color: 'deep-purple' },
  { key: 'p', label: 'พาสซีฟ', color: 'teal' },
]
export const skillLabel = (k) => QUEUE_SKILLS.find((s) => s.key === k)?.label || k
export const skillColor = (k) => QUEUE_SKILLS.find((s) => s.key === k)?.color || 'grey'
