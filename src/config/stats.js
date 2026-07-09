// ป้ายชื่อ + ไอคอนของสเตตัส (ใช้ใน dialog)
export const STAT_META = {
  hp: { label: 'พลังชีวิต', icon: '❤️' },
  atk: { label: 'พลังโจมตี', icon: '⚔️' },
  def: { label: 'พลังป้องกัน', icon: '🛡️' },
  spd: { label: 'ความเร็ว', icon: '⚡' },
  critRate: { label: 'อัตราคริ', icon: '🎯', pct: true },
  critDmg: { label: 'ดาเมจคริ', icon: '💥', pct: true },
  block: { label: 'บล็อค', icon: '🧱', pct: true },
  dmgRed: { label: 'ลดดาเมจ', icon: '🪖', pct: true },
  acc: { label: 'เข้าเป้า', icon: '📍', pct: true },
  resist: { label: 'ต้านทาน', icon: '🧬', pct: true },
  weakness: { label: 'จุดอ่อน', icon: '💔', pct: true },
}

export const PRIMARY_STATS = ['hp', 'atk', 'def', 'spd']
export const SECONDARY_STATS = ['critRate', 'critDmg', 'block', 'dmgRed', 'acc', 'resist', 'weakness']

// ป้ายชื่อค่าที่สกิล scale ด้วย
export const scaleLabel = (s) =>
  ({ atk: 'พลังโจมตี', def: 'พลังป้องกัน', hp: 'พลังชีวิต', spd: 'ความเร็ว' }[s] || s)

// สีของ effect ในสกิล (ตรงกับหมวดคลังสกิล)
export const EFFECT_COLOR = {
  cc: 'blue',
  dot: 'deep-orange',
  debuff: 'red',
  buff: 'green',
  special: 'purple',
  other: 'grey',
}

// ป้ายสกิลแต่ละช่อง
export const SKILL_LABELS = {
  n: 'โจมตีปกติ',
  p: 'แพสซีฟ',
  s1: 'สกิล 1',
  s2: 'สกิล 2',
  aw: 'สกิลตื่นรู้',
}

// สรุปสกิลจาก skillData (สำหรับฮีโร่ที่ไม่มีคำอธิบาย HTML)
// คืน { scaling: 'xx% พลังโจมตี + yy% พลังป้องกัน', targets, hits, effects: [{label,color}] }
export function summarizeSkill(sd) {
  if (!sd) return null
  const scales = Array.isArray(sd.scales) && sd.scales.length
    ? sd.scales
    : sd.scale
      ? [{ scale: sd.scale, percent: sd.percent }]
      : []
  const scaling = scales
    .filter((s) => s && s.percent)
    .map((s) => `${s.percent}% ${scaleLabel(s.scale)}`)
    .join(' + ')

  const effects = (sd.effects || []).map((e) => {
    const parts = []
    if (e.rate) parts.push(`${e.rate}%`)
    if (e.turn) parts.push(`${e.turn} เทิร์น`)
    const suffix = parts.length ? ` (${parts.join(', ')})` : ''
    return { label: `${e.name || e.type || 'effect'}${suffix}`, color: EFFECT_COLOR[e.type] || 'grey' }
  })

  return {
    scaling,
    targets: sd.targets || 0,
    hits: sd.hits || 0,
    effects,
    hasContent: !!(scaling || effects.length),
  }
}
