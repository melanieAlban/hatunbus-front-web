<template>
  <section class="login-view">
    <LoginForm />
  </section>
</template>

<script setup lang="ts">
import LoginForm from '../components/LoginForm.vue'
</script>

<style scoped>
.login-view {
  position: fixed;
  inset: 0; /* top:0; right:0; bottom:0; left:0 */
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  background: var(--app-bg, var(--beige-bone));
}
</style>
