<template>
  <Toast ref="toast" position="top-right" />

  <Dialog v-model:visible="confirmVisible" modal :closable="false" :style="{ width: '420px' }">
    <div class="confirm-content">
      <h3 class="confirm-title">{{ opts.title || 'Confirmar' }}</h3>
      <p class="confirm-message">{{ opts.message }}</p>
      <div class="confirm-actions">
        <Button class="p-button-text" :label="opts.rejectLabel || 'Cancelar'" @click="onReject" />
        <Button class="p-button-raised p-button-danger" :label="opts.acceptLabel || 'Eliminar'" @click="onAccept" />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Toast from 'primevue/toast'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { setToastRef, setConfirmHandler } from '../../lib/notifier'

const toast = ref<any>(null)
const confirmVisible = ref(false)
const resolveRef = ref<((v: boolean) => void) | null>(null)
const opts = ref({ title: '', message: '', acceptLabel: '', rejectLabel: '' })

setToastRef(toast.value)

function openConfirm(o: { title?: string; message: string; acceptLabel?: string; rejectLabel?: string }) {
  opts.value = o as any
  confirmVisible.value = true
  return new Promise<boolean>((resolve) => {
    resolveRef.value = resolve
  })
}

function onAccept() {
  confirmVisible.value = false
  resolveRef.value?.(true)
}

function onReject() {
  confirmVisible.value = false
  resolveRef.value?.(false)
}

setConfirmHandler(openConfirm)

// set toast ref when mounted via nextTick
import { onMounted, nextTick } from 'vue'
onMounted(async () => {
  await nextTick()
  setToastRef(toast.value)
})
</script>

<style scoped>
.confirm-content { padding: 1rem }
.confirm-title { margin: 0 0 0.25rem; font-size: 1.1rem }
.confirm-message { margin: 0 0 1rem; color: var(--gray-dark) }
.confirm-actions { display:flex; justify-content:flex-end; gap:0.5rem }
</style>
