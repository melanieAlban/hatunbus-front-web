<template>
  <router-view />
  <Notifier />
  <Toast />
</template>

<script setup>
import Notifier from './components/ui/Notifier.vue'
import Toast from 'primevue/toast'
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
