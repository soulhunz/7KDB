<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import EntityTile from '@/components/EntityTile.vue'
import EntityDetailDialog from '@/components/EntityDetailDialog.vue'

const store = useDataStore()
const route = useRoute()

const tab = ref('heroes')
if (['heroes', 'pets', 'rings'].includes(route.query.tab)) tab.value = route.query.tab

const search = ref('')
const filters = ref({ rarity: null, type: null, aff: null, awaken: false })
watch(tab, () => {
  search.value = ''
  filters.value = { rarity: null, type: null, aff: null, awaken: false }
})

// อิงตาม 7k-commander
const HERO_RARITY = ['โบราณ', 'ตำนาน SP', 'ตำนาน', 'หายาก', 'ระดับสูง', 'ทั่วไป']
const HERO_TYPE = ['กายภาพ', 'เวทมนตร์', 'ป้องกัน', 'สมดุล', 'สนับสนุน']
const PET_RARITY = ['ตำนาน', 'หายาก']
const PET_TYPE = ['บัพโจมตี', 'บัพป้องกัน', 'สนับสนุน']

const gradeColor = { 1: '#6b7280', 2: '#22c55e', 3: '#3b82f6', 4: '#a855f7', 5: '#f97316', 6: '#eab308' }
const ringColor = (g) => gradeColor[g] || '#6b7280'

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
  return uniq(store.rings.map((r) => r.ringType))
})
const affOptions = computed(() => uniq(store.heroes.map((h) => h.affiliation)).sort((a, b) => a.localeCompare(b, 'th')))

// แถว filter ต่อแท็บ (label + ปุ่ม)
const filterGroups = computed(() => {
  if (tab.value === 'heroes') {
    return [
      { key: 'rarity', label: 'RARITY', options: rarityOptions.value },
      { key: 'type', label: 'TYPE', options: typeOptions.value },
      { key: 'awaken', label: 'SPECIAL', options: ['ปลุกพลัง'], toggle: true },
      { key: 'aff', label: 'GROUP', options: affOptions.value },
    ]
  }
  if (tab.value === 'pets') {
    return [
      { key: 'rarity', label: 'RARITY', options: rarityOptions.value },
      { key: 'type', label: 'TYPE', options: typeOptions.value },
    ]
  }
  return [{ key: 'type', label: 'TYPE', options: typeOptions.value }]
})

function isActive(g, opt) {
  return g.toggle ? filters.value[g.key] : filters.value[g.key] === opt
}
function toggle(g, opt) {
  if (g.toggle) filters.value[g.key] = !filters.value[g.key]
  else filters.value[g.key] = filters.value[g.key] === opt ? null : opt
}

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
    return store.rings.filter((r) => (!q || (r.name || '').toLowerCase().includes(q)) && (!f.type || r.ringType === f.type))
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
    <!-- หัว: ชื่อ + ช่องค้นหา -->
    <div class="row items-center q-mb-md">
      <div class="text-h5 text-weight-bold">Gallery</div>
      <q-space />
      <q-input v-model="search" dense outlined dark rounded placeholder="ค้นหา ชื่อ..." style="min-width: 260px" clearable>
        <template #prepend><q-icon name="search" color="primary" /></template>
      </q-input>
    </div>

    <!-- แท็บ -->
    <q-tabs v-model="tab" dense align="left" class="q-mb-md text-grey-5" active-color="primary" indicator-color="primary" narrow-indicator>
      <q-tab name="heroes" label="HEROES" no-caps />
      <q-tab name="pets" label="PETS" no-caps />
      <q-tab name="rings" label="RINGS" no-caps />
    </q-tabs>

    <!-- แถว filter (ปุ่ม chip แบบ 7k-commander) -->
    <div class="q-mb-md">
      <div v-for="g in filterGroups" :key="g.key" class="filter-row">
        <span class="filter-label">{{ g.label }}</span>
        <div class="filter-btns">
          <button
            v-for="opt in g.options"
            :key="opt"
            class="filter-btn"
            :class="{ active: isActive(g, opt) }"
            @click="toggle(g, opt)"
          >
            {{ opt }}
          </button>
        </div>
      </div>
    </div>

    <div class="text-grey-5 q-mb-sm">แสดง {{ items.length }} รายการ</div>

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

<style scoped>
.filter-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}
.filter-label {
  flex-shrink: 0;
  width: 60px;
  padding-top: 5px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #6b7280;
  text-transform: uppercase;
}
.filter-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.filter-btn {
  padding: 4px 14px;
  border-radius: 999px;
  border: 1px solid #30363d;
  background: #161b22;
  color: #cbd5e1;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.12s ease;
}
.filter-btn:hover {
  border-color: #3b82f6;
  color: #fff;
}
.filter-btn.active {
  background: #2563eb;
  border-color: #3b82f6;
  color: #fff;
  font-weight: 600;
}
</style>
