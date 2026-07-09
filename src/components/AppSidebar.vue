<script setup>
import { NAV_GROUPS } from '@/config/nav'
</script>

<template>
  <q-scroll-area class="fit">
    <q-list padding>
      <template v-for="group in NAV_GROUPS" :key="group.title">
        <q-item-label header class="text-grey-6 text-weight-bold">
          {{ group.title }}
        </q-item-label>

        <q-item
          v-for="item in group.items"
          :key="item.name"
          clickable
          v-ripple
          :to="item.path"
          exact
          active-class="text-primary bg-primary-fade"
        >
          <q-item-section avatar>
            <q-avatar size="30px">{{ item.icon }}</q-avatar>
          </q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
          <q-item-section v-if="!item.ready" side>
            <q-badge outline color="grey" label="เร็ว ๆ นี้" />
          </q-item-section>
        </q-item>

        <q-separator spaced />
      </template>
    </q-list>
  </q-scroll-area>
</template>

<style scoped>
.bg-primary-fade {
  background: rgba(59, 130, 246, 0.12);
}
</style>
