<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { GOOGLE_CLIENT_ID } from '@/config/auth'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'success'])
const show = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

const auth = useAuthStore()
const btnEl = ref(null)
const err = ref('')
const loading = ref(false)

function loadGis() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('โหลด Google Sign-In ไม่สำเร็จ'))
    document.head.appendChild(s)
  })
}

function onCredential(resp) {
  try {
    auth.loginWithGoogleCredential(resp.credential)
    show.value = false
    emit('success')
  } catch (e) {
    err.value = 'เข้าสู่ระบบไม่สำเร็จ: ' + (e?.message || e)
  }
}

async function setup() {
  err.value = ''
  if (!GOOGLE_CLIENT_ID) {
    err.value = 'ยังไม่ได้ตั้งค่า Google Client ID — แก้ที่ src/config/auth.js'
    return
  }
  loading.value = true
  try {
    await loadGis()
    window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onCredential })
    await nextTick()
    if (btnEl.value) {
      btnEl.value.innerHTML = ''
      window.google.accounts.id.renderButton(btnEl.value, {
        theme: 'filled_blue', size: 'large', shape: 'pill', text: 'signin_with', width: 280,
      })
    }
  } catch (e) {
    err.value = e?.message || 'โหลด Google Sign-In ไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

watch(show, (v) => { if (v) setup() })
</script>

<template>
  <q-dialog v-model="show">
    <q-card class="login-card">
      <div class="login-head">
        <q-btn flat round dense icon="close" color="white" class="absolute-top-right q-ma-sm" v-close-popup />
        <div class="login-logo"><span class="text-primary">7K</span>DB</div>
        <div class="login-sub">เข้าสู่ระบบด้วยบัญชี Google</div>
      </div>

      <q-card-section class="column items-center q-gutter-md">
        <q-spinner v-if="loading" color="primary" size="28px" />
        <div ref="btnEl" class="gsi-btn"></div>

        <q-banner v-if="err" class="bg-red-9 text-white full-width" rounded dense>
          <template #avatar><q-icon name="error" /></template>
          {{ err }}
        </q-banner>
      </q-card-section>

      <div class="login-foot">
        ล็อกอินฟรีทุกคน · แชร์บิ้วขึ้นรายการต้องเป็นสมาชิก <b class="text-amber-4">Premium</b>
        <br />บันทึก/แชร์รูปได้โดยไม่ต้องล็อกอิน
      </div>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.login-card {
  width: 92vw;
  max-width: 380px;
  border-radius: 16px;
  overflow: hidden;
  background: #0f1420;
}
.login-head {
  position: relative;
  text-align: center;
  padding: 26px 20px 18px;
  background: linear-gradient(135deg, #1e3a5f 0%, #0f1420 100%);
}
.login-logo { font-size: 2rem; font-weight: 800; color: #fff; letter-spacing: 0.02em; }
.login-sub { font-size: 0.8rem; color: #93c5fd; margin-top: 4px; }
.gsi-btn { min-height: 44px; display: flex; justify-content: center; }
.login-foot {
  text-align: center;
  font-size: 0.72rem;
  color: #94a3b8;
  padding: 4px 16px 18px;
  line-height: 1.6;
}
</style>
