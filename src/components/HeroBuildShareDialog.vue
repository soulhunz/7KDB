<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useDataStore } from '@/stores/dataStore'
import { encodeBuild, decodeBuild, normalizeBuildData } from '@/config/heroBuild'
import { renderBuildCanvas, shareCanvas } from '@/utils/buildImage'

const props = defineProps({
  modelValue: Boolean,
  mode: { type: String, default: 'save' }, // 'save' | 'load'
  build: { type: Object, default: null }, // build.data ปัจจุบัน (สำหรับ encode ตอน save)
  defaultName: { type: String, default: '' },
  owner: { type: String, default: '' }, // ผู้สร้าง = ผู้ใช้ที่ login (ล็อกไว้)
  canPublish: { type: Boolean, default: true }, // เผยแพร่ขึ้นรายการได้ไหม (= Premium)
  publishing: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'publish', 'load', 'upgrade'])
const show = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

const $q = useQuasar()
const store = useDataStore()

const name = ref('')
const owner = ref('')
const code = ref('')
const imgBusy = ref(false)

async function shareImage() {
  if (imgBusy.value) return
  imgBusy.value = true
  try {
    const wrapped = { name: name.value.trim() || 'บิ้วตัวละคร', owner: owner.value.trim(), data: props.build }
    const cv = await renderBuildCanvas(wrapped, store)
    const fn = `7kdb-${(wrapped.name).replace(/[\\/:*?"<>|]+/g, '').trim() || 'build'}.png`
    const res = await shareCanvas(cv, fn, wrapped.name)
    if (res === 'downloaded') $q.notify({ type: 'info', message: 'อุปกรณ์นี้แชร์รูปไม่ได้ — ดาวน์โหลดให้แทนแล้ว', timeout: 2500 })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'แชร์รูปไม่สำเร็จ: ' + (e?.message || e) })
  } finally {
    imgBusy.value = false
  }
}

watch(
  () => [props.modelValue, props.mode],
  ([open]) => {
    if (!open) return
    if (props.mode === 'save') {
      code.value = encodeBuild(props.build || {})
      if (!name.value.trim()) name.value = props.defaultName || ''
      owner.value = props.owner || ''
    } else {
      code.value = ''
    }
  },
  { immediate: true },
)

async function copy(text, msg) {
  try {
    await navigator.clipboard.writeText(text)
    $q.notify({ type: 'positive', message: msg, timeout: 1500 })
  } catch {
    $q.notify({ type: 'warning', message: 'คัดลอกไม่สำเร็จ — คัดลอกจากช่องด้วยตนเอง' })
  }
}
function copyCode() {
  if (!code.value) return
  copy(code.value, '📋 คัดลอกโค้ดบิ้วแล้ว')
}
function copyLink() {
  if (!code.value) return
  let url
  try {
    const u = new URL(window.location.href)
    u.hash = ''
    u.searchParams.set('build', code.value)
    url = u.toString()
  } catch {
    url = window.location.origin + window.location.pathname + '?build=' + encodeURIComponent(code.value)
  }
  copy(url, '🔗 คัดลอกลิงก์แล้ว — ส่งให้เพื่อนเปิดดูบิ้วได้ทันที')
}
function doPublish() {
  if (!props.canPublish) { emit('upgrade'); return } // ไม่ใช่ premium → ชวนสมัคร
  if (!name.value.trim()) {
    $q.notify({ type: 'warning', message: 'กรุณาตั้งชื่อบิ้ว' })
    return
  }
  emit('publish', { name: name.value.trim(), owner: owner.value.trim() || 'ไม่ระบุ' })
}
function doLoad() {
  const c = (code.value || '').trim()
  if (!c) {
    $q.notify({ type: 'warning', message: 'กรุณาวางโค้ดบิ้วก่อน' })
    return
  }
  const res = decodeBuild(c)
  if (!res.ok) {
    $q.notify({
      type: 'negative',
      message: res.reason === 'corrupt'
        ? '❌ โค้ดบิ้วเสียหาย/ไม่ครบ — ลองคัดลอกใหม่ทั้งโค้ด'
        : '❌ โค้ดบิ้วไม่ถูกต้อง',
    })
    return
  }
  emit('load', normalizeBuildData(res.data))
  if (res.newer) $q.notify({ type: 'warning', message: '⚠️ โค้ดนี้มาจากแอปเวอร์ชันใหม่กว่า บางค่าอาจไม่ครบ' })
  show.value = false
}
</script>

<template>
  <q-dialog v-model="show">
    <q-card class="share-card">
      <q-card-section class="row items-center q-pb-sm">
        <div class="text-h6 text-white">{{ mode === 'save' ? '💾 บันทึก / แชร์บิ้ว' : '📥 โหลดบิ้วจากโค้ด' }}</div>
        <q-space />
        <q-btn flat round dense icon="close" color="white" v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <template v-if="mode === 'save'">
          <div class="text-caption text-grey-5 q-mb-sm">
            ตั้งชื่อแล้วกด 🌍 เผยแพร่ (ให้คนอื่นเห็นในรายการ) หรือคัดลอกโค้ด/ลิงก์ส่งเอง
          </div>
          <q-input v-model="name" dense outlined dark label="ชื่อบิ้ว" class="q-mb-sm" maxlength="60" counter />
          <q-input v-model="owner" dense outlined dark readonly label="ผู้สร้าง (จากบัญชีที่เข้าสู่ระบบ)" class="q-mb-sm">
            <template #prepend><q-icon name="person" /></template>
          </q-input>
          <q-input v-model="code" type="textarea" rows="3" dense outlined dark readonly label="โค้ดบิ้ว" class="hb-code q-mb-sm" />
          <q-banner v-if="!canPublish" class="bg-amber-9 text-white q-mb-sm" rounded dense>
            <template #avatar><q-icon name="workspace_premium" /></template>
            เผยแพร่ขึ้นรายการต้องเป็นสมาชิก <b>Premium</b> — แต่คัดลอกโค้ด/ลิงก์ และแชร์เป็นรูปได้ตามปกติ
          </q-banner>
          <div class="row q-gutter-sm">
            <q-btn
              unelevated :color="canPublish ? 'purple-6' : 'amber-8'" no-caps
              :icon="canPublish ? 'public' : 'workspace_premium'"
              :label="canPublish ? 'เผยแพร่' : 'เผยแพร่ (Premium)'"
              :loading="publishing" @click="doPublish"
            />
            <q-btn outline color="grey-4" no-caps icon="content_copy" label="คัดลอกโค้ด" @click="copyCode" />
            <q-btn outline color="blue-4" no-caps icon="link" label="คัดลอกลิงก์" @click="copyLink" />
            <q-btn outline color="teal-4" no-caps icon="image" label="แชร์เป็นรูป" :loading="imgBusy" @click="shareImage" />
          </div>
        </template>

        <template v-else>
          <div class="text-caption text-grey-5 q-mb-sm">วางโค้ดบิ้วที่ได้รับ แล้วกด “โหลดบิ้วนี้”</div>
          <q-input
            v-model="code" type="textarea" rows="4" dense outlined dark autofocus
            label="วางโค้ดบิ้วที่นี่..." class="hb-code q-mb-sm"
          />
          <q-btn unelevated color="blue-6" no-caps icon="download" label="โหลดบิ้วนี้" @click="doLoad" />
        </template>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.share-card {
  width: 92vw;
  max-width: 480px;
  background: #0f1420;
  border-radius: 16px;
}
.hb-code :deep(textarea) {
  font-family: monospace;
  font-size: 0.75rem;
  word-break: break-all;
}
</style>
