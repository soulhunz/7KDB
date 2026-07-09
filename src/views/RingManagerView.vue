<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'

const store = useDataStore()
const search = ref('')
const typeFilter = ref(null)

const FALLBACK = 'https://placehold.co/96x96/0d1117/475569?text=%F0%9F%92%8D'

// สีขอบตามเกรด 1-6 (โทนไล่จากเทา → ทอง)
const gradeColor = {
  1: '#6b7280',
  2: '#22c55e',
  3: '#3b82f6',
  4: '#a855f7',
  5: '#f97316',
  6: '#eab308',
}

const typeOptions = computed(() => {
  const set = new Set(store.rings.map((r) => r.ringType).filter(Boolean))
  return [...set]
})

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
      <q-input
        v-model="search"
        dense
        outlined
        dark
        placeholder="ค้นหาชื่อแหวน..."
        class="q-mr-sm"
        style="min-width: 200px"
        clearable
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <q-select
        v-model="typeFilter"
        :options="typeOptions"
        dense
        outlined
        dark
        clearable
        placeholder="ประเภท"
        style="min-width: 150px"
      />
    </div>

    <div v-if="store.loading" class="row q-col-gutter-sm">
      <div v-for="n in 8" :key="n" class="col-12 col-sm-6 col-md-4">
        <q-skeleton height="90px" />
      </div>
    </div>

    <div v-else-if="!filtered.length" class="text-center text-grey-5 q-pa-xl">
      <div class="text-h2">💍</div>
      ไม่พบแหวน
    </div>

    <div v-else class="row q-col-gutter-sm">
      <div v-for="ring in filtered" :key="ring.id" class="col-12 col-sm-6 col-md-4">
        <q-card class="entity-card bg-dark row items-center no-wrap q-pa-sm" bordered>
          <q-avatar
            rounded
            size="64px"
            :style="{ border: `2px solid ${gradeColor[ring.grade] || '#6b7280'}` }"
          >
            <img :src="ring.img || FALLBACK" @error="(e) => (e.target.src = FALLBACK)" />
          </q-avatar>
          <div class="q-ml-md col overflow-hidden">
            <div class="row items-center q-gutter-xs">
              <span class="text-weight-bold ellipsis">{{ ring.name || '—' }}</span>
              <q-badge
                v-if="ring.grade"
                :style="{ backgroundColor: gradeColor[ring.grade] || '#6b7280' }"
                :label="'เกรด ' + ring.grade"
              />
            </div>
            <div v-if="ring.ringType" class="text-caption text-grey-4">{{ ring.ringType }}</div>
            <div v-if="ring.desc" class="text-caption text-grey-5 ellipsis-2-lines">{{ ring.desc }}</div>
          </div>
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
