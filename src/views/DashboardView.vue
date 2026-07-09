<script setup>
import { computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'

const store = useDataStore()

const stats = computed(() => [
  { label: 'ฮีโร่', value: store.heroCount, icon: '🦸', to: '/hero-manager', color: 'text-blue-4' },
  { label: 'สัตว์เลี้ยง', value: store.petCount, icon: '🐾', to: '/pet-manager', color: 'text-green-4' },
  { label: 'แหวน', value: store.ringCount, icon: '💍', to: '/ring-manager', color: 'text-purple-4' },
  { label: 'กิลด์', value: store.guildCount, icon: '🏰', to: '/guild-manager', color: 'text-orange-4' },
  { label: 'ลูกกิลทั้งหมด', value: store.memberCount, icon: '👥', to: '/member-roster', color: 'text-teal-4' },
])
</script>

<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-xs">🏠 ภาพรวม</div>
    <div class="text-grey-5 q-mb-lg">สรุปข้อมูลกิลด์จากฐานข้อมูล</div>

    <div v-if="store.loading" class="row q-col-gutter-md">
      <div v-for="n in 5" :key="n" class="col-6 col-sm-4 col-md-2">
        <q-skeleton height="120px" />
      </div>
    </div>

    <q-banner v-else-if="store.error" class="bg-red-9 text-white q-mb-md" rounded>
      <template #avatar><q-icon name="error" /></template>
      โหลดข้อมูลไม่สำเร็จ: {{ store.error }}
    </q-banner>

    <div v-else class="row q-col-gutter-md">
      <div v-for="s in stats" :key="s.label" class="col-6 col-sm-4 col-md-2">
        <q-card
          class="entity-card bg-dark cursor-pointer text-center q-pa-md"
          bordered
          @click="$router.push(s.to)"
        >
          <div class="text-h3">{{ s.icon }}</div>
          <div class="text-h4 text-weight-bold" :class="s.color">{{ s.value }}</div>
          <div class="text-grey-5">{{ s.label }}</div>
        </q-card>
      </div>
    </div>

    <div class="text-caption text-grey-6 q-mt-lg">
      อัปเดตล่าสุด: {{ store.timestamp ? new Date(store.timestamp).toLocaleString('th-TH') : '—' }}
    </div>
  </q-page>
</template>
