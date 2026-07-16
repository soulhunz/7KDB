import { createRouter, createWebHistory } from 'vue-router'
import { NAV_ITEMS } from '@/config/nav'

// view จริงที่ทำเสร็จแล้ว — map ตาม name
const readyViews = {
  dashboard: () => import('@/views/DashboardView.vue'),
  gallery: () => import('@/views/GalleryView.vue'),
  'hero-build': () => import('@/views/HeroBuildView.vue'),
  'member-roster': () => import('@/views/MemberRosterView.vue'),
  'equip-manager': () => import('@/views/EquipManagerView.vue'),
  'skill-lib': () => import('@/views/SkillLibView.vue'),
  'guild-manager': () => import('@/views/GuildManagerView.vue'),
  'battle-war': () => import('@/views/WarTeamsView.vue'),
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

// หน้าแรก + 404 -> ไปหน้าบิ้วตัวละคร (หน้า dashboard ปิดชั่วคราว)
const HOME = '/hero-build'
routes.push({ path: '/', redirect: HOME })
routes.push({ path: '/:pathMatch(.*)*', redirect: HOME })

const router = createRouter({
  // ใช้ BASE_URL เพื่อรองรับ deploy ใต้ sub-path (GitHub Pages = /7KDB/)
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// อัปเดต title ตามหน้า
router.afterEach((to) => {
  const label = to.meta?.label
  document.title = label ? `7KDB — ${label}` : '7KDB'
})

export default router
