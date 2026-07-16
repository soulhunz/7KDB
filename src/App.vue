<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import AppSidebar from '@/components/AppSidebar.vue'
import LoginDialog from '@/components/LoginDialog.vue'
import DonateDialog from '@/components/DonateDialog.vue'
import { useDataStore } from '@/stores/dataStore'
import { useAuthStore } from '@/stores/authStore'

const $q = useQuasar()
const store = useDataStore()
const auth = useAuthStore()
const drawerOpen = ref(true)
const showLogin = ref(false)
const showDonate = ref(false)

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

function doLogout() {
  auth.logout()
  $q.notify({ type: 'info', message: 'ออกจากระบบแล้ว', timeout: 1500 })
}

onMounted(() => {
  auth.hydrate() // คืน session ที่ login ไว้
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

        <q-btn v-if="auth.isAdmin" flat dense round icon="publish" :loading="store.exporting" @click="publishSnapshot">
          <q-tooltip>เผยแพร่ snapshot (admin) — ดาวน์โหลด data.json</q-tooltip>
        </q-btn>

        <!-- Donate (ทุกคนกดได้ ไม่ต้อง login) -->
        <q-btn flat dense round icon="favorite" color="pink-4" class="q-ml-xs" @click="showDonate = true">
          <q-tooltip>สนับสนุน (Donate)</q-tooltip>
        </q-btn>

        <!-- ===== Login / User (มุมขวา) ===== -->
        <q-btn v-if="!auth.isLoggedIn" flat dense no-caps icon="login" label="เข้าสู่ระบบ" class="q-ml-sm" @click="showLogin = true" />
        <q-btn v-else flat dense round class="q-ml-sm">
          <q-avatar size="28px" color="primary" text-color="white">
            {{ (auth.displayName[0] || '?').toUpperCase() }}
          </q-avatar>
          <q-menu anchor="bottom right" self="top right">
            <q-list style="min-width: 180px">
              <q-item>
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white">{{ (auth.displayName[0] || '?').toUpperCase() }}</q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">{{ auth.displayName }}</q-item-label>
                  <q-item-label caption>
                    <q-badge :color="auth.isPremium ? 'amber-8' : auth.isVip ? 'deep-purple-5' : 'blue-grey'"
                      :label="auth.tier.toUpperCase()" />
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="doLogout">
                <q-item-section avatar><q-icon name="logout" color="red-4" /></q-item-section>
                <q-item-section class="text-red-4">ออกจากระบบ</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <LoginDialog v-model="showLogin" />
    <DonateDialog v-model="showDonate" />

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
