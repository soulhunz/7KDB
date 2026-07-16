<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useDataStore } from '@/stores/dataStore'
import { useAuthStore } from '@/stores/authStore'
import HeroBuildPickerDialog from '@/components/HeroBuildPickerDialog.vue'
import SkillQueueEditor from '@/components/SkillQueueEditor.vue'
import { FORMATIONS } from '@/config/warTeam'

const props = defineProps({
  modelValue: Boolean,
  team: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'save'])
const show = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

const $q = useQuasar()
const store = useDataStore()
const auth = useAuthStore()
const FALLBACK = 'https://placehold.co/80x80/0d1117/475569?text=%2B'

const blank = () => ({
  id: '', name: '', type: 'attack', formation: 'basic',
  heroes: ['', '', ''], pet: '', skillQueue: [], skillQueueAlts: [], note: '',
  visibility: 'public', allowedEmails: [], editorEmails: [],
})
const form = ref(blank())

function norm3(h) {
  const a = Array.isArray(h) ? h.map((x) => String(x || '')) : []
  while (a.length < 3) a.push('')
  return a.slice(0, 3)
}
watch(show, (v) => {
  if (!v) return
  form.value = props.team
    ? { ...blank(), ...JSON.parse(JSON.stringify(props.team)),
        heroes: norm3(props.team.heroes),
        skillQueue: props.team.skillQueue || [], skillQueueAlts: props.team.skillQueueAlts || [],
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

// picker
const showPicker = ref(false)
const pickerMode = ref('hero')
const pickTarget = ref(null)
function openHero(i) { pickerMode.value = 'hero'; pickTarget.value = i; showPicker.value = true }
function openPet() { pickerMode.value = 'pet'; pickTarget.value = 'pet'; showPicker.value = true }
function onPick(id) {
  if (pickTarget.value === 'pet') form.value.pet = String(id || '')
  else if (typeof pickTarget.value === 'number') form.value.heroes[pickTarget.value] = String(id || '')
}

const isOwnerOrNew = computed(() => !props.team || props.team.isOwner)
const canShareSettings = computed(() => auth.isPremium && isOwnerOrNew.value)
const canAltPlans = computed(() => auth.isPremium) // แผนสำรอง = Premium

// แผนสกิลสำรอง (Premium)
function addAlt() {
  form.value.skillQueueAlts.push({ name: 'แผน ' + String.fromCharCode(66 + form.value.skillQueueAlts.length), queue: [] })
}
function removeAlt(i) { form.value.skillQueueAlts.splice(i, 1) }

function save() {
  if (!form.value.name.trim()) { $q.notify({ type: 'warning', message: 'ตั้งชื่อทีมก่อน' }); return }
  if (!form.value.heroes.some((h) => h)) { $q.notify({ type: 'warning', message: 'เลือกฮีโร่อย่างน้อย 1 ตัว' }); return }
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

        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-6">
            <q-btn-toggle v-model="form.type" spread no-caps unelevated
              toggle-color="primary" color="grey-9" text-color="grey-5"
              :options="[{ label: '⚔️ ทีมบุก', value: 'attack' }, { label: '🛡️ ทีมรับ', value: 'defense' }]" />
          </div>
          <div class="col-12 col-sm-6">
            <q-select v-model="form.formation" :options="FORMATIONS" option-value="id" option-label="name"
              emit-value map-options dense outlined dark label="Formation" />
          </div>
        </div>

        <div>
          <div class="text-caption text-grey-5 q-mb-xs">ฮีโร่ (3 ตัว)</div>
          <div class="wt-slots">
            <div v-for="(h, i) in form.heroes" :key="i" class="wt-slot" @click="openHero(i)">
              <img v-if="heroById[h]" :src="heroById[h].img" @error="(e) => (e.target.src = FALLBACK)" />
              <q-icon v-else name="add" size="22px" color="grey-6" />
            </div>
            <div class="wt-slot wt-pet" @click="openPet">
              <img v-if="petById[form.pet]" :src="petById[form.pet].img" @error="(e) => (e.target.src = FALLBACK)" />
              <template v-else><q-icon name="pets" size="18px" color="grey-6" /></template>
            </div>
          </div>
          <div class="text-caption text-grey-7">3 ช่องแรก = ฮีโร่ · ช่องเขียว = เพ็ท</div>
        </div>

        <div>
          <div class="text-caption text-grey-5 q-mb-xs">🎯 ลำดับสกิล (คิว)</div>
          <SkillQueueEditor v-model="form.skillQueue" :heroes="form.heroes" :max="6" />
        </div>

        <!-- แผนสำรอง (Premium) -->
        <div>
          <div class="row items-center q-mb-xs">
            <div class="text-caption text-grey-5">🗂️ แผนสกิลสำรอง</div>
            <q-space />
            <q-badge v-if="!canAltPlans" color="amber-8" label="Premium" />
            <q-btn v-else flat dense no-caps size="sm" icon="add" label="เพิ่มแผน" color="primary" @click="addAlt" />
          </div>
          <template v-if="canAltPlans">
            <div v-for="(alt, i) in form.skillQueueAlts" :key="i" class="wt-alt">
              <div class="row items-center q-mb-xs">
                <q-input v-model="alt.name" dense borderless dark class="col" input-class="text-weight-bold" />
                <q-btn flat dense round size="sm" icon="delete" color="red-4" @click="removeAlt(i)" />
              </div>
              <SkillQueueEditor v-model="alt.queue" :heroes="form.heroes" :max="6" />
            </div>
          </template>
        </div>

        <q-input v-model="form.note" dense outlined dark type="textarea" rows="2" label="โน้ต (ไม่บังคับ)" />

        <!-- การแชร์ -->
        <q-separator dark />
        <div>
          <div class="row items-center q-mb-xs">
            <div class="text-subtitle2">🔗 การแชร์</div>
            <q-space />
            <q-badge v-if="!canShareSettings" color="amber-8" label="แชร์เจาะจง = Premium" />
          </div>
          <q-option-group
            v-model="form.visibility" :disable="!canShareSettings"
            :options="[
              { label: '🌍 ทุกคนเห็น (Public)', value: 'public' },
              { label: '🔒 เฉพาะอีเมลที่กำหนด', value: 'restricted' },
            ]" color="primary" dense
          />
          <q-select v-if="canShareSettings && form.visibility === 'restricted'"
            v-model="form.allowedEmails" dense outlined dark use-input use-chips multiple hide-dropdown-icon
            new-value-mode="add-unique" label="อีเมลที่ให้ดู (Enter เพื่อเพิ่ม)" class="q-mt-sm" />
          <q-select v-if="canShareSettings"
            v-model="form.editorEmails" dense outlined dark use-input use-chips multiple hide-dropdown-icon
            new-value-mode="add-unique" label="อีเมลที่ให้แก้ไขได้ (Enter เพื่อเพิ่ม)" class="q-mt-sm" />
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
.wt-card { width: 92vw; max-width: 560px; background: #0f1420; border-radius: 16px; display: flex; flex-direction: column; max-height: 90vh; }
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
.wt-alt { background: #12161f; border: 1px solid #262d38; border-radius: 10px; padding: 8px 10px; margin-bottom: 8px; }
</style>
