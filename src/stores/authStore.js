// ระบบล็อกอินผ่าน Google (Google Identity Services)
// - ทุกคน login ผ่าน Google ได้ (ฟรี)
// - สิทธิ์ Premium (แชร์บิ้วขึ้นรายการ) เช็คจาก PREMIUM_EMAILS/ADMIN_EMAILS (ชั่วคราว) — ย้ายไป backend ได้ภายหลัง
// - เก็บ session ใน localStorage เพื่อคง login ข้ามการรีเฟรช
import { defineStore } from 'pinia'
import { PREMIUM_EMAILS, ADMIN_EMAILS } from '@/config/auth'

const AUTH_KEY = '7kdb_auth_v2'

// ถอด payload จาก Google JWT (id token) เพื่อดึง email/name/picture
function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

const norm = (e) => String(e || '').trim().toLowerCase()

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null, // { id, email, name, picture }
    hydrated: false,
  }),

  getters: {
    isLoggedIn: (s) => !!s.user,
    displayName: (s) => (s.user ? s.user.name || s.user.email : ''),
    picture: (s) => s.user?.picture || '',
    isAdmin: (s) => !!s.user && ADMIN_EMAILS.map(norm).includes(norm(s.user.email)),

    // ระดับสมาชิก: guest → free → premium (เผื่อ VIP/Premium)
    tier() {
      if (!this.user) return 'guest'
      if (this.isAdmin) return 'premium'
      if (PREMIUM_EMAILS.map(norm).includes(norm(this.user.email))) return 'premium'
      return 'free'
    },
    isPremium() {
      return this.tier === 'premium'
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

    // รับ credential (JWT) จาก Google Identity Services
    loginWithGoogleCredential(credential) {
      const p = decodeJwt(credential)
      if (!p || !p.email) throw new Error('ไม่สามารถอ่านข้อมูลบัญชี Google')
      this.user = { id: p.sub, email: p.email, name: p.name || p.email, picture: p.picture || '' }
      try { localStorage.setItem(AUTH_KEY, JSON.stringify(this.user)) } catch { /* ignore */ }
      return this.user
    },

    logout() {
      this.user = null
      try { localStorage.removeItem(AUTH_KEY) } catch { /* ignore */ }
      try { window.google?.accounts?.id?.disableAutoSelect?.() } catch { /* ignore */ }
    },
  },
})
