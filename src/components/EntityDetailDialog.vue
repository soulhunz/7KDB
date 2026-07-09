<script setup>
import { computed, ref, watch } from 'vue'
import { rarityThemeOf, themeFromColor } from '@/config/rarity'
import {
  STAT_META, PRIMARY_STATS, SECONDARY_STATS, SKILL_LABELS, summarizeSkill,
} from '@/config/stats'

const props = defineProps({
  modelValue: Boolean,
  kind: { type: String, default: 'hero' }, // 'hero' | 'pet' | 'ring' | 'equip'
  item: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue'])
const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const FALLBACK = 'https://placehold.co/160x160/0d1117/475569?text=%3F'
const onErr = (e) => (e.target.src = FALLBACK)

// ธีมสี
const GRADE_COLOR = { 1: '#6b7280', 2: '#22c55e', 3: '#3b82f6', 4: '#a855f7', 5: '#f97316', 6: '#eab308' }
const theme = computed(() => {
  const it = props.item || {}
  if (props.kind === 'ring') return themeFromColor(GRADE_COLOR[it.grade] || '#6b7280')
  if (props.kind === 'equip') return themeFromColor('#f97316')
  return rarityThemeOf(it.rarity)
})

// ---- โหมดตื่นรู้ (ปุ่มใต้รูป) ----
const awaken = ref(false)
const tab = ref('stats') // panel ที่กำลังดู: 'stats' | 'skills' (ฮีโร่)
watch(() => props.item, () => { awaken.value = false; tab.value = 'stats' })
const hasAwaken = computed(() => {
  const it = props.item || {}
  if (props.kind !== 'hero') return false
  const b = it.baseStats || {}, a = it.awakenStats || {}
  const statsDiffer = Object.keys(b).some((k) => a[k] !== undefined && a[k] !== b[k])
  return !!(it.img2 && it.img2.trim()) || statsDiffer || !!(it.skillData?.aw?.img)
})
const isAwaken = computed(() => props.kind === 'hero' && awaken.value)

const mainImg = computed(() => {
  const it = props.item || {}
  if (props.kind === 'hero') return isAwaken.value ? it.img2 || it.img : it.img
  return it.img
})

// รูปหลายมุมของเซ็ตอุปกรณ์ (โชว์ใหญ่ในเนื้อหา)
const equipImages = computed(() => {
  if (props.kind !== 'equip') return []
  const it = props.item || {}
  return [
    { label: 'หน้า·กายภาพ', src: it.imgFrontPhysical },
    { label: 'หน้า·เวท', src: it.imgFrontMagic },
    { label: 'ด้านหลัง', src: it.imgBack },
  ].filter((x) => x.src && String(x.src).trim())
})

// ---- สเตตัส ----
const statsSource = computed(() => {
  const it = props.item || {}
  if (props.kind === 'equip') return it.mainStats || {}
  return isAwaken.value ? it.awakenStats || it.baseStats || {} : it.baseStats || {}
})
const primaryStats = computed(() =>
  PRIMARY_STATS.filter((k) => statsSource.value[k] != null).map((k) => ({ key: k, ...STAT_META[k], value: statsSource.value[k] }))
)
const secondaryStats = computed(() =>
  SECONDARY_STATS.filter((k) => statsSource.value[k] != null).map((k) => ({ key: k, ...STAT_META[k], value: statsSource.value[k] }))
)

// ---- สกิลฮีโร่ ----
const skills = computed(() => {
  if (props.kind !== 'hero') return []
  const it = props.item || {}
  const keys = ['n', 'p', 's1', 's2']
  if (isAwaken.value && it.skillData?.aw?.img) keys.push('aw')
  return keys
    .map((k) => {
      const sd = it.skillData?.[k]
      const html = it.skills?.[k]
      const summary = summarizeSkill(sd)
      const hasAny = (html && html.trim()) || sd?.img || summary?.hasContent
      if (!hasAny) return null
      return { key: k, label: SKILL_LABELS[k], icon: sd?.img, html: html?.trim() || '', summary }
    })
    .filter(Boolean)
})

const equipMain = computed(() =>
  Object.keys(props.item?.mainStats || {}).map((k) => ({
    label: STAT_META[k]?.label || k,
    icon: STAT_META[k]?.icon || '📊',
    value: props.item.mainStats[k],
  }))
)
function bonusRows(arr) {
  return (arr || []).map((b) => `${b.stat} +${b.value}${b.valueType === 'percent' ? '%' : ''}`)
}
</script>

<template>
  <q-dialog v-model="show" transition-show="jump-up" transition-hide="jump-down">
    <q-card v-if="item" class="detail-card">
      <!-- ===== BANNER ===== -->
      <div class="banner" :style="{ background: theme.grad }">
        <q-btn flat round dense icon="close" color="white" class="banner-close" v-close-popup />

        <div class="banner-left">
          <div class="banner-portrait" :style="{ borderColor: theme.color, boxShadow: `0 0 22px ${theme.color}66` }">
            <img :src="mainImg || FALLBACK" @error="onErr" />
          </div>
          <!-- ปุ่ม Awakening ปุ่มเดียว (กดเปิด/ปิด) ใต้รูป -->
          <q-btn
            v-if="hasAwaken"
            :outline="!awaken"
            :unelevated="awaken"
            color="deep-purple-4"
            no-caps
            rounded
            size="sm"
            class="awaken-btn"
            label="🌟 ตื่นรู้"
            @click="awaken = !awaken"
          />
        </div>

        <!-- ชื่อ + ข้อมูล อยู่ข้างๆ รูป -->
        <div class="banner-info">
          <div class="banner-name">{{ item.name || '—' }}</div>
          <div class="row items-center q-gutter-xs q-mt-xs">
            <q-badge v-if="item.rarity" :style="{ backgroundColor: theme.color }" :label="item.rarity" />
            <q-badge v-if="item.type && !Array.isArray(item.type)" color="white" text-color="dark" :label="item.type" />
            <q-badge v-for="t in (Array.isArray(item.type) ? item.type : [])" :key="t" color="white" text-color="dark" :label="t" />
            <q-badge v-if="kind === 'ring' && item.grade" :style="{ backgroundColor: theme.color }" :label="'เกรด ' + item.grade" />
            <q-badge v-if="kind === 'equip' && item.setType" :style="{ backgroundColor: theme.color }" :label="item.setType" />
            <q-badge v-if="item.attackType" color="teal" :label="item.attackType === 'physical' ? 'กายภาพ' : 'เวท'" />
          </div>
          <div v-if="item.affiliation" class="banner-affil">{{ item.affiliation }}</div>
        </div>

        <!-- รูปอุปกรณ์ มุมขวาล่าง -->
        <div v-if="kind === 'hero' && item.accImg" class="acc-corner" :style="{ borderColor: theme.color + '99' }">
          <img :src="item.accImg" @error="onErr" />
          <q-tooltip>อุปกรณ์</q-tooltip>
        </div>
      </div>

      <!-- ===== BODY ===== -->
      <q-card-section class="detail-body scroll">
        <!-- ปุ่ม panel สลับ สเตตัส / สกิล (ฮีโร่) -->
        <q-btn-toggle
          v-if="kind === 'hero' && skills.length"
          v-model="tab"
          spread
          no-caps
          unelevated
          class="panel-toggle q-mb-md"
          toggle-color="primary"
          color="grey-9"
          text-color="grey-5"
          :options="[
            { label: '📊 สเตตัส', value: 'stats' },
            { label: '🎯 สกิล', value: 'skills' },
          ]"
        />

        <!-- สเตตัส -->
        <template v-if="(primaryStats.length || secondaryStats.length) && (kind !== 'hero' || tab === 'stats')">
          <div class="section-title">
            📊 {{ isAwaken ? 'สเตตัสตื่นรู้' : 'สเตตัสพื้นฐาน' }}
          </div>
          <div class="stat-primary-grid q-mb-sm">
            <div v-for="st in primaryStats" :key="st.key" class="stat-primary" :style="{ borderColor: theme.color + '55' }">
              <div class="stat-ico" :style="{ background: theme.color + '22' }">{{ st.icon }}</div>
              <div class="stat-primary-txt">
                <div class="stat-lbl">{{ st.label }}</div>
                <div class="stat-val">{{ st.value }}{{ st.pct ? '%' : '' }}</div>
              </div>
            </div>
          </div>
          <div v-if="secondaryStats.length" class="stat-mini-grid q-mb-md">
            <div v-for="st in secondaryStats" :key="st.key" class="stat-mini">
              <span class="m-ico">{{ st.icon }}</span>
              <span class="m-lbl">{{ st.label }}</span>
              <span class="m-val">{{ st.value }}{{ st.pct ? '%' : '' }}</span>
            </div>
          </div>
        </template>

        <!-- สกิล (ฮีโร่) -->
        <template v-if="skills.length && (kind !== 'hero' || tab === 'skills')">
          <div v-for="sk in skills" :key="sk.key" class="skill-card" :style="{ borderLeftColor: theme.color }">
            <div class="skill-head">
              <img v-if="sk.icon" :src="sk.icon" @error="onErr" class="skill-ico" :style="{ borderColor: theme.color + '66' }" />
              <div class="skill-ico skill-ico-empty" v-else>🎯</div>
              <div class="skill-head-txt">
                <span class="skill-label">{{ sk.label }}</span>
                <span v-if="sk.summary && sk.summary.hits" class="skill-meta">
                  🎯 {{ sk.summary.targets || 1 }} เป้า · {{ sk.summary.hits }} ครั้ง
                </span>
              </div>
            </div>
            <div v-if="sk.summary && sk.summary.scaling" class="skill-scaling">
              💢 ความเสียหาย: {{ sk.summary.scaling }}
            </div>
            <div v-if="sk.summary && sk.summary.effects.length" class="row q-gutter-xs q-mt-xs">
              <q-badge v-for="(ef, i) in sk.summary.effects" :key="i" :color="ef.color" :label="ef.label" />
            </div>
            <div v-if="sk.html" class="skill-html q-mt-xs" v-html="sk.html"></div>
          </div>
        </template>

        <!-- สกิลสัตว์เลี้ยง -->
        <template v-if="kind === 'pet' && item.skill">
          <div class="section-title">🎯 สกิล</div>
          <div class="skill-card" :style="{ borderLeftColor: theme.color }">
            <div class="skill-html" v-html="item.skill"></div>
          </div>
        </template>

        <!-- แหวน -->
        <template v-if="kind === 'ring' && item.desc">
          <div class="section-title">📜 คำอธิบาย</div>
          <div class="desc-box">{{ item.desc }}</div>
        </template>

        <!-- เซ็ตอุปกรณ์ -->
        <template v-if="kind === 'equip'">
          <template v-if="equipImages.length">
            <div class="section-title">🖼️ รูปเซ็ต</div>
            <div class="equip-img-row q-mb-md">
              <div v-for="im in equipImages" :key="im.label" class="equip-img-item">
                <img :src="im.src" @error="onErr" :style="{ borderColor: theme.color + '55' }" />
                <div class="equip-img-lbl">{{ im.label }}</div>
              </div>
            </div>
          </template>
          <template v-if="equipMain.length">
            <div class="section-title">📊 ค่าหลัก</div>
            <div class="stat-primary-grid q-mb-md">
              <div v-for="st in equipMain" :key="st.label" class="stat-primary" :style="{ borderColor: theme.color + '55' }">
                <div class="stat-ico" :style="{ background: theme.color + '22' }">{{ st.icon }}</div>
                <div class="stat-primary-txt">
                  <div class="stat-lbl">{{ st.label }}</div>
                  <div class="stat-val">{{ st.value }}</div>
                </div>
              </div>
            </div>
          </template>
          <div v-if="item.desc" class="desc-box q-mb-md">{{ item.desc }}</div>
          <template v-if="item.setBonus">
            <div class="section-title">🎁 โบนัสเซ็ต</div>
            <div v-for="(arr, key) in item.setBonus" :key="key" class="bonus-row">
              <q-badge :style="{ backgroundColor: theme.color }" :label="String(key).toUpperCase()" />
              <span class="q-ml-sm text-grey-3">{{ bonusRows(arr).join(' · ') }}</span>
            </div>
          </template>
        </template>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.detail-card {
  width: 92vw;
  max-width: 600px;
  height: 82vh;
  max-height: 760px;
  display: flex;
  flex-direction: column;
  background: #0f1420;
  border-radius: 16px;
  overflow: hidden;
}

/* ---- Banner (แนวนอน: รูปซ้าย · ชื่อขวา · อุปกรณ์มุมขวาล่าง) ---- */
.banner {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 18px;
  padding: 20px;
  flex-shrink: 0;
  min-height: 180px;
}
.banner-close {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
}
.banner-left {
  flex-shrink: 0;
  width: 140px;
}
.banner-portrait {
  width: 140px;
  height: 140px;
  border-radius: 16px;
  border: 3px solid;
  overflow: hidden;
  background: #000;
}
.banner-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.awaken-btn {
  margin-top: 10px;
  width: 140px;
}
.banner-info {
  flex: 1;
  min-width: 0;
  padding-top: 4px;
  /* กันข้อความยาวไปทับรูปอุปกรณ์มุมขวาล่าง */
  padding-right: 108px;
}
/* รูปอุปกรณ์ มุมขวาล่าง (เล็กลงอีก 20px = 100px) */
.acc-corner {
  position: absolute;
  bottom: 14px;
  right: 14px;
  width: 100px;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid;
  background: #000;
}
.acc-corner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.banner-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
  word-break: break-word;
}
.banner-affil {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 6px;
}

