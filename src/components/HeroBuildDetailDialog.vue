<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useDataStore } from '@/stores/dataStore'
import { STAT_META } from '@/config/stats'
import {
  hbCompute, GEAR_LABEL, hbRelicStat, hbRelicTier, HB_SKILL_LABELS,
  BUILD_FRONT_MAIN, BUILD_BACK_MAIN, BUILD_SUB_DEF,
} from '@/config/heroBuild'
import { renderBuildCanvas, downloadCanvas, shareCanvas } from '@/utils/buildImage'

const props = defineProps({
  modelValue: Boolean,
  build: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue'])
const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const store = useDataStore()
const $q = useQuasar()
const FALLBACK = 'https://placehold.co/160x160/0d1117/475569?text=%3F'
const onErr = (e) => (e.target.src = FALLBACK)

const THEME = '#3b82f6'

// ---- แชร์/บันทึกเป็นรูป ----
const imgBusy = ref(false)
const fileName = computed(() => {
  const base = (props.build?.name || 'build').replace(/[\\/:*?"<>|]+/g, '').trim() || 'build'
  return `7kdb-${base}.png`
})
async function saveImage() {
  if (imgBusy.value) return
  imgBusy.value = true
  try {
    const cv = await renderBuildCanvas(props.build, store)
    downloadCanvas(cv, fileName.value)
    $q.notify({ type: 'positive', message: '📷 บันทึกรูปแล้ว', timeout: 1500 })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'สร้างรูปไม่สำเร็จ: ' + (e?.message || e) })
  } finally {
    imgBusy.value = false
  }
}
async function shareImage() {
  if (imgBusy.value) return
  imgBusy.value = true
  try {
    const cv = await renderBuildCanvas(props.build, store)
    const res = await shareCanvas(cv, fileName.value, props.build?.name || 'บิ้วตัวละคร')
    if (res === 'downloaded') $q.notify({ type: 'info', message: 'อุปกรณ์นี้แชร์รูปไม่ได้ — ดาวน์โหลดให้แทนแล้ว', timeout: 2500 })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'แชร์รูปไม่สำเร็จ: ' + (e?.message || e) })
  } finally {
    imgBusy.value = false
  }
}

const data = computed(() => props.build?.data || {})
const result = computed(() => hbCompute(data.value, store.heroes, store.equipSets))
const hero = computed(() => result.value.hero)
const set = computed(() => result.value.set)

const heroImg = computed(() => {
  const h = hero.value
  if (!h) return ''
  return data.value.awakened && h.img2 ? h.img2 : h.img
})

// รูปทั้งหมดที่มีของตัวละคร (ปกติ / ตื่นรู้ / ของรัก) — กดสลับรูปหลักได้
const heroImages = computed(() => {
  const h = hero.value
  if (!h) return []
  return [
    { label: 'ปกติ', src: h.img },
    { label: 'ตื่นรู้', src: h.img2 },
    { label: 'ของรัก', src: h.accImg },
  ].filter((x) => x.src && String(x.src).trim())
})
const heroAcc = computed(() => hero.value?.accImg || '')

const viewImg = ref(null)
watch(() => props.build, () => { viewImg.value = null })
const mainImg = computed(() => viewImg.value || heroImg.value)

const PRIMARY = ['hp', 'atk', 'def', 'spd']
const SECONDARY = ['critRate', 'critDmg', 'weakness', 'acc', 'block', 'resist', 'dmgRed']
const fmt = (n) => (Math.round((n + Number.EPSILON) * 10) / 10).toLocaleString()
const primaryStats = computed(() =>
  PRIMARY.map((k) => ({ key: k, ...STAT_META[k], value: fmt(result.value.totals[k] || 0) })),
)
const secondaryStats = computed(() =>
  SECONDARY.filter((k) => (result.value.totals[k] || 0) !== 0).map((k) => ({
    key: k, ...STAT_META[k], value: fmt(result.value.totals[k] || 0),
  })),
)

// รวม stat หลัก + รอง สำหรับตาราง 2 คอลัมน์
const allStats = computed(() => [...primaryStats.value, ...secondaryStats.value])

const extraStats = computed(() => result.value.extra || [])
const effects = computed(() => result.value.effects || [])

const relics = computed(() =>
  (data.value.relic || []).map((r) => {
    const rs = r && r.stat ? hbRelicStat(r.stat) : null
    const t = hbRelicTier(r?.tier)
    if (!rs) return null
    const ti = { green: 0, blue: 1, gold: 2 }[r.tier] ?? 2
    return { label: rs.label, value: rs.vals[ti], tier: t?.label || '', color: t?.color || '#eab308' }
  }).filter(Boolean),
)

