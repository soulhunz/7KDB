<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import HeroBuildPickerDialog from '@/components/HeroBuildPickerDialog.vue'
import {
  hbCompute, BUILD_SHOW, BUILD_FRONT_MAIN, BUILD_BACK_MAIN, BUILD_SUBS, BUILD_SUB_DEF,
  buildIsPct, MAX_SUB_UP, HB_RELIC_STATS, HB_RELIC_TIERS, hbRelicStat, hbMainVal, HB_SKILL_LABELS,
} from '@/config/heroBuild'

// props.build เป็น object reactive ที่ parent เป็นเจ้าของ — editor แก้ค่าในตัวมันตรง ๆ
const props = defineProps({ build: { type: Object, required: true } })

const store = useDataStore()
const FALLBACK = 'https://placehold.co/96x96/0d1117/475569?text=%3F'
const onErr = (e) => (e.target.src = FALLBACK)

const c = computed(() => hbCompute(props.build, store.heroes, store.equipSets))
const hero = computed(() => c.value.hero)
const set = computed(() => c.value.set)
const hasAwaken = computed(() => {
  const h = hero.value
  return !!(h && h.img2 && String(h.img2).trim())
})

const round1 = (n) => Math.round((parseFloat(n) || 0) * 10) / 10
// แถวสเตตัส base → รวม
const statRows = computed(() =>
  BUILD_SHOW.map(([k, label, pct]) => {
    const b = round1(c.value.base[k])
    const t = round1(c.value.totals[k])
    return { key: k, label, suf: pct ? '%' : '', base: b, total: t, up: t > b }
  }),
)
const extraRows = computed(() => c.value.extra || [])

// ---- picker ----
const showPicker = ref(false)
const pickerMode = ref('hero')
function openHeroPicker() { pickerMode.value = 'hero'; showPicker.value = true }
function openSetPicker() { pickerMode.value = 'set'; showPicker.value = true }
function onPick(id) {
  if (pickerMode.value === 'hero') {
    props.build.heroId = id || null
    if (!id) props.build.awakened = false
  } else {
    props.build.setId = id || ''
  }
}

// ---- ดาว / ปลุกพลัง ----
function setBlue(n) { props.build.blueStars = Math.max(0, Math.min(6, parseInt(n) || 0)) }
function setRed(n) { props.build.redStars = Math.max(0, Math.min(6, parseInt(n) || 0)) }
function toggleAwaken() { if (hasAwaken.value) props.build.awakened = !props.build.awakened }

// ---- อัพสกิล ----
const skillCells = computed(() => {
  const h = hero.value
  if (!h) return []
  return [['n', 'ปกติ'], ['s1', 'สกิล 1'], ['s2', 'สกิล 2'], ['p', 'พาสซีฟ'], ['aw', 'ปลุกพลัง']]
    .filter(([k]) => k !== 'aw' || props.build.awakened)
    .map(([k, label]) => ({ k, label, img: h.skillData?.[k]?.img || '', up: !!props.build.skillUp?.[k] }))
})
function toggleSkillUp(k) {
  if (!props.build.skillUp || typeof props.build.skillUp !== 'object') props.build.skillUp = {}
  props.build.skillUp[k] = !props.build.skillUp[k]
}

// ---- ของรัก ----
const relicOpts = HB_RELIC_STATS.map((r) => ({ label: r.label, value: r.key }))
const relicTiers = HB_RELIC_TIERS
function relicTierVal(stat, tierIdx) {
  const rs = hbRelicStat(stat)
  return rs ? rs.vals[tierIdx] : null
}
function setRelicStat(i, stat) { props.build.relic[i].stat = stat || '' }
function setRelicTier(i, tier) { props.build.relic[i].tier = tier }

