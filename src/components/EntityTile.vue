<script setup>
// tile รูป 100x100 กดได้ + ชื่อด้านล่าง — ใช้ร่วมกันทั้งฮีโร่/สัตว์/แหวน/เซ็ต
defineProps({
  name: { type: String, default: '' },
  img: { type: String, default: '' },
  // ขอบสีพิเศษ (เช่น เกรดแหวน) — ถ้าไม่ส่งใช้ขอบเทา
  borderColor: { type: String, default: '#30363d' },
  // มุมขวาบน (เช่น เกรด/เรตติ้ง)
  badge: { type: String, default: '' },
  badgeColor: { type: String, default: '#c2410c' },
})
defineEmits(['click'])

const FALLBACK = 'https://placehold.co/100x100/0d1117/475569?text=%3F'
</script>

<template>
  <div class="tile column items-center cursor-pointer" @click="$emit('click')">
    <div
      class="tile-img"
      :style="{ borderColor }"
    >
      <img
        :src="img || FALLBACK"
        loading="lazy"
        @error="(e) => (e.target.src = FALLBACK)"
      />
      <span v-if="badge" class="tile-badge" :style="{ backgroundColor: badgeColor }">{{ badge }}</span>
    </div>
    <div class="tile-name" :title="name">{{ name || '—' }}</div>
  </div>
</template>

<style scoped>
.tile {
  width: 100px;
}
.tile-img {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  border: 2px solid;
  overflow: hidden;
  background: #000;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.tile:hover .tile-img {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
}
.tile-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.tile-badge {
  position: absolute;
  top: 3px;
  left: 3px;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  padding: 1px 5px;
  border-radius: 6px;
  line-height: 1.4;
}
.tile-name {
  width: 100px;
  margin-top: 4px;
  font-size: 11px;
  text-align: center;
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