// สกิลทั้งหมด (มีรูป) + ไฮไลต์ตัวที่อัป
const skillCells = computed(() => {
  const h = hero.value
  if (!h) return []
  const su = data.value.skillUp || {}
  return [['n', 'ปกติ'], ['s1', 'สกิล 1'], ['s2', 'สกิล 2'], ['p', 'พาสซีฟ'], ['aw', 'ปลุกพลัง']]
    .filter(([k]) => k !== 'aw' || data.value.awakened)
    .map(([k, label]) => ({ k, label, img: h.skillData?.[k]?.img || '', up: !!su[k] }))
})

function pieceImg(idx) {
  const s = set.value
  if (!s) return ''
  if (idx < 2) {
    const magic = hero.value && hero.value.attackType === 'magic'
    return (magic ? s.imgFrontMagic : s.imgFrontPhysical) || s.imgFrontPhysical || s.imgFrontMagic || ''
  }
  return s.imgBack || ''
}
function mainVal(idx, key) {
  if (!key) return 0
  const o = (idx < 2 ? BUILD_FRONT_MAIN : BUILD_BACK_MAIN).find((x) => x[0] === key)
  return o ? o[2] : 0
}
const pieces = computed(() =>
  (data.value.pieces || []).map((p, idx) => ({
    idx,
    title: (idx < 2 ? 'ชิ้นหน้า' : 'ชิ้นหลัง') + ' #' + (idx < 2 ? idx + 1 : idx - 1),
    img: pieceImg(idx),
    mainKey: p?.mainKey || '',
    mainLabel: GEAR_LABEL[p?.mainKey] || '—',
    mainVal: mainVal(idx, p?.mainKey),
    subs: (p?.subs || []).filter((s) => s && s.key).map((s) => ({
      label: GEAR_LABEL[s.key] || s.key,
      value: (BUILD_SUB_DEF[s.key] || 0) * (1 + (parseInt(s.up) || 0)),
      up: parseInt(s.up) || 0,
    })),
  })),
)

const starsBlue = computed(() => parseInt(data.value.blueStars) || 0)
const starsRed = computed(() => parseInt(data.value.redStars) || 0)
</script>

