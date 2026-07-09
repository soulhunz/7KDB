<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import EntityTile from '@/components/EntityTile.vue'
import EntityDetailDialog from '@/components/EntityDetailDialog.vue'

const store = useDataStore()
const search = ref('')
const typeFilter = ref(null)

// สีขอบตามเกรด 1-6 (เทา → ทอง)
const gradeColor = { 1: '#6b7280', 2: '#22c55e', 3: '#3b82f6', 4: '#a855f7', 5: '#f97316', 6: '#eab308' }
const colorOf = (g) => gradeColor[g] || '#6b7280'

const showDetail = ref(false)
const selected = ref(null)
function open(ring) {
  selected.value = ring
  showDetail.value = true
}

const typeOptions = computed(() => [...new Set(store.rings.map((r) => r.ringType).filter(Boolean))])

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.rings.filter((r) => {
    const matchQ = !q || (r.name || '').toLowerCase().includes(q)
    const matchT = !typeFilter.value || r.ringType === typeFilter.value
    return matchQ && matchT
  })
})
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">💍 แหวน</div>
        <div class="text-grey-5">ทั้งหมด {{ store.ringCount }} วง · แสดง {{ filtered.length }}</div>
      </div>
      <q-space />
      <q-input v-model="search" dense outlined dark placeholder="ค้นหาชื่อแหวน..." class="q-mr-sm" style="min-width: 200px" clearable>
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <q-select v-model="typeFilter" :options="typeOptions" dense outlined dark clearable placeholder="ประเภท" style="min-width: 150px" />
    </div>

    <div v-if="store.loading" class="tile-grid">
      <q-skeleton v-for="n in 24" :key="n" width="100px" height="124px" />
    </div>

    <div v-else-if="!filtered.length" class="text-center text-grey-5 q-pa-xl">
      <div class="text-h2">💍</div>
      ไม่พบแหวน
    </div>

    <div v-else class="tile-grid">
      <EntityTile
        v-for="ring in filtered"
        :key="ring.id"
        :name="ring.name"
        :img="ring.img"
        :border-color="colorOf(ring.grade)"
        :badge="ring.grade ? String(ring.grade) : ''"
        :badge-color="colorOf(ring.grade)"
        @click="open(ring)"
      />
    </div>

    <EntityDetailDialog v-model="showDetail" kind="ring" :item="selected" />
  </q-page>
</template>
