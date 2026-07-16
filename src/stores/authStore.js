// ระบบล็อกอินผ่าน Google (Google Identity Services)
// - ทุกคน login ผ่าน Google ได้ (ฟรี)
// - สิทธิ์ Premium (แชร์บิ้วขึ้นรายการ) เช็คจาก PREMIUM_EMAILS/ADMIN_EMAILS (ชั่วคราว) — ย้ายไป backend ได้ภายหลัง
// - เก็บ session ใน localStorage เพื่อคง login ข้ามการรีเฟรช
import { defineStore } from 'pinia'
import { api } from '@/api'
import { PREMIUM_EMAILS, ADMIN_EMAILS, DEV_TIER_OVERRIDE } from '@/config/auth'

// override เฉพาะตอน dev (build จริงจะไม่มีผล)
const devOverride = import.meta.env.DEV ? DEV_TIER_OVERRIDE : null

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
    serverTier: null, // ระดับจาก backend (sheet Premium) — null = ยังไม่ได้เช็ค
    hydrated: false,
  }),

  getters: {
    isLoggedIn: (s) => !!s.user,
    displayName: (s) => (s.user ? s.user.name || s.user.email : ''),
    picture: (s) => s.user?.picture || '',
    isAdmin: (s) => {
      if (!s.user) return false
      if (devOverride) return false // ตอนทดสอบ override → ซ่อน UI admin
      return ADMIN_EMAILS.map(norm).includes(norm(s.user.email))
    },

    // ระดับสมาชิก — ลำดับความสำคัญ:
    //   dev override (เฉพาะ dev) > sheet Premium (backend) > admin/config email > free
    tier() {
      if (!this.user) return 'guest'
      if (devOverride) return devOverride // [dev] บังคับระดับเพื่อทดสอบ
      if (this.serverTier && this.serverTier !== 'free') return this.serverTier
      if (this.isAdmin) return 'premium'
      if (PREMIUM_EMAILS.map(norm).includes(norm(this.user.email))) return 'premium'
      return 'free'
    },
    isPremium() {
      return this.tier === 'premium'
    },
  },

  actions: {
    persist() {
      try {
        localStorage.setItem(AUTH_KEY, JSON.stringify({ user: this.user, serverTier: this.serverTier }))
      } catch { /* ignore */ }
    },

    hydrate() {
      if (this.hydrated) return
      this.hydrated = true
      try {
        const raw = localStorage.getItem(AUTH_KEY)
        if (raw) {
          const p = JSON.parse(raw)
          // รองรับทั้งฟอร์แมตใหม่ {user, serverTier} และเก่า (เป็น user ตรง ๆ)
          this.user = p && p.user ? p.user : p
          this.serverTier = p && p.serverTier ? p.serverTier : null
        }
      } catch { /* ignore */ }
      // เช็ค tier ล่าสุดจาก backend เบื้องหลัง (เผื่อ premium เปลี่ยนในชีต)
      if (this.user) this.refreshTier()
    },

    // รับ credential (JWT) จาก Google Identity Services
    loginWithGoogleCredential(credential) {
      const p = decodeJwt(credential)
      if (!p || !p.email) throw new Error('ไม่สามารถอ่านข้อมูลบัญชี Google')
      this.user = { id: p.sub, email: p.email, name: p.name || p.email, picture: p.picture || '' }
      this.serverTier = null
      this.persist()
      this.refreshTier() // เช็ค Premium จากชีตเบื้องหลัง
      return this.user
    },

    // ดึงระดับสมาชิกจาก backend (sheet Premium) แล้ว cache
    async refreshTier() {
      if (!this.user?.email) return
      try {
        const t = await api.getUserTier(this.user.email)
        this.serverTier = t || 'free'
        this.persist()
      } catch {
        /* ถ้า backend ล่ม ใช้ config email list เป็น fallback */
      }
    },

    logout() {
      this.user = null
      this.serverTier = null
      try { localStorage.removeItem(AUTH_KEY) } catch { /* ignore */ }
      try { window.google?.accounts?.id?.disableAutoSelect?.() } catch { /* ignore */ }
    },
  },
})
