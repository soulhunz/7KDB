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

const FALLBACK = 'https://placehold.co/200x200/1d1d1d/616161?text=%3F'
const onErr = (e) => (e.target.src = FALLBACK)

const GRADE_COLOR = { 1: '#78909c', 2: '#66bb6a', 3: '#42a5f5', 4: '#7e57c2', 5: '#fb8c00', 6: '#ffb300' }
const theme = computed(() => {
  const it = props.item || {}
  if (props.kind === 'ring') return themeFromColor(GRADE_COLOR[it.grade] || '#78909c')
  if (props.kind === 'equip') return themeFromColor('#fb8c00')
  return rarityThemeOf(it.rarity)
})

const tab = ref('stats')
const awaken = ref(false)
watch(() => props.item, () => { awaken.value = false; tab.value = 'stats' })

const hasAwaken = computed(() => {
  const it = props.item || {}
  if (props.kind !== 'hero') return false
  const b = it.baseStats || {}, a = it.awakenStats || {}
  const diff = Object.keys(b).some((k) => a[k] !== undefined && a[k] !== b[k])
  return !!(it.img2 && it.img2.trim()) || diff || !!(it.skillData?.aw?.img)
})
const isAwaken = computed(() => props.kind === 'hero' && awaken.value)
const mainImg = computed(() => {
  const it = props.item || {}
  if (props.kind === 'hero') return isAwaken.value ? it.img2 || it.img : it.img
  return it.img
})

const statsSource = computed(() => {
  const it = props.item || {}
  if (props.kind === 'equip') return it.mainStats || {}
  return isAwaken.value ? it.awakenStats || it.baseStats || {} : it.baseStats || {}
})
const allStats = computed(() => {
  const src = statsSource.value
  const keys = props.kind === 'equip' ? Object.keys(src) : [...PRIMARY_STATS, ...SECONDARY_STATS]
  return keys
    .filter((k) => src[k] != null)
    .map((k) => ({ key: k, label: STAT_META[k]?.label || k, icon: STAT_META[k]?.icon || '•', value: src[k], pct: STAT_META[k]?.pct }))
})

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

const equipImages = computed(() => {
  if (props.kind !== 'equip') return []
  const it = props.item || {}
  return [
    { label: 'หน้า·กายภาพ', src: it.imgFrontPhysical },
    { label: 'หน้า·เวท', src: it.imgFrontMagic },
    { label: 'ด้านหลัง', src: it.imgBack },
  ].filter((x) => x.src && String(x.src).trim())
})
const petTypes = computed(() => {
  const t = props.item?.type
  return (Array.isArray(t) ? t : [t]).filter(Boolean)
})
function bonusRows(arr) {
  return (arr || []).map((b) => `${b.stat} +${b.value}${b.valueType === 'percent' ? '%' : ''}`)
}
</script>

