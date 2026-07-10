<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import HeroBuildDetailDialog from '@/components/HeroBuildDetailDialog.vue'

const store = useDataStore()
const search = ref('')

const FALLBACK = 'https://placehold.co/64x64/0d1117/475569?text=%3F'
const onErr = (e) => (e.target.src = FALLBACK)

// จับคู่ hero / set ให้แต่ละบิ้ว + ใหม่สุดขึ้นก่อน
const cards = computed(() => {
  const builds = Array.isArray(store.heroBuilds) ? store.heroBuilds.slice().reverse() : []
  return builds.map((b) => {
    const hid = b.heroId || b.data?.heroId
    const hero = store.heroes.find((h) => String(h.id) === String(hid)) || null
    const setId = b.data?.setId
    const set = setId ? store.equipSets.find((s) => String(s.id) === String(setId)) || null : null
    return { build: b, hero, set }
  })
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return cards.value
  return cards.value.filter(
    (c) =>
      (c.build.name || '').toLowerCase().includes(q) ||
      (c.build.owner || '').toLowerCase().includes(q) ||
      (c.hero?.name || '').toLowerCase().includes(q) ||
      (c.set?.name || '').toLowerCase().includes(q),
  )
})

const showDetail = ref(false)
const selected = ref(null)
function open(build) {
  selected.value = build
  showDetail.value = true
}
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">🔨 บิ้วตัวละคร</div>
        <div class="text-grey-5">
          บิ้วที่เผยแพร่ทั้งหมด {{ store.heroBuilds.length }} · แสดง {{ filtered.length }}
        </div>
      </div>
      <q-space />
      <q-input v-model="search" dense outlined dark clearable placeholder="ค้นหาบิ้ว/ผู้สร้าง/ตัวละคร..." style="min-width: 240px">
        <template #prepend><q-icon name="search" /></template>
      </q-input>
    </div>

    <div v-if="store.loading && !store.heroBuilds.length" class="build-grid">
      <q-skeleton v-for="n in 6" :key="n" height="96px" class="rounded-borders" />
    </div>

    <div v-else-if="!filtered.length" class="text-center text-grey-5 q-pa-xl">
      <div class="text-h2 q-mb-sm">📋</div>
      <div v-if="store.heroBuilds.length">ไม่พบบิ้วที่ตรงกับคำค้น</div>
      <div v-else>ยังไม่มีบิ้วที่เผยแพร่</div>
    </div>

    <div v-else class="build-grid">
      <div
        v-for="c in filtered"
        :key="c.build.id"
        class="build-card"
        @click="open(c.build)"
      >
        <div class="build-portrait">
          <img v-if="c.hero" :src="c.hero.img || FALLBACK" @error="onErr" />
          <span v-else class="build-portrait-empty">🦸</span>
        </div>
        <div class="build-meta">
          <div class="build-name" :title="c.build.name">{{ c.build.name || 'บิ้วไม่มีชื่อ' }}</div>
          <div class="build-hero">{{ c.hero ? c.hero.name : '— ไม่พบตัวละคร —' }}</div>
          <div class="build-owner">โดย {{ c.build.owner || 'ไม่ระบุ' }}</div>
          <div v-if="c.set" class="build-set">🛡️ {{ c.set.name }}</div>
        </div>
      </div>
    </div>

    <HeroBuildDetailDialog v-model="showDetail" :build="selected" />
  </q-page>
</template>

<style scoped>
.build-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}
.build-card {
  display: flex;
  gap: 12px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 16px;
  padding: 14px;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
}
.build-card:hover {
  transform: translateY(-2px);
  border-color: #3b82f6;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
}
.build-portrait {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  border: 2px solid rgba(59, 130, 246, 0.4);
  overflow: hidden;
  background: #000;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.build-portrait img { width: 100%; height: 100%; object-fit: cover; display: block; }
.build-portrait-empty { font-size: 1.6rem; opacity: 0.3; }
.build-meta { min-width: 0; flex: 1; }
.build-name {
  font-size: 0.95rem;
  font-weight: 800;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.build-hero {
  font-size: 0.78rem;
  color: #93c5fd;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.build-owner { font-size: 0.7rem; color: #6b7280; }
.build-set {
  font-size: 0.72rem;
  color: rgba(34, 211, 238, 0.85);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
