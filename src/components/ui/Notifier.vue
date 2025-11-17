<template>
  <Toast ref="toast" position="top-right" />

  <Dialog 
    v-model:visible="confirmVisible" 
    modal 
    :closable="false" 
    :style="{ width: '500px', maxWidth: '90vw' }"
    :header="opts.title || 'Confirmar'"
  >
    <div class="confirm-content">
      <p class="confirm-message" v-html="formatMessage(opts.message)"></p>
    </div>
    <template #footer>
      <div class="confirm-actions">
        <Button 
          :label="opts.rejectLabel || 'Cancelar'" 
          severity="secondary"
          text
          @click="onReject" 
        />
        <Button 
          :label="opts.acceptLabel || 'Aceptar'" 
          severity="danger"
          @click="onAccept" 
        />
      </div>
    </template>
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

function formatMessage(message: string): string {
  // Convertir saltos de línea a <br> y números de lista a puntos con formato
  return message
    .replace(/\n/g, '<br>')
    .replace(/(\d+)\./g, '<strong>$1.</strong>')
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
.confirm-content { 
  padding: 0.5rem 0;
}

.confirm-message { 
  margin: 0;
  line-height: 1.8;
  color: var(--app-text);
  font-size: 0.95rem;
}

.confirm-message :deep(strong) {
  color: var(--app-accent);
  font-weight: 600;
}

.confirm-actions { 
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0;
}
</style>
