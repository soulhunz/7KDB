import { createRouter, createWebHistory } from 'vue-router'
import { NAV_ITEMS } from '@/config/nav'

// view จริงที่ทำเสร็จแล้ว — map ตาม name
const readyViews = {
  dashboard: () => import('@/views/DashboardView.vue'),
  'hero-manager': () => import('@/views/HeroManagerView.vue'),
  'pet-manager': () => import('@/views/PetManagerView.vue'),
  'ring-manager': () => import('@/views/RingManagerView.vue'),
  'member-roster': () => import('@/views/MemberRosterView.vue'),
  'equip-manager': () => import('@/views/EquipManagerView.vue'),
  'skill-lib': () => import('@/views/SkillLibView.vue'),
  'guild-manager': () => import('@/views/GuildManagerView.vue'),
}

// สร้าง routes จาก nav config ทีเดียว — view ที่ยังไม่ทำใช้ PlaceholderView
const routes = NAV_ITEMS.map((item) => ({
  path: item.path,
  name: item.name,
  component: item.ready
    ? readyViews[item.name]
    : () => import('@/views/PlaceholderView.vue'),
  meta: { label: item.label, icon: item.icon },
}))

// 404 -> กลับหน้าแรก
routes.push({ path: '/:pathMatch(.*)*', redirect: '/' })

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// อัปเดต title ตามหน้า
router.afterEach((to) => {
  const label = to.meta?.label
  document.title = label ? `7KDB — ${label}` : '7KDB'
})

export default router
