<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useDataStore } from '@/stores/dataStore'
import { useAuthStore } from '@/stores/authStore'
import HeroBuildPickerDialog from '@/components/HeroBuildPickerDialog.vue'
import { FORMATIONS, formationDef, QUEUE_SKILLS, skillLabel, skillColor } from '@/config/warTeam'

const props = defineProps({ modelValue: Boolean, team: { type: Object, default: null } })
const emit = defineEmits(['update:modelValue', 'save'])
const show = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

const $q = useQuasar()
const store = useDataStore()
const auth = useAuthStore()
const FALLBACK = 'https://placehold.co/80x80/0d1117/475569?text=%2B'

const blank = () => ({
  id: '', name: '', type: 'attack', formation: 'basic',
  heroes: ['', '', '', '', ''], pets: ['', '', ''], skillQueue: [null, null, null],
  skillQueueAlts: [], note: '', visibility: 'public', allowedEmails: [], editorEmails: [],
})
const form = ref(blank())

function fix(arr, n) { const a = Array.isArray(arr) ? arr.slice(0, n) : []; while (a.length < n) a.push(''); return a }
function fixQueue(q) { const a = Array.isArray(q) ? q.slice(0, 3) : []; while (a.length < 3) a.push(null); return a }
watch(show, (v) => {
  if (!v) return
  form.value = props.team
    ? { ...blank(), ...JSON.parse(JSON.stringify(props.team)),
        heroes: fix(props.team.heroes, 5), pets: fix(props.team.pets, 3), skillQueue: fixQueue(props.team.skillQueue),
        skillQueueAlts: props.team.skillQueueAlts || [],
        allowedEmails: props.team.allowedEmails || [], editorEmails: props.team.editorEmails || [] }
    : blank()
})

const heroById = computed(() => { const m = {}; store.heroes.forEach((h) => { if (h?.id != null) m[String(h.id)] = h }); return m })
const petById = computed(() => { const m = {}; store.pets.forEach((p) => { if (p?.id != null) m[String(p.id)] = p }); return m })

const fdef = computed(() => formationDef(form.value.formation))
const backIdx = computed(() => Array.from({ length: fdef.value.back }, (_, i) => i))
const frontIdx = computed(() => Array.from({ length: fdef.value.front }, (_, i) => fdef.value.back + i))
const placedHeroes = computed(() => form.value.heroes.filter((h) => h))

// picker
const showPicker = ref(false)
const pickerMode = ref('hero')
const pickTarget = ref(null)
function openHero(i) { pickerMode.value = 'hero'; pickTarget.value = { t: 'hero', i }; showPicker.value = true }
function openPet(i) { pickerMode.value = 'pet'; pickTarget.value = { t: 'pet', i }; showPicker.value = true }
function onPick(id) {
  const tg = pickTarget.value
  if (!tg) return
  if (tg.t === 'hero') form.value.heroes[tg.i] = String(id || '')
  else form.value.pets[tg.i] = String(id || '')
}

// combo
function setStep(i, hero, skill) { form.value.skillQueue[i] = { hero: String(hero), skill } }
function clearStep(i) { form.value.skillQueue[i] = null }

const isOwnerOrNew = computed(() => !props.team || props.team.isOwner)
const canShareSettings = computed(() => auth.isPremium && isOwnerOrNew.value)
const canAltPlans = computed(() => auth.isPremium)
function addAlt() { form.value.skillQueueAlts.push({ name: 'แผน ' + String.fromCharCode(66 + form.value.skillQueueAlts.length), queue: [] }) }
function removeAlt(i) { form.value.skillQueueAlts.splice(i, 1) }

