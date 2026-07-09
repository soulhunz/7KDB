<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import EntityTile from '@/components/EntityTile.vue'
import EntityDetailDialog from '@/components/EntityDetailDialog.vue'
import { sortByRarityThenName } from '@/config/rarity'

const store = useDataStore()
const search = ref('')

const showDetail = ref(false)
const selected = ref(null)
function open(pet) {
  selected.value = pet
  showDetail.value = true
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = store.pets.filter((p) => !q || (p.name || '').toLowerCase().includes(q))
  // เรียง ตำนาน → หายาก แล้วตามชื่อ (ตามลำดับความหายากเดียวกับฮีโร่)
  return sortByRarityThenName(list)
})
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">🐾 สัตว์เลี้ยง</div>
        <div class="text-grey-5">ทั้งหมด {{ store.petCount }} ตัว · แสดง {{ filtered.length }}</div>
      </div>
      <q-space />
      <q-input v-model="search" dense outlined dark placeholder="ค้นหาชื่อ..." style="min-width: 200px" clearable>
        <template #prepend><q-icon name="search" /></template>
      </q-input>
    </div>

    <div v-if="store.loading" class="tile-grid">
      <q-skeleton v-for="n in 24" :key="n" width="100px" height="124px" />
    </div>

    <div v-else-if="!filtered.length" class="text-center text-grey-5 q-pa-xl">
      <div class="text-h2">🔍</div>
      ไม่พบสัตว์เลี้ยง
    </div>

    <div v-else class="tile-grid">
      <EntityTile
        v-for="pet in filtered"
        :key="pet.id"
        :name="pet.name"
        :img="pet.img"
        :badge="pet.rarity"
        @click="open(pet)"
      />
    </div>

    <EntityDetailDialog v-model="showDetail" kind="pet" :item="selected" />
  </q-page>
</template>
