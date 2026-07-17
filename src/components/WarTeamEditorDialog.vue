<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useDataStore } from '@/stores/dataStore'
import { useAuthStore } from '@/stores/authStore'
import HeroBuildPickerDialog from '@/components/HeroBuildPickerDialog.vue'
import { FORMATIONS, formationDef, QUEUE_SKILLS, QUEUE_SIZE, fixSkillQueue, skillLabel, skillColor } from '@/config/warTeam'

const props = defineProps({ modelValue: Boolean, team: { type: Object, default: null } })
const emit = defineEmits(['update:modelValue', 'save'])
const show = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

const $q = useQuasar()
const store = useDataStore()
const auth = useAuthStore()
const FALLBACK = 'https://placehold.co/80x80/0d1117/475569?text=%2B'

const blank = () => ({
  id: '', name: '', type: 'attack', formation: 'basic',
  heroes: ['', '', '', '', ''], heroAwakened: [false, false, false, false, false],
  pets: ['', '', ''], skillQueue: fixSkillQueue([]),
  skillQueueAlts: [], note: '', visibility: 'public', allowedEmails: [], editorEmails: [],
})
const form = ref(blank())

function fix(arr, n, fill = '') {
  const a = Array.isArray(arr) ? arr.slice(0, n) : []
  while (a.length < n) a.push(fill)
  return a
}
function fixAwakened(arr) {
  return fix(arr, 5, false).map((v) => !!v)
}
function fixAlts(alts) {
  if (!Array.isArray(alts)) return []
  return alts.map((a, i) => ({
    name: a?.name || ('แบบ ' + String.fromCharCode(66 + i)),
    queue: fixSkillQueue(a?.queue),
  }))
}
watch(show, (v) => {
  if (!v) return
  form.value = props.team
    ? { ...blank(), ...JSON.parse(JSON.stringify(props.team)),
        heroes: fix(props.team.heroes, 5, ''),
        heroAwakened: fixAwakened(props.team.heroAwakened),
        pets: fix(props.team.pets, 3, ''),
        skillQueue: fixSkillQueue(props.team.skillQueue),
        skillQueueAlts: fixAlts(props.team.skillQueueAlts),
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
const pickerCurrentId = computed(() => {
  const tg = pickTarget.value
  if (!tg) return ''
  if (tg.t === 'hero') return form.value.heroes[tg.i] || ''
  if (tg.t === 'pet') return form.value.pets[tg.i] || ''
  return ''
})
const pickerPlacedIds = computed(() => {
  const tg = pickTarget.value
  if (!tg) return []
  if (tg.t === 'hero') {
    return form.value.heroes.filter((h, i) => h && i !== tg.i).map(String)
  }
  if (tg.t === 'pet') {
    return form.value.pets.filter((p, i) => p && i !== tg.i).map(String)
  }
  return []
})
function openHero(i) { pickerMode.value = 'hero'; pickTarget.value = { t: 'hero', i }; showPicker.value = true }
function openPet(i) { pickerMode.value = 'pet'; pickTarget.value = { t: 'pet', i }; showPicker.value = true }

// drag & drop สลับตำแหน่งฮีโร่
const dragFrom = ref(null)
const dragOver = ref(null)
let heroDragMoved = false
function swapHeroSlots(a, b) {
  if (a === b || a == null || b == null) return
  const tmpH = form.value.heroes[a]
  const tmpA = form.value.heroAwakened[a]
  form.value.heroes[a] = form.value.heroes[b]
  form.value.heroAwakened[a] = form.value.heroAwakened[b]
  form.value.heroes[b] = tmpH
  form.value.heroAwakened[b] = tmpA
}
function onHeroDragStart(i, e) {
  if (!form.value.heroes[i]) {
    e.preventDefault()
    return
  }
  dragFrom.value = i
  heroDragMoved = false
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', String(i))
  try { e.dataTransfer.setDragImage(e.currentTarget, 40, 40) } catch (_) { /* ignore */ }
}
function onHeroDragOver(i, e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  dragOver.value = i
}
function onHeroDragLeave(i) {
  if (dragOver.value === i) dragOver.value = null
}
function onHeroDrop(i, e) {
  e.preventDefault()
  e.stopPropagation()
  const from = dragFrom.value
  if (from != null && from !== i) {
    heroDragMoved = true
    swapHeroSlots(from, i)
  }
  dragFrom.value = null
  dragOver.value = null
}
function onHeroDragEnd() {
  dragFrom.value = null
  dragOver.value = null
}
function onHeroClick(i) {
  if (heroDragMoved) {
    heroDragMoved = false
    return
  }
  openHero(i)
}

// drag & drop สลับตำแหน่งเพ็ท
const petDragFrom = ref(null)
const petDragOver = ref(null)
let petDragMoved = false
function swapPetSlots(a, b) {
  if (a === b || a == null || b == null) return
  const tmp = form.value.pets[a]
  form.value.pets[a] = form.value.pets[b]
  form.value.pets[b] = tmp
}
function onPetDragStart(i, e) {
  if (!form.value.pets[i]) {
    e.preventDefault()
    return
  }
  petDragFrom.value = i
  petDragMoved = false
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', 'pet:' + i)
  try { e.dataTransfer.setDragImage(e.currentTarget, 30, 30) } catch (_) { /* ignore */ }
}
function onPetDragOver(i, e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  petDragOver.value = i
}
function onPetDragLeave(i) {
  if (petDragOver.value === i) petDragOver.value = null
}
function onPetDrop(i, e) {
  e.preventDefault()
  e.stopPropagation()
  const from = petDragFrom.value
  if (from != null && from !== i) {
    petDragMoved = true
    swapPetSlots(from, i)
  }
  petDragFrom.value = null
  petDragOver.value = null
}
function onPetDragEnd() {
  petDragFrom.value = null
  petDragOver.value = null
}
function onPetClick(i) {
  if (petDragMoved) {
    petDragMoved = false
    return
  }
  openPet(i)
}

function onPick(id) {
  const tg = pickTarget.value
  if (!tg) return
  if (tg.t === 'hero') {
    const hid = String(id || '')
    const slot = tg.i
    const other = hid ? form.value.heroes.findIndex((h, i) => i !== slot && String(h) === hid) : -1
    if (other >= 0) {
      swapHeroSlots(slot, other)
      return
    }
    form.value.heroes[slot] = hid
    form.value.heroAwakened[slot] = false
    pruneOrphanSkills()
    if (hid && hasHeroAwaken(hid)) {
      awakenChooser.value = { slot, heroId: hid }
      nextTick(() => { showAwakenChooser.value = true })
    }
  } else {
    const pid = String(id || '')
    const slot = tg.i
    const other = pid ? form.value.pets.findIndex((p, i) => i !== slot && String(p) === pid) : -1
    if (other >= 0) {
      swapPetSlots(slot, other)
      return
    }
    form.value.pets[slot] = pid
  }
}

/** ลบสกิลในคิวที่ฮีโร่ไม่อยู่ในสนามแล้ว */
function pruneOrphanSkills() {
  const placed = new Set(form.value.heroes.filter(Boolean).map(String))
  const prune = (queue) => {
    if (!Array.isArray(queue)) return
    for (let i = 0; i < queue.length; i++) {
      const step = queue[i]
      if (step && !placed.has(String(step.hero))) queue[i] = null
    }
  }
  prune(form.value.skillQueue)
  for (const alt of form.value.skillQueueAlts || []) prune(alt.queue)
}

function hasHeroAwaken(heroId) {
  const h = heroById.value[String(heroId)]
  if (!h) return false
  const b = h.baseStats || {}, a = h.awakenStats || {}
  const statsDiffer = Object.keys(b).some((k) => a[k] !== undefined && a[k] !== b[k])
  return !!(h.img2 && String(h.img2).trim()) || statsDiffer || !!(h.skillData?.aw?.img)
}
function heroSlotImg(i) {
  const h = heroById.value[form.value.heroes[i]]
  if (!h) return ''
  if (form.value.heroAwakened[i] && h.img2) return h.img2
  return h.img || ''
}

const showAwakenChooser = ref(false)
const awakenChooser = ref(null) // { slot, heroId }
const awakenChooserHero = computed(() => heroById.value[awakenChooser.value?.heroId] || null)
function chooseHeroForm(awakened) {
  const c = awakenChooser.value
  if (!c) return
  form.value.heroAwakened[c.slot] = !!awakened
  showAwakenChooser.value = false
  awakenChooser.value = null
}

// combo — 1 แบบ = 3 สกิล
function setStep(queue, i, hero, skill) { queue[i] = { hero: String(hero), skill } }
function clearStep(queue, i) { queue[i] = null }
function skillImg(heroId, skillKey) {
  return heroById.value[String(heroId)]?.skillData?.[skillKey]?.img || ''
}
function hasAwakenSkill(heroId) {
  const img = heroById.value[String(heroId)]?.skillData?.aw?.img
  return !!(img && String(img).trim())
}
function skillsForHero(heroId) {
  return QUEUE_SKILLS.filter((sk) => sk.key !== 'aw' || hasAwakenSkill(heroId))
}
function skillKey(heroId, skill) {
  return `${String(heroId)}::${String(skill)}`
}
/** สกิล (ฮีโร่+ชนิด) ถูกใช้ในคิวแล้วหรือยัง — exceptIndex = ช่องที่กำลังแก้ */
function isSkillTaken(queue, heroId, skill, exceptIndex = -1) {
  if (!Array.isArray(queue)) return false
  const key = skillKey(heroId, skill)
  return queue.some((step, i) => i !== exceptIndex && step && skillKey(step.hero, step.skill) === key)
}
function findSkillIndex(queue, heroId, skill, exceptIndex = -1) {
  if (!Array.isArray(queue)) return -1
  const key = skillKey(heroId, skill)
  return queue.findIndex((step, i) => i !== exceptIndex && step && skillKey(step.hero, step.skill) === key)
}

const showSkillPicker = ref(false)
const skillPickTarget = ref(null) // { queue, i }
function openSkillPicker(queue, i) {
  if (!placedHeroes.value.length) {
    $q.notify({ type: 'warning', message: 'เลือกฮีโร่ในสนามรบก่อน', position: 'top' })
    return
  }
  skillPickTarget.value = { queue, i }
  showSkillPicker.value = true
}
function pickSkill(heroId, skillKeyName) {
  const tg = skillPickTarget.value
  if (!tg) return
  const other = findSkillIndex(tg.queue, heroId, skillKeyName, tg.i)
  if (other >= 0) {
    const tmp = tg.queue[tg.i]
    tg.queue[tg.i] = tg.queue[other]
    tg.queue[other] = tmp
  } else {
    setStep(tg.queue, tg.i, heroId, skillKeyName)
  }
  showSkillPicker.value = false
  skillPickTarget.value = null
}

const isOwnerOrNew = computed(() => !props.team || props.team.isOwner)
const canShareSettings = computed(() => auth.isPremium && isOwnerOrNew.value)
const canAltPlans = computed(() => auth.isPremium)
function addPlan() {
  form.value.skillQueueAlts.push({
    name: 'แบบ ' + String.fromCharCode(66 + form.value.skillQueueAlts.length),
    queue: fixSkillQueue([]),
  })
}
function onAddPlanClick() {
  if (!canAltPlans.value) {
    $q.notify({
      type: 'warning',
      icon: 'workspace_premium',
      message: 'เพิ่มแบบจองสกิลได้เฉพาะบัญชี Premium',
      position: 'top',
      timeout: 2500,
    })
    return
  }
  addPlan()
  $q.notify({
    type: 'positive',
    message: 'เพิ่มแบบจองสกิลแล้ว',
    position: 'top',
    timeout: 1500,
  })
}
function removePlan(i) { form.value.skillQueueAlts.splice(i, 1) }

function save() {
  if (!form.value.name.trim()) { $q.notify({ type: 'negative', message: 'ตั้งชื่อทีมก่อน', position: 'top' }); return }
  if (!form.value.heroes.some((h) => h)) { $q.notify({ type: 'negative', message: 'เลือกฮีโร่อย่างน้อย 1 ตัว', position: 'top' }); return }
  const out = JSON.parse(JSON.stringify(form.value))
  out.skillQueue = out.skillQueue.filter(Boolean)
  out.skillQueueAlts = (out.skillQueueAlts || []).map((a) => ({
    ...a,
    queue: (a.queue || []).filter(Boolean),
  }))
  emit('save', out)
}
</script>

<template>
  <q-dialog v-model="show" maximized>
    <q-card class="wt-card no-padding">
      <q-card-section class="row items-center q-pb-none ">
        <div class="text-h6">{{ team ? '✏️ แก้ไขทีม' : '➕ สร้างทีม' }}</div>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-card-section class="wt-body scroll ">
        <div class="row">
          <q-input v-model="form.name" class="col" dense outlined dark label="ชื่อทีม" maxlength="60" />
          <q-btn-toggle v-model="form.type" no-caps unelevated class="col-auto q-ml-md"
            toggle-color="primary" color="grey-9" text-color="grey-5"
            :options="[{ label: '⚔️ บุก', value: 'attack' }, { label: '🛡️ รับ', value: 'defense' }]" />
        </div>

        <!-- #region Formation + สนามรบ -->
        <div class="row q-mt-md">
          <div class="col-12 col-sm ">
            <div class="wt-panel-title">รูปแบบการจัดทีม</div>
            <div class="bf row">
              <!-- #region รูปแบบระบบ -->
              <div class="col self-center row items-center fit" style="border-right: 1px solid #2a3441;">
                <!-- #region รูปแบบระบบ -->
                <div class="col-12 self-center q-pa-sm">
                  <div class="bf-row relative-position">
                    <div class="bf-row-tag" aria-hidden="true">
                      <span v-for="(ch, i) in 'BACK'" :key="'bt' + i">{{ ch }}</span>
                    </div>
                    <div
                      v-for="i in backIdx" :key="'b' + i"
                      class="bf-slot"
                      :class="{
                        awk: form.heroAwakened[i],
                        dragging: dragFrom === i,
                        'drag-over': dragOver === i && dragFrom !== i,
                      }"
                      :draggable="!!form.heroes[i]"
                      @dragstart="onHeroDragStart(i, $event)"
                      @dragover="onHeroDragOver(i, $event)"
                      @dragleave="onHeroDragLeave(i)"
                      @drop="onHeroDrop(i, $event)"
                      @dragend="onHeroDragEnd"
                      @click="onHeroClick(i)"
                    >
                      <img v-if="heroSlotImg(i)" :src="heroSlotImg(i)" @error="(e) => (e.target.src = FALLBACK)" />
                      <q-icon v-else name="add" size="18px" color="grey-7" />
                    </div>
                  </div>
                  <div class="bf-row relative-position">
                    <div class="bf-row-tag" aria-hidden="true">
                      <span v-for="(ch, i) in 'FRONT'" :key="'ft' + i">{{ ch }}</span>
                    </div>
                    <div
                      v-for="i in frontIdx" :key="'f' + i"
                      class="bf-slot"
                      :class="{
                        awk: form.heroAwakened[i],
                        dragging: dragFrom === i,
                        'drag-over': dragOver === i && dragFrom !== i,
                      }"
                      :draggable="!!form.heroes[i]"
                      @dragstart="onHeroDragStart(i, $event)"
                      @dragover="onHeroDragOver(i, $event)"
                      @dragleave="onHeroDragLeave(i)"
                      @drop="onHeroDrop(i, $event)"
                      @dragend="onHeroDragEnd"
                      @click="onHeroClick(i)"
                    >
                      <img v-if="heroSlotImg(i)" :src="heroSlotImg(i)" @error="(e) => (e.target.src = FALLBACK)" />
                      <q-icon v-else name="add" size="18px" color="grey-7" />
                    </div>
                  </div>
                </div>
                <!-- #endregion -->

                <!-- #region รูปแบบการจัดทีม -->
                <div class="col-12" style="border-top: 1px solid #2a3441;">
                  <div class="q-pa-sm">
                    <div class="fit row justify-center items-center">
                      <div v-for="f in FORMATIONS" :key="f.id" class="fm-card" :class="{ active: form.formation === f.id }"
                        @click="form.formation = f.id">
                        <div class="fm-name">{{ f.name }}</div>
                        <div class="fm-sub" align="center">{{ f.sub }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- #endregion -->
              </div>
              <!-- #endregion -->

              <!-- #region เพ็ท -->
              <div class="col-12 col-sm-2 relative-position q-pa-sm row justify-center items-center" style="border-top: 1px solid #2a3441;">
                <div class="pet-col-slots row justify-center items-center">
                  <div
                    v-for="(p, i) in form.pets" :key="i"
                    class="pet-slot relative-position"
                    :class="{
                      dragging: petDragFrom === i,
                      'drag-over': petDragOver === i && petDragFrom !== i,
                    }"
                    :draggable="!!p"
                    @dragstart="onPetDragStart(i, $event)"
                    @dragover="onPetDragOver(i, $event)"
                    @dragleave="onPetDragLeave(i)"
                    @drop="onPetDrop(i, $event)"
                    @dragend="onPetDragEnd"
                    @click="onPetClick(i)"
                  >
                    <span class="pet-slot-tag absolute-center" aria-hidden="true">{{ 'PET'[i] }}</span>
                    <img v-if="petById[p]" :src="petById[p].img" @error="(e) => (e.target.src = FALLBACK)" />
                    <q-icon v-else name="pets" size="20px" color="grey-7" />
                  </div>
                </div>
              </div>
              <!-- #endregion -->
            </div>
          </div>
        </div>
        <!-- #endregion -->

        <!-- #region จองสกิล — หลายแบบ แต่ละแบบ 3 สกิล -->
        <div class="q-mt-md">
          <div class="wt-panel-title q-mb-none skill row">
            <div>
              จองสกิล
              <span class="text-caption text-grey-6">(1 แบบ = {{ QUEUE_SIZE }} สกิล)</span>
            </div>
            <q-space />
            <q-btn flat dense no-caps size="sm" icon="add" label="เพิ่มแบบ" color="primary"
              class="q-ml-sm" @click="onAddPlanClick" />
          </div>

          <!-- #region แบบหลัก -->
          <div class="wt-alt">
            <div class="combo relative-position">
              <template v-for="(step, i) in form.skillQueue" :key="'mq' + i">
                <div class="combo-box" :class="{ filled: step }" @click="openSkillPicker(form.skillQueue, i)">
                  <template v-if="step">
                    <img
                      v-if="skillImg(step.hero, step.skill)"
                      class="combo-skill-img"
                      :src="skillImg(step.hero, step.skill)"
                      @error="(e) => (e.target.src = FALLBACK)"
                    />
                    <template v-else>
                      <q-avatar rounded size="34px">
                        <img v-if="heroById[step.hero]" :src="heroById[step.hero].img" />
                      </q-avatar>
                      <q-badge :color="skillColor(step.skill)" :label="skillLabel(step.skill)" class="q-mt-xs" />
                    </template>
                    <!-- <q-btn flat dense round size="xs" icon="close" class="combo-x" @click.stop="clearStep(form.skillQueue, i)" /> -->
                  </template>
                  <template v-else>
                    <q-icon name="add" size="20px" color="grey-6" />
                    <div class="combo-sel">SELECT</div>
                  </template>
                </div>
                <span v-if="i < QUEUE_SIZE - 1" class="combo-arrow" aria-hidden="true">→</span>
              </template>
            </div>
          </div>
          <!-- #endregion -->

          <!-- #region แบบเพิ่ม -->
          <template v-if="canAltPlans">
            <div v-for="(plan, pi) in form.skillQueueAlts" :key="pi" class="wt-alt">
              <div class="row items-center q-mb-sm">
                <q-input v-model="plan.name" dense borderless dark class="col" input-class="text-weight-bold" />
                <q-btn flat dense round size="sm" icon="delete" color="red-4" @click="removePlan(pi)" />
              </div>
              <div class="combo">
                <template v-for="(step, i) in plan.queue" :key="'pq' + pi + '-' + i">
                  <div class="combo-box" :class="{ filled: step }" @click="openSkillPicker(plan.queue, i)">
                    <template v-if="step">
                      <img
                        v-if="skillImg(step.hero, step.skill)"
                        class="combo-skill-img"
                        :src="skillImg(step.hero, step.skill)"
                        @error="(e) => (e.target.src = FALLBACK)"
                      />
                      <template v-else>
                        <q-avatar rounded size="34px">
                          <img v-if="heroById[step.hero]" :src="heroById[step.hero].img" />
                        </q-avatar>
                        <q-badge :color="skillColor(step.skill)" :label="skillLabel(step.skill)" class="q-mt-xs" />
                      </template>
                      <q-btn flat dense round size="xs" icon="close" class="combo-x" @click.stop="clearStep(plan.queue, i)" />
                    </template>
                    <template v-else>
                      <q-icon name="add" size="20px" color="grey-6" />
                      <div class="combo-sel">SELECT</div>
                    </template>
                  </div>
                  <span v-if="i < QUEUE_SIZE - 1" class="combo-arrow" aria-hidden="true">→</span>
                </template>
              </div>
            </div>
          </template>
          <!-- #endregion -->
        </div>
        <!-- #endregion -->

        <!-- #region โน้ต -->
        <div class=" q-my-md">
          <div class="wt-panel-title note">โน้ต (ไม่บังคับ)</div>
          <div class="bf" style="overflow:auto;height:130px;">
            <q-editor v-model="form.note" :toolbar="[]" placeholder="เพิ่มความคิดเห็น..." toolbar-bg="transparent" min-height="5rem" flat style="background:transparent;height:100%;" />
          </div>
        </div>
        <!-- #endregion -->
        
        <q-separator dark />
        
        <!-- #region แชร์ -->
        <div class="q-mt-md">
          <div class="row items-center q-mb-xs">
            <div class="text-subtitle2">🔗 การแชร์</div>
            <q-space />
            <q-badge v-if="!canShareSettings" color="amber-8" label="แชร์เจาะจง = Premium" />
          </div>

          <q-select v-model="form.visibility" :options="[{ label: '🌍 ทุกคนเห็น (Public)', value: 'public' }, { label: '🔒 เฉพาะอีเมลที่กำหนด', value: 'restricted' }]" color="primary" dense >
            <template v-slot:option="{ option }">
              <q-item>
                <q-item-section>
                  <q-item-label>{{ option.label }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <!-- <q-option-group v-model="form.visibility" :disable="!canShareSettings"
            :options="[{ label: '🌍 ทุกคนเห็น (Public)', value: 'public' }, { label: '🔒 เฉพาะอีเมลที่กำหนด', value: 'restricted' }]"
            color="primary" dense />
          <q-select v-if="canShareSettings && form.visibility === 'restricted'" v-model="form.allowedEmails"
            dense outlined dark use-input use-chips multiple hide-dropdown-icon new-value-mode="add-unique"
            label="อีเมลที่ให้ดู" class="q-mt-sm" />
          <q-select v-if="canShareSettings" v-model="form.editorEmails"
            dense outlined dark use-input use-chips multiple hide-dropdown-icon new-value-mode="add-unique"
            label="อีเมลที่ให้แก้ไขได้" class="q-mt-sm" /> -->
        </div>
        <!-- #endregion -->
      </q-card-section>

      <!-- #region ปุ่มบันทึก -->
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat no-caps label="ยกเลิก" v-close-popup />
        <q-btn unelevated color="primary" no-caps icon="save" label="บันทึก" @click="save" />
      </q-card-actions>
      <!-- #endregion -->

      <!-- #region Dialog เลือกฮีโร่ -->
      <HeroBuildPickerDialog
        v-model="showPicker"
        :mode="pickerMode"
        :current-id="pickerCurrentId"
        :placed-ids="pickerPlacedIds"
        @pick="onPick"
      />
      <!-- #endregion -->

      <!-- #region Dialog เลือกร่างปกติ / ปลุกพลัง -->
      <q-dialog v-model="showAwakenChooser" persistent>
        <q-card class="awk-choose-card">
          <q-card-section class="q-pb-sm">
            <div class="text-subtitle1 text-weight-bold">เลือกร่างตัวละคร</div>
            <div class="text-caption text-grey-5">
              {{ awakenChooserHero?.name || '' }} มีร่างปลุกพลัง — ต้องการใช้แบบไหน?
            </div>
          </q-card-section>
          <q-card-section class="awk-choose-row">
            <button type="button" class="awk-choose-opt" @click="chooseHeroForm(false)">
              <img
                v-if="awakenChooserHero?.img"
                :src="awakenChooserHero.img"
                @error="(e) => (e.target.src = FALLBACK)"
              />
              <div class="awk-choose-lbl">ร่างปกติ</div>
            </button>
            <span class="awk-choose-arrow" aria-hidden="true">→</span>
            <button type="button" class="awk-choose-opt awk" @click="chooseHeroForm(true)">
              <img
                v-if="awakenChooserHero?.img2 || awakenChooserHero?.img"
                :src="awakenChooserHero.img2 || awakenChooserHero.img"
                @error="(e) => (e.target.src = FALLBACK)"
              />
              <div class="awk-choose-lbl">✨ ปลุกพลัง</div>
            </button>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps label="ใช้ร่างปกติ" color="grey-5" @click="chooseHeroForm(false)" />
          </q-card-actions>
        </q-card>
      </q-dialog>
      <!-- #endregion -->

      <!-- #region Dialog เลือกสกิล -->
      <q-dialog v-model="showSkillPicker" position="bottom">
        <q-card class="sk-pick-card">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-subtitle1 text-weight-bold">เลือกสกิล</div>
            <q-space />
            <q-btn flat round dense icon="close" v-close-popup />
          </q-card-section>
          <q-card-section class="sk-pick-body">
            <div v-for="hid in placedHeroes" :key="hid" class="sk-pick-hero">
              <div class="sk-pick-hero-head">
                <q-avatar rounded size="70px">
                  <img v-if="heroById[hid] && heroById[hid].img2" :src="heroById[hid].img2" @error="(e) => (e.target.src = FALLBACK)" />
                  <img v-else-if="heroById[hid] && heroById[hid].img" :src="heroById[hid].img" @error="(e) => (e.target.src = FALLBACK)" />
                </q-avatar>
                <div class="sk-pick-hero-name">{{ heroById[hid]?.name || hid }}</div>
              </div>
              <div class="sk-pick-skills">
                <button
                  v-for="sk in skillsForHero(hid)" :key="sk.key"
                  type="button"
                  class="sk-pick-skill"
                  :class="{ swap: skillPickTarget && isSkillTaken(skillPickTarget.queue, hid, sk.key, skillPickTarget.i) }"
                  @click="pickSkill(hid, sk.key)"
                >
                  <img
                    v-if="skillImg(hid, sk.key)"
                    :src="skillImg(hid, sk.key)"
                    :alt="sk.label"
                    @error="(e) => (e.target.src = FALLBACK)"
                  />
                  <span v-else class="sk-pick-fallback">{{ sk.label }}</span>
                  <span
                    v-if="skillPickTarget && isSkillTaken(skillPickTarget.queue, hid, sk.key, skillPickTarget.i)"
                    class="sk-pick-swap"
                  >สลับ</span>
                  <q-tooltip>
                    {{ skillPickTarget && isSkillTaken(skillPickTarget.queue, hid, sk.key, skillPickTarget.i)
                      ? 'กดเพื่อสลับตำแหน่งในคิว'
                      : sk.label }}
                  </q-tooltip>
                </button>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
      <!-- #endregion -->
    </q-card>
  </q-dialog>
</template>

<style scoped>
.wt-card { width: 100vw; max-width: 700px; background: #0f1420; border-radius: 16px; display: flex; flex-direction: column; height:95vh;font-size: 16px; }
.wt-body { overflow-y: auto; }
.wt-panel-title { font-size: 1.2rem; font-weight: 600; color: #cbd5e1; border-left: 4px solid #3b82f6;  padding-left: 8px; background: #161b22; border-radius: 5px 0px 0px 0px ; padding: 4px 10px;}
.wt-panel-title.skill {
  border-left: 4px solid #ffa218;
}
.wt-panel-title.note {
  border-left: 4px solid #94a3b8;
}
.wt-panel-title.q-mb-none { margin-bottom: 0; }

/* formation cards */
.fm-card { width:120px;background: #161b22; border: 1px solid #262d38; border-radius: 10px; padding: 12px;margin: 0px 5px; cursor: pointer; transition: all 0.12s ease; text-align: center;margin:5px;}
.fm-card:hover { border-color: #3b82f6; }
.fm-card.active { background: #1e293b; border-color: #3b82f6; box-shadow: inset 3px 0 0 #3b82f6; }
.fm-name { font-weight: 700; color: #e2e8f0; font-size: 0.85rem; }
.fm-sub { font-size: 0.72rem; color: #94a3b8; }

/* battlefield */
.bf { background: #10151f; border: 1px solid #2a3441; border-radius: 0 0 10px 10px; overflow: visible; }
.bf-row {
  position: relative;
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;
  gap: 6px;
  width: 100%;
  max-width: 100%;
  padding: 8px 4px;
  overflow: visible;
  min-height: 72px;
  container-type: inline-size;
  box-sizing: border-box;
}
.bf-row-tag {
  position: absolute;
  inset: 8px 4px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  pointer-events: none;
  z-index: 0;
}
.bf-row-tag span {
  flex: 1;
  text-align: center;
  font-size: clamp(1.5rem, 18cqi, 4rem);
  font-weight: 800;
  line-height: 1;
  color: rgba(204, 204, 204, 0.28);
}
.bf-slot {
  position: relative;
  z-index: 1;
  flex: 0 1 auto;
  width: min(90px, 22cqi);
  height: min(90px, 22cqi);
  min-width: 52px;
  min-height: 52px;
  aspect-ratio: 1;
  border-radius: 10px;
  border: 2px solid #2a3441;
  background: #000000de;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.bf-slot:hover { border-color: #3b82f6; }
.bf-slot.awk { border-color: #c084fc; box-shadow: 0 0 10px rgba(168, 85, 247, 0.55); }
.bf-slot.dragging { opacity: 0.45; cursor: grabbing; }
.bf-slot.drag-over {
  border-color: #f59e0b;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.55);
}
.bf-slot[draggable="true"] { cursor: grab; }
.bf-slot img { width: 100%; height: 100%; object-fit: cover; pointer-events: none; }

/* skill combo — แสดง 3 ช่องเสมอ ไม่โดนตัดบนจอแคบ */
.combo {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: clamp(2px, 1.5cqi, 8px);
  width: 100%;
  max-width: 100%;
  overflow: visible;
  container-type: inline-size;
  box-sizing: border-box;
}
.combo-box {
  position: relative;
  flex: 0 1 auto;
  width: min(90px, 28cqi);
  height: min(90px, 28cqi);
  min-width: 56px;
  min-height: 56px;
  aspect-ratio: 1;
  border: 2px dashed #2a3441;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #12161f;
  box-sizing: border-box;
}
.combo-box.filled { border-style: solid; border-color: #3b82f6; cursor: pointer; }
.combo-box:not(.filled):hover { border-color: #3b82f6; }
.combo-sel { font-size: clamp(0.55rem, 3.5cqi, 0.66rem); color: #94a3b8; font-weight: 700; margin-top: 2px; }
.combo-x { position: absolute; top: 0; right: 0; color: #ef4444; z-index: 2; }
.combo-arrow {
  flex-shrink: 0;
  font-size: clamp(1.1rem, 6cqi, 1.6rem);
  font-weight: 800;
  color: #94a3b8;
  line-height: 1;
  padding: 0 2px;
}
.combo-skill-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

/* skill picker dialog */
.sk-pick-card {
  width: 100%;
  max-width: 700px;
  background: #0f1420;
  border-radius: 16px 16px 0 0;
}
.sk-pick-body { max-height: 60vh; overflow-y: auto; }
.sk-pick-hero {
  background: #12161f;
  border: 1px solid #262d38;
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 10px;
}
.sk-pick-hero-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.sk-pick-hero-name { font-weight: 700; color: #e2e8f0; font-size: 0.9rem; }
.sk-pick-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
}
.sk-pick-skill {
  position: relative;
  width: 90px;
  height: 90px;
  padding: 0;
  border: 2px solid #2a3441;
  border-radius: 10px;
  background: #000;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sk-pick-skill:hover { border-color: #3b82f6; }
.sk-pick-skill.swap { border-color: #f59e0b; }
.sk-pick-skill img { width: 100%; height: 100%; object-fit: cover; }
.sk-pick-swap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 1px 0;
  background: rgba(245, 158, 11, 0.92);
  color: #111;
  font-size: 0.55rem;
  font-weight: 800;
  text-align: center;
  line-height: 1.2;
}
.sk-pick-fallback {
  font-size: 0.65rem;
  font-weight: 700;
  color: #94a3b8;
  text-align: center;
  padding: 4px;
  line-height: 1.2;
}

/* awaken form chooser */
.awk-choose-card {
  width: min(92vw, 360px);
  background: #0f1420;
  border-radius: 16px;
}
.awk-choose-row {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
}
.awk-choose-arrow {
  flex-shrink: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #a855f7;
  line-height: 1;
}
.awk-choose-opt {
  flex: 1;
  max-width: 140px;
  padding: 0;
  border: 2px solid #2a3441;
  border-radius: 14px;
  background: #12161f;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
}
.awk-choose-opt:hover { border-color: #3b82f6; }
.awk-choose-opt.awk { border-color: #7c3aed; }
.awk-choose-opt.awk:hover {
  border-color: #c084fc;
  box-shadow: 0 0 14px rgba(168, 85, 247, 0.45);
}
.awk-choose-opt img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  background: #000;
}
.awk-choose-lbl {
  padding: 8px 6px;
  font-size: 0.8rem;
  font-weight: 800;
  color: #e2e8f0;
  text-align: center;
}
.awk-choose-opt.awk .awk-choose-lbl { color: #e9d5ff; }

/* pets */
.pet-slot {
  position: relative;
  z-index: 1;
  width: 70px;
  height: 70px;
  margin: 5px;
  border-radius: 50%;
  border: 2px dashed #2a3441;
  background: #000000de;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pet-slot[draggable="true"] { cursor: grab; }
.pet-slot.dragging { opacity: 0.45; cursor: grabbing; }
.pet-slot.drag-over {
  border-color: #f59e0b;
  border-style: solid;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.55);
}
.pet-slot-tag {
  font-size: 4rem;
  font-weight: 800;
  line-height: 0;
  color: rgba(204, 204, 204, 0.123);
  pointer-events: none;
}
.pet-slot > img,
.pet-slot > .q-icon {
  position: relative;
  z-index: 1;
  pointer-events: none;
}
.pet-slot:hover { border-color: #22c55e; }
.pet-slot img { width: 100%; height: 100%; object-fit: cover; }

.wt-alt { background: #12161f; border: 1px solid #262d38; border-radius: 00px 0px 10px 10px; padding: 8px 10px; margin-bottom: 8px; }
</style>
