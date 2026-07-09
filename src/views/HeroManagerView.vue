<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import EntityTile from '@/components/EntityTile.vue'
import EntityDetailDialog from '@/components/EntityDetailDialog.vue'

const store = useDataStore()
const search = ref('')
const rarityFilter = ref(null)

const showDetail = ref(false)
const selected = ref(null)
function open(hero) {
  selected.value = hero
  showDetail.value = true
}

const rarityOptions = computed(() => [...new Set(store.heroes.map((h) => h.rarity).filter(Boolean))])

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
      <q-input v-model="search" dense outlined dark placeholder="ค้นหาชื่อฮีโร่..." class="q-mr-sm" style="min-width: 200px" clearable>
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <q-select v-model="rarityFilter" :options="rarityOptions" dense outlined dark clearable placeholder="เรตติ้ง" style="min-width: 140px" />
    </div>

    <div v-if="store.loading" class="tile-grid">
      <q-skeleton v-for="n in 24" :key="n" width="100px" height="124px" />
    </div>

    <div v-else-if="!filtered.length" class="text-center text-grey-5 q-pa-xl">
      <div class="text-h2">🔍</div>
      ไม่พบฮีโร่ที่ตรงกับเงื่อนไข
    </div>

    <div v-else class="tile-grid">
      <EntityTile
        v-for="hero in filtered"
        :key="hero.id"
        :name="hero.name"
        :img="hero.img"
        :badge="hero.rarity"
        @click="open(hero)"
      />
    </div>

    <EntityDetailDialog v-model="showDetail" kind="hero" :item="selected" />
  </q-page>
</template>
