<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'

const store = useDataStore()
const search = ref('')

const FALLBACK = 'https://placehold.co/160x160/0d1117/475569?text=%F0%9F%9B%A1%EF%B8%8F'

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
      <div v-for="n in 8" :key="n" class="col-6 col-sm-4 col-md-3"><q-skeleton height="200px" /></div>
    </div>

    <div v-else-if="!filtered.length" class="text-center text-grey-5 q-pa-xl">
      <div class="text-h2">🛡️</div>
      ไม่พบเซ็ตอุปกรณ์
    </div>

    <div v-else class="row q-col-gutter-sm">
      <div v-for="set in filtered" :key="set.id" class="col-6 col-sm-4 col-md-3">
        <q-card class="entity-card bg-dark" bordered>
          <q-img :src="set.img || FALLBACK" :ratio="1" loading="lazy" no-spinner @error="(e) => (e.target.src = FALLBACK)" />
          <q-card-section class="q-pa-sm">
            <div class="text-weight-bold ellipsis" :title="set.name">{{ set.name || 'ไม่มีชื่อ' }}</div>
            <div v-if="set.desc" class="text-caption text-grey-5 ellipsis-2-lines">{{ set.desc }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
