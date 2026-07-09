<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const label = computed(() => route.meta?.label || 'หน้านี้')
const icon = computed(() => route.meta?.icon || '🚧')
</script>

<template>
  <q-page class="flex flex-center column text-center q-pa-lg">
    <div class="text-h1 q-mb-md">{{ icon }}</div>
    <div class="text-h5 text-weight-bold q-mb-sm">{{ label }}</div>
    <div class="text-grey-5" style="max-width: 420px">
      หน้านี้ยังไม่ถูกพอร์ตจากเวอร์ชัน HTML — จะทยอยทำในเฟสถัดไป
    </div>
    <q-btn
      class="q-mt-lg"
      color="primary"
      outline
      icon="arrow_back"
      label="กลับหน้าภาพรวม"
      to="/"
    />
  </q-page>
</template>
