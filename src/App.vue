<template>
  <router-view />
  <Notifier />
</template>

<script setup>
import Notifier from './components/ui/Notifier.vue'
</script>

<style>
#app-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-bg);
}
</style>
