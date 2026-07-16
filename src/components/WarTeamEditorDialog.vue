<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useDataStore } from '@/stores/dataStore'
import { useAuthStore } from '@/stores/authStore'
import HeroBuildPickerDialog from '@/components/HeroBuildPickerDialog.vue'

const props = defineProps({
  modelValue: Boolean,
  team: { type: Object, default: null }, // null = สร้างใหม่
})
const emit = defineEmits(['update:modelValue', 'save'])
const show = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

const $q = useQuasar()
const store = useDataStore()
const auth = useAuthStore()
const FALLBACK = 'https://placehold.co/80x80/0d1117/475569?text=%2B'

const blank = () => ({
  id: '', name: '', type: 'attack', heroes: ['', '', '', '', ''], pet: '', note: '',
  visibility: 'public', allowedEmails: [], editorEmails: [],
})
const form = ref(blank())

function normHeroes(h) {
  const a = Array.isArray(h) ? h.map((x) => String(x || '')) : []
  while (a.length < 5) a.push('')
  return a.slice(0, 5)
}
watch(show, (v) => {
  if (!v) return
  form.value = props.team
    ? { ...blank(), ...JSON.parse(JSON.stringify(props.team)), heroes: normHeroes(props.team.heroes),
        allowedEmails: props.team.allowedEmails || [], editorEmails: props.team.editorEmails || [] }
    : blank()
})

const heroById = computed(() => {
  const m = {}
  store.heroes.forEach((h) => { if (h?.id != null) m[String(h.id)] = h })
  return m
})
const petById = computed(() => {
  const m = {}
  store.pets.forEach((p) => { if (p?.id != null) m[String(p.id)] = p })
  return m
})

// ---- picker ----
const showPicker = ref(false)
const pickerMode = ref('hero')
const pickTarget = ref(null)
function openHero(i) { pickerMode.value = 'hero'; pickTarget.value = i; showPicker.value = true }
function openPet() { pickerMode.value = 'pet'; pickTarget.value = 'pet'; showPicker.value = true }
function onPick(id) {
  if (pickTarget.value === 'pet') form.value.pet = String(id || '')
  else if (typeof pickTarget.value === 'number') form.value.heroes[pickTarget.value] = String(id || '')
}

// เจ้าของ (หรือทีมใหม่) เท่านั้นที่ตั้งค่าแชร์ได้ + ต้อง premium
const isOwnerOrNew = computed(() => !props.team || props.team.isOwner)
const canShareSettings = computed(() => auth.isPremium && isOwnerOrNew.value)

function save() {
  if (!form.value.name.trim()) {
    $q.notify({ type: 'warning', message: 'ตั้งชื่อทีมก่อน' })
    return
  }
  if (!form.value.heroes.some((h) => h)) {
    $q.notify({ type: 'warning', message: 'เลือกฮีโร่อย่างน้อย 1 ตัว' })
    return
  }
  emit('save', JSON.parse(JSON.stringify(form.value)))
}
</script>

<template>
  <q-dialog v-model="show">
    <q-card class="wt-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ team ? '✏️ แก้ไขทีม' : '➕ สร้างทีม' }}</div>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-card-section class="wt-body scroll q-gutter-md">
        <q-input v-model="form.name" dense outlined dark label="ชื่อทีม" maxlength="60" autofocus />

        <q-btn-toggle
          v-model="form.type"
          spread no-caps unelevated
          toggle-color="primary" color="grey-9" text-color="grey-5"
          :options="[
            { label: '⚔️ ทีมบุก', value: 'attack' },
            { label: '🛡️ ทีมรับ', value: 'defense' },
          ]"
        />

        <div>
          <div class="text-caption text-grey-5 q-mb-xs">ฮีโร่ (5 ช่อง)</div>
          <div class="wt-slots">
            <div v-for="(h, i) in form.heroes" :key="i" class="wt-slot" @click="openHero(i)">
              <img v-if="heroById[h]" :src="heroById[h].img" @error="(e) => (e.target.src = FALLBACK)" />
              <q-icon v-else name="add" size="20px" color="grey-6" />
            </div>
          </div>
        </div>

        <div class="row items-center q-gutter-md">
          <div>
            <div class="text-caption text-grey-5 q-mb-xs">เพ็ท</div>
            <div class="wt-slot wt-pet" @click="openPet">
              <img v-if="petById[form.pet]" :src="petById[form.pet].img" @error="(e) => (e.target.src = FALLBACK)" />
              <q-icon v-else name="add" size="20px" color="grey-6" />
            </div>
          </div>
          <q-input v-model="form.note" class="col" dense outlined dark type="textarea" rows="2" label="โน้ต (ไม่บังคับ)" />
        </div>

        <!-- ตั้งค่าแชร์ (Premium เท่านั้น) -->
        <q-separator dark />
        <div>
          <div class="row items-center q-mb-xs">
            <div class="text-subtitle2">🔗 การแชร์</div>
            <q-space />
            <q-badge v-if="!canShareSettings" color="amber-8" label="ตั้งค่าเจาะจง = Premium" />
          </div>

          <q-option-group
            v-model="form.visibility"
            :disable="!canShareSettings"
            :options="[
              { label: '🌍 ทุกคนเห็น (Public)', value: 'public' },
              { label: '🔒 เฉพาะอีเมลที่กำหนด', value: 'restricted' },
            ]"
            color="primary"
            dense
          />

          <template v-if="canShareSettings && form.visibility === 'restricted'">
            <q-select
              v-model="form.allowedEmails"
              dense outlined dark use-input use-chips multiple hide-dropdown-icon
              new-value-mode="add-unique" label="อีเมลที่ให้ดู (Enter เพื่อเพิ่ม)"
              class="q-mt-sm"
            />
          </template>

          <template v-if="canShareSettings">
            <q-select
              v-model="form.editorEmails"
              dense outlined dark use-input use-chips multiple hide-dropdown-icon
              new-value-mode="add-unique" label="อีเมลที่ให้แก้ไขได้ (Enter เพื่อเพิ่ม)"
              class="q-mt-sm"
            />
          </template>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat no-caps label="ยกเลิก" v-close-popup />
        <q-btn unelevated color="primary" no-caps icon="save" label="บันทึก" @click="save" />
      </q-card-actions>

      <HeroBuildPickerDialog v-model="showPicker" :mode="pickerMode" @pick="onPick" />
    </q-card>
  </q-dialog>
</template>

<style scoped>
.wt-card { width: 92vw; max-width: 520px; background: #0f1420; border-radius: 16px; display: flex; flex-direction: column; max-height: 88vh; }
.wt-body { overflow-y: auto; }
.wt-slots { display: flex; gap: 8px; flex-wrap: wrap; }
.wt-slot {
  width: 60px; height: 60px; border-radius: 10px; border: 2px solid #2a3441; background: #000;
  overflow: hidden; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: border-color 0.12s ease;
}
.wt-slot:hover { border-color: #3b82f6; }
.wt-slot img { width: 100%; height: 100%; object-fit: cover; }
.wt-pet { border-color: #22c55e55; }
</style>
