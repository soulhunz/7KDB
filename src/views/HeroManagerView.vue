<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import EntityCard from '@/components/EntityCard.vue'

const store = useDataStore()
const search = ref('')
const rarityFilter = ref(null)

const rarityOptions = computed(() => {
  const set = new Set(store.heroes.map((h) => h.rarity).filter(Boolean))
  return [...set]
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.heroes.filter((h) => {
    const matchQ = !q || (h.name || '').toLowerCase().includes(q)
    const matchR = !rarityFilter.value || h.rarity === rarityFilter.value
    return matchQ && matchR
  })
})
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">🦸 ฮีโร่</div>
        <div class="text-grey-5">ทั้งหมด {{ store.heroCount }} ตัว · แสดง {{ filtered.length }}</div>
      </div>
      <q-space />
      <q-input
        v-model="search"
        dense
        outlined
        dark
        placeholder="ค้นหาชื่อฮีโร่..."
        class="q-mr-sm"
        style="min-width: 200px"
        clearable
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <q-select
        v-model="rarityFilter"
        :options="rarityOptions"
        dense
        outlined
        dark
        clearable
        placeholder="เรตติ้ง"
        style="min-width: 140px"
      />
    </div>

    <div v-if="store.loading" class="row q-col-gutter-sm">
      <div v-for="n in 12" :key="n" class="col-6 col-sm-3 col-md-2">
        <q-skeleton height="180px" />
      </div>
    </div>

    <div v-else-if="!filtered.length" class="text-center text-grey-5 q-pa-xl">
      <div class="text-h2">🔍</div>
      ไม่พบฮีโร่ที่ตรงกับเงื่อนไข
    </div>

    <div v-else class="row q-col-gutter-sm">
      <div
        v-for="hero in filtered"
        :key="hero.id"
        class="col-6 col-sm-3 col-md-2"
      >
        <EntityCard
          :name="hero.name"
          :img="hero.img"
          :rarity="hero.rarity"
          :type="hero.type"
          :affiliation="hero.affiliation"
        />
      </div>
    </div>
  </q-page>
</template>
