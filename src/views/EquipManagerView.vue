<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import EntityTile from '@/components/EntityTile.vue'
import EntityDetailDialog from '@/components/EntityDetailDialog.vue'

const store = useDataStore()
const search = ref('')

const showDetail = ref(false)
const selected = ref(null)
function open(set) {
  selected.value = set
  showDetail.value = true
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.equipSets.filter(
    (s) => !q || (s.name || '').toLowerCase().includes(q) || (s.desc || '').toLowerCase().includes(q)
  )
})
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">🛡️ เซ็ตอุปกรณ์</div>
        <div class="text-grey-5">ทั้งหมด {{ store.equipSets.length }} เซ็ต · แสดง {{ filtered.length }}</div>
      </div>
      <q-space />
      <q-input v-model="search" dense outlined dark clearable placeholder="ค้นหา..." style="min-width: 220px">
        <template #prepend><q-icon name="search" /></template>
      </q-input>
    </div>

    <div v-if="store.loading" class="tile-grid">
      <q-skeleton v-for="n in 16" :key="n" width="100px" height="124px" />
    </div>

    <div v-else-if="!filtered.length" class="text-center text-grey-5 q-pa-xl">
      <div class="text-h2">🛡️</div>
      ไม่พบเซ็ตอุปกรณ์
    </div>

    <div v-else class="tile-grid">
      <EntityTile
        v-for="set in filtered"
        :key="set.id"
        :name="set.name"
        :img="set.img"
        :badge="set.setType"
        badge-color="#c2410c"
        @click="open(set)"
      />
    </div>

    <EntityDetailDialog v-model="showDetail" kind="equip" :item="selected" />
  </q-page>
</template>
