// Store กลางเก็บข้อมูลทั้งหมด + ระบบ incremental loading
// - โหลดครั้งแรก: snapshot/getAllData (ได้ข้อมูล + versions)
// - ครั้งต่อไป: getUpdates(versions) → โหลดเฉพาะ category ที่เปลี่ยน
// - cache ลง localStorage เพื่อให้เปิดครั้งหน้าเริ่มจากของเดิมทันที
import { defineStore } from 'pinia'
import { api } from '@/api'
import { downloadSnapshot } from '@/api/snapshot'

const CACHE_KEY = '7kdb_cache_v1'
// state ที่ persist ลง localStorage (ชื่อ state ในสโตร์)
const PERSIST_KEYS = [
  'heroes', 'pets', 'rings', 'items', 'equipSets', 'heroBuilds', 'accessories',
  'skillLib', 'enemyPatterns', 'affiliations', 'teams', 'teams3v3', 'guilds',
  'applications', 'surveyConfig', 'battleHistory',
]
// map: category จาก server → ชื่อ state ในสโตร์ (สำหรับ merge delta ของ getUpdates)
const CAT_TO_STATE = {
  heroes: 'heroes', pets: 'pets', rings: 'rings', items: 'items',
  equip_sets: 'equipSets', hero_builds: 'heroBuilds', accessories: 'accessories',
  skillLib: 'skillLib', enemyPatterns: 'enemyPatterns', affiliations: 'affiliations',
  teams_3v3: 'teams3v3', applications: 'applications', battleHistory: 'battleHistory',
  surveyConfig: 'surveyConfig',
}

