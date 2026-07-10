<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useDataStore } from '@/stores/dataStore'
import HeroBuildEditor from '@/components/HeroBuildEditor.vue'
import HeroBuildShareDialog from '@/components/HeroBuildShareDialog.vue'
import HeroBuildDetailDialog from '@/components/HeroBuildDetailDialog.vue'
import { defaultBuild, normalizeBuildData, decodeBuild } from '@/config/heroBuild'

const store = useDataStore()
const $q = useQuasar()

const LS_KEY = '7kdb_hero_build'
const FALLBACK = 'https://placehold.co/64x64/0d1117/475569?text=%3F'
const onErr = (e) => (e.target.src = FALLBACK)

// ---- โหมด: list = รายการบิ้วที่แชร์ | editor = สร้าง/แก้บิ้วของฉัน ----
const mode = ref('list')

// ---- state ของบิ้วที่กำลังสร้าง (persist ลง localStorage) ----
function loadLS() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY))
    if (s && Array.isArray(s.pieces) && s.pieces.length === 4) return normalizeBuildData(s)
  } catch { /* ignore */ }
  return defaultBuild()
}
const editorBuild = reactive(loadLS())

watch(editorBuild, (v) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(v)) } catch { /* ignore */ }
}, { deep: true })

function replaceBuild(data) {
  Object.assign(editorBuild, normalizeBuildData(data))
}

// ---- รายการบิ้วที่แชร์ ----
const search = ref('')
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

// ---- ดูรายละเอียดบิ้วที่แชร์ (อ่านอย่างเดียว) ----
const showDetail = ref(false)
const selectedBuild = ref(null)
function openDetail(build) {
  selectedBuild.value = build
  showDetail.value = true
}

// ---- สร้าง / แก้บิ้วของฉัน ----
function newBuild() {
  mode.value = 'editor'
}
function backToList() { mode.value = 'list' }
function resetBuild() {
  $q.dialog({
    title: 'ล้างบิ้ว',
    message: 'ล้างหน้านี้ทั้งหมด? (ตัวละคร + ดาว + เซต + อุปกรณ์)',
    cancel: true, dark: true,
  }).onOk(() => {
    Object.assign(editorBuild, defaultBuild())
  })
}

// ---- share / save / load ----
const showShare = ref(false)
const shareMode = ref('save')
const publishing = ref(false)
const defaultName = computed(() => {
  const h = store.heroes.find((x) => String(x.id) === String(editorBuild.heroId))
  return h ? 'บิ้ว ' + h.name : ''
})
function openSave() {
  if (!editorBuild.heroId) { $q.notify({ type: 'warning', message: 'เลือกตัวละครก่อนบันทึก/แชร์' }); return }
  shareMode.value = 'save'
  showShare.value = true
}
function openLoad() {
  shareMode.value = 'load'
  showShare.value = true
}
function onLoadCode(data) {
  replaceBuild(data)
  mode.value = 'editor'
  const h = store.heroes.find((x) => String(x.id) === String(editorBuild.heroId))
  $q.notify({ type: 'positive', message: '✅ โหลดบิ้วสำเร็จ' + (h ? ': ' + h.name : (editorBuild.heroId ? ' (⚠️ ไม่พบตัวละครในฐานข้อมูล)' : '')) })
}

async function onPublish({ name, owner }) {
  if (!editorBuild.heroId) { $q.notify({ type: 'warning', message: 'เลือกตัวละครก่อน' }); return }
  publishing.value = true
  const data = JSON.parse(JSON.stringify(editorBuild))
  const oid = (owner || '').replace(/\W/g, '').slice(0, 6) || 'x'
  const rand = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
  const record = { id: 'build_' + Date.now() + '_' + oid + '_' + rand, name, owner, heroId: editorBuild.heroId, data, ts: Date.now() }
  try {
    await store.publishBuild(record)
    showShare.value = false
    $q.notify({ type: 'positive', message: '✅ เผยแพร่บิ้วสำเร็จ!' })
    mode.value = 'list'
  } catch (e) {
    $q.notify({ type: 'negative', message: '⚠️ เผยแพร่ไม่สำเร็จ: ' + (e?.message || e) })
  } finally {
    publishing.value = false
  }
}

