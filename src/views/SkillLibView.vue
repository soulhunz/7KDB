<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { SKILL_LIB_CATS, skillCatLabel, skillCatColor } from '@/config/skillCats'

const store = useDataStore()
const search = ref('')
const activeCat = ref('') // '' = ทั้งหมด

const catOf = (s) => s.category || 'other'

// จำนวนในแต่ละหมวด (ไว้โชว์บน chip)
const counts = computed(() => {
  const c = {}
  store.skillLib.forEach((s) => {
    const k = catOf(s)
    c[k] = (c[k] || 0) + 1
  })
  return c
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.skillLib
    .filter((s) => {
      const matchCat = !activeCat.value || catOf(s) === activeCat.value
      const matchQ =
        !q ||
        (s.name || '').toLowerCase().includes(q) ||
        (s.rawText || '').toLowerCase().includes(q)
      return matchCat && matchQ
    })
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'th'))
})

function desc(s) {
  return String(s.rawText || '').replace(/\s*\n\s*/g, ' ').slice(0, 140)
}
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-sm">
      <div>
        <div class="text-h5 text-weight-bold">📚 คลังสกิล</div>
        <div class="text-grey-5">ทั้งหมด {{ store.skillLib.length }} รายการ · แสดง {{ filtered.length }}</div>
      </div>
      <q-space />
      <q-input v-model="search" dense outlined dark clearable placeholder="ค้นหาชื่อ/คำอธิบาย..." style="min-width: 240px">
        <template #prepend><q-icon name="search" /></template>
      </q-input>
    </div>

    <!-- chip กรองหมวด -->
    <div class="row q-gutter-xs q-mb-md">
      <q-chip
        clickable
        :outline="activeCat !== ''"
        color="indigo"
        text-color="white"
        :selected="activeCat === ''"
        @click="activeCat = ''"
        :label="`ทั้งหมด (${store.skillLib.length})`"
      />
      <q-chip
        v-for="cat in SKILL_LIB_CATS"
        :key="cat.key"
        clickable
        :outline="activeCat !== cat.key"
        :color="cat.color"
        text-color="white"
        @click="activeCat = cat.key"
        :label="`${cat.label} (${counts[cat.key] || 0})`"
      />
    </div>

    <div v-if="store.loading" class="row q-col-gutter-sm">
      <div v-for="n in 9" :key="n" class="col-12 col-sm-6 col-md-4"><q-skeleton height="90px" /></div>
    </div>

    <div v-else-if="!filtered.length" class="text-center text-grey-6 q-pa-xl">
      <q-icon name="menu_book" size="48px" class="q-mb-sm" />
      <div>ยังไม่มีสกิลในคลัง</div>
    </div>

    <div v-else class="row q-col-gutter-sm">
      <div v-for="s in filtered" :key="s.id" class="col-12 col-sm-6 col-md-4">
        <q-card class="full-height">
          <q-card-section class="q-pb-xs">
            <div class="row items-center no-wrap">
              <q-avatar v-if="s.img" rounded size="32px" class="q-mr-sm">
                <img :src="s.img" />
              </q-avatar>
              <div class="text-weight-medium ellipsis col">{{ s.name || '(ไม่มีชื่อ)' }}</div>
            </div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-badge :color="skillCatColor(catOf(s))" :label="skillCatLabel(catOf(s))" class="q-mb-sm" />
            <div class="text-caption text-grey-5">
              {{ desc(s) || '— ยังไม่มีคำอธิบาย —' }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>
