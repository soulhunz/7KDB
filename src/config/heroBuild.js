// เครื่องคำนวณ "บิ้วตัวละคร" — port มาจาก 7k-commander (hbHeroStats / hbCompute)
// อ่านอย่างเดียว: รับ build object + คลังฮีโร่/เซตอุปกรณ์ แล้วคืนสเตตัสสุทธิที่คำนวณแล้ว
// โครงสร้าง build.data: { heroId, setId, blueStars, redStars, awakened, skillUp, relic[4], pieces[4] }

export const STAT_KEYS = ['hp', 'atk', 'def', 'spd', 'critRate', 'critDmg', 'block', 'dmgRed', 'acc', 'resist', 'weakness']

// ออฟหลัก ชิ้นหน้า / ชิ้นหลัง  [key, label, ค่าคงที่]
export const BUILD_FRONT_MAIN = [
  ['weakRate', 'อัตราโจมตีจุดอ่อน', 28], ['critRate', 'อัตราคริติคอล', 24], ['critDmg', 'ความเสียหายคริติคอล', 36],
  ['atkPct', 'พลังโจมตีทั้งหมด (%)', 28], ['atkFlat', 'พลังโจมตีทั้งหมด', 240], ['defPct', 'พลังป้องกัน (%)', 28],
  ['defFlat', 'พลังป้องกัน', 160], ['hpPct', 'HP (%)', 28], ['hpFlat', 'HP', 850], ['acc', 'ผลเข้าเป้า', 30],
]
export const BUILD_BACK_MAIN = [
  ['dmgRed', 'ลดความเสียหายที่ได้รับ', 16], ['block', 'อัตราบล็อก', 24],
  ['atkPct', 'พลังโจมตีทั้งหมด (%)', 28], ['atkFlat', 'พลังโจมตีทั้งหมด', 240], ['defPct', 'พลังป้องกัน (%)', 28],
  ['defFlat', 'พลังป้องกัน', 160], ['hpPct', 'HP (%)', 28], ['hpFlat', 'HP', 850], ['resist', 'ต้านทานผล', 30],
]
// ออฟรอง  [key, label, ค่าเริ่มต้นต่อ 1 ระดับ]
export const BUILD_SUBS = [
  ['atkPct', 'พลังโจมตีทั้งหมด (%)', 5], ['atkFlat', 'พลังโจมตีทั้งหมด', 50],
  ['defPct', 'พลังป้องกัน (%)', 5], ['defFlat', 'พลังป้องกัน', 30],
  ['hpPct', 'HP (%)', 5], ['hpFlat', 'HP', 180], ['spd', 'ความเร็วโจมตี', 4],
  ['critRate', 'อัตราคริติคอล (%)', 4], ['weakRate', 'อัตราโจมตีจุดอ่อน (%)', 5],
  ['acc', 'ผลเข้าเป้า (%)', 5], ['critDmg', 'ความเสียหายคริติคอล (%)', 6],
  ['block', 'อัตราบล็อก (%)', 4], ['resist', 'ต้านทานผล (%)', 5],
]
export const BUILD_SUB_DEF = {}
BUILD_SUBS.forEach((s) => { BUILD_SUB_DEF[s[0]] = s[2] })
// label ของ gear key ทุกตัว (main + sub) ใช้แสดงผล
export const GEAR_LABEL = {}
BUILD_FRONT_MAIN.concat(BUILD_BACK_MAIN, BUILD_SUBS).forEach(([k, label]) => { if (!GEAR_LABEL[k]) GEAR_LABEL[k] = label })

// setBonus statKey → gear key (เฉพาะที่ map เข้าสเตตัสหลักได้)
const BUILD_SETKEY_TO_GEAR = { atk: 'atkPct', def: 'defPct', hp: 'hpPct', acc: 'acc', resist: 'resist', critRate: 'critRate', weakRate: 'weakRate', block: 'block' }

