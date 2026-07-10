// วาด "การ์ดสรุปบิ้ว" ลง canvas เพื่อบันทึก/แชร์เป็นรูป PNG
// - โหลดรูปแบบ CORS (googleusercontent ส่ง ACAO:* ) + query กัน service worker ส่ง opaque cache มา taint canvas
// - ใช้ hbCompute เพื่อได้สเตตัสสุทธิเหมือนหน้ารายละเอียด
import { STAT_META } from '@/config/stats'
import {
  hbCompute, GEAR_LABEL, hbRelicStat, hbRelicTier,
  BUILD_FRONT_MAIN, BUILD_BACK_MAIN, BUILD_SUB_DEF,
} from '@/config/heroBuild'

const W = 760
const P = 28
const FONT = 'Kanit, "Segoe UI", sans-serif'

const C = {
  bg1: '#0f1420', bg2: '#141b2b', panel: '#161b22', panelBorder: '#2a3342',
  text: '#f1f5f9', sub: '#94a3b8', blue: '#93c5fd', accent: '#3b82f6',
  cyan: '#22d3ee', green: '#34d399', dim: '#6b7280',
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function loadImg(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    // query กัน SW ส่ง opaque cache มา (บังคับ fetch ใหม่แบบ CORS)
    img.src = url + (url.includes('?') ? '&' : '?') + 'imgcors=1'
  })
}

function imgCover(ctx, img, x, y, w, h, r) {
  ctx.save()
  roundRect(ctx, x, y, w, h, r)
  ctx.clip()
  if (img) {
    const s = Math.max(w / img.width, h / img.height)
    const dw = img.width * s
    const dh = img.height * s
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
  } else {
    ctx.fillStyle = '#000'
    ctx.fillRect(x, y, w, h)
  }
  ctx.restore()
}

