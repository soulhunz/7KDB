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

const FALLBACK = 'https://placehold.co/140x140/0d1117/475569?text=%3F'
const onErr = (e) => (e.target.src = FALLBACK)

// โหมด ปกติ / ตื่นรู้ (ฮีโร่) — รีเซ็ตทุกครั้งที่เปลี่ยนตัว
const mode = ref('normal')
watch(() => props.item, () => (mode.value = 'normal'))

// ธีมสี (ฮีโร่/สัตว์ = ตามความหายาก, แหวน = ตามเกรด, เซ็ต = ส้ม)
const GRADE_COLOR = { 1: '#6b7280', 2: '#22c55e', 3: '#3b82f6', 4: '#a855f7', 5: '#f97316', 6: '#eab308' }
const theme = computed(() => {
  const it = props.item || {}
  if (props.kind === 'ring') return themeFromColor(GRADE_COLOR[it.grade] || '#6b7280')
  if (props.kind === 'equip') return themeFromColor('#f97316')
  return rarityThemeOf(it.rarity)
})

// ---- ฮีโร่: awakening ----
const hasAwaken = computed(() => {
  const it = props.item || {}
  if (props.kind !== 'hero') return false
  const b = it.baseStats || {}, a = it.awakenStats || {}
  const statsDiffer = Object.keys(b).some((k) => a[k] !== undefined && a[k] !== b[k])
  return !!(it.img2 && it.img2.trim()) || statsDiffer || !!(it.skillData?.aw?.img)
})
const isAwaken = computed(() => hasAwaken.value && mode.value === 'awaken')

const mainImg = computed(() => {
  const it = props.item || {}
  if (props.kind !== 'hero') return it.img
  return isAwaken.value ? it.img2 || it.img : it.img
})

// สเตตัสที่แสดง (สลับตามโหมด)
const statsSource = computed(() => {
  const it = props.item || {}
  if (props.kind === 'equip') return it.mainStats || {}
  return isAwaken.value ? it.awakenStats || it.baseStats || {} : it.baseStats || {}
})
const primaryStats = computed(() =>
  PRIMARY_STATS.filter((k) => statsSource.value[k] != null).map((k) => ({
    key: k, ...STAT_META[k], value: statsSource.value[k],
  }))
)
const secondaryStats = computed(() =>
  SECONDARY_STATS.filter((k) => (statsSource.value[k] || 0) > 0).map((k) => ({
    key: k, ...STAT_META[k], value: statsSource.value[k],
  }))
)

// รูปประกอบฮีโร่ (อุปกรณ์)
const accImg = computed(() => (props.kind === 'hero' ? props.item?.accImg : ''))

// ---- สกิลฮีโร่ (จาก skillData + HTML text) ----
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