export const useDataStore = defineStore('data', {
  state: () => ({
    loaded: false,
    loading: false,
    exporting: false,
    error: null,
    timestamp: 0,
    source: null, // 'snapshot' | 'สด' | 'อัปเดต N หมวด' | 'ล่าสุดแล้ว'
    versions: {}, // เวอร์ชันต่อ category ที่ client มีอยู่
    hydrated: false, // อ่าน cache จาก localStorage แล้วหรือยัง
    initDone: false, // โหลดรอบแรกของ session เสร็จหรือยัง

    // ก้อนข้อมูลหลัก
    heroes: [],
    pets: [],
    rings: [],
    items: [],
    equipSets: [],
    heroBuilds: [],
    accessories: [],
    skillLib: [],
    enemyPatterns: [],
    affiliations: [],
    teams: {},
    teams3v3: [],
    guilds: [],
    applications: [],
    surveyConfig: null,
    battleHistory: [],
  }),

  getters: {
    heroCount: (s) => s.heroes.length,
    petCount: (s) => s.pets.length,
    ringCount: (s) => s.rings.length,
    guildCount: (s) => s.guilds.length,
    memberCount: (s) =>
      s.guilds.reduce((sum, g) => sum + ((g.members && g.members.length) || 0), 0),
  },

  actions: {
    // โหลดข้อมูล — full ครั้งแรก แล้ว incremental ครั้งต่อไป
    async loadAll(force = false) {
      if (this.initDone && !force) return
      this.loading = true
      this.error = null
      try {
        if (!this.hydrated) {
          this.hydrateFromCache()
          this.hydrated = true
        }

        if (this.loaded && this.versions && Object.keys(this.versions).length) {
          // ---- incremental: โหลดเฉพาะที่เปลี่ยน ----
          const res = await api.getUpdates(this.versions)
          const changed = res?.changed || {}
          this.applyDelta(changed)
          if (res?.versions) this.versions = res.versions
          if (res?.timestamp) this.timestamp = res.timestamp
          const n = Object.keys(changed).length
          this.source = n ? `อัปเดต ${n} หมวด` : 'ล่าสุดแล้ว'
        } else {
          // ---- full: โหลดทั้งก้อน (snapshot ก่อน แล้ว fallback Apps Script) ----
          const data = await api.getAllData()
          this.source = data?.__fromSnapshot ? 'snapshot' : 'สด'
          this.applyData(data || {})
          this.loaded = true
          if (data?.versions && Object.keys(data.versions).length) {
            this.versions = data.versions
          } else {
            // snapshot เก่าไม่มี versions → ขอ baseline (เล็กมาก) เพื่อให้ครั้งหน้าเป็น incremental
            try { this.versions = await api.getVersions() } catch (e) { this.versions = {} }
          }
        }
        this.initDone = true
        this.persistCache()
      } catch (e) {
        this.error = e?.message || String(e)
        console.error('loadAll failed:', e)
      } finally {
        this.loading = false
      }
    },

    // [Admin] ดึงข้อมูลสดล่าสุด แล้วดาวน์โหลดเป็น data.json (สำหรับ publish snapshot)
    async exportSnapshot() {
      this.exporting = true
      try {
        const live = await api.getAllDataLive()
        downloadSnapshot(live || {})
        return live?.timestamp || 0
      } finally {
        this.exporting = false
      }
    },

    // เผยแพร่บิ้ว 1 รายการ → เขียนขึ้น backend (HeroBuilds sheet) + อัปเดต local ทันที
    async publishBuild(record) {
      if (!record || !record.id) throw new Error('ข้อมูลบิ้วไม่ครบ')
      await api.saveOneItem('hero_builds', record)
      const i = this.heroBuilds.findIndex((b) => String(b.id) === String(record.id))
      if (i >= 0) this.heroBuilds.splice(i, 1, record)
      else this.heroBuilds.push(record)
      this.persistCache()
    },

    // ลบบิ้ว 1 รายการ → ลบจาก backend + local
    async deleteBuild(id) {
      await api.deleteOneItem('hero_builds', id)
      this.heroBuilds = this.heroBuilds.filter((b) => String(b.id) !== String(id))
      this.persistCache()
    },

    // merge เฉพาะ category ที่เปลี่ยน (overwrite ตรง ๆ — รองรับ เพิ่ม/แก้/ลบ)
    applyDelta(changed) {
      if (!changed) return
      Object.keys(changed).forEach((cat) => {
        if (cat === 'guilds') {
          this.applyGuilds({ guilds: changed.guilds || [] })
          return
        }
        if (cat === 'teams') {
          const t = changed.teams?.teams ? changed.teams.teams : changed.teams
          this.teams = t || {}
          return
        }
        const key = CAT_TO_STATE[cat]
        if (key) this[key] = changed[cat]
      })
    },

    // เขียน cache ลง localStorage
    persistCache() {
      try {
        const data = {}
        PERSIST_KEYS.forEach((k) => (data[k] = this[k]))
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ versions: this.versions, timestamp: this.timestamp, data })
        )
      } catch (e) {
        console.warn('cache save failed:', e)
      }
    },

    // อ่าน cache จาก localStorage (เริ่มแอปเห็นข้อมูลทันทีก่อนยิง network)
    hydrateFromCache() {
      try {
        const raw = localStorage.getItem(CACHE_KEY)
        if (!raw) return false
        const p = JSON.parse(raw)
        if (!p || !p.data) return false
        PERSIST_KEYS.forEach((k) => {
          if (p.data[k] !== undefined) this[k] = p.data[k]
        })
        this.versions = p.versions || {}
        this.timestamp = p.timestamp || 0
        this.loaded = true
        return true
      } catch (e) {
        return false
      }
    },

    // แมปข้อมูลดิบจาก server เข้า state (full load — กัน array ว่างมาทับข้อมูลเดิม)
    applyData(data) {
      this.timestamp = data.timestamp || Date.now()
      if (data.heroes?.length) this.heroes = data.heroes
      if (data.pets?.length) this.pets = data.pets
      if (data.rings?.length) this.rings = data.rings
      if (data.items) this.items = data.items
      if (data.equip_sets?.length) this.equipSets = data.equip_sets
      if (Array.isArray(data.hero_builds)) this.heroBuilds = data.hero_builds
      if (data.accessories?.length) this.accessories = data.accessories
      if (Array.isArray(data.skillLib)) this.skillLib = data.skillLib
      if (data.enemyPatterns?.length) this.enemyPatterns = data.enemyPatterns
      if (data.affiliations) this.affiliations = data.affiliations
      if (data.teams) {
        const t = data.teams.teams ? data.teams.teams : data.teams
        this.teams = t || {}
      }
      if (data.teams_3v3?.length) this.teams3v3 = data.teams_3v3
      this.applyGuilds(data)
      if (data.applications) this.applications = data.applications
      if (data.surveyConfig) this.surveyConfig = data.surveyConfig
      if (data.battleHistory) this.battleHistory = data.battleHistory
    },

    // จัดกลุ่มกิลด์จาก server — รองรับทั้ง data.guilds และ fallback data.guildMembers
    applyGuilds(data) {
      if (data.guilds?.length) {
        this.guilds = data.guilds.map((g) => ({
          id: g.id,
          name: g.name,
          type: g.type || 'sub',
          members: (g.members || []).map(normalizeMember),
        }))
      } else if (data.guildMembers?.length) {
        const byGuild = {}
        data.guildMembers.forEach((m) => {
          const gid = String(m.guild_id || 'G_MAIN')
          ;(byGuild[gid] ||= []).push(normalizeMember(m))
        })
        this.guilds = Object.keys(byGuild).map((gid) => ({
          id: gid,
          name: gid === 'G_MAIN' ? 'Main Guild (กิลด์หลัก)' : gid,
          type: gid === 'G_MAIN' ? 'main' : 'sub',
          members: byGuild[gid],
        }))
      } else if (data.guilds) {
        // delta ที่กิลด์ถูกล้างหมด
        this.guilds = []
      }
    },
  },
})

// map ข้อมูลสมาชิกให้ครบ field (อิงตาม normalizeMemberRecord เดิม)
function normalizeMember(m) {
  if (!m) return { id: '', name: '', hero_list: [], pet_list: [], ring_list: [], teams: [], inventoryUpdatedAt: 0 }
  return {
    id: String(m.id ?? ''),
    name: m.name || '',
    // ไม่เก็บ accessCode — แอปนี้ตัด login แล้ว ไม่ควรถือ credential ไว้ใน client
    hero_list: m.hero_list || m.ownedHeroes || [],
    pet_list: m.pet_list || [],
    ring_list: m.ring_list || [],
    teams: Array.isArray(m.teams) ? m.teams : [],
    inventoryUpdatedAt: parseInt(m.inventoryUpdatedAt, 10) || 0,
  }
}
