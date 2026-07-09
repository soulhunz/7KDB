// Store กลางเก็บข้อมูลทั้งหมดที่โหลดจาก backend (getAllData)
// โครงสร้างข้อมูลอิงตามเวอร์ชัน HTML เดิม (processLoadedData)
import { defineStore } from 'pinia'
import { api } from '@/api'
import { downloadSnapshot } from '@/api/snapshot'

export const useDataStore = defineStore('data', {
  state: () => ({
    loaded: false,
    loading: false,
    exporting: false,
    error: null,
    timestamp: 0,
    source: null, // 'snapshot' | 'live' — ข้อมูลชุดนี้มาจากไหน

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
    // รวมจำนวนสมาชิกจากทุกกิลด์
    memberCount: (s) =>
      s.guilds.reduce((sum, g) => sum + ((g.members && g.members.length) || 0), 0),
  },

  actions: {
    // โหลดข้อมูลทั้งหมด (เรียกครั้งเดียวตอนเปิดแอป) — ไม่มี login แล้ว
    async loadAll(force = false) {
      if (this.loaded && !force) return
      this.loading = true
      this.error = null
      try {
        const data = await api.getAllData()
        this.source = data?.__fromSnapshot ? 'snapshot' : 'live'
        this.applyData(data || {})
        this.loaded = true
      } catch (e) {
        this.error = e?.message || String(e)
        console.error('loadAll failed:', e)
      } finally {
        this.loading = false
      }
    },

    // [Admin] ดึงข้อมูลสดล่าสุดจาก backend แล้วดาวน์โหลดเป็นไฟล์ data.json
    // (เอาไปวางใน public/ แล้ว deploy — user จะได้อ่านจาก snapshot แทนการยิง Apps Script)
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

    // แมปข้อมูลดิบจาก server เข้า state (กัน array ว่างมาทับข้อมูลเดิม)
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
    // (อิงตาม applyGuildsFromServer ของเวอร์ชัน HTML)
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
