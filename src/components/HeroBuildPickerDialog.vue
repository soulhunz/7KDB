<script setup>
import { ref, computed, watch } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { sortByRarityThenName } from '@/config/rarity'

const props = defineProps({
  modelValue: Boolean,
  mode: { type: String, default: 'hero' }, // 'hero' | 'set' | 'pet'
  currentId: { type: [String, Number], default: '' },
  /** ไอดีที่อยู่ช่องอื่นแล้ว — ยังเลือกได้ (จะสลับตำแหน่ง) */
  placedIds: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'pick'])
const show = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

const store = useDataStore()
const search = ref('')
watch(() => props.modelValue, (v) => { if (v) search.value = '' })

const FALLBACK = 'https://placehold.co/80x80/0d1117/475569?text=%3F'
const onErr = (e) => (e.target.src = FALLBACK)

const title = computed(() =>
  props.mode === 'hero' ? 'เลือกตัวละคร' : props.mode === 'pet' ? 'เลือกสัตว์เลี้ยง' : 'เลือกเซตอุปกรณ์'
)
const accent = computed(() =>
  props.mode === 'hero' ? '#3b82f6' : props.mode === 'pet' ? '#22c55e' : '#06b6d4'
)
const placedSet = computed(() => {
  const cur = String(props.currentId || '')
  return new Set((props.placedIds || []).map(String).filter((id) => id && id !== cur))
})
function isPlacedElsewhere(id) {
  return placedSet.value.has(String(id))
}

const items = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (props.mode === 'hero') {
    return sortByRarityThenName(
      store.heroes.filter((h) => !q || String(h.name || '').toLowerCase().includes(q)),
    )
  }
  if (props.mode === 'pet') {
    return sortByRarityThenName(
      store.pets.filter((p) => !q || String(p.name || '').toLowerCase().includes(q)),
    )
  }
  return store.equipSets.filter(
    (s) => !String(s.name || '').includes('ยำ') && (!q || String(s.name || '').toLowerCase().includes(q)),
  )
})

function pick(id) {
  emit('pick', id)
  show.value = false
}
</script>

<template>
  <q-dialog v-model="show">
    <q-card class="picker-card">
      <div class="picker-head">
        <div class="text-weight-bold text-white">{{ title }}</div>
        <q-space />
        <q-btn flat round dense icon="close" color="white" v-close-popup />
      </div>
      <div class="q-px-md q-pb-sm">
        <q-input v-model="search" dense outlined dark clearable placeholder="ค้นหา..." >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>
      <q-card-section class="picker-body scroll">
        <div class="picker-grid">
          <!-- ไม่เลือก -->
          <div class="picker-item" @click="pick('')">
            <div class="picker-img picker-none">✕</div>
            <div class="picker-name">— {{ mode === 'hero' ? 'ไม่เลือก' : 'ไม่ใส่เซต' }} —</div>
          </div>
          <div
            v-for="it in items"
            :key="it.id"
            class="picker-item"
            :class="{ swap: isPlacedElsewhere(it.id) }"
            @click="pick(it.id)"
          >
            <div
              class="picker-img"
              :style="String(currentId) === String(it.id) ? { boxShadow: `0 0 0 2px ${accent}` } : {}"
            >
              <img :src="it.img || FALLBACK" @error="onErr" loading="lazy" />
              <span v-if="isPlacedElsewhere(it.id)" class="picker-swap-badge">สลับ</span>
            </div>
            <div class="picker-name" :title="it.name">{{ it.name }}</div>
            <q-tooltip v-if="isPlacedElsewhere(it.id)">กดเพื่อสลับตำแหน่งกับช่องนี้</q-tooltip>
          </div>
        </div>
        <div v-if="!items.length" class="text-center text-grey-6 q-py-lg">ไม่พบรายการ</div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.picker-card {
  width: 92vw;
  max-width: 640px;
  height: 80vh;
  max-height: 720px;
  display: flex;
  flex-direction: column;
  background: #0f1420;
  border-radius: 16px;
  overflow: hidden;
}
.picker-head { display: flex; align-items: center; padding: 12px 8px 12px 16px; }
.picker-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 8px 16px 20px; }
.picker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 12px; }
.picker-item { cursor: pointer; }
.picker-img {
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  border: 1px solid #30363d;
  overflow: hidden;
  background: #000;
  transition: border-color 0.12s ease;
}
.picker-item:hover .picker-img { border-color: #60a5fa; }
.picker-item.swap .picker-img { border-color: #f59e0b; }
.picker-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.picker-swap-badge {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 2px 0;
  background: rgba(245, 158, 11, 0.92);
  color: #111;
  font-size: 0.58rem;
  font-weight: 800;
  text-align: center;
  line-height: 1.2;
}
.picker-none { display: flex; align-items: center; justify-content: center; color: #4b5563; border-style: dashed; }
.picker-name {
  font-size: 0.68rem;
  color: #cbd5e1;
  text-align: center;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