// ---- ชิ้นอุปกรณ์ ----
function mainOpts(idx) {
  const list = idx < 2 ? BUILD_FRONT_MAIN : BUILD_BACK_MAIN
  return list.map(([k, label, v]) => ({ label: `${label}  +${v}${buildIsPct(k) ? '%' : ''}`, value: k }))
}
const subOpts = BUILD_SUBS.map(([k, label]) => ({ label, value: k }))
function setMain(idx, key) { props.build.pieces[idx].mainKey = key || '' }
function setSub(idx, si, key) {
  const s = props.build.pieces[idx].subs[si]
  s.key = key || ''
  if (!key) s.up = 0
}
function usedUp(idx) {
  return props.build.pieces[idx].subs.reduce((a, s) => a + (parseInt(s.up) || 0), 0)
}
function subUp(idx, si, delta) {
  const s = props.build.pieces[idx].subs[si]
  if (!s.key) return
  if (delta > 0 && usedUp(idx) >= MAX_SUB_UP) return
  s.up = Math.max(0, (parseInt(s.up) || 0) + delta)
}
function subVal(s) {
  if (!s.key) return null
  const b = BUILD_SUB_DEF[s.key] || 0
  return b * (1 + (parseInt(s.up) || 0))
}
function pieceImg(idx) {
  const s = set.value
  if (!s) return ''
  if (idx < 2) {
    const magic = hero.value?.attackType === 'magic'
    return (magic ? s.imgFrontMagic : s.imgFrontPhysical) || s.imgFrontPhysical || s.imgFrontMagic || ''
  }
  return s.imgBack || ''
}
function setMainParts(idx) {
  const ms = set.value?.mainStats || {}
  const parts = []
  if (idx < 2) { if (ms.atk) parts.push({ label: 'พลังโจมตี', v: ms.atk }) }
  else { if (ms.def) parts.push({ label: 'พลังป้องกัน', v: ms.def }); if (ms.hp) parts.push({ label: 'HP', v: ms.hp }) }
  return parts
}
const pieces = computed(() =>
  props.build.pieces.map((p, idx) => ({
    idx, p,
    isFront: idx < 2,
    title: (idx < 2 ? 'ชิ้นหน้า' : 'ชิ้นหลัง') + ' #' + (idx < 2 ? idx + 1 : idx - 1),
    img: pieceImg(idx),
    setParts: setMainParts(idx),
    used: usedUp(idx),
  })),
)

// โบนัสเซต 4 ชิ้น
const setBonusRows = computed(() => {
  const sb = set.value?.setBonus?.s4 || []
  return sb.map((b) => ({ stat: b.stat, value: b.value, isEffect: b.kind === 'effect' }))
})

const heroImg = computed(() => {
  const h = hero.value
  if (!h) return ''
  return props.build.awakened && h.img2 ? h.img2 : h.img
})
</script>

