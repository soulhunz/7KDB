<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import EntityTile from '@/components/EntityTile.vue'
import EntityDetailDialog from '@/components/EntityDetailDialog.vue'
import { sortByRarityThenName, rarityQColor } from '@/config/rarity'

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

    <div v-if="store.loading" class="row q-col-gutter-sm">
      <div v-for="n in 24" :key="n" class="col-4 col-sm-3 col-md-2">
        <q-skeleton height="140px" />
      </div>
    </div>

    <div v-else-if="!filtered.length" class="text-center text-grey-6 q-pa-xl">
      <q-icon name="search_off" size="48px" class="q-mb-sm" />
      <div>ไม่พบสัตว์เลี้ยง</div>
    </div>

    <div v-else class="row q-col-gutter-sm">
      <div v-for="pet in filtered" :key="pet.id" class="col-4 col-sm-3 col-md-2">
        <EntityTile
          :name="pet.name"
          :img="pet.img"
          :badge="pet.rarity"
          :badge-color="rarityQColor(pet.rarity)"
          @click="open(pet)"
        />
      </div>
    </div>

    <EntityDetailDialog v-model="showDetail" kind="pet" :item="selected" />
  </q-page>
</template>