/* ---- Body ---- */
.detail-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 18px 20px;
}
.section-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 14px 0 8px;
}
.section-title:first-child {
  margin-top: 0;
}

/* ปุ่ม panel สลับ สเตตัส/สกิล */
.panel-toggle {
  border: 1px solid #262d38;
  border-radius: 10px;
  overflow: hidden;
  font-weight: 700;
}

/* รูปเซ็ตหลายมุม */
.equip-img-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.equip-img-item {
  text-align: center;
}
.equip-img-item img {
  width: 110px;
  height: 110px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid;
  background: #000;
  display: block;
}
.equip-img-lbl {
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 3px;
}

/* สเตตัสหลัก */
.stat-primary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.stat-primary {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #1a2130 0%, #12161f 100%);
  border: 1px solid;
  border-radius: 12px;
  padding: 10px 14px;
}
.stat-ico {
  font-size: 1.35rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  flex-shrink: 0;
}
.stat-primary-txt {
  min-width: 0;
}
.stat-lbl {
  font-size: 0.72rem;
  color: #94a3b8;
  white-space: nowrap;
}
.stat-val {
  font-size: 1.2rem;
  font-weight: 800;
  color: #f1f5f9;
  line-height: 1.15;
}

/* สเตตัสรอง */
.stat-mini-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}
.stat-mini {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #161b22;
  border: 1px solid #262d38;
  border-radius: 9px;
  padding: 7px 11px;
}
.stat-mini .m-ico {
  font-size: 0.95rem;
}
.stat-mini .m-lbl {
  flex: 1;
  font-size: 0.78rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stat-mini .m-val {
  font-weight: 800;
  color: #e2e8f0;
  font-size: 0.9rem;
}
@media (min-width: 480px) {
  .stat-mini-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* การ์ดสกิล — ไอคอนใหญ่ ×2 */
.skill-card {
  background: #161b22;
  border: 1px solid #262d38;
  border-left: 3px solid;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 10px;
}
.skill-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.skill-ico {
  width: 88px;
  height: 88px;
  border-radius: 12px;
  object-fit: cover;
  background: #000;
  border: 2px solid;
  flex-shrink: 0;
}
.skill-ico-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  border-color: #333 !important;
}
.skill-head-txt {
  min-width: 0;
}
.skill-label {
  display: block;
  font-weight: 700;
  color: #e2e8f0;
  font-size: 1.05rem;
}
.skill-meta {
  font-size: 0.75rem;
  color: #94a3b8;
}
.skill-scaling {
  font-size: 0.85rem;
  color: #cbd5e1;
  margin-top: 8px;
}

.desc-box {
  background: #161b22;
  border: 1px solid #262d38;
  border-radius: 10px;
  padding: 10px 12px;
  color: #cbd5e1;
  line-height: 1.6;
}
.bonus-row {
  padding: 4px 0;
}
</style>
