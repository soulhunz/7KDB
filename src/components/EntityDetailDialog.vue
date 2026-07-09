<script setup>
import { computed } from 'vue'

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

const FALLBACK = 'https://placehold.co/120x120/0d1117/475569?text=%3F'

// ป้ายชื่อสเตตัส (ไทย)
const STAT_LABELS = {
  hp: 'พลังชีวิต', atk: 'พลังโจมตี', def: 'พลังป้องกัน', spd: 'ความเร็ว',
  critRate: 'อัตราคริ', critDmg: 'ดาเมจคริ', block: 'บล็อค', dmgRed: 'ลดดาเมจ',
  acc: 'เข้าเป้า', resist: 'ต้านทาน', weakness: 'จุดอ่อน',
}
const PCT_STATS = new Set(['critRate', 'critDmg', 'block', 'dmgRed', 'acc', 'resist', 'weakness'])

const SKILL_LABELS = { n: '⚔️ โจมตีปกติ', p: '🌀 แพสซีฟ', s1: '💥 สกิล 1', s2: '✨ สกิล 2', aw: '🌟 ตื่นรู้' }

// สเตตัสที่มีค่า > 0 เท่านั้น
const baseStats = computed(() => {
  const s = props.item?.baseStats || {}
  return Object.keys(STAT_LABELS)
    .filter((k) => s[k] != null)
    .map((k) => ({ key: k, label: STAT_LABELS[k], value: s[k], pct: PCT_STATS.has(k) }))
})

// สกิลที่มีเนื้อหา
const skills = computed(() => {
  const sk = props.item?.skills || {}
  return Object.keys(SKILL_LABELS)
    .filter((k) => sk[k] && String(sk[k]).trim())
    .map((k) => ({ key: k, label: SKILL_LABELS[k], html: sk[k] }))
})

// รูปฮีโร่ (ฐาน / ตื่นรู้ / อุปกรณ์)
const heroImgs = computed(() => {
  const it = props.item || {}
  return [
    { label: 'ปกติ', src: it.img },
    { label: 'ตื่นรู้', src: it.img2 },
    { label: 'อุปกรณ์', src: it.accImg },
  ].filter((x) => x.src)
})

// equip set bonus → แถว
function bonusRows(arr) {
  return (arr || []).map((b) => {
    const suffix = b.valueType === 'percent' ? '%' : ''
    return `${b.stat} +${b.value}${suffix}`
  })
}
const equipMain = computed(() => {
  const m = props.item?.mainStats || {}
  return Object.keys(m).map((k) => ({ label: STAT_LABELS[k] || k, value: m[k] }))
})
</script>

