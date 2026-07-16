<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { DONATE } from '@/config/donate'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])
const show = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

const $q = useQuasar()
const hasChannel = computed(() => !!(DONATE.qrImage || DONATE.promptpay || (DONATE.links && DONATE.links.length)))

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
    <q-card class="donate-card">
      <div class="donate-head">
        <q-btn flat round dense icon="close" color="white" class="absolute-top-right q-ma-sm" v-close-popup />
        <div class="donate-emoji">❤️</div>
        <div class="donate-title">สนับสนุน 7KDB</div>
      </div>

      <q-card-section>
        <div class="text-body2 text-grey-3 q-mb-md">{{ DONATE.message }}</div>

        <div v-if="!hasChannel" class="text-caption text-grey-6 text-center q-py-md">
          ยังไม่ได้ตั้งค่าช่องทางสนับสนุน<br />(แก้ที่ <code>src/config/donate.js</code>)
        </div>

        <!-- QR พร้อมเพย์ -->
        <div v-if="DONATE.qrImage" class="text-center q-mb-md">
          <img :src="DONATE.qrImage" alt="PromptPay QR" class="donate-qr" />
        </div>

        <!-- เลขพร้อมเพย์ -->
        <q-item v-if="DONATE.promptpay" class="donate-pp" clickable @click="copy(DONATE.promptpay)">
          <q-item-section avatar><q-icon name="qr_code_2" color="primary" /></q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold">{{ DONATE.promptpay }}</q-item-label>
            <q-item-label caption>พร้อมเพย์{{ DONATE.promptpayName ? ' · ' + DONATE.promptpayName : '' }} (แตะเพื่อคัดลอก)</q-item-label>
          </q-item-section>
          <q-item-section side><q-icon name="content_copy" /></q-item-section>
        </q-item>

        <!-- ลิงก์ภายนอก -->
        <div v-if="DONATE.links && DONATE.links.length" class="q-gutter-sm q-mt-md">
          <q-btn
            v-for="l in DONATE.links"
            :key="l.url"
            class="full-width"
            :color="l.color || 'primary'"
            :icon="l.icon || 'favorite'"
            :label="l.label"
            no-caps
            unelevated
            type="a"
            :href="l.url"
            target="_blank"
          />
        </div>
      </q-card-section>

      <div class="donate-foot">ขอบคุณที่สนับสนุนครับ 🙏</div>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.donate-card {
  width: 92vw;
  max-width: 380px;
  border-radius: 16px;
  overflow: hidden;
  background: #0f1420;
}
.donate-head {
  position: relative;
  text-align: center;
  padding: 22px 20px 16px;
  background: linear-gradient(135deg, #7f1d3a 0%, #0f1420 100%);
}
.donate-emoji { font-size: 2rem; }
.donate-title { font-size: 1.2rem; font-weight: 800; color: #fff; margin-top: 2px; }
.donate-qr {
  width: 200px;
  max-width: 70%;
  border-radius: 12px;
  border: 3px solid #fff;
  background: #fff;
}
.donate-pp {
  background: #161b22;
  border: 1px solid #262d38;
  border-radius: 10px;
}
.donate-foot {
  text-align: center;
  font-size: 0.8rem;
  color: #f472b6;
  padding: 0 16px 18px;
}
</style>
