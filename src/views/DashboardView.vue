<script setup>
import { computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'

const store = useDataStore()

const stats = computed(() => [
  { label: 'ฮีโร่', value: store.heroCount, icon: 'shield_moon', to: '/hero-manager', color: 'blue' },
  { label: 'สัตว์เลี้ยง', value: store.petCount, icon: 'pets', to: '/pet-manager', color: 'green' },
  { label: 'แหวน', value: store.ringCount, icon: 'workspaces', to: '/ring-manager', color: 'deep-purple' },
  { label: 'เซ็ตอุปกรณ์', value: store.equipSets.length, icon: 'security', to: '/equip-manager', color: 'orange' },
  { label: 'กิลด์', value: store.guildCount, icon: 'castle', to: '/guild-manager', color: 'red' },
  { label: 'ลูกกิลทั้งหมด', value: store.memberCount, icon: 'groups', to: '/member-roster', color: 'teal' },
])
</script>

<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-weight-medium q-mb-xs">ภาพรวม</div>
    <div class="text-grey-6 q-mb-lg">สรุปข้อมูลกิลด์จากฐานข้อมูล</div>

    <div v-if="store.loading" class="row q-col-gutter-md">
      <div v-for="n in 6" :key="n" class="col-6 col-sm-4 col-md-2">
        <q-skeleton height="128px" />
      </div>
    </div>

    <q-banner v-else-if="store.error" class="bg-negative text-white q-mb-md" rounded>
      <template #avatar><q-icon name="error" /></template>
      โหลดข้อมูลไม่สำเร็จ: {{ store.error }}
    </q-banner>

    <div v-else class="row q-col-gutter-md">
      <div v-for="s in stats" :key="s.label" class="col-6 col-sm-4 col-md-2">
        <q-card v-ripple class="cursor-pointer" @click="$router.push(s.to)">
          <q-card-section class="column items-center q-py-lg">
            <q-avatar :color="s.color" text-color="white" :icon="s.icon" size="52px" />
            <div class="text-h4 text-weight-bold q-mt-sm">{{ s.value }}</div>
            <div class="text-grey-6">{{ s.label }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="text-caption text-grey-7 q-mt-lg">
      อัปเดตล่าสุด:
      {{ store.timestamp ? new Date(store.timestamp).toLocaleString('th-TH') : '—' }}
    </div>
  </q-page>
</template>
