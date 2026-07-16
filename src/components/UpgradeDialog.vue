<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { PREMIUM } from '@/config/premium'
import { useAuthStore } from '@/stores/authStore'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])
const show = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

const $q = useQuasar()
const auth = useAuthStore()
const hasPay = computed(() => !!(PREMIUM.qrImage || PREMIUM.promptpay))

function copy(text) {
  try {
    navigator.clipboard?.writeText(text)
    $q.notify({ type: 'positive', message: 'คัดลอกแล้ว', timeout: 1200 })
  } catch {
    $q.notify({ type: 'info', message: text })
  }
}
</script>

<template>
  <q-dialog v-model="show">
    <q-card class="up-card">
      <div class="up-head">
        <q-btn flat round dense icon="close" color="white" class="absolute-top-right q-ma-sm" v-close-popup />
        <q-icon name="workspace_premium" size="34px" color="amber-4" />
        <div class="up-title">สมัคร Premium</div>
        <div class="up-price">{{ PREMIUM.priceLabel }}</div>
      </div>

      <q-card-section>
        <!-- สิทธิประโยชน์ -->
        <q-list dense>
          <q-item v-for="(b, i) in PREMIUM.benefits" :key="i" class="q-px-none">
            <q-item-section avatar><q-icon :name="b.icon" color="amber-5" /></q-item-section>
            <q-item-section>{{ b.text }}</q-item-section>
          </q-item>
        </q-list>

        <q-separator dark spaced />

        <!-- ช่องทางชำระ -->
        <div class="text-subtitle2 q-mb-sm">💳 ช่องทางชำระเงิน</div>
        <div v-if="!hasPay" class="text-caption text-grey-6 q-py-sm">
          ยังไม่ได้ตั้งค่าช่องทางชำระ (แก้ที่ <code>src/config/premium.js</code>)
        </div>

        <div v-if="PREMIUM.qrImage" class="text-center q-mb-md">
          <img :src="PREMIUM.qrImage" alt="QR" class="up-qr" />
        </div>
        <q-item v-if="PREMIUM.promptpay" class="up-pp" clickable @click="copy(PREMIUM.promptpay)">
          <q-item-section avatar><q-icon name="qr_code_2" color="primary" /></q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold">{{ PREMIUM.promptpay }}</q-item-label>
            <q-item-label caption>พร้อมเพย์{{ PREMIUM.promptpayName ? ' · ' + PREMIUM.promptpayName : '' }} (แตะเพื่อคัดลอก)</q-item-label>
          </q-item-section>
          <q-item-section side><q-icon name="content_copy" /></q-item-section>
        </q-item>

        <q-banner class="bg-blue-grey-9 text-grey-3 q-mt-md" rounded dense>
          <template #avatar><q-icon name="info" color="info" /></template>
          {{ PREMIUM.note }}
          <div v-if="auth.isLoggedIn" class="q-mt-xs text-weight-bold">
            อีเมลของคุณ: {{ auth.user.email }}
          </div>
        </q-banner>

        <q-btn
          v-if="PREMIUM.contact"
          class="full-width q-mt-md"
          color="green-6"
          icon="send"
          no-caps
          unelevated
          label="แจ้งสลิป / ติดต่อแอดมิน"
          type="a"
          :href="PREMIUM.contact"
          target="_blank"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.up-card {
  width: 92vw;
  max-width: 400px;
  border-radius: 16px;
  overflow: hidden;
  background: #0f1420;
}
.up-head {
  position: relative;
  text-align: center;
  padding: 22px 20px 16px;
  background: linear-gradient(135deg, #78560f 0%, #0f1420 100%);
}
.up-title { font-size: 1.3rem; font-weight: 800; color: #fff; margin-top: 4px; }
.up-price { font-size: 1rem; color: #fcd34d; font-weight: 700; margin-top: 2px; }
.up-qr { width: 190px; max-width: 70%; border-radius: 12px; border: 3px solid #fff; background: #fff; }
.up-pp { background: #161b22; border: 1px solid #262d38; border-radius: 10px; }
</style>
