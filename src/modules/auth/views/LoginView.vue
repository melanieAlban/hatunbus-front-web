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
  inset: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: flex-start; /* Cambiado de center a flex-start */
  justify-content: center;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  background: var(--app-bg, var(--beige-bone));
  /* Añadir padding-top para bajar un poco desde arriba */
  padding-top: 2rem;
}
</style>
