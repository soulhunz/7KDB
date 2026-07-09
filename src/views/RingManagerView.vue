<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import EntityTile from '@/components/EntityTile.vue'
import EntityDetailDialog from '@/components/EntityDetailDialog.vue'
import { gradeQColor } from '@/config/rarity'

const store = useDataStore()
const search = ref('')
const typeFilter = ref(null)

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

    <div v-if="store.loading" class="row q-col-gutter-sm">
      <div v-for="n in 24" :key="n" class="col-4 col-sm-3 col-md-2">
        <q-skeleton height="140px" />
      </div>
    </div>

    <div v-else-if="!filtered.length" class="text-center text-grey-6 q-pa-xl">
      <q-icon name="search_off" size="48px" class="q-mb-sm" />
      <div>ไม่พบแหวน</div>
    </div>

    <div v-else class="row q-col-gutter-sm">
      <div v-for="ring in filtered" :key="ring.id" class="col-4 col-sm-3 col-md-2">
        <EntityTile
          :name="ring.name"
          :img="ring.img"
          :badge="ring.grade ? 'เกรด ' + ring.grade : ''"
          :badge-color="gradeQColor(ring.grade)"
          @click="open(ring)"
        />
      </div>
    </div>

    <EntityDetailDialog v-model="showDetail" kind="ring" :item="selected" />
  </q-page>
</template>
