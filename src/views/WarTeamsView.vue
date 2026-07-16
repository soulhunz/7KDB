<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from '@/api'
import { useDataStore } from '@/stores/dataStore'
import { useAuthStore } from '@/stores/authStore'
import WarTeamEditorDialog from '@/components/WarTeamEditorDialog.vue'
import LoginDialog from '@/components/LoginDialog.vue'

const $q = useQuasar()
const store = useDataStore()
const auth = useAuthStore()

const teams = ref([])
const loading = ref(false)
const tab = ref('all') // all | attack | defense
const showLogin = ref(false)

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
const FALLBACK = 'https://placehold.co/60x60/0d1117/475569?text=%3F'
const onErr = (e) => (e.target.src = FALLBACK)

const filtered = computed(() => (tab.value === 'all' ? teams.value : teams.value.filter((t) => t.type === tab.value)))

async function load() {
  loading.value = true
  try {
    teams.value = await api.getWarTeams(auth.user?.email || '')
  } catch (e) {
    $q.notify({ type: 'negative', message: 'โหลดทีมไม่สำเร็จ: ' + (e?.message || e) })
  } finally {
    loading.value = false
  }
}
onMounted(load)

// ---- create / edit ----
const showEditor = ref(false)
const editing = ref(null)
function create() {
  if (!auth.isLoggedIn) {
    $q.notify({ type: 'warning', message: '🔒 ต้องเข้าสู่ระบบเพื่อสร้างทีม', timeout: 2500 })
    showLogin.value = true
    return
  }
  editing.value = null
  showEditor.value = true
}
function edit(t) {
  editing.value = t
  showEditor.value = true
}

async function onSave(team) {
  try {
    await api.saveWarTeam(team, auth.user?.email || '')
    showEditor.value = false
    $q.notify({ type: 'positive', message: '✅ บันทึกทีมแล้ว' })
    await load()
  } catch (e) {
    $q.notify({ type: 'negative', message: 'บันทึกไม่สำเร็จ: ' + (e?.message || e) })
  }
}

function del(t) {
  $q.dialog({ title: 'ลบทีม', message: `ลบทีม "${t.name}"?`, cancel: true, dark: true }).onOk(async () => {
    try {
      await api.deleteWarTeam(t.id, auth.user?.email || '')
      $q.notify({ type: 'positive', message: 'ลบแล้ว' })
      await load()
    } catch (e) {
      $q.notify({ type: 'negative', message: 'ลบไม่สำเร็จ: ' + (e?.message || e) })
    }
  })
}
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-sm">
      <div>
        <div class="text-h5 text-weight-bold">⚔️ ทีมบุก / ทีมรับ</div>
        <div class="text-grey-5">ทีมที่แชร์ {{ teams.length }} · แสดง {{ filtered.length }}</div>
      </div>
      <q-space />
      <q-btn flat dense round icon="refresh" :loading="loading" @click="load"><q-tooltip>รีเฟรช</q-tooltip></q-btn>
    </div>

    <q-tabs v-model="tab" dense align="left" class="q-mb-md text-grey-5" active-color="primary" indicator-color="primary" narrow-indicator>
      <q-tab name="all" label="ทั้งหมด" no-caps />
      <q-tab name="attack" label="⚔️ ทีมบุก" no-caps />
      <q-tab name="defense" label="🛡️ ทีมรับ" no-caps />
    </q-tabs>

    <div v-if="loading && !teams.length" class="q-gutter-sm">
      <q-skeleton height="90px" /><q-skeleton height="90px" />
    </div>

    <div v-else-if="!filtered.length" class="text-center text-grey-6 q-pa-xl">
      <div class="text-h2 q-mb-sm">📋</div>
      <div>ยังไม่มีทีมที่แชร์</div>
      <div v-if="auth.isLoggedIn" class="text-caption text-grey-7 q-mt-xs">กดปุ่ม + มุมขวาล่างเพื่อสร้างทีม</div>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div v-for="t in filtered" :key="t.id" class="col-12 col-md-6">
        <q-card class="bg-dark" bordered>
          <q-card-section class="q-pb-xs">
            <div class="row items-center no-wrap">
              <q-badge :color="t.type === 'attack' ? 'red-7' : 'blue-7'" :label="t.type === 'attack' ? '⚔️ บุก' : '🛡️ รับ'" class="q-mr-sm" />
              <div class="text-weight-bold ellipsis col">{{ t.name }}</div>
              <q-badge v-if="t.visibility === 'restricted'" color="amber-8" class="q-ml-xs"><q-icon name="lock" size="12px" /></q-badge>
              <q-btn v-if="t.canEdit" flat dense round size="sm" icon="edit" @click="edit(t)" />
              <q-btn v-if="t.isOwner" flat dense round size="sm" icon="delete" color="red-4" @click="del(t)" />
            </div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div class="row items-center q-gutter-xs">
              <div v-for="(h, i) in t.heroes" :key="i" class="wt-mini">
                <img v-if="heroById[h]" :src="heroById[h].img" @error="onErr" :title="heroById[h].name" />
                <span v-else class="wt-mini-empty">·</span>
              </div>
              <div v-if="petById[t.pet]" class="wt-mini wt-mini-pet">
                <img :src="petById[t.pet].img" @error="onErr" :title="petById[t.pet].name" />
              </div>
            </div>
            <div v-if="t.note" class="text-caption text-grey-4 q-mt-xs">{{ t.note }}</div>
            <div class="text-caption text-grey-6 q-mt-xs">โดย {{ t.owner || 'ไม่ระบุ' }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="create">
        <q-tooltip>สร้างทีม</q-tooltip>
      </q-btn>
    </q-page-sticky>

    <WarTeamEditorDialog v-model="showEditor" :team="editing" @save="onSave" />
    <LoginDialog v-model="showLogin" />
  </q-page>
</template>

<style scoped>
.wt-mini { width: 46px; height: 46px; border-radius: 8px; overflow: hidden; border: 1px solid #2a3441; background: #000; display: flex; align-items: center; justify-content: center; }
.wt-mini img { width: 100%; height: 100%; object-fit: cover; }
.wt-mini-empty { color: #374151; }
.wt-mini-pet { border-color: #22c55e55; }
</style>