<template>
  <div class="hb-editor">
    <div class="hb-cols">
      <!-- ซ้าย: ตัวละคร + สเตตัส -->
      <div class="hb-left">
        <div class="panel hb-hero-row">
          <div class="hb-hero-img" :class="hero ? (build.awakened && hasAwaken ? 'awk' : 'on') : 'off'" @click="openHeroPicker">
            <img v-if="hero" :src="heroImg || FALLBACK" @error="onErr" />
            <span v-else class="hb-ph">🦸</span>
          </div>
          <div class="min-w-0 col">
            <div class="hb-cap">ตัวละคร</div>
            <button class="hb-pick-name" :class="{ empty: !hero }" @click="openHeroPicker">
              {{ hero ? hero.name : '+ เลือกตัวละคร' }}
            </button>
            <div v-if="hero && hero.attackType" class="hb-atk" :class="hero.attackType">
              {{ hero.attackType === 'magic' ? '🔮 โจมตีเวท' : '⚔️ โจมตีกายภาพ' }}
            </div>
          </div>
        </div>

        <div v-if="hero" class="panel">
          <div class="panel-title text-blue-4">📊 สเตตัสสุทธิ <span class="hint">(base → รวมอุปกรณ์)</span></div>
          <div class="stat-rows">
            <div v-for="r in statRows" :key="r.key" class="stat-row">
              <span class="stat-label">{{ r.label }}</span>
              <span class="stat-nums">
                <span class="stat-base">{{ r.base }}{{ r.suf }}</span>
                <span class="stat-arrow">→</span>
                <span :class="r.up ? 'stat-up' : 'stat-total'">{{ r.total }}{{ r.suf }}</span>
              </span>
            </div>
            <div v-for="(e, i) in extraRows" :key="'x' + i" class="stat-row extra">
              <span class="stat-label text-cyan-3">{{ e.stat }}</span>
              <span class="stat-up">+{{ e.value }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ขวา: ดาว/สกิล/ของรัก + เซต + อุปกรณ์ -->
      <div class="hb-right">
        <template v-if="hero">
          <div class="hb-two">
            <div class="col-flex">
              <!-- ดาว -->
              <div class="panel">
                <div class="panel-title text-yellow-4">⭐ ระดับดาว <span class="hint">(เริ่ม 6 ดาวเหลือง = base)</span></div>
                <div class="star-row">
                  <span class="star-cap">ดาวฟ้า <span class="dim">(C1–C6)</span></span>
                  <div class="stars">
                    <span v-for="n in 6" :key="'b' + n" class="star" :class="{ on: n <= build.blueStars, blue: true }" @click="setBlue(n)">★</span>
                    <button class="clear" @click="setBlue(0)">ล้าง</button>
                  </div>
                </div>
                <div class="star-row">
                  <span class="star-cap">ดาวแดง <span class="dim">(C7–C12)</span></span>
                  <div class="stars">
                    <span v-for="n in 6" :key="'r' + n" class="star" :class="{ on: n <= build.redStars, red: true }" @click="setRed(n)">★</span>
                    <button class="clear" @click="setRed(0)">ล้าง</button>
                  </div>
                </div>
                <q-btn
                  :disable="!hasAwaken" no-caps unelevated dense
                  :color="build.awakened ? 'deep-purple-6' : 'deep-purple-10'"
                  class="full-width q-mt-sm"
                  :label="!hasAwaken ? '✨ ตัวนี้ไม่มีปลุกพลัง' : (build.awakened ? '✨ ปลุกพลังแล้ว (กดเพื่อปลด)' : '✨ ปลุกพลัง')"
                  @click="toggleAwaken"
                />
              </div>
              <!-- สกิล -->
              <div class="panel">
                <div class="panel-title text-purple-3">⚡ อัพสกิล <span class="hint">(กดรูปเพื่อสลับอัพ)</span></div>
                <div class="skill-grid">
                  <div v-for="s in skillCells" :key="s.k" class="skill-cell">
                    <div class="skill-img" :class="{ up: s.up }" @click="toggleSkillUp(s.k)">
                      <img v-if="s.img" :src="s.img" @error="onErr" />
                      <span v-else class="skill-txt">{{ s.label }}</span>
                    </div>
                    <span class="skill-lbl" :class="{ up: s.up }">{{ s.label }}</span>
                  </div>
                </div>
              </div>
            </div>
            <!-- ของรัก -->
            <div class="panel">
              <div class="panel-title text-pink-3">💎 ของรัก / อุปกรณ์เฉพาะ</div>
              <div class="relic-list">
                <div v-for="(r, i) in build.relic" :key="i" class="relic-row">
                  <q-select
                    :model-value="r.stat || ''" dense outlined dark options-dense emit-value map-options
                    :options="[{ label: '— เลือกความสามารถ —', value: '' }, ...relicOpts]"
                    class="relic-select col" @update:model-value="setRelicStat(i, $event)"
                  />
                  <div class="tier-btns">
                    <button
                      v-for="(t, ti) in relicTiers" :key="t.key"
                      class="tier-btn" :class="{ active: r.tier === t.key }"
                      :style="r.tier === t.key ? { background: t.color, borderColor: t.color, color: '#fff' } : { color: t.color }"
                      @click="setRelicTier(i, t.key)"
                    >
                      {{ relicTierVal(r.stat, ti) != null ? relicTierVal(r.stat, ti) + '%' : t.label }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- เซต -->
        <div class="panel hb-set-panel">
          <div class="hb-set-left">
            <div class="hb-set-img" :class="{ on: set }" @click="openSetPicker">
              <img v-if="set" :src="set.img || FALLBACK" @error="onErr" />
              <span v-else class="hb-ph">🛡️</span>
            </div>
            <button class="hb-pick-name sm" :class="{ empty: !set }" @click="openSetPicker">
              {{ set ? set.name : '+ เลือกเซต' }}
            </button>
          </div>
          <div class="col min-w-0">
            <template v-if="set">
              <div class="panel-title text-cyan-4">🛡️ โบนัสเซต 4 ชิ้น</div>
              <div v-if="setBonusRows.length">
                <div v-for="(b, i) in setBonusRows" :key="i" class="bonus-line">
                  • {{ b.stat }}<span v-if="!b.isEffect" class="stat-up"> +{{ b.value }}%</span>
                  <span v-else class="text-amber-5"> (เอฟเฟกต์)</span>
                </div>
              </div>
              <div v-else class="dim-italic">เซตนี้ยังไม่มีโบนัสเซต 4 ชิ้น</div>
            </template>
            <div v-else class="dim-italic empty-set">ยังไม่ได้เลือกเซต — โบนัสจะแสดงตรงนี้</div>
          </div>
        </div>

        <!-- อุปกรณ์ 4 ชิ้น -->
        <div v-if="hero" class="piece-grid">
          <div v-for="pc in pieces" :key="pc.idx" class="panel piece" :class="pc.isFront ? 'front' : 'back'">
            <div class="piece-head">
              <div class="piece-img">
                <img v-if="pc.img" :src="pc.img" @error="onErr" />
                <span v-else class="hb-ph sm">{{ pc.isFront ? '⚔️' : '🛡️' }}</span>
              </div>
              <div class="col min-w-0">
                <div v-if="pc.setParts.length" class="set-main-parts">
                  <div v-for="(sp, i) in pc.setParts" :key="i" class="set-main-chip">
                    {{ sp.label }} <span class="stat-up">+{{ sp.v }}</span>
                  </div>
                </div>
                <q-select
                  :model-value="pc.p.mainKey || ''" dense outlined dark options-dense emit-value map-options
                  :options="[{ label: '— เลือกออฟหลัก —', value: '' }, ...mainOpts(pc.idx)]"
                  class="main-select" @update:model-value="setMain(pc.idx, $event)"
                />
              </div>
            </div>
            <div class="sub-list">
              <div v-for="(s, si) in pc.p.subs" :key="si" class="sub-row">
                <q-select
                  :model-value="s.key || ''" dense outlined dark options-dense emit-value map-options
                  :options="[{ label: '— ออฟรอง —', value: '' }, ...subOpts]"
                  class="sub-select col" @update:model-value="setSub(pc.idx, si, $event)"
                />
                <span class="sub-val" :class="{ has: s.key }">
                  {{ s.key ? '+' + subVal(s) + (buildIsPct(s.key) ? '%' : '') : '-' }}
                </span>
                <div class="up-ctrl">
                  <button class="up-btn minus" :disabled="!((parseInt(s.up) || 0) > 0)" @click="subUp(pc.idx, si, -1)">−</button>
                  <span class="up-n">{{ parseInt(s.up) || 0 }}</span>
                  <button class="up-btn plus" :disabled="!s.key || pc.used >= MAX_SUB_UP" @click="subUp(pc.idx, si, 1)">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="panel empty-hero">
          <div class="text-h4 q-mb-sm" style="opacity: .4">🦸</div>
          เลือกตัวละครเพื่อเริ่มบิ้ว
        </div>
      </div>
    </div>

    <HeroBuildPickerDialog
      v-model="showPicker"
      :mode="pickerMode"
      :current-id="pickerMode === 'hero' ? build.heroId : build.setId"
      @pick="onPick"
    />
  </div>
</template>

<style scoped>
.hb-editor { max-width: 1100px; margin: 0 auto; }
.min-w-0 { min-width: 0; }
.col { flex: 1; }
.col-flex { display: flex; flex-direction: column; gap: 14px; }
.hb-cols { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 1000px) { .hb-cols { grid-template-columns: 1fr 2fr; } }
.hb-left, .hb-right { display: flex; flex-direction: column; gap: 14px; }
.hb-two { display: grid; grid-template-columns: 1fr; gap: 14px; }
@media (min-width: 640px) { .hb-two { grid-template-columns: 1fr 1fr; } }

.panel { background: #111827; border: 1px solid #30363d; border-radius: 16px; padding: 16px; }
.panel-title { font-size: 0.85rem; font-weight: 800; margin-bottom: 10px; }
.hint { font-size: 0.62rem; color: #6b7280; font-weight: 400; }

/* hero row */
.hb-hero-row { display: flex; gap: 12px; }
.hb-hero-img, .hb-set-img {
  width: 88px; height: 88px; border-radius: 16px; border: 2px solid #374151;
  background: #000; overflow: hidden; cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; transition: border-color 0.12s;
}
.hb-hero-img.on { border-color: #3b82f6; }
.hb-hero-img.awk { border-color: #a855f7; }
.hb-hero-img.off { border-style: dashed; }
.hb-hero-img:hover, .hb-set-img:hover { border-color: #60a5fa; }
.hb-hero-img img, .hb-set-img img { width: 100%; height: 100%; object-fit: cover; }
.hb-ph { font-size: 2.2rem; opacity: 0.3; }
.hb-ph.sm { font-size: 1.4rem; }
.hb-cap { font-size: 0.6rem; text-transform: uppercase; color: #6b7280; font-weight: 700; }
.hb-pick-name {
  background: none; border: none; text-align: left; padding: 0; cursor: pointer;
  font-size: 1.05rem; font-weight: 800; color: #fff; max-width: 100%;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;
}
.hb-pick-name.sm { font-size: 0.8rem; margin-top: 6px; max-width: 96px; }
.hb-pick-name.empty { color: #6b7280; }
.hb-pick-name:hover { color: #60a5fa; }
.hb-atk { font-size: 0.62rem; font-weight: 700; margin-top: 2px; }
.hb-atk.magic { color: #d8b4fe; }
.hb-atk.physical { color: #fdba74; }

/* stat rows */
.stat-rows { display: flex; flex-direction: column; gap: 6px; }
.stat-row {
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(0, 0, 0, 0.2); border: 1px solid #1f2733; border-radius: 6px; padding: 6px 12px;
}
.stat-row.extra { background: rgba(8, 145, 178, 0.08); border-color: rgba(8, 145, 178, 0.3); }
.stat-label { font-size: 0.72rem; color: #94a3b8; }
.stat-nums { font-family: monospace; font-size: 0.8rem; }
.stat-base { color: #6b7280; }
.stat-arrow { color: #4b5563; margin: 0 3px; }
.stat-total { color: #fff; font-weight: 700; }
.stat-up { color: #34d399; font-weight: 700; }

/* stars */
.star-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.star-cap { font-size: 0.72rem; color: #94a3b8; }
.dim { color: #6b7280; }
.stars { display: flex; align-items: center; gap: 1px; }
.star { cursor: pointer; font-size: 1.1rem; line-height: 1; color: #374151; transition: color 0.1s; }
.star.on.blue { color: #38bdf8; }
.star.on.red { color: #ef4444; }
.star:hover { color: #93c5fd; }
.clear { margin-left: 6px; background: none; border: none; color: #6b7280; font-size: 0.62rem; cursor: pointer; }
.clear:hover { color: #fff; }

/* skills */
.skill-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
.skill-cell { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.skill-img {
  width: 100%; aspect-ratio: 1; border-radius: 8px; border: 2px solid #4b5563; background: #000;
  overflow: hidden; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: border-color 0.12s;
}
.skill-img.up { border-color: #22c55e; }
.skill-img:hover { border-color: #c084fc; }
.skill-img img { width: 100%; height: 100%; object-fit: cover; }
.skill-txt { font-size: 0.5rem; color: #6b7280; font-weight: 700; text-align: center; }
.skill-lbl { font-size: 0.55rem; color: #94a3b8; text-align: center; }
.skill-lbl.up { color: #4ade80; font-weight: 700; }

/* relic */
.relic-list { display: flex; flex-direction: column; gap: 8px; }
.relic-row { display: flex; align-items: center; gap: 6px; }
.relic-select { min-width: 0; }
.relic-select :deep(.q-field__control) { font-size: 0.72rem; }
.tier-btns { display: flex; gap: 3px; flex-shrink: 0; }
.tier-btn {
  width: 42px; padding: 4px 2px; border-radius: 6px; border: 1px solid #4b5563;
  background: #161b22; font-size: 0.6rem; font-weight: 700; cursor: pointer; transition: all 0.1s;
}

/* set panel */
.hb-set-panel { display: flex; gap: 16px; border-color: rgba(6, 182, 212, 0.3); }
.hb-set-left { display: flex; flex-direction: column; align-items: center; }
.hb-set-img.on { border-color: #06b6d4; }
.bonus-line { font-size: 0.72rem; color: #cbd5e1; margin-bottom: 2px; }
.dim-italic { font-size: 0.72rem; color: #6b7280; font-style: italic; }
.empty-set { display: flex; align-items: center; min-height: 5rem; }

/* pieces */
.piece-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
@media (min-width: 640px) { .piece-grid { grid-template-columns: 1fr 1fr; } }
.piece.front { border-color: rgba(234, 88, 12, 0.35); }
.piece.back { border-color: rgba(2, 132, 199, 0.35); }
.piece-head { display: flex; gap: 10px; }
.piece-img {
  width: 76px; height: 76px; border-radius: 10px; border: 1px solid #30363d; background: #000;
  overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
}
.piece-img img { width: 100%; height: 100%; object-fit: cover; }
.set-main-parts { display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px; }
.set-main-chip {
  font-size: 0.66rem; background: rgba(0, 0, 0, 0.25); border: 1px solid #1f2733;
  border-radius: 5px; padding: 3px 7px; color: #cbd5e1;
}
.main-select :deep(.q-field__control) { font-size: 0.72rem; }
.main-select :deep(.q-field__native) { color: #fde68a; font-weight: 700; }
.sub-list { display: flex; flex-direction: column; gap: 6px; border-top: 1px solid #1f2733; margin-top: 10px; padding-top: 10px; }
.sub-row { display: flex; align-items: center; gap: 6px; }
.sub-select { min-width: 0; }
.sub-select :deep(.q-field__control) { font-size: 0.7rem; }
.sub-val { width: 46px; text-align: right; font-family: monospace; font-size: 0.7rem; color: #4b5563; flex-shrink: 0; }
.sub-val.has { color: #6ee7b7; }
.up-ctrl { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
.up-btn {
  width: 20px; height: 20px; border-radius: 4px; border: none; color: #fff; font-size: 0.85rem;
  line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.up-btn.minus { background: #374151; }
.up-btn.plus { background: #1d4ed8; }
.up-btn:disabled { opacity: 0.3; cursor: default; }
.up-n { width: 16px; text-align: center; font-size: 0.62rem; color: #94a3b8; }

.empty-hero { text-align: center; color: #6b7280; padding: 48px 16px; }
</style>
