<script setup>
// การ์ดแสดงฮีโร่/สัตว์เลี้ยง (ใช้ field ร่วม: name, img, rarity, type, affiliation)
defineProps({
  name: { type: String, default: '' },
  img: { type: String, default: '' },
  rarity: { type: String, default: '' },
  type: { type: String, default: '' },
  affiliation: { type: String, default: '' },
})

const FALLBACK = 'https://placehold.co/160x160/0d1117/475569?text=%3F'
</script>

<template>
  <q-card class="entity-card bg-dark" bordered>
    <q-img
      :src="img || FALLBACK"
      :ratio="1"
      loading="lazy"
      no-spinner
      @error="(e) => (e.target.src = FALLBACK)"
    >
      <q-badge
        v-if="rarity"
        class="absolute-top-left q-ma-xs"
        color="deep-orange-9"
        :label="rarity"
      />
    </q-img>
    <q-card-section class="q-pa-sm">
      <div class="text-weight-bold ellipsis" :title="name">{{ name || '—' }}</div>
      <div class="row items-center q-gutter-xs q-mt-xs">
        <q-badge v-if="type" color="blue-9" outline :label="type" />
        <q-badge v-if="affiliation" color="purple-9" outline :label="affiliation" />
      </div>
    </q-card-section>
  </q-card>
</template>