// ---- เปิดจากลิงก์แชร์ ?build=CODE → เข้าตัวแก้ไข (บิ้วใหม่จากโค้ด) ----
onMounted(() => {
  try {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('build')
    if (!code) return
    const res = decodeBuild(code)
    if (res.ok && res.data) {
      replaceBuild(res.data)
      mode.value = 'editor'
      $q.notify({ type: 'positive', message: '🔗 เปิดบิ้วจากลิงก์แล้ว' })
    }
    const u = new URL(window.location.href)
    u.searchParams.delete('build')
    window.history.replaceState(null, '', u.pathname + (u.search || '') + (u.hash || ''))
  } catch { /* ignore */ }
})
</script>

<template>
  <q-page class="q-pa-md">
    <!-- ===== LIST MODE (รายการบิ้วที่แชร์ — อ่านอย่างเดียว) ===== -->
    <template v-if="mode === 'list'">
      <div class="row items-center q-mb-md">
        <div>
          <div class="text-h5 text-weight-bold">🔨 บิ้วตัวละคร</div>
          <div class="text-grey-5">รายการบิ้วที่แชร์ {{ store.heroBuilds.length }} · แสดง {{ filtered.length }}</div>
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
        <template v-else>
          <div>ยังไม่มีบิ้วที่แชร์</div>
          <div class="text-caption text-grey-6 q-mt-xs">กดปุ่ม + มุมขวาล่างเพื่อสร้างบิ้วของคุณ</div>
        </template>
      </div>

      <div v-else class="build-grid">
        <div v-for="c in filtered" :key="c.build.id" class="build-card" @click="openDetail(c.build)">
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
    </template>

    <!-- ===== EDITOR MODE (สร้างบิ้วของฉัน) ===== -->
    <template v-else>
      <div class="row items-center q-mb-md">
        <q-btn flat dense round icon="arrow_back" color="grey-4" @click="backToList" />
        <div class="text-h6 text-weight-bold q-ml-sm">🔨 สร้างบิ้ว</div>
      </div>
      <HeroBuildEditor :build="editorBuild" />
    </template>

    <!-- ===== FAB ===== -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <div v-if="mode === 'list'">
        <q-btn fab icon="add" color="blue-6" @click="newBuild">
          <q-tooltip>สร้างบิ้วใหม่</q-tooltip>
        </q-btn>
      </div>
      <div v-else class="fab-col">
        <q-btn fab-mini icon="save" color="green-6" @click="openSave"><q-tooltip>บันทึก / เผยแพร่ / แชร์</q-tooltip></q-btn>
        <q-btn fab-mini icon="download" color="blue-6" @click="openLoad"><q-tooltip>โหลด (วางโค้ด)</q-tooltip></q-btn>
        <q-btn fab-mini icon="delete_sweep" color="grey-7" @click="resetBuild"><q-tooltip>ล้างทั้งหมด</q-tooltip></q-btn>
        <q-btn fab-mini icon="list" color="grey-8" @click="backToList"><q-tooltip>กลับรายการบิ้ว</q-tooltip></q-btn>
      </div>
    </q-page-sticky>

    <HeroBuildShareDialog
      v-model="showShare"
      :mode="shareMode"
      :build="editorBuild"
      :default-name="defaultName"
      :publishing="publishing"
      @publish="onPublish"
      @load="onLoadCode"
    />
    <HeroBuildDetailDialog v-model="showDetail" :build="selectedBuild" />
  </q-page>
</template>

<style scoped>
.build-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}
.build-card {
  position: relative;
  display: flex;
  gap: 12px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 16px;
  padding: 14px;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
}
.build-card:hover { transform: translateY(-2px); border-color: #3b82f6; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45); }
.build-portrait {
  width: 64px; height: 64px; border-radius: 14px; border: 2px solid rgba(59, 130, 246, 0.4);
  overflow: hidden; background: #000; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
}
.build-portrait img { width: 100%; height: 100%; object-fit: cover; display: block; }
.build-portrait-empty { font-size: 1.6rem; opacity: 0.3; }
.build-meta { min-width: 0; flex: 1; }
.build-name { font-size: 0.95rem; font-weight: 800; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.build-hero { font-size: 0.78rem; color: #93c5fd; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.build-owner { font-size: 0.7rem; color: #6b7280; }
.build-set { font-size: 0.72rem; color: rgba(34, 211, 238, 0.85); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fab-col { display: flex; flex-direction: column; gap: 10px; align-items: center; }
</style>
