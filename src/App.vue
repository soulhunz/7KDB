<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import AppSidebar from '@/components/AppSidebar.vue'
import { useDataStore } from '@/stores/dataStore'

const $q = useQuasar()
const store = useDataStore()
const drawerOpen = ref(true)

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value
}

async function refresh() {
  await store.loadAll(true)
  if (store.error) {
    $q.notify({ type: 'negative', message: 'โหลดข้อมูลไม่สำเร็จ: ' + store.error })
  } else {
    $q.notify({ type: 'positive', message: 'อัปเดตข้อมูลแล้ว' })
  }
}

// [Admin] ดึงข้อมูลสด → ดาวน์โหลด data.json ไปวางใน public/ แล้ว deploy
async function publishSnapshot() {
  try {
    await store.exportSnapshot()
    $q.notify({
      type: 'positive',
      timeout: 6000,
      message: 'ดาวน์โหลด data.json แล้ว — นำไปวางใน public/ แล้ว deploy',
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: ' export ไม่สำเร็จ: ' + (e?.message || e) })
  }
}

onMounted(() => {
  // โหลดข้อมูลทั้งหมดตอนเปิดแอป — ไม่มี login
  store.loadAll()
})
</script>

<template>
  <q-layout view="hHh Lpr lFf">
    <q-header elevated class="bg-dark">
      <q-toolbar style="height: 50px; min-height: 50px">
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleDrawer" />
        <q-toolbar-title class="text-weight-bold">
          <span class="text-primary">7K</span>DB
          <span class="text-caption text-grey-5 q-ml-sm">Seven Deadly Sins</span>
        </q-toolbar-title>

        <q-space />

        <q-badge
          v-if="store.loaded"
          :color="store.syncing ? 'grey-7' : store.source === 'ล่าสุดแล้ว' ? 'positive' : 'info'"
          class="q-mr-sm"
          text-color="white"
        >
          <q-spinner v-if="store.syncing" size="12px" class="q-mr-xs" />
          <q-icon v-else name="bolt" size="14px" class="q-mr-xs" />
          {{ store.syncing ? 'กำลังเช็ค...' : store.source || 'พร้อม' }}
        </q-badge>

        <q-btn
          flat
          dense
          round
          icon="refresh"
          :loading="store.loading || store.syncing"
          @click="refresh"
        >
          <q-tooltip>รีเฟรชข้อมูล</q-tooltip>
        </q-btn>

        <q-btn flat dense round icon="publish" :loading="store.exporting" @click="publishSnapshot">
          <q-tooltip>เผยแพร่ snapshot (admin) — ดาวน์โหลด data.json</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawerOpen"
      show-if-above
      :width="260"
      :breakpoint="700"
      bordered
      class="bg-dark"
    >
      <AppSidebar />
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
