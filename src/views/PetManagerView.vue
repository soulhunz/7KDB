<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import EntityCard from '@/components/EntityCard.vue'

const store = useDataStore()
const search = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.pets.filter((p) => !q || (p.name || '').toLowerCase().includes(q))
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
      <q-input
        v-model="search"
        dense
        outlined
        dark
        placeholder="ค้นหาชื่อ..."
        style="min-width: 200px"
        clearable
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
    </div>

    <div v-if="store.loading" class="row q-col-gutter-sm">
      <div v-for="n in 12" :key="n" class="col-6 col-sm-3 col-md-2">
        <q-skeleton height="180px" />
      </div>
    </div>

    <div v-else-if="!filtered.length" class="text-center text-grey-5 q-pa-xl">
      <div class="text-h2">🔍</div>
      ไม่พบสัตว์เลี้ยง
    </div>

    <div v-else class="row q-col-gutter-sm">
      <div v-for="pet in filtered" :key="pet.id" class="col-6 col-sm-3 col-md-2">
        <EntityCard
          :name="pet.name"
          :img="pet.img"
          :rarity="pet.rarity"
          :type="pet.type"
          :affiliation="pet.affiliation"
        />
      </div>
    </div>
  </q-page>
</template>