// ป้ายกลม (chip) — คืนความกว้างที่ใช้
function chip(ctx, x, y, text, { bg, color, dot }) {
  ctx.font = `600 15px ${FONT}`
  const padX = dot ? 24 : 12
  const tw = ctx.measureText(text).width
  const w = tw + padX + 12
  const h = 26
  ctx.fillStyle = bg
  roundRect(ctx, x, y, w, h, 8)
  ctx.fill()
  if (dot) {
    ctx.fillStyle = dot
    ctx.beginPath()
    ctx.arc(x + 12, y + h / 2, 4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + padX, y + h / 2 + 1)
  ctx.textBaseline = 'alphabetic'
  return w
}

function ellipsize(ctx, text, maxW) {
  text = String(text || '')
  if (ctx.measureText(text).width <= maxW) return text
  while (text.length && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1)
  return text + '…'
}

const fmt = (n) => (Math.round((n + Number.EPSILON) * 10) / 10).toLocaleString()

// สร้าง canvas การ์ดบิ้ว — คืน HTMLCanvasElement
export async function renderBuildCanvas(build, store) {
  const data = build?.data || {}
  const r = hbCompute(data, store.heroes, store.equipSets)
  const hero = r.hero
  const set = r.set
  const heroImgUrl = data.awakened && hero?.img2 ? hero.img2 : hero?.img

  // เตรียมรูปทั้งหมด
  const [heroImg, setImg] = await Promise.all([loadImg(heroImgUrl), loadImg(set?.img)])

  // รอฟอนต์ Kanit โหลดก่อนวาด (กันตัวหนังสือเพี้ยน)
  try { await document.fonts.ready } catch { /* ignore */ }

  const dpr = 2
  const cv = document.createElement('canvas')
  const ctx = cv.getContext('2d')

  // ---- คำนวณข้อมูลที่จะวาด ----
  const primary = ['hp', 'atk', 'def', 'spd'].map((k) => ({ ...STAT_META[k], value: fmt(r.totals[k] || 0), pct: STAT_META[k].pct }))
  const secondary = ['critRate', 'critDmg', 'weakness', 'acc', 'block', 'resist', 'dmgRed']
    .filter((k) => (r.totals[k] || 0) !== 0)
    .map((k) => ({ ...STAT_META[k], value: fmt(r.totals[k] || 0) }))
  const extra = (r.extra || []).map((e) => ({ label: e.stat, value: `+${e.value}${e.valueType === 'percent' ? '%' : ''}` }))
  const relics = (data.relic || []).map((rl) => {
    const rs = rl && rl.stat ? hbRelicStat(rl.stat) : null
    if (!rs) return null
    const ti = { green: 0, blue: 1, gold: 2 }[rl.tier] ?? 2
    return { label: rs.label, value: rs.vals[ti], color: hbRelicTier(rl.tier)?.color || '#eab308' }
  }).filter(Boolean)
  const pieces = (data.pieces || []).map((p, idx) => {
    const mainO = (idx < 2 ? BUILD_FRONT_MAIN : BUILD_BACK_MAIN).find((x) => x[0] === p?.mainKey)
    const subs = (p?.subs || []).filter((s) => s && s.key).map((s) => `${GEAR_LABEL[s.key] || s.key} +${(BUILD_SUB_DEF[s.key] || 0) * (1 + (parseInt(s.up) || 0))}`)
    return {
      title: (idx < 2 ? 'หน้า' : 'หลัง') + ' #' + (idx < 2 ? idx + 1 : idx - 1),
      main: mainO ? `${mainO[1]} +${mainO[2]}` : '—',
      subs,
    }
  })

  // ---- วัดความสูงรวม ----
  let h = P
  h += 120 + 16 // header
  if (set) h += 40 + 16 // set row
  h += 30 // stats title
  h += 2 * 66 // primary (2 แถว)
  if (secondary.length || extra.length) h += 34 // secondary chips (สมมติ 1 แถวหลัก + wrap)
  const secRows = Math.max(1, Math.ceil((secondary.length + extra.length) / 3))
  h += (secRows - 1) * 34
  if (relics.length) { h += 28 + Math.ceil(relics.length / 2) * 34 }
  h += 30 // pieces title
  h += pieces.length * 58
  h += 34 // footer
  h += P

  cv.width = W * dpr
  cv.height = h * dpr
  ctx.scale(dpr, dpr)

  // ---- พื้นหลัง ----
  const g = ctx.createLinearGradient(0, 0, W, h)
  g.addColorStop(0, C.bg2)
  g.addColorStop(1, C.bg1)
  ctx.fillStyle = g
  roundRect(ctx, 0, 0, W, h, 22)
  ctx.fill()
  ctx.strokeStyle = C.panelBorder
  ctx.lineWidth = 1.5
  roundRect(ctx, 0.75, 0.75, W - 1.5, h - 1.5, 22)
  ctx.stroke()

  let y = P

  // ---- Header ----
  imgCover(ctx, heroImg, P, y, 120, 120, 16)
  ctx.strokeStyle = C.accent
  ctx.lineWidth = 3
  roundRect(ctx, P, y, 120, 120, 16)
  ctx.stroke()
  const tx = P + 120 + 18
  const tw = W - tx - P
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = C.text
  ctx.font = `800 27px ${FONT}`
  ctx.fillText(ellipsize(ctx, build?.name || 'บิ้วไม่มีชื่อ', tw), tx, y + 30)
  ctx.fillStyle = C.blue
  ctx.font = `600 18px ${FONT}`
  ctx.fillText(ellipsize(ctx, hero ? hero.name : '— ไม่พบตัวละคร —', tw), tx, y + 56)
  ctx.fillStyle = C.sub
  ctx.font = `400 14px ${FONT}`
  ctx.fillText(ellipsize(ctx, 'โดย ' + (build?.owner || 'ไม่ระบุ'), tw), tx, y + 78)
  // badges (ดาว/ตื่นรู้/ชนิดโจมตี)
  let bx = tx
  const by = y + 90
  const blue = parseInt(data.blueStars) || 0
  const red = parseInt(data.redStars) || 0
  if (blue) bx += chip(ctx, bx, by, `★ ฟ้า ${blue}`, { bg: 'rgba(56,189,248,.2)', color: '#7dd3fc' }) + 6
  if (red) bx += chip(ctx, bx, by, `★ แดง ${red}`, { bg: 'rgba(239,68,68,.2)', color: '#fca5a5' }) + 6
  if (data.awakened) bx += chip(ctx, bx, by, '🌟 ตื่นรู้', { bg: 'rgba(168,85,247,.22)', color: '#d8b4fe' }) + 6
  if (hero?.attackType) chip(ctx, bx, by, hero.attackType === 'magic' ? 'เวท' : 'กายภาพ', { bg: 'rgba(20,184,166,.2)', color: '#5eead4' })
  y += 120 + 16

  // ---- Set ----
  if (set) {
    imgCover(ctx, setImg, P, y, 40, 40, 9)
    ctx.strokeStyle = C.panelBorder
    ctx.lineWidth = 1
    roundRect(ctx, P, y, 40, 40, 9)
    ctx.stroke()
    ctx.fillStyle = C.cyan
    ctx.font = `700 17px ${FONT}`
    ctx.fillText('🛡️ ' + ellipsize(ctx, set.name, tw - 50), P + 52, y + 26)
    y += 40 + 16
  }

  const sectionTitle = (t) => {
    ctx.fillStyle = C.sub
    ctx.font = `700 14px ${FONT}`
    ctx.fillText(t.toUpperCase(), P, y + 16)
    y += 30
  }

  // ---- สเตตัสสุทธิ (primary) ----
  sectionTitle('📊 สเตตัสสุทธิ')
  const colW = (W - P * 2 - 12) / 2
  primary.forEach((st, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = P + col * (colW + 12)
    const py = y + row * 66
    ctx.fillStyle = C.panel
    roundRect(ctx, x, py, colW, 58, 12)
    ctx.fill()
    ctx.strokeStyle = 'rgba(59,130,246,.33)'
    ctx.lineWidth = 1
    roundRect(ctx, x, py, colW, 58, 12)
    ctx.stroke()
    ctx.font = `400 22px ${FONT}`
    ctx.fillText(st.icon, x + 14, py + 37)
    ctx.fillStyle = C.sub
    ctx.font = `400 13px ${FONT}`
    ctx.fillText(st.label, x + 50, py + 24)
    ctx.fillStyle = C.text
    ctx.font = `800 21px ${FONT}`
    ctx.fillText(st.value + (st.pct ? '%' : ''), x + 50, py + 47)
  })
  y += 2 * 66

  // ---- secondary + extra chips ----
  let cx = P
  const measureChip = (text) => { ctx.font = `600 15px ${FONT}`; return ctx.measureText(text).width + 24 }
  secondary.forEach((st) => {
    const text = `${st.icon} ${st.label} ${st.value}${st.pct ? '%' : ''}`
    const wch = measureChip(text)
    if (cx + wch > W - P) { cx = P; y += 34 }
    chip(ctx, cx, y, text, { bg: C.panel, color: '#cbd5e1' })
    cx += wch + 6
  })
  extra.forEach((ex) => {
    const text = `${ex.label} ${ex.value}`
    const wch = measureChip(text)
    if (cx + wch > W - P) { cx = P; y += 34 }
    chip(ctx, cx, y, text, { bg: 'rgba(51,65,85,.6)', color: '#a7f3d0' })
    cx += wch + 6
  })
  if (secondary.length || extra.length) y += 34

  // ---- ของรัก ----
  if (relics.length) {
    sectionTitle('💎 ของรัก / อุปกรณ์เฉพาะ')
    relics.forEach((rl, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = P + col * (colW + 12)
      const py = y + row * 34
      ctx.fillStyle = C.panel
      roundRect(ctx, x, py, colW, 28, 8)
      ctx.fill()
      ctx.fillStyle = rl.color
      ctx.beginPath()
      ctx.arc(x + 14, py + 14, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#cbd5e1'
      ctx.font = `500 13px ${FONT}`
      ctx.fillText(ellipsize(ctx, rl.label, colW - 70), x + 26, py + 19)
      ctx.fillStyle = rl.color
      ctx.font = `800 14px ${FONT}`
      ctx.textAlign = 'right'
      ctx.fillText('+' + rl.value, x + colW - 12, py + 19)
      ctx.textAlign = 'left'
    })
    y += Math.ceil(relics.length / 2) * 34
  }

  // ---- อุปกรณ์ 4 ชิ้น ----
  sectionTitle('🧩 อุปกรณ์ 4 ชิ้น')
  pieces.forEach((pc) => {
    ctx.fillStyle = C.panel
    roundRect(ctx, P, y, W - P * 2, 50, 10)
    ctx.fill()
    ctx.fillStyle = C.sub
    ctx.font = `700 12px ${FONT}`
    ctx.fillText(pc.title, P + 12, y + 20)
    ctx.fillStyle = '#fde68a'
    ctx.font = `700 14px ${FONT}`
    ctx.fillText(ellipsize(ctx, pc.main, W - P * 2 - 90), P + 60, y + 20)
    ctx.fillStyle = C.dim
    ctx.font = `400 12px ${FONT}`
    ctx.fillText(ellipsize(ctx, pc.subs.join('  ·  ') || '— ไม่มีออฟรอง —', W - P * 2 - 24), P + 12, y + 39)
    y += 58
  })

  // ---- Footer ----
  ctx.fillStyle = C.dim
  ctx.font = `700 14px ${FONT}`
  ctx.fillText('7KDB · Seven Deadly Sins', P, y + 18)

  return cv
}

// ดาวน์โหลด canvas เป็น PNG
export function downloadCanvas(cv, filename) {
  cv.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, 'image/png')
}

// แชร์ผ่าน Web Share API (มือถือ) ถ้าได้ ไม่งั้น fallback ดาวน์โหลด — คืน 'shared' | 'downloaded'
export async function shareCanvas(cv, filename, title) {
  const blob = await new Promise((res) => cv.toBlob(res, 'image/png'))
  if (!blob) throw new Error('สร้างรูปไม่สำเร็จ')
  const file = new File([blob], filename, { type: 'image/png' })
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: title || 'บิ้วตัวละคร', text: title || '' })
      return 'shared'
    } catch (e) {
      if (e && e.name === 'AbortError') return 'shared'
      // ผู้ใช้ยกเลิก/ไม่รองรับ → ดาวน์โหลดแทน
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return 'downloaded'
}