<template>
  <q-dialog v-model="show">
    <q-card v-if="item" class="bg-dark" style="min-width: 340px; max-width: 640px; width: 92vw">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 ellipsis">{{ item.name || '—' }}</div>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-card-section class="scroll" style="max-height: 78vh">
        <!-- ===== HERO ===== -->
        <template v-if="kind === 'hero'">
          <div class="row q-gutter-sm q-mb-md">
            <div v-for="im in heroImgs" :key="im.label" class="text-center">
              <img :src="im.src" @error="(e) => (e.target.src = FALLBACK)"
                   style="width: 96px; height: 96px; object-fit: cover; border-radius: 8px; border: 1px solid #30363d" />
              <div class="text-caption text-grey-5">{{ im.label }}</div>
            </div>
          </div>
          <div class="row q-gutter-xs q-mb-md">
            <q-badge v-if="item.rarity" color="deep-orange-9" :label="item.rarity" />
            <q-badge v-if="item.type" color="blue-9" :label="item.type" />
            <q-badge v-if="item.affiliation" color="purple-9" :label="item.affiliation" />
            <q-badge v-if="item.attackType" color="teal-9" :label="item.attackType === 'physical' ? 'กายภาพ' : 'เวท'" />
          </div>

          <template v-if="baseStats.length">
            <div class="text-subtitle2 q-mb-xs">📊 สเตตัสพื้นฐาน</div>
            <div class="row q-col-gutter-xs q-mb-md">
              <div v-for="st in baseStats" :key="st.key" class="col-4">
                <div class="stat-box">
                  <div class="text-caption text-grey-5">{{ st.label }}</div>
                  <div class="text-weight-bold">{{ st.value }}{{ st.pct ? '%' : '' }}</div>
                </div>
              </div>
            </div>
          </template>

          <template v-if="skills.length">
            <div class="text-subtitle2 q-mb-xs">🎯 สกิล</div>
            <div v-for="sk in skills" :key="sk.key" class="q-mb-sm">
              <div class="text-weight-bold text-blue-4">{{ sk.label }}</div>
              <div class="skill-html" v-html="sk.html"></div>
            </div>
          </template>
        </template>

        <!-- ===== PET ===== -->
        <template v-else-if="kind === 'pet'">
          <div class="row items-center q-gutter-md q-mb-md">
            <img :src="item.img || FALLBACK" @error="(e) => (e.target.src = FALLBACK)"
                 style="width: 110px; height: 110px; object-fit: cover; border-radius: 10px; border: 1px solid #30363d" />
            <div>
              <q-badge v-if="item.rarity" color="deep-orange-9" :label="item.rarity" class="q-mb-xs" />
              <div class="row q-gutter-xs">
                <q-badge v-for="t in (Array.isArray(item.type) ? item.type : [item.type]).filter(Boolean)"
                         :key="t" color="green-9" :label="t" />
              </div>
            </div>
          </div>
          <template v-if="item.skill">
            <div class="text-subtitle2 q-mb-xs">🎯 สกิล</div>
            <div class="skill-html" v-html="item.skill"></div>
          </template>
        </template>

        <!-- ===== RING ===== -->
        <template v-else-if="kind === 'ring'">
          <div class="row items-center q-gutter-md q-mb-md">
            <img :src="item.img || FALLBACK" @error="(e) => (e.target.src = FALLBACK)"
                 style="width: 100px; height: 100px; object-fit: cover; border-radius: 50%; border: 2px solid #eab308" />
            <div>
              <q-badge v-if="item.grade" color="amber-8" :label="'เกรด ' + item.grade" class="q-mb-xs" />
              <div v-if="item.ringType" class="text-grey-4">{{ item.ringType }}</div>
            </div>
          </div>
          <div v-if="item.desc" class="skill-html">{{ item.desc }}</div>
        </template>

        <!-- ===== EQUIP SET ===== -->
        <template v-else-if="kind === 'equip'">
          <div class="row items-center q-gutter-md q-mb-md">
            <img :src="item.img || FALLBACK" @error="(e) => (e.target.src = FALLBACK)"
                 style="width: 110px; height: 110px; object-fit: cover; border-radius: 10px; border: 1px solid #30363d" />
            <div>
              <q-badge v-if="item.setType" color="orange-9" :label="item.setType" class="q-mb-xs" />
              <div v-if="item.desc" class="text-grey-4 text-caption" style="max-width: 260px">{{ item.desc }}</div>
            </div>
          </div>

          <template v-if="equipMain.length">
            <div class="text-subtitle2 q-mb-xs">📊 ค่าหลัก</div>
            <div class="row q-col-gutter-xs q-mb-md">
              <div v-for="st in equipMain" :key="st.label" class="col-4">
                <div class="stat-box">
                  <div class="text-caption text-grey-5">{{ st.label }}</div>
                  <div class="text-weight-bold">{{ st.value }}</div>
                </div>
              </div>
            </div>
          </template>

          <template v-if="item.setBonus">
            <div class="text-subtitle2 q-mb-xs">🎁 โบนัสเซ็ต</div>
            <div v-for="(arr, key) in item.setBonus" :key="key" class="q-mb-xs">
              <q-badge color="indigo" :label="key.toUpperCase()" class="q-mr-sm" />
              <span class="text-grey-3">{{ bonusRows(arr).join(' · ') }}</span>
            </div>
          </template>
        </template>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.stat-box {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 4px 8px;
  text-align: center;
}
</style>
