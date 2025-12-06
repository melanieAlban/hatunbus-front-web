type ToastInstance = { add: (options: any) => void } | null

let toastRef: ToastInstance = null
let confirmHandler: ((opts: ConfirmOptions) => Promise<boolean>) | null = null

type ConfirmOptions = { title?: string; message: string; acceptLabel?: string; rejectLabel?: string }

export function setToastRef(t: ToastInstance) {
  toastRef = t
}

export function setConfirmHandler(fn: ((opts: ConfirmOptions) => Promise<boolean>) | null) {
  confirmHandler = fn
}

export function success(summary = 'OK', detail = '') {
  try { toastRef?.add({ severity: 'success', summary, detail, life: 3000 }) } catch (e) {}
}

export function info(summary = 'Info', detail = '') {
  try { toastRef?.add({ severity: 'info', summary, detail, life: 3000 }) } catch (e) {}
}

export function warn(summary = 'Atención', detail = '') {
  try { toastRef?.add({ severity: 'warn', summary, detail, life: 4000 }) } catch (e) {}
}

export function error(summary = 'Error', detail = '') {
  try { toastRef?.add({ severity: 'error', summary, detail, life: 5000 }) } catch (e) {}
}

export async function confirm(opts: ConfirmOptions): Promise<boolean> {
  if (!confirmHandler) {
    // fallback to window.confirm
    return window.confirm(opts.message)
  }
  return confirmHandler(opts)
}

export default { setToastRef, setConfirmHandler, success, info, warn, error, confirm }