function save() {
  if (!form.value.name.trim()) { $q.notify({ type: 'warning', message: 'ตั้งชื่อทีมก่อน' }); return }
  if (!form.value.heroes.some((h) => h)) { $q.notify({ type: 'warning', message: 'เลือกฮีโร่อย่างน้อย 1 ตัว' }); return }
  const out = JSON.parse(JSON.stringify(form.value))
  out.skillQueue = out.skillQueue.filter(Boolean)
  emit('save', out)
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
        <div class="row q-col-gutter-sm">
          <q-input v-model="form.name" class="col" dense outlined dark label="ชื่อทีม" maxlength="60" autofocus />
          <q-btn-toggle v-model="form.type" no-caps unelevated class="col-auto"
            toggle-color="primary" color="grey-9" text-color="grey-5"
            :options="[{ label: '⚔️ บุก', value: 'attack' }, { label: '🛡️ รับ', value: 'defense' }]" />
        </div>

        <!-- Formation + สนามรบ -->
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-5">
            <div class="wt-panel-title">🚩 รูปแบบการยืน (FORMATION)</div>
            <div class="q-gutter-xs">
              <div v-for="f in FORMATIONS" :key="f.id" class="fm-card" :class="{ active: form.formation === f.id }"
                @click="form.formation = f.id">
                <div class="fm-name">{{ f.name }}</div>
                <div class="fm-sub">{{ f.sub }}</div>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-7">
            <div class="wt-panel-title">⚔️ สนามรบ</div>
            <div class="bf">
              <div class="bf-tag">BACK</div>
              <div class="bf-row">
                <div v-for="i in backIdx" :key="'b' + i" class="bf-slot" @click="openHero(i)">
                  <img v-if="heroById[form.heroes[i]]" :src="heroById[form.heroes[i]].img" @error="(e) => (e.target.src = FALLBACK)" />
                  <q-icon v-else name="add" size="18px" color="grey-7" />
                </div>
              </div>
              <div class="bf-tag">FRONT</div>
              <div class="bf-row">
                <div v-for="i in frontIdx" :key="'f' + i" class="bf-slot" @click="openHero(i)">
                  <img v-if="heroById[form.heroes[i]]" :src="heroById[form.heroes[i]].img" @error="(e) => (e.target.src = FALLBACK)" />
                  <q-icon v-else name="add" size="18px" color="grey-7" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- คอมโบสกิล -->
        <div>
          <div class="wt-panel-title">⚡ คอมโบสกิล <span class="text-caption text-grey-6">(ลำดับ 1 → 2 → 3)</span></div>
          <div class="combo">
            <template v-for="(step, i) in form.skillQueue" :key="i">
              <div class="combo-box" :class="{ filled: step }">
                <template v-if="step">
                  <q-avatar rounded size="34px">
                    <img v-if="heroById[step.hero]" :src="heroById[step.hero].img" />
                  </q-avatar>
                  <q-badge :color="skillColor(step.skill)" :label="skillLabel(step.skill)" class="q-mt-xs" />
                  <q-btn flat dense round size="xs" icon="close" class="combo-x" @click.stop="clearStep(i)" />
                </template>
                <template v-else>
                  <q-icon name="add" size="20px" color="grey-6" />
                  <div class="combo-sel">SELECT</div>
                  <q-menu>
                    <q-list dense style="min-width: 200px">
                      <q-item-label header>เลือกฮีโร่ + สกิล</q-item-label>
                      <q-item v-for="hid in placedHeroes" :key="hid">
                        <q-item-section avatar><q-avatar rounded size="28px"><img v-if="heroById[hid]" :src="heroById[hid].img" /></q-avatar></q-item-section>
                        <q-item-section>
                          <div class="row q-gutter-xs">
                            <q-btn v-for="sk in QUEUE_SKILLS" :key="sk.key" v-close-popup dense unelevated size="sm" no-caps
                              :color="sk.color" :label="sk.label" @click="setStep(i, hid, sk.key)" />
                          </div>
                        </q-item-section>
                      </q-item>
                      <q-item v-if="!placedHeroes.length"><q-item-section class="text-grey-6">เลือกฮีโร่ในสนามรบก่อน</q-item-section></q-item>
                    </q-list>
                  </q-menu>
                </template>
              </div>
              <q-icon v-if="i < 2" name="arrow_forward" color="grey-7" class="combo-arrow" />
            </template>
          </div>
        </div>

        <!-- เพ็ท -->
        <div>
          <div class="wt-panel-title">🐾 สัตว์เลี้ยง</div>
          <div class="row q-gutter-md">
            <div v-for="(p, i) in form.pets" :key="i" class="pet-slot" @click="openPet(i)">
              <img v-if="petById[p]" :src="petById[p].img" @error="(e) => (e.target.src = FALLBACK)" />
              <q-icon v-else name="pets" size="20px" color="grey-7" />
            </div>
          </div>
        </div>

        <!-- แผนสำรอง (Premium) -->
        <div>
          <div class="row items-center q-mb-xs">
            <div class="wt-panel-title q-mb-none">🗂️ แผนสกิลสำรอง</div>
            <q-space />
            <q-badge v-if="!canAltPlans" color="amber-8" label="Premium" />
            <q-btn v-else flat dense no-caps size="sm" icon="add" label="เพิ่มแผน" color="primary" @click="addAlt" />
          </div>
          <template v-if="canAltPlans">
            <div v-for="(alt, i) in form.skillQueueAlts" :key="i" class="wt-alt row items-center">
              <q-input v-model="alt.name" dense borderless dark class="col" input-class="text-weight-bold" />
              <q-btn flat dense round size="sm" icon="delete" color="red-4" @click="removeAlt(i)" />
            </div>
          </template>
        </div>

        <q-input v-model="form.note" dense outlined dark type="textarea" rows="2" label="โน้ต (ไม่บังคับ)" />

        <!-- แชร์ -->
        <q-separator dark />
        <div>
          <div class="row items-center q-mb-xs">
            <div class="text-subtitle2">🔗 การแชร์</div>
            <q-space />
            <q-badge v-if="!canShareSettings" color="amber-8" label="แชร์เจาะจง = Premium" />
          </div>
          <q-option-group v-model="form.visibility" :disable="!canShareSettings"
            :options="[{ label: '🌍 ทุกคนเห็น (Public)', value: 'public' }, { label: '🔒 เฉพาะอีเมลที่กำหนด', value: 'restricted' }]"
            color="primary" dense />
          <q-select v-if="canShareSettings && form.visibility === 'restricted'" v-model="form.allowedEmails"
            dense outlined dark use-input use-chips multiple hide-dropdown-icon new-value-mode="add-unique"
            label="อีเมลที่ให้ดู" class="q-mt-sm" />
          <q-select v-if="canShareSettings" v-model="form.editorEmails"
            dense outlined dark use-input use-chips multiple hide-dropdown-icon new-value-mode="add-unique"
            label="อีเมลที่ให้แก้ไขได้" class="q-mt-sm" />
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
.wt-card { width: 94vw; max-width: 640px; background: #0f1420; border-radius: 16px; display: flex; flex-direction: column; max-height: 92vh; }
.wt-body { overflow-y: auto; }
.wt-panel-title { font-size: 0.8rem; font-weight: 700; color: #cbd5e1; margin-bottom: 8px; }
.wt-panel-title.q-mb-none { margin-bottom: 0; }

/* formation cards */
.fm-card { background: #161b22; border: 1px solid #262d38; border-radius: 10px; padding: 8px 12px; cursor: pointer; transition: all 0.12s ease; }
.fm-card:hover { border-color: #3b82f6; }
.fm-card.active { background: #1e293b; border-color: #3b82f6; box-shadow: inset 3px 0 0 #3b82f6; }
.fm-name { font-weight: 700; color: #e2e8f0; font-size: 0.85rem; }
.fm-sub { font-size: 0.72rem; color: #94a3b8; }

/* battlefield */
.bf { background: #10151f; border: 1px solid #1e2632; border-radius: 12px; padding: 10px; }
.bf-tag { font-size: 0.62rem; font-weight: 800; letter-spacing: 0.1em; color: #3a4557; margin: 2px 0; }
.bf-row { display: flex; gap: 8px; justify-content: center; margin-bottom: 8px; }
.bf-slot { width: 52px; height: 52px; border-radius: 10px; border: 2px solid #2a3441; background: #000; overflow: hidden; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.bf-slot:hover { border-color: #3b82f6; }
.bf-slot img { width: 100%; height: 100%; object-fit: cover; }

/* skill combo */
.combo { display: flex; align-items: center; justify-content: center; gap: 4px; }
.combo-box { position: relative; width: 84px; height: 84px; border: 2px dashed #2a3441; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; background: #12161f; }
.combo-box.filled { border-style: solid; border-color: #3b82f6; cursor: default; }
.combo-box:not(.filled):hover { border-color: #3b82f6; }
.combo-sel { font-size: 0.66rem; color: #94a3b8; font-weight: 700; margin-top: 2px; }
.combo-x { position: absolute; top: 0; right: 0; color: #ef4444; }
.combo-arrow { flex-shrink: 0; }

/* pets */
.pet-slot { width: 60px; height: 60px; border-radius: 50%; border: 2px dashed #2a3441; background: #000; overflow: hidden; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.pet-slot:hover { border-color: #22c55e; }
.pet-slot img { width: 100%; height: 100%; object-fit: cover; }

.wt-alt { background: #12161f; border: 1px solid #262d38; border-radius: 10px; padding: 4px 10px; margin-bottom: 8px; }
</style>
