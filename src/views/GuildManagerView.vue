<script setup>
import { computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'

const store = useDataStore()

const guilds = computed(() =>
  [...store.guilds].sort((a, b) => (a.type === 'main' ? -1 : b.type === 'main' ? 1 : 0))
)
</script>

<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-xs">🏰 กิลด์ & พันธมิตร</div>
    <div class="text-grey-5 q-mb-md">
      {{ store.guildCount }} กิลด์ · รวม {{ store.memberCount }} คน
    </div>

    <div v-if="store.loading">
      <q-skeleton height="120px" class="q-mb-sm" />
      <q-skeleton height="120px" />
    </div>

    <div v-else-if="!guilds.length" class="text-center text-grey-5 q-pa-xl">
      <div class="text-h2">🏰</div>
      ยังไม่มีข้อมูลกิลด์
    </div>

    <div v-else class="row q-col-gutter-md">
      <div v-for="g in guilds" :key="g.id" class="col-12 col-md-6">
        <q-card class="bg-dark" bordered>
          <q-card-section class="row items-center no-wrap">
            <div class="text-h4 q-mr-sm">{{ g.type === 'main' ? '👑' : '🛡️' }}</div>
            <div class="col">
              <div class="text-h6 text-weight-bold ellipsis">{{ g.name }}</div>
              <q-badge :color="g.type === 'main' ? 'amber-8' : 'blue-grey'" :label="g.type === 'main' ? 'กิลด์หลัก' : 'พันธมิตร'" />
            </div>
            <q-badge
              :color="(g.members || []).length >= 30 ? 'negative' : 'positive'"
              class="text-body2 q-pa-sm"
              :label="`${(g.members || []).length}/30`"
            />
          </q-card-section>

          <q-separator dark />

          <q-expansion-item
            dense
            expand-separator
            icon="groups"
            :label="`รายชื่อสมาชิก (${(g.members || []).length})`"
            header-class="text-grey-4"
          >
            <q-list separator dark>
              <q-item v-for="m in g.members" :key="m.id">
                <q-item-section>
                  <q-item-label>{{ m.name || '—' }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row q-gutter-xs text-caption text-grey-5">
                    <span>🦸 {{ (m.hero_list || []).length }}</span>
                    <span>🐾 {{ (m.pet_list || []).length }}</span>
                    <span>💍 {{ (m.ring_list || []).length }}</span>
                  </div>
                </q-item-section>
              </q-item>
              <q-item v-if="!(g.members || []).length">
                <q-item-section class="text-grey-6">ยังไม่มีสมาชิก</q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>
        </q-card>
      </div>
    </div>
  </q-page>
</template>
