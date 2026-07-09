<script setup>
// การ์ดรายการ (ฮีโร่/สัตว์/แหวน/เซ็ต) — Quasar Material
defineProps({
  name: { type: String, default: '' },
  img: { type: String, default: '' },
  badge: { type: String, default: '' },
  badgeColor: { type: String, default: 'primary' },
})
defineEmits(['click'])

const FALLBACK = 'https://placehold.co/200x200/1d1d1d/616161?text=%3F'
</script>

<template>
  <q-card v-ripple class="cursor-pointer" @click="$emit('click')">
    <q-img :src="img || FALLBACK" :ratio="1" no-spinner @error="(e) => (e.target.src = FALLBACK)">
      <q-badge v-if="badge" :color="badgeColor" class="absolute-top-left q-ma-xs" :label="badge" />
    </q-img>
    <q-card-section class="q-pa-sm">
      <div class="text-caption text-weight-medium ellipsis text-center" :title="name">
        {{ name || '—' }}
      </div>
    </q-card-section>
  </q-card>
</template>
