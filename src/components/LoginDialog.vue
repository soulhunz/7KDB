<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'success'])
const show = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

const auth = useAuthStore()
const username = ref('')
const password = ref('')
const showPass = ref(false)

watch(show, (v) => {
  if (v) { username.value = ''; password.value = ''; auth.error = null }
})

async function submit() {
  if (!username.value.trim() || !password.value) return
  const ok = await auth.login(username.value.trim(), password.value)
  if (ok) {
    show.value = false
    emit('success')
  }
}
</script>

<template>
  <q-dialog v-model="show">
    <q-card class="login-card">
      <div class="login-head">
        <q-btn flat round dense icon="close" color="white" class="absolute-top-right q-ma-sm" v-close-popup />
        <div class="login-logo"><span class="text-primary">7K</span>DB</div>
        <div class="login-sub">สำหรับสมาชิก · สร้าง/แก้ไขบิ้วได้</div>
      </div>

      <q-card-section class="q-gutter-md">
        <q-input
          v-model="username"
          dark outlined dense
          label="ชื่อผู้ใช้"
          autofocus
          @keyup.enter="submit"
        >
          <template #prepend><q-icon name="person" /></template>
        </q-input>
        <q-input
          v-model="password"
          dark outlined dense
          :type="showPass ? 'text' : 'password'"
          label="รหัสผ่าน"
          @keyup.enter="submit"
        >
          <template #prepend><q-icon name="lock" /></template>
          <template #append>
            <q-icon :name="showPass ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showPass = !showPass" />
          </template>
        </q-input>

        <q-banner v-if="auth.error" class="bg-red-9 text-white" rounded dense>
          <template #avatar><q-icon name="error" /></template>
          {{ auth.error }}
        </q-banner>
      </q-card-section>

      <q-card-actions class="q-px-md q-pb-md">
        <q-btn
          class="full-width"
          color="primary"
          unelevated
          no-caps
          size="md"
          label="เข้าสู่ระบบ"
          icon="login"
          :loading="auth.loading"
          :disable="!username.trim() || !password"
          @click="submit"
        />
      </q-card-actions>

      <div class="login-foot">
        ยังไม่เป็นสมาชิก? สมัคร Premium รายเดือนเพื่อสร้าง/แก้ไขบิ้ว · หรือสนับสนุนเราผ่าน Donate
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
.login-foot {
  text-align: center;
  font-size: 0.72rem;
  color: #64748b;
  padding: 0 16px 18px;
}
</style>
