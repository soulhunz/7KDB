// Store กลางเก็บข้อมูลทั้งหมดที่โหลดจาก backend (getAllData)
// โครงสร้างข้อมูลอิงตามเวอร์ชัน HTML เดิม (processLoadedData)
import { defineStore } from 'pinia'
import { api } from '@/api'

export const useDataStore = defineStore('data', {
  state: () => ({
    loaded: false,
    loading: false,
    error: null,
    timestamp: 0,

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
        this.applyData(data || {})
        this.loaded = true
      } catch (e) {
        this.error = e?.message || String(e)
        console.error('loadAll failed:', e)
      } finally {
        this.loading = false
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
      if (data.guilds) this.guilds = data.guilds
      if (data.applications) this.applications = data.applications
      if (data.surveyConfig) this.surveyConfig = data.surveyConfig
      if (data.battleHistory) this.battleHistory = data.battleHistory
    },
  },
})
