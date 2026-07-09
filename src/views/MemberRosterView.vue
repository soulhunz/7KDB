<script setup>
import { ref, computed, watch } from 'vue'
import { useDataStore } from '@/stores/dataStore'

const store = useDataStore()

// เลือกกิลด์ที่กำลังดู
const activeGuildId = ref(null)
watch(
  () => store.guilds,
  (guilds) => {
    if (!activeGuildId.value && guilds.length) activeGuildId.value = guilds[0].id
  },
  { immediate: true }
)

const activeGuild = computed(
  () => store.guilds.find((g) => g.id === activeGuildId.value) || null
)

const guildOptions = computed(() =>
  store.guilds.map((g) => ({
    label: `${g.type === 'main' ? '👑' : '🛡️'} ${g.name} (${(g.members || []).length}/30)`,
    value: g.id,
  }))
)

// แปลง hero_list/pet_list ที่อาจเป็น id หรือ object → id
const idOf = (x) => (x && typeof x === 'object' ? x.id : x)

// lookup ฮีโร่จาก id เพื่อโชว์รูป
const heroesById = computed(() => {
  const m = {}
  store.heroes.forEach((h) => { if (h?.id != null) m[String(h.id)] = h })
  return m
})

const search = ref('')
const members = computed(() => {
  const list = activeGuild.value?.members || []
  const q = search.value.trim().toLowerCase()
  return list
    .filter((m) => !q || (m.name || '').toLowerCase().includes(q))
    .map((m) => ({
      ...m,
      heroCount: (m.hero_list || []).length,
      petCount: (m.pet_list || []).length,
      ringCount: (m.ring_list || []).length,
      teamCount: (m.teams || []).length,
    }))
})

const columns = [
  { name: 'name', label: 'ชื่อลูกกิล', field: 'name', align: 'left', sortable: true },
  { name: 'heroCount', label: '🦸 ฮีโร่', field: 'heroCount', align: 'center', sortable: true },
  { name: 'petCount', label: '🐾 สัตว์', field: 'petCount', align: 'center', sortable: true },
  { name: 'ringCount', label: '💍 แหวน', field: 'ringCount', align: 'center', sortable: true },
  { name: 'teamCount', label: '⚔️ ทีม', field: 'teamCount', align: 'center', sortable: true },
  { name: 'updated', label: 'อัปเดต', field: 'inventoryUpdatedAt', align: 'right', sortable: true },
]

function fmtDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })
}

// dialog รายละเอียดสมาชิก
const detail = ref(null)
const showDetail = ref(false)
function openDetail(member) {
  detail.value = member
  showDetail.value = true
}
const detailHeroes = computed(() => {
  if (!detail.value) return []
  return (detail.value.hero_list || [])
    .map((h) => heroesById.value[String(idOf(h))])
    .filter(Boolean)
})
</script>

<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-xs">👥 ข้อมูลลูกกิล</div>

    <div v-if="store.loading" class="q-mt-md">
      <q-skeleton height="40px" class="q-mb-sm" />
      <q-skeleton height="280px" />
    </div>

    <div v-else-if="!store.guilds.length" class="text-center text-grey-5 q-pa-xl">
      <div class="text-h2">🏰</div>
      ยังไม่มีข้อมูลกิลด์
    </div>

    <template v-else>
      <!-- แถวเลือกกิลด์ + ค้นหา -->
      <div class="row items-center q-col-gutter-sm q-mb-md">
        <div class="col-12 col-sm-5">
          <q-select
            v-model="activeGuildId"
            :options="guildOptions"
            emit-value
            map-options
            dense
            outlined
            dark
            label="เลือกกิลด์"
          />
        </div>
        <div class="col-12 col-sm-4">
          <q-input v-model="search" dense outlined dark clearable placeholder="ค้นหาชื่อลูกกิล...">
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
        <div class="col-12 col-sm-3 text-right">
          <q-badge
            :color="members.length >= 30 ? 'negative' : 'positive'"
            class="text-body2 q-pa-sm"
          >
            สมาชิก {{ (activeGuild?.members || []).length }}/30
          </q-badge>
        </div>
      </div>

      <q-table
        :rows="members"
        :columns="columns"
        row-key="id"
        dark
        flat
        bordered
        :rows-per-page-options="[15, 30, 50, 0]"
        class="bg-dark"
        @row-click="(e, row) => openDetail(row)"
      >
        <template #body-cell-updated="props">
          <q-td :props="props" class="text-grey-5">{{ fmtDate(props.value) }}</q-td>
        </template>
        <template #no-data>
          <div class="full-width text-center text-grey-5 q-pa-md">ไม่พบลูกกิล</div>
        </template>
      </q-table>
    </template>

    <!-- Dialog รายละเอียดสมาชิก -->
    <q-dialog v-model="showDetail" @hide="detail = null">
      <q-card class="bg-dark" style="min-width: 340px; max-width: 620px">
        <q-card-section class="row items-center">
          <div class="text-h6">👤 {{ detail?.name }}</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-separator dark />
        <q-card-section>
          <div class="row q-gutter-sm q-mb-md">
            <q-chip color="blue-9" text-color="white">🦸 {{ (detail?.hero_list || []).length }}</q-chip>
            <q-chip color="green-9" text-color="white">🐾 {{ (detail?.pet_list || []).length }}</q-chip>
            <q-chip color="purple-9" text-color="white">💍 {{ (detail?.ring_list || []).length }}</q-chip>
          </div>

          <div class="text-subtitle2 q-mb-sm">ฮีโร่ที่มี ({{ detailHeroes.length }})</div>
          <div v-if="!detailHeroes.length" class="text-grey-5 text-caption">
            ไม่มีข้อมูลฮีโร่ (หรือ id ไม่ตรงกับฐานข้อมูลฮีโร่)
          </div>
          <div v-else class="row q-gutter-xs">
            <q-avatar
              v-for="h in detailHeroes"
              :key="h.id"
              rounded
              size="44px"
              class="cursor-help"
            >
              <img :src="h.img" :title="h.name" />
              <q-tooltip>{{ h.name }}</q-tooltip>
            </q-avatar>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>
