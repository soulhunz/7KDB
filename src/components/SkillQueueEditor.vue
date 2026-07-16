<script setup>
import { computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { QUEUE_SKILLS, skillLabel, skillColor } from '@/config/warTeam'

// แก้ไข "ลำดับสกิล" 1 ชุด — item = { hero: heroId, skill: 'n'|'s1'|'s2'|'p' }
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  heroes: { type: Array, default: () => [] }, // 3 hero ids
  max: { type: Number, default: 6 },
})
const emit = defineEmits(['update:modelValue'])
const store = useDataStore()

const heroById = computed(() => {
  const m = {}
  store.heroes.forEach((h) => { if (h?.id != null) m[String(h.id)] = h })
  return m
})
const chosenHeroes = computed(() => props.heroes.filter((h) => h))

function add(heroId, skill) {
  if (props.modelValue.length >= props.max) return
  emit('update:modelValue', [...props.modelValue, { hero: String(heroId), skill }])
}
function removeAt(i) {
  const arr = props.modelValue.slice()
  arr.splice(i, 1)
  emit('update:modelValue', arr)
}
</script>

<template>
  <div class="sq">
    <!-- คิวปัจจุบัน -->
    <div v-if="modelValue.length" class="sq-queue">
      <div v-for="(step, i) in modelValue" :key="i" class="sq-step" @click="removeAt(i)">
        <span class="sq-order">{{ i + 1 }}</span>
        <q-avatar rounded size="24px">
          <img v-if="heroById[step.hero]" :src="heroById[step.hero].img" />
          <q-icon v-else name="person" size="14px" />
        </q-avatar>
        <q-badge :color="skillColor(step.skill)" :label="skillLabel(step.skill)" />
        <q-icon name="close" size="12px" class="sq-x" />
      </div>
    </div>
    <div v-else class="text-caption text-grey-6 q-mb-xs">ยังไม่มีลำดับสกิล — เลือกสกิลจากฮีโร่ด้านล่าง</div>

    <!-- เลือกสกิลจากฮีโร่ในทีม -->
    <div v-if="chosenHeroes.length" class="sq-picker">
      <div v-for="hid in chosenHeroes" :key="hid" class="sq-hero">
        <q-avatar rounded size="30px">
          <img v-if="heroById[hid]" :src="heroById[hid].img" />
        </q-avatar>
        <div class="sq-skills">
          <q-btn
            v-for="s in QUEUE_SKILLS"
            :key="s.key"
            dense unelevated size="sm" no-caps
            :color="s.color"
            :label="s.label"
            :disable="modelValue.length >= max"
            @click="add(hid, s.key)"
          />
        </div>
      </div>
    </div>
    <div v-else class="text-caption text-grey-7">เลือกฮีโร่ก่อนจึงจะกำหนดลำดับสกิลได้</div>
  </div>
</template>

<style scoped>
.sq-queue { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.sq-step {
  display: flex; align-items: center; gap: 4px; padding: 2px 6px 2px 2px;
  background: #161b22; border: 1px solid #2a3441; border-radius: 999px; cursor: pointer;
}
.sq-step:hover { border-color: #ef4444; }
.sq-order { font-size: 10px; font-weight: 800; color: #94a3b8; width: 14px; text-align: center; }
.sq-x { color: #ef4444; }
.sq-picker { display: flex; flex-direction: column; gap: 6px; }
.sq-hero { display: flex; align-items: center; gap: 8px; }
.sq-skills { display: flex; gap: 4px; flex-wrap: wrap; }
</style>
