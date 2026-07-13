<script setup>
import { computed } from 'vue'

// ระบบดาว: 6 ดาวเสมอ สีตามระดับ C
//  C0 = เหลือง · C1-C6 = ฟ้า · C7-C12 = แดง
//  Awakening = ม่วง เสมอ, ขอบสีตามระดับ (C0 ไม่มีขอบ, C1-6 ขอบฟ้า, C7-12 ขอบแดง)
const props = defineProps({
  blue: { type: Number, default: 0 }, // จำนวนดาวฟ้า → C1-C6
  red: { type: Number, default: 0 },  // จำนวนดาวแดง → C7-C12
  awakened: { type: Boolean, default: false },
  size: { type: Number, default: 16 },
  showLevel: { type: Boolean, default: true },
})

const COLOR = { yellow: '#fbbf24', blue: '#38bdf8', red: '#f43f5e', purple: '#a855f7' }

const tier = computed(() => (props.red > 0 ? 'red' : props.blue > 0 ? 'blue' : 'yellow'))
const cLevel = computed(() => (props.red > 0 ? 6 + Math.min(6, props.red) : Math.min(6, props.blue)))
const fill = computed(() => (props.awakened ? COLOR.purple : COLOR[tier.value]))
// ขอบ: เฉพาะ awakening ที่ระดับ C1 ขึ้นไป
const stroke = computed(() => (props.awakened && tier.value !== 'yellow' ? COLOR[tier.value] : null))

const starStyle = computed(() => ({
  color: fill.value,
  fontSize: props.size + 'px',
  ...(stroke.value ? { WebkitTextStroke: '1.2px ' + stroke.value } : {}),
}))
</script>

<template>
  <span class="build-stars">
    <span v-for="n in 6" :key="n" class="bs-star" :style="starStyle">★</span>
    <span v-if="showLevel" class="bs-clevel" :class="{ awk: awakened }">C{{ cLevel }}</span>
  </span>
</template>

<style scoped>
.build-stars {
  display: inline-flex;
  align-items: center;
  gap: 1px;
}
.bs-star {
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55);
}
.bs-clevel {
  margin-left: 6px;
  font-size: 0.72rem;
  font-weight: 800;
  color: #cbd5e1;
}
.bs-clevel.awk {
  color: #c4b5fd;
}
</style>