<template>
  <q-dialog v-model="show">
    <q-card v-if="item" class="detail-card column no-wrap">
      <!-- Header (สีตามความหายาก) -->
      <q-card-section class="text-white q-pb-md" :style="{ background: theme.color }">
        <q-btn flat round dense icon="close" class="absolute-top-right q-ma-sm" v-close-popup />
        <div class="row items-center no-wrap q-gutter-md">
          <q-img :src="mainImg || FALLBACK" :ratio="1" style="width: 96px" class="rounded-borders shadow-3" @error="onErr" />
          <q-img
            v-if="kind === 'hero' && item.accImg"
            :src="item.accImg"
            :ratio="1"
            style="width: 64px"
            class="rounded-borders shadow-2"
            @error="onErr"
          >
            <div class="absolute-bottom text-center q-pa-none text-caption" style="padding:1px">อุปกรณ์</div>
          </q-img>
          <div class="col">
            <div class="text-h6 text-weight-bold ellipsis-2-lines">{{ item.name || '—' }}</div>
            <div class="row items-center q-gutter-xs q-mt-xs">
              <q-badge v-if="item.rarity" color="white" text-color="dark" :label="item.rarity" />
              <q-badge v-if="item.type && !Array.isArray(item.type)" outline :label="item.type" />
              <q-badge v-for="t in petTypes" :key="t" outline :label="t" />
              <q-badge v-if="kind === 'ring' && item.grade" color="white" text-color="dark" :label="'เกรด ' + item.grade" />
              <q-badge v-if="kind === 'equip' && item.setType" color="white" text-color="dark" :label="item.setType" />
              <q-badge v-if="item.attackType" outline :label="item.attackType === 'physical' ? 'กายภาพ' : 'เวท'" />
            </div>
            <div v-if="item.affiliation" class="text-caption q-mt-xs">{{ item.affiliation }}</div>
            <q-btn
              v-if="hasAwaken"
              :outline="!awaken"
              color="white"
              :text-color="awaken ? 'deep-purple' : 'white'"
              dense
              no-caps
              rounded
              size="sm"
              class="q-mt-sm"
              icon="auto_awesome"
              label="ตื่นรู้"
              @click="awaken = !awaken"
            />
          </div>
        </div>
      </q-card-section>

      <!-- Tabs (ฮีโร่) -->
      <q-tabs
        v-if="kind === 'hero' && skills.length"
        v-model="tab"
        dense
        class="text-grey-5"
        active-color="primary"
        indicator-color="primary"
        align="justify"
      >
        <q-tab name="stats" icon="bar_chart" label="สเตตัส" no-caps />
        <q-tab name="skills" icon="flare" label="สกิล" no-caps />
      </q-tabs>
      <q-separator />

      <!-- Body -->
      <q-card-section class="col scroll q-pa-none">
        <!-- สเตตัส -->
        <q-list v-if="allStats.length && (kind !== 'hero' || tab === 'stats')" separator>
          <q-item v-for="st in allStats" :key="st.key">
            <q-item-section avatar>
              <q-avatar size="34px" color="grey-9" text-color="white">{{ st.icon }}</q-avatar>
            </q-item-section>
            <q-item-section>{{ st.label }}</q-item-section>
            <q-item-section side>
              <span class="text-weight-bold text-white">{{ st.value }}{{ st.pct ? '%' : '' }}</span>
            </q-item-section>
          </q-item>
        </q-list>

        <!-- สกิล (ฮีโร่) -->
        <div v-if="skills.length && (kind !== 'hero' || tab === 'skills')" class="q-pa-md q-gutter-sm">
          <q-card v-for="sk in skills" :key="sk.key" flat bordered>
            <q-item>
              <q-item-section avatar>
                <q-avatar rounded size="56px">
                  <img v-if="sk.icon" :src="sk.icon" @error="onErr" />
                  <q-icon v-else name="flare" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ sk.label }}</q-item-label>
                <q-item-label caption v-if="sk.summary && sk.summary.hits">
                  {{ sk.summary.targets || 1 }} เป้า · {{ sk.summary.hits }} ครั้ง
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-card-section class="q-pt-none">
              <div v-if="sk.summary && sk.summary.scaling" class="text-body2 q-mb-xs">
                ⚔️ {{ sk.summary.scaling }}
              </div>
              <div v-if="sk.summary && sk.summary.effects.length" class="q-gutter-xs q-mb-xs">
                <q-badge v-for="(ef, i) in sk.summary.effects" :key="i" :color="ef.color" :label="ef.label" />
              </div>
              <div v-if="sk.html" class="skill-html text-grey-4" v-html="sk.html"></div>
            </q-card-section>
          </q-card>
        </div>

        <!-- สัตว์เลี้ยง -->
        <q-card-section v-if="kind === 'pet' && item.skill">
          <div class="text-overline text-grey-6">สกิล</div>
          <div class="skill-html text-grey-3" v-html="item.skill"></div>
        </q-card-section>

        <!-- แหวน -->
        <q-card-section v-if="kind === 'ring' && item.desc">
          <div class="text-overline text-grey-6">คำอธิบาย</div>
          <div class="text-body2 text-grey-3">{{ item.desc }}</div>
        </q-card-section>

        <!-- เซ็ตอุปกรณ์: รูปหลายมุม + โบนัส -->
        <template v-if="kind === 'equip'">
          <q-card-section v-if="equipImages.length">
            <div class="text-overline text-grey-6 q-mb-xs">รูปเซ็ต</div>
            <div class="row q-gutter-sm">
              <div v-for="im in equipImages" :key="im.label" class="text-center">
                <q-img :src="im.src" :ratio="1" style="width: 96px" class="rounded-borders" @error="onErr" />
                <div class="text-caption text-grey-6">{{ im.label }}</div>
              </div>
            </div>
          </q-card-section>
          <q-card-section v-if="item.setBonus" class="q-pt-none">
            <div class="text-overline text-grey-6">โบนัสเซ็ต</div>
            <q-list dense>
              <q-item v-for="(arr, key) in item.setBonus" :key="key" class="q-px-none">
                <q-item-section avatar><q-badge color="primary" :label="String(key).toUpperCase()" /></q-item-section>
                <q-item-section>{{ bonusRows(arr).join(' · ') }}</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </template>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.detail-card {
  width: 92vw;
  max-width: 560px;
  height: 82vh;
  max-height: 760px;
}
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
