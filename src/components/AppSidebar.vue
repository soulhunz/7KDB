<script setup>
import { NAV_GROUPS } from '@/config/nav'
</script>

<template>
  <q-scroll-area class="fit">
    <q-list padding>
      <template v-for="group in NAV_GROUPS" :key="group.title">
        <q-item-label header class="text-grey-5 text-weight-bold text-uppercase">
          {{ group.title }}
        </q-item-label>

        <q-item
          v-for="item in group.items"
          :key="item.name"
          clickable
          v-ripple
          :to="item.path"
          exact
          active-class="nav-active"
        >
          <q-item-section avatar>
            <span class="text-h6">{{ item.icon }}</span>
          </q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
          <q-item-section v-if="!item.ready" side>
            <q-badge color="grey-8" text-color="grey-4" label="เร็ว ๆ นี้" />
          </q-item-section>
        </q-item>

        <q-separator spaced dark />
      </template>
    </q-list>
  </q-scroll-area>
</template>

<style scoped>
.nav-active {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  font-weight: 600;
  border-right: 3px solid #3b82f6;
}
</style>