// 💎 ของรัก / อุปกรณ์เฉพาะ — 4 ความสามารถ, แต่ละอันมี 3 ระดับ (เขียว/ฟ้า/ทอง)
export const HB_RELIC_STATS = [
  { key: 'atkPct', label: 'พลังโจมตีทั้งหมด (%)', gear: 'atkPct', vals: [5, 7, 12] },
  { key: 'defPct', label: 'พลังป้องกัน (%)', gear: 'defPct', vals: [5, 7, 12] },
  { key: 'hpPct', label: 'HP (%)', gear: 'hpPct', vals: [5, 7, 12] },
  { key: 'acc', label: 'ผลเข้าเป้า', gear: 'acc', vals: [4, 6, 10] },
  { key: 'resist', label: 'ต้านทานผล', gear: 'resist', vals: [4, 6, 10] },
  { key: 'dmgBoost', label: 'เสริมความเสียหาย', gear: null, vals: [1.6, 2.4, 4] },
  { key: 'crush', label: 'บดขยี้', gear: null, vals: [4.8, 7.2, 12] },
  { key: 'resilience', label: 'ยืดหยุ่น', gear: null, vals: [6, 9, 15] },
  { key: 'recovery', label: 'ฟื้นคืน', gear: null, vals: [2.4, 3.6, 6] },
]
export const HB_RELIC_TIERS = [
  { key: 'green', label: 'เขียว', color: '#22c55e' },
  { key: 'blue', label: 'ฟ้า', color: '#0ea5e9' },
  { key: 'gold', label: 'ทอง', color: '#eab308' },
]
const HB_RELIC_TIER_IDX = { green: 0, blue: 1, gold: 2 }
export const hbRelicStat = (key) => HB_RELIC_STATS.find((x) => x.key === key)
export const hbRelicTier = (key) => HB_RELIC_TIERS.find((x) => x.key === key)

export const HB_SKILL_LABELS = { n: 'สกิลปกติ', s1: 'สกิล 1', s2: 'สกิล 2', p: 'พาสซีฟ', aw: 'ปลุกพลัง' }

// ค่าออฟหลักตาม key (ชิ้นหน้า idx<2 / ชิ้นหลัง)
function hbMainVal(idx, key) {
  if (!key) return 0
  const list = idx < 2 ? BUILD_FRONT_MAIN : BUILD_BACK_MAIN
  const o = list.find((x) => x[0] === key)
  return o ? o[2] : 0
}

// สเตตัสฮีโร่ตามระดับดาว: base 6 ดาวเหลือง + บลูสตาร์ + เรดสตาร์ + พาสซีฟสกิล
function hbHeroStats(hero, blue, red, awakened, skillUp) {
  const out = {}
  const aws = hero && hero.awakenStats
  const useAw = !!awakened && aws && Object.keys(aws).some((k) => parseFloat(aws[k]))
  const base = useAw ? aws : (hero && hero.baseStats ? hero.baseStats : {})
  const gc = hero && hero.growthConfig ? hero.growthConfig : {}
  const percentStats = ['critRate', 'critDmg', 'block', 'dmgRed', 'acc', 'resist', 'weakness']
  const redMul = 1 + (parseInt(red) || 0) * ((parseFloat(gc.redStarPerLevel) || 2) / 100)
  STAT_KEYS.forEach((k) => {
    const b = parseFloat(base[k]) || 0
    out[k] = ['hp', 'atk', 'def'].includes(k) ? b * redMul : b
  })
  // บลูสตาร์ milestone (1–6)
  ;[1, 2, 3, 4, 5, 6].forEach((lvl) => {
    if ((parseInt(blue) || 0) >= lvl) {
      const conf = gc['blue' + lvl]
      if (conf && conf.stat && STAT_KEYS.includes(conf.stat)) {
        const val = parseFloat(conf.percent) || 0
        if (percentStats.includes(conf.stat)) out[conf.stat] = (out[conf.stat] || 0) + val
        else out[conf.stat] = (out[conf.stat] || 0) + (parseFloat(base[conf.stat]) || 0) * (val / 100)
      }
    }
  })
  // พาสซีฟสกิลที่เป็น stat (auto-detect ตามชื่อ) — ผลอัปเกรด/C2/C6 ใช้ได้เมื่อติ๊กอัพสกิล p
  const blueLvl = parseInt(blue) || 0
  const pUp = !!(skillUp && skillUp.p)
  const pe = hero && hero.skillData && hero.skillData.p && hero.skillData.p.effects
  if (Array.isArray(pe)) {
    pe.forEach((eff) => {
      if (!eff || eff.type !== 'stat') return
      let v = eff.val || 0
      if (pUp) {
        if (eff.green_val) v = eff.green_val
        if (blueLvl >= 2 && eff.c2_val) v = eff.c2_val
        if (blueLvl >= 6 && eff.c6_val) v = eff.c6_val
      }
      if (!(v > 0)) return
      const name = String(eff.name || '').toLowerCase()
      let tk = null
      if (name.includes('hp') || name.includes('เลือด')) tk = 'hp'
      else if (name.includes('atk') || name.includes('โจมตี')) tk = 'atk'
      else if (name.includes('def') || name.includes('ป้องกัน')) tk = 'def'
      else if (name.includes('spd') || name.includes('speed') || name.includes('ความเร็ว')) tk = 'spd'
      else if (name.includes('block') || name.includes('บล็อก')) tk = 'block'
      else if (name.includes('crit') || name.includes('คริ')) tk = 'critRate'
      else if (name.includes('weak') || name.includes('จุดอ่อน')) tk = 'weakness'
      else if (name.includes('acc') || name.includes('แม่น')) tk = 'acc'
      else if (name.includes('resist') || name.includes('ต้าน')) tk = 'resist'
      if (!tk) return
      if (percentStats.includes(tk)) out[tk] = (out[tk] || 0) + v
      else out[tk] = (out[tk] || 0) + (parseFloat(base[tk]) || 0) * (v / 100)
    })
  }
  return out
}