<template>
  <q-dialog v-model="show" transition-show="jump-up" transition-hide="jump-down">
    <q-card v-if="build" class="hb-card">
      <!-- ===== BANNER ===== -->
      <div class="hb-banner">
        <div class="hb-actions">
          <q-btn round dense unelevated color="green-6" icon="image" size="sm" :loading="imgBusy" @click="saveImage">
            <q-tooltip>บันทึกเป็นรูป</q-tooltip>
          </q-btn>
          <q-btn round dense unelevated color="blue-6" icon="ios_share" size="sm" :loading="imgBusy" @click="shareImage">
            <q-tooltip>แชร์เป็นรูป</q-tooltip>
          </q-btn>
        </div>
        <q-btn flat round dense icon="close" color="white" class="hb-close" v-close-popup />
        <div class="hb-media">
          <div class="hb-portrait" :style="{ boxShadow: `0 0 22px ${THEME}66` }">
            <img :src="mainImg || FALLBACK" @error="onErr" />
          </div>
          <div v-if="heroImages.length > 1" class="hb-thumbs">
            <button
              v-for="im in heroImages"
              :key="im.label"
              class="hb-thumb"
              :class="{ active: (viewImg || heroImg) === im.src }"
              @click="viewImg = im.src"
            >
              <img :src="im.src" @error="onErr" />
              <q-tooltip>{{ im.label }}</q-tooltip>
            </button>
          </div>
        </div>
        <div class="hb-info">
          <div class="hb-name">{{ build.name || 'บิ้วไม่มีชื่อ' }}</div>
          <div class="hb-hero">{{ hero ? hero.name : '— ไม่พบตัวละคร —' }}</div>
          <div class="hb-owner">โดย {{ build.owner || 'ไม่ระบุ' }}</div>
          <div class="row items-center q-gutter-xs q-mt-sm">
            <q-badge v-if="starsBlue" color="light-blue-6" :label="`⭐ ฟ้า ${starsBlue}`" />
            <q-badge v-if="starsRed" color="red-6" :label="`⭐ แดง ${starsRed}`" />
            <q-badge v-if="data.awakened" color="deep-purple-5" label="🌟 ตื่นรู้" />
            <q-badge v-if="hero && hero.attackType" color="teal" :label="hero.attackType === 'magic' ? 'เวท' : 'กายภาพ'" />
          </div>
        </div>
      </div>

      <!-- ===== BODY ===== -->
      <q-card-section class="hb-body scroll">
        <div class="hb-title">📊 สเตตัสสุทธิ</div>
        <div class="hb-stat-table q-mb-sm">
          <div
            v-for="(st, i) in allStats"
            :key="st.key"
            class="hb-stat-cell"
            :class="{ primary: i < primaryStats.length }"
          >
            <span class="hb-stat-ico">{{ st.icon }}</span>
            <span class="hb-stat-lbl">{{ st.label }}</span>
            <span class="hb-stat-val">{{ st.value }}{{ st.pct ? '%' : '' }}</span>
          </div>
        </div>
        <div v-if="extraStats.length || effects.length" class="row q-gutter-xs q-mb-sm">
          <q-badge v-for="(ex, i) in extraStats" :key="'x' + i" color="blue-grey-7"
            :label="`${ex.stat} +${ex.value}${ex.valueType === 'percent' ? '%' : ''}`" />
          <q-badge v-for="(ef, i) in effects" :key="'e' + i" color="purple-6" :label="`⚡ ${ef.stat}`" />
        </div>

        <template v-if="relics.length || heroAcc">
          <div class="hb-title">💎 ของรัก / อุปกรณ์เฉพาะ</div>
          <div class="hb-relic-wrap q-mb-sm">
            <img v-if="heroAcc" :src="heroAcc" @error="onErr" class="hb-acc-img" />
            <div v-if="relics.length" class="hb-relic-grid col">
              <div v-for="(r, i) in relics" :key="i" class="hb-relic" :style="{ borderColor: r.color + '77' }">
                <span class="hb-relic-dot" :style="{ background: r.color }" />
                <span class="hb-relic-lbl">{{ r.label }}</span>
                <span class="hb-relic-val" :style="{ color: r.color }">+{{ r.value }}</span>
              </div>
            </div>
          </div>
        </template>

        <template v-if="skillCells.length">
          <div class="hb-title">⚡ สกิล <span class="hb-skill-hint">(เขียว = อัป)</span></div>
          <div class="hb-skill-grid q-mb-sm">
            <div v-for="s in skillCells" :key="s.k" class="hb-skill-cell">
              <div class="hb-skill-img" :class="{ up: s.up }">
                <img v-if="s.img" :src="s.img" @error="onErr" />
                <span v-else class="hb-skill-txt">{{ s.label }}</span>
                <q-icon v-if="s.up" name="arrow_upward" class="hb-skill-up" />
              </div>
              <span class="hb-skill-lbl" :class="{ up: s.up }">{{ s.label }}</span>
            </div>
          </div>
        </template>

        <div class="hb-title">🧩 อุปกรณ์ 4 ชิ้น</div>
        <div class="hb-piece-grid">
          <div v-for="p in pieces" :key="p.idx" class="hb-piece">
            <div class="hb-piece-head">
              <img v-if="p.img" :src="p.img" @error="onErr" class="hb-piece-img" />
              <div v-else class="hb-piece-img hb-piece-img-empty">🧩</div>
              <div class="min-w-0">
                <div class="hb-piece-title">{{ p.title }}</div>
                <div class="hb-piece-main">{{ p.mainLabel }}<span v-if="p.mainVal"> +{{ p.mainVal }}</span></div>
              </div>
            </div>
            <div v-if="p.subs.length" class="hb-sub-list">
              <div v-for="(s, si) in p.subs" :key="si" class="hb-sub">
                <span class="hb-sub-lbl">{{ s.label }}</span>
                <span class="hb-sub-val">+{{ s.value }}<span v-if="s.up" class="hb-sub-up"> ·{{ s.up }}</span></span>
              </div>
            </div>
            <div v-else class="hb-sub-empty">— ไม่มีออฟรอง —</div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.hb-card {
  width: 92vw;
  max-width: 620px;
  height: 84vh;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  background: #0f1420;
  border-radius: 16px;
  overflow: hidden;
}
.min-w-0 { min-width: 0; }
.hb-banner {
  position: relative;
  display: flex;
  gap: 16px;
  padding: 20px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #1e3a5f 0%, #0f1420 100%);
}
.hb-close { position: absolute; top: 6px; right: 6px; z-index: 2; }
.hb-actions { position: absolute; top: 10px; right: 48px; z-index: 2; display: flex; gap: 8px; }
.hb-media { display: flex; flex-direction: column; gap: 8px; align-items: center; flex-shrink: 0; }
.hb-portrait {
  width: 120px;
  height: 120px;
  border-radius: 16px;
  border: 3px solid #3b82f6;
  overflow: hidden;
  background: #000;
  flex-shrink: 0;
}
.hb-portrait img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hb-thumbs { display: flex; gap: 6px; }
.hb-thumb {
  width: 34px; height: 34px; padding: 0; border-radius: 7px; overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.25); background: #000; cursor: pointer;
  transition: transform 0.1s ease;
}
.hb-thumb:hover { transform: translateY(-2px); }
.hb-thumb.active { border-color: #60a5fa; }
.hb-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hb-info { flex: 1; min-width: 0; padding-right: 28px; }
.hb-name { font-size: 1.35rem; font-weight: 800; color: #fff; line-height: 1.2; word-break: break-word; }
.hb-hero { font-size: 0.9rem; color: #93c5fd; margin-top: 2px; }
.hb-owner { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }
.hb-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 16px 18px 22px; }
.hb-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 16px 0 8px;
}
.hb-title:first-child { margin-top: 0; }
/* ตารางสเตตัส 2 คอลัมน์ */
.hb-stat-table {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid #262d38;
  border-radius: 10px;
  overflow: hidden;
}
.hb-stat-cell {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 12px;
  border-bottom: 1px solid #1c2430;
}
.hb-stat-cell:nth-child(odd) { border-right: 1px solid #1c2430; }
.hb-stat-cell.primary { background: #12203a; }
.hb-stat-ico { font-size: 1rem; width: 20px; text-align: center; flex-shrink: 0; }
.hb-stat-lbl { flex: 1; font-size: 0.82rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hb-stat-val { font-weight: 800; color: #f1f5f9; font-size: 0.9rem; white-space: nowrap; }

/* ของรัก: รูป + relic stats */
.hb-relic-wrap { display: flex; gap: 12px; align-items: flex-start; }
.hb-acc-img {
  width: 88px; height: 88px; border-radius: 12px; object-fit: cover;
  background: #000; border: 2px solid #7c3aed77; flex-shrink: 0;
}
/* สกิล (มีรูป) */
.hb-skill-hint { font-size: 0.68rem; color: #4ade80; font-weight: 400; text-transform: none; letter-spacing: 0; }
.hb-skill-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
.hb-skill-cell { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.hb-skill-img {
  position: relative; width: 100%; aspect-ratio: 1; border-radius: 10px; overflow: hidden;
  border: 2px solid #2a3441; background: #000;
  display: flex; align-items: center; justify-content: center;
}
.hb-skill-img.up { border-color: #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.4); }
.hb-skill-img img { width: 100%; height: 100%; object-fit: cover; }
.hb-skill-txt { font-size: 0.55rem; color: #6b7280; font-weight: 700; text-align: center; }
.hb-skill-up {
  position: absolute; top: 2px; right: 2px; font-size: 13px; color: #fff;
  background: #22c55e; border-radius: 50%; padding: 1px;
}
.hb-skill-lbl { font-size: 0.62rem; color: #94a3b8; text-align: center; }
.hb-skill-lbl.up { color: #4ade80; font-weight: 700; }

.hb-relic-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.hb-relic {
  display: flex; align-items: center; gap: 8px;
  background: #161b22; border: 1px solid; border-radius: 9px; padding: 8px 11px;
}
.hb-relic-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.hb-relic-lbl { flex: 1; font-size: 0.78rem; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hb-relic-val { font-weight: 800; font-size: 0.85rem; }
.hb-piece-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.hb-piece { background: #161b22; border: 1px solid #262d38; border-radius: 12px; padding: 11px; }
.hb-piece-head { display: flex; gap: 10px; align-items: center; }
.hb-piece-img {
  width: 46px; height: 46px; border-radius: 9px; object-fit: cover;
  background: #000; border: 1px solid #2a3441; flex-shrink: 0;
}
.hb-piece-img-empty { display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
.hb-piece-title { font-size: 0.72rem; color: #94a3b8; }
.hb-piece-main { font-size: 0.82rem; font-weight: 700; color: #f1f5f9; }
.hb-sub-list { margin-top: 9px; display: flex; flex-direction: column; gap: 4px; }
.hb-sub { display: flex; justify-content: space-between; font-size: 0.75rem; }
.hb-sub-lbl { color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hb-sub-val { color: #cbd5e1; font-weight: 700; white-space: nowrap; }
.hb-sub-up { color: #22c55e; }
.hb-sub-empty { margin-top: 9px; font-size: 0.72rem; color: #4b5563; }
</style>
