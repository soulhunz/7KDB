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

    <div v-if="store.loading" class="row q-col-gutter-sm">
      <div v-for="n in 16" :key="n" class="col-4 col-sm-3 col-md-2">
        <q-skeleton height="140px" />
      </div>
    </div>

    <div v-else-if="!filtered.length" class="text-center text-grey-6 q-pa-xl">
      <q-icon name="search_off" size="48px" class="q-mb-sm" />
      <div>ไม่พบเซ็ตอุปกรณ์</div>
    </div>

    <div v-else class="row q-col-gutter-sm">
      <div v-for="set in filtered" :key="set.id" class="col-4 col-sm-3 col-md-2">
        <EntityTile
          :name="set.name"
          :img="set.img"
          :badge="set.setType"
          badge-color="orange-8"
          @click="open(set)"
        />
      </div>
    </div>

    <EntityDetailDialog v-model="showDetail" kind="equip" :item="selected" />
  </q-page>
</template>