// คำนวณสเตตัสสุทธิ = base + (ออฟหลัก/รอง 4 ชิ้น) + โบนัสเซต 4 ชิ้น + ของรัก
// รับ build.data + คลัง heroes/equipSets → คืน { hero, base, totals, effects, extra, set }
export function hbCompute(data, heroes, equipSets) {
  const d = data || {}
  const hero = (heroes || []).find((h) => String(h.id) === String(d.heroId)) || null
  const base = hero ? hbHeroStats(hero, d.blueStars || 0, d.redStars || 0, d.awakened, d.skillUp) : {}
  const acc = {}
  const add = (k, v) => { if (!k || !v) return; acc[k] = (acc[k] || 0) + v }
  const set = d.setId ? (equipSets || []).find((x) => String(x.id) === String(d.setId)) : null
  const ms = set && set.mainStats ? set.mainStats : {}
  const pieces = Array.isArray(d.pieces) ? d.pieces : []
  pieces.forEach((p, idx) => {
    if (!p) return
    // ออฟหลักของเซต ต่อชิ้น → หน้า ATK, หลัง DEF + HP (flat)
    if (idx < 2) { if (ms.atk) add('atkFlat', parseFloat(ms.atk) || 0) }
    else { if (ms.def) add('defFlat', parseFloat(ms.def) || 0); if (ms.hp) add('hpFlat', parseFloat(ms.hp) || 0) }
    add(p.mainKey, hbMainVal(idx, p.mainKey))
    ;(p.subs || []).forEach((s) => {
      if (s && s.key) { const de = BUILD_SUB_DEF[s.key] || 0; add(s.key, de * (1 + (parseInt(s.up) || 0))) }
    })
  })
  const effects = []
  const extraMap = {}
  if (set && set.setBonus) {
    // คิดเฉพาะเซต 4 ชิ้น (หน้าบิ้วใส่ครบ 4 → เซต 4 รวมค่าชุดเต็มไว้แล้ว)
    ;(set.setBonus.s4 || []).forEach((b) => {
      if (b.kind === 'effect') { effects.push(b); return }
      const statKey = b.statKey || null
      const gk = BUILD_SETKEY_TO_GEAR[statKey]
      if (gk && b.value) { add(gk, b.value); return }
      if (b.value) {
        const key = statKey || b.stat
        if (!extraMap[key]) extraMap[key] = { stat: b.stat, value: 0, valueType: b.valueType }
        extraMap[key].value += b.value
      }
    })
  }
  // 💎 ของรัก / อุปกรณ์เฉพาะ (4 ความสามารถ)
  ;(d.relic || []).forEach((r) => {
    if (!r || !r.stat) return
    const rs = hbRelicStat(r.stat)
    const ti = HB_RELIC_TIER_IDX[r.tier]
    if (!rs || ti == null) return
    const v = rs.vals[ti] || 0
    if (!v) return
    if (rs.gear) add(rs.gear, v)
    else {
      if (!extraMap[rs.key]) extraMap[rs.key] = { stat: rs.label, value: 0, valueType: 'percent' }
      extraMap[rs.key].value += v
    }
  })
  const extra = Object.keys(extraMap).map((k) => extraMap[k])
  const num = (k) => parseFloat(base[k]) || 0
  const totals = {
    atk: Math.round(num('atk') * (1 + (acc.atkPct || 0) / 100) + (acc.atkFlat || 0)),
    def: Math.round(num('def') * (1 + (acc.defPct || 0) / 100) + (acc.defFlat || 0)),
    hp: Math.round(num('hp') * (1 + (acc.hpPct || 0) / 100) + (acc.hpFlat || 0)),
    spd: num('spd') + (acc.spd || 0),
    critRate: num('critRate') + (acc.critRate || 0),
    critDmg: num('critDmg') + (acc.critDmg || 0),
    weakness: num('weakness') + (acc.weakRate || 0),
    acc: num('acc') + (acc.acc || 0),
    block: num('block') + (acc.block || 0),
    resist: num('resist') + (acc.resist || 0),
    dmgRed: num('dmgRed') + (acc.dmgRed || 0),
  }
  return { hero, base, totals, effects, extra, set }
}
