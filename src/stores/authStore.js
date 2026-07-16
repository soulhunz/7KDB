// ระบบล็อกอิน (ทั่วไป) — ใช้ action login ของ Apps Script (Users sheet)
// เก็บ session ใน localStorage เพื่อคง login ข้ามการรีเฟรช
import { defineStore } from 'pinia'
import { api } from '@/api'

const AUTH_KEY = '7kdb_auth_v1'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null, // { id, name, role, permissions, guild_name }
    loading: false,
    error: null,
    hydrated: false,
  }),

  getters: {
    isLoggedIn: (s) => !!s.user,
    displayName: (s) => (s.user ? s.user.name || s.user.id : ''),
    isAdmin: (s) => s.user?.role === 'admin',

    // ---- ระดับสมาชิก (เผื่อระบบ VIP/Premium ในอนาคต) ----
    // อ่านจาก field user.tier/plan ถ้ามี, admin ถือเป็น premium, ที่เหลือ = free
    tier: (s) => {
      if (!s.user) return 'guest'
      const t = String(s.user.tier || s.user.plan || '').toLowerCase()
      if (t) return t
      if (s.user.role === 'admin') return 'premium'
      return 'free'
    },
    isVip() {
      return this.tier === 'vip' || this.tier === 'premium'
    },
    isPremium() {
      return this.tier === 'premium'
    },
    // เช็คสิทธิ์แบบยืดหยุ่น — ใช้ทั้ง permissions array และ tier
    can: (s) => (feature) => {
      if (!s.user) return false
      if (s.user.role === 'admin') return true
      const perms = Array.isArray(s.user.permissions) ? s.user.permissions : []
      return perms.includes(feature)
    },
  },

  actions: {
    hydrate() {
      if (this.hydrated) return
      this.hydrated = true
      try {
        const raw = localStorage.getItem(AUTH_KEY)
        if (raw) this.user = JSON.parse(raw)
      } catch {
        /* ignore */
      }
    },

    async login(username, password) {
      this.loading = true
      this.error = null
      try {
        const res = await api.login(username, password)
        if (res && res.status === 'success' && res.user) {
          this.user = res.user
          try { localStorage.setItem(AUTH_KEY, JSON.stringify(res.user)) } catch { /* ignore */ }
          return true
        }
        this.error = res?.message || 'เข้าสู่ระบบไม่สำเร็จ'
        return false
      } catch (e) {
        this.error = e?.message || String(e)
        return false
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.user = null
      try { localStorage.removeItem(AUTH_KEY) } catch { /* ignore */ }
    },
  },
})
