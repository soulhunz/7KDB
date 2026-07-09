<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import EntityTile from '@/components/EntityTile.vue'
import EntityDetailDialog from '@/components/EntityDetailDialog.vue'

const store = useDataStore()
const route = useRoute()

// แท็บ: ฮีโร่ / สัตว์เลี้ยง / แหวน — เปิดจาก ?tab= ได้ (ลิงก์จาก Dashboard)
const tab = ref('heroes')
if (['heroes', 'pets', 'rings'].includes(route.query.tab)) tab.value = route.query.tab

const search = ref('')
// filter อิงตาม 7k-commander
const filters = ref({ rarity: null, type: null, aff: null, awaken: false })
watch(tab, () => {
  search.value = ''
  filters.value = { rarity: null, type: null, aff: null, awaken: false }
})

// ลำดับความหายาก (ไว้จัดเรียง) — อิงตาม 7k-commander
const HERO_RARITY = ['โบราณ', 'ตำนาน SP', 'ตำนาน', 'หายาก', 'ระดับสูง', 'ทั่วไป']
const HERO_TYPE = ['กายภาพ', 'เวทมนตร์', 'ป้องกัน', 'สมดุล', 'สนับสนุน']
const PET_RARITY = ['ตำนาน', 'หายาก']
const PET_TYPE = ['บัพโจมตี', 'บัพป้องกัน', 'สนับสนุน']

// สีขอบ/badge ตามเกรดแหวน 1-6
const gradeColor = { 1: '#6b7280', 2: '#22c55e', 3: '#3b82f6', 4: '#a855f7', 5: '#f97316', 6: '#eab308' }
const ringColor = (g) => gradeColor[g] || '#6b7280'

// ตัวเลือก filter ต่อแท็บ (ผสมค่ามาตรฐาน + ที่มีจริงในข้อมูล)
const uniq = (arr) => [...new Set(arr.filter(Boolean))]
const rarityOptions = computed(() => {
  if (tab.value === 'heroes') return HERO_RARITY.filter((r) => store.heroes.some((h) => h.rarity === r))
  if (tab.value === 'pets') return PET_RARITY.filter((r) => store.pets.some((p) => p.rarity === r))
  return []
})
const typeOptions = computed(() => {
  if (tab.value === 'heroes') return HERO_TYPE.filter((t) => store.heroes.some((h) => h.type === t))
  if (tab.value === 'pets')
    return PET_TYPE.filter((t) => store.pets.some((p) => (Array.isArray(p.type) ? p.type : [p.type]).includes(t)))
  return uniq(store.rings.map((r) => r.ringType)) // แหวน: ประเภทแหวน
})
const affOptions = computed(() => uniq(store.heroes.map((h) => h.affiliation)).sort((a, b) => a.localeCompare(b, 'th')))

// จัดเรียงตามความหายากแล้วตามชื่อ
function sortByRarity(list, order) {
  const rank = (r) => {
    const i = order.indexOf(r)
    return i === -1 ? 999 : i
  }
  return [...list].sort((a, b) => rank(a.rarity) - rank(b.rarity) || String(a.name || '').localeCompare(String(b.name || ''), 'th'))
}

const items = computed(() => {
  const q = search.value.trim().toLowerCase()
  const f = filters.value

  if (tab.value === 'rings') {
    return store.rings.filter((r) => {
      const mq = !q || (r.name || '').toLowerCase().includes(q)
      const mt = !f.type || r.ringType === f.type
      return mq && mt
    })
  }

  if (tab.value === 'heroes') {
    const list = store.heroes.filter((h) => {
      if (q && !(h.name || '').toLowerCase().includes(q)) return false
      if (f.rarity && h.rarity !== f.rarity) return false
      if (f.type && h.type !== f.type) return false
      if (f.aff && h.affiliation !== f.aff) return false
      if (f.awaken && !(h.img2 && h.img2.trim())) return false
      return true
    })
    return sortByRarity(list, HERO_RARITY)
  }

  // pets
  const list = store.pets.filter((p) => {
    if (q && !(p.name || '').toLowerCase().includes(q)) return false
    if (f.rarity && p.rarity !== f.rarity) return false
    if (f.type) {
      const types = Array.isArray(p.type) ? p.type : [p.type]
      if (!types.includes(f.type)) return false
    }
    return true
  })
  return sortByRarity(list, PET_RARITY)
})

const dialogKind = computed(() => ({ heroes: 'hero', pets: 'pet', rings: 'ring' }[tab.value]))

const showDetail = ref(false)
const selected = ref(null)
function open(it) {
  selected.value = it
  showDetail.value = true
}
</script>

<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-sm">🖼️ แกลเลอรี</div>

    <q-tabs
      v-model="tab"
      dense
      align="left"
      class="q-mb-md text-grey-5"
      active-color="primary"
      indicator-color="primary"
      narrow-indicator
    >
      <q-tab name="heroes" label="🦸 ฮีโร่" no-caps />
      <q-tab name="pets" label="🐾 สัตว์เลี้ยง" no-caps />
      <q-tab name="rings" label="💍 แหวน" no-caps />
    </q-tabs>

    <!-- ค้นหา + filter -->
    <div class="row items-center q-col-gutter-sm q-mb-sm">
      <div class="col-12 col-sm">
        <q-input v-model="search" dense outlined dark placeholder="ค้นหาชื่อ..." clearable>
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>
      <div v-if="rarityOptions.length" class="col-6 col-sm-auto">
        <q-select v-model="filters.rarity" :options="rarityOptions" dense outlined dark clearable
          options-dense emit-value map-options label="เรตติ้ง" style="min-width: 130px" />
      </div>
      <div v-if="typeOptions.length" class="col-6 col-sm-auto">
        <q-select v-model="filters.type" :options="typeOptions" dense outlined dark clearable
          options-dense label="ประเภท" style="min-width: 130px" />
      </div>
      <div v-if="tab === 'heroes'" class="col-6 col-sm-auto">
        <q-select v-model="filters.aff" :options="affOptions" dense outlined dark clearable
          options-dense label="สังกัด" style="min-width: 150px" />
      </div>
      <div v-if="tab === 'heroes'" class="col-6 col-sm-auto">
        <q-btn :outline="!filters.awaken" :unelevated="filters.awaken" color="deep-purple-4"
          dense no-caps rounded icon="auto_awesome" label="ปลุกพลัง"
          @click="filters.awaken = !filters.awaken" />
      </div>
    </div>

    <div class="text-grey-5 q-mb-md">แสดง {{ items.length }} รายการ</div>

    <div v-if="store.loading" class="tile-grid">
      <q-skeleton v-for="n in 24" :key="n" width="100px" height="124px" />
    </div>

    <div v-else-if="!items.length" class="text-center text-grey-5 q-pa-xl">
      <div class="text-h2">🔍</div>
      ไม่พบข้อมูล
    </div>

    <div v-else class="tile-grid">
      <EntityTile
        v-for="it in items"
        :key="it.id"
        :name="it.name"
        :img="it.img"
        :border-color="tab === 'rings' ? ringColor(it.grade) : '#30363d'"
        :badge="tab === 'rings' ? (it.grade ? String(it.grade) : '') : it.rarity"
        :badge-color="tab === 'rings' ? ringColor(it.grade) : '#c2410c'"
        @click="open(it)"
      />
    </div>

    <EntityDetailDialog v-model="showDetail" :kind="dialogKind" :item="selected" />
  </q-page>
</template>