const petTypes = computed(() => {
  const t = props.item?.type
  return (Array.isArray(t) ? t : [t]).filter(Boolean)
})
const equipMain = computed(() =>
  Object.keys(props.item?.mainStats || {}).map((k) => ({ label: STAT_META[k]?.label || k, value: props.item.mainStats[k] }))
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
        <div class="banner-portrait" :style="{ borderColor: theme.color, boxShadow: `0 0 22px ${theme.color}66` }">
          <img :src="mainImg || FALLBACK" @error="onErr" />
        </div>
        <div class="banner-info">
          <div class="banner-name">{{ item.name || '—' }}</div>
          <div class="row items-center q-gutter-xs q-mt-xs">
            <q-badge v-if="item.rarity" :style="{ backgroundColor: theme.color }" :label="item.rarity" />
            <q-badge v-if="item.type && !Array.isArray(item.type)" color="white" text-color="dark" :label="item.type" />
            <q-badge v-for="t in (Array.isArray(item.type) ? item.type : [])" :key="t" color="white" text-color="dark" :label="t" />
            <q-badge v-if="kind === 'ring' && item.grade" :style="{ backgroundColor: theme.color }" :label="'เกรด ' + item.grade" />
            <q-badge v-if="kind === 'equip' && item.setType" :style="{ backgroundColor: theme.color }" :label="item.setType" />
          </div>
          <div v-if="item.affiliation" class="banner-affil">{{ item.affiliation }}</div>

          <!-- ปุ่มสลับ ปกติ / ตื่นรู้ -->
          <q-btn-toggle
            v-if="hasAwaken"
            v-model="mode"
            no-caps
            rounded
            unelevated
            size="sm"
            class="q-mt-sm awaken-toggle"
            toggle-color="deep-purple-5"
            color="dark"
            text-color="grey-4"
            :options="[
              { label: '🧍 ปกติ', value: 'normal' },
              { label: '🌟 ตื่นรู้', value: 'awaken' },
            ]"
          />
        </div>
        <img v-if="accImg" :src="accImg" @error="onErr" class="banner-acc" :title="'อุปกรณ์'" />
      </div>

      <!-- ===== BODY ===== -->
      <q-card-section class="detail-body scroll">
        <!-- สเตตัส (ฮีโร่ / เซ็ต) -->
        <template v-if="primaryStats.length || secondaryStats.length">
          <div class="section-title">📊 {{ isAwaken ? 'สเตตัสตื่นรู้' : 'สเตตัสพื้นฐาน' }}</div>
          <div class="stat-primary-grid q-mb-sm">
            <div v-for="st in primaryStats" :key="st.key" class="stat-primary" :style="{ borderColor: theme.color + '55' }">
              <div class="stat-ico">{{ st.icon }}</div>
              <div>
                <div class="stat-lbl">{{ st.label }}</div>
                <div class="stat-val">{{ st.value }}{{ st.pct ? '%' : '' }}</div>
              </div>
            </div>
          </div>
          <div v-if="secondaryStats.length" class="row q-gutter-xs q-mb-md">
            <q-chip v-for="st in secondaryStats" :key="st.key" dense square color="grey-9" text-color="grey-3" class="stat-chip">
              <span class="q-mr-xs">{{ st.icon }}</span>{{ st.label }}
              <span class="text-weight-bold q-ml-xs">{{ st.value }}{{ st.pct ? '%' : '' }}</span>
            </q-chip>
          </div>
        </template>

        <!-- สกิล (ฮีโร่) -->
        <template v-if="skills.length">
          <div class="section-title">🎯 สกิล</div>
          <div v-for="sk in skills" :key="sk.key" class="skill-card" :style="{ borderLeftColor: theme.color }">
            <div class="skill-head">
              <img v-if="sk.icon" :src="sk.icon" @error="onErr" class="skill-ico" />
              <span class="skill-label">{{ sk.label }}</span>
              <span v-if="sk.summary && sk.summary.hits" class="skill-meta">
                🎯 {{ sk.summary.targets || 1 }} เป้า · {{ sk.summary.hits }} ครั้ง
              </span>
            </div>
            <!-- scaling -->
            <div v-if="sk.summary && sk.summary.scaling" class="skill-scaling">
              💢 ความเสียหาย: {{ sk.summary.scaling }}
            </div>
            <!-- effects -->
            <div v-if="sk.summary && sk.summary.effects.length" class="row q-gutter-xs q-mt-xs">
              <q-badge v-for="(ef, i) in sk.summary.effects" :key="i" :color="ef.color" :label="ef.label" />
            </div>
            <!-- คำอธิบายเต็ม (ถ้ามี) -->
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

        <!-- เซ็ตอุปกรณ์: main stats + set bonus -->
        <template v-if="kind === 'equip'">
          <template v-if="equipMain.length">
            <div class="section-title">📊 ค่าหลัก</div>
            <div class="stat-primary-grid q-mb-md">
              <div v-for="st in equipMain" :key="st.label" class="stat-primary" :style="{ borderColor: theme.color + '55' }">
                <div>
                  <div class="stat-lbl">{{ st.label }}</div>
                  <div class="stat-val">{{ st.value }}</div>
                </div>
              </div>
            </div>
          </template>
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
  max-width: 560px;
  background: #0f1420;
  border-radius: 16px;
  overflow: hidden;
}

/* ---- Banner ---- */
.banner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 18px 20px;
}
.banner-close {
  position: absolute;
  top: 6px;
  right: 6px;
}
.banner-portrait {
  width: 96px;
  height: 96px;
  border-radius: 14px;
  border: 3px solid;
  overflow: hidden;
  flex-shrink: 0;
  background: #000;
}
.banner-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.banner-info {
  flex: 1;
  min-width: 0;
}
.banner-name {
  font-size: 1.4rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}
.banner-affil {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4px;
}
.banner-acc {
  position: absolute;
  bottom: 10px;
  right: 12px;
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.35);
}
.awaken-toggle {
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* ---- Body ---- */
.detail-body {
  max-height: 68vh;
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

/* สเตตัสหลัก */
.stat-primary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.stat-primary {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #161b22;
  border: 1px solid;
  border-radius: 10px;
  padding: 8px 12px;
}
.stat-ico {
  font-size: 1.3rem;
}
.stat-lbl {
  font-size: 0.72rem;
  color: #94a3b8;
}
.stat-val {
  font-size: 1.05rem;
  font-weight: 800;
  color: #f1f5f9;
}
.stat-chip {
  font-size: 0.72rem;
}

/* การ์ดสกิล */
.skill-card {
  background: #161b22;
  border: 1px solid #262d38;
  border-left: 3px solid;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
}
.skill-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.skill-ico {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  object-fit: cover;
  background: #000;
}
.skill-label {
  font-weight: 700;
  color: #e2e8f0;
}
.skill-meta {
  font-size: 0.72rem;
  color: #94a3b8;
  margin-left: auto;
}
.skill-scaling {
  font-size: 0.82rem;
  color: #cbd5e1;
  margin-top: 6px;
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
