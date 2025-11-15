<template>
    <div class="login-root">
        <div class="brand">
            <div class="logo">🚌</div>
            <h1>HatunBus</h1>
            <p class="subtitle">Gestión y venta de boletos de autobús.</p>
        </div>
        <div class="card login-card">
            <div class="tabs"> <button class="tab active">Iniciar Sesión</button> <button
                    class="tab">Registrarse</button> </div>
            <form @submit.prevent="onSubmit" class="form-body">
                <div class="input-group">
                    <div class="input-icon-wrapper"> <svg class="input-icon" xmlns="http://www.w3.org/2000/svg"
                            width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                        </svg> <input id="email" v-model="form.email" type="text" placeholder="Correo electrónico"
                            class="custom-input" required /> </div>
                </div>
                <div class="input-group">
                    <div class="input-icon-wrapper"> <svg class="input-icon" xmlns="http://www.w3.org/2000/svg"
                            width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path
                                d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                        </svg> <input id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'"
                            placeholder="Contraseña" class="custom-input" required /> <button type="button"
                            class="password-toggle" @click="showPassword = !showPassword"> <svg v-if="showPassword"
                                xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                viewBox="0 0 16 16">
                                <path
                                    d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
                                <path
                                    d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
                            </svg> <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                fill="currentColor" viewBox="0 0 16 16">
                                <path
                                    d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" />
                                <path
                                    d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z" />
                                <path
                                    d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z" />
                            </svg> </button> </div>
                </div> <label class="label">Selecciona tu rol</label>
                <div class="input-group select-group">
                    <div class="custom-select-wrapper" :class="{ 'select-open': dropdownOpen }">
                        <div class="select-trigger" @click="toggleDropdown"> <span class="select-value"> {{
                            selectedRoleLabel || 'Selecciona rol' }} </span> <svg class="select-arrow" width="16"
                                height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 11L3 6h10l-5 5z" />
                            </svg> </div>
                        <transition name="dropdown">
                            <div v-if="dropdownOpen" class="select-dropdown">
                                <div v-for="role in roles" :key="role.value" class="select-option"
                                    :class="{ 'selected': form.role === role.value }" @click="selectRole(role)"> <span
                                        class="option-text">{{ role.label }}</span> <svg v-if="form.role === role.value"
                                        class="check-icon" width="16" height="16" viewBox="0 0 16 16"
                                        fill="currentColor">
                                        <path d="M13.5 4.5l-7 7L3.5 9" />
                                    </svg> </div>
                            </div>
                        </transition>
                    </div>
                </div>
                <div class="row between"> <label class="remember"> <input type="checkbox" v-model="remember"
                            class="custom-checkbox" /> <span class="checkmark"></span> Recuérdame </label> <a
                        class="muted" href="#" @click.prevent="onForgot">¿Olvidaste tu contraseña?</a> </div>
                <div v-if="error" class="error">{{ error }}</div> <button type="submit" class="custom-button"
                    :disabled="loading"> {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }} </button>
            </form>
        </div>
    </div>
</template>
<script setup
    lang="ts">    import { reactive, ref, onMounted, computed } from 'vue' import { useRouter, useRoute } from 'vue-router' import { useAuthStore } from '../store/useAuthStore' import type { LoginCredentials } from '../interfaces/auth.interface' import Select from 'primevue/select' import Dropdown from 'primevue/dropdown' const router = useRouter() const route = useRoute() const auth = useAuthStore() const form = reactive({ email: '', password: '', role: 'CLIENT' }) const roles = [{ label: 'Usuario', value: 'CLIENT' }, { label: 'Conductor', value: 'DRIVER' }, { label: 'Empleado', value: 'CLERK' }, { label: 'Cooperativa', value: 'COOPERATIVE' }, { label: 'Administrador', value: 'ADMIN' },] const remember = ref(false) const error = ref<string | null>(null) const loading = ref(false) const showPassword = ref(false) onMounted(() => { if (auth.isAuthenticated) { router.push('/') } }) async function onSubmit() { error.value = null loading.value = true try { const credentials: LoginCredentials = { email: form.email, password: form.password } await auth.loginAction(credentials) const redirect = (route.query.redirect as string) || '/' await router.push(redirect) } catch (e: any) { error.value = e?.response?.data?.message || e?.message || 'Error al iniciar sesión' } finally { loading.value = false } } function onForgot() { alert('Funcionalidad de recuperar contraseña aún no implementada') } function onRegister() { router.push({ name: 'Register' }).catch(() => { console.log('Register route not available') }) } const dropdownOpen = ref(false) const selectedRoleLabel = computed(() => { const selected = roles.find(role => role.value === form.role) return selected ? selected.label : '' }) function toggleDropdown() { dropdownOpen.value = !dropdownOpen.value } function selectRole(role: any) { form.role = role.value dropdownOpen.value = false } // Cerrar dropdown al hacer clic fuera onMounted(() => { document.addEventListener('click', (e) => { const dropdown = document.querySelector('.custom-select-wrapper') if (dropdown && !dropdown.contains(e.target as Node)) { dropdownOpen.value = false } }) }) </script>
<style scoped>
/* Root: occupy full viewport and center the card */
.login-root {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 2rem;
    min-height: 100vh;
    width: 100vw;
    box-sizing: border-box;
    background: var(--app-bg, var(--beige-bone));
    background-repeat: no-repeat;
    background-size: cover;
}

.brand {
    text-align: center;
}

.brand .logo {
    font-size: 2.25rem;
    margin-bottom: 0.25rem;
    color: var(--app-accent);
}

.brand h1 {
    margin: 0;
    color: var(--app-text);
    font-size: 1.6rem;
}

.brand .subtitle {
    margin: 0.4rem 0 0;
    color: var(--gray-earth);
    font-size: 0.95rem;
}

/* Card: responsive width, max-width keeps it compact on large screens */
.login-card {
    width: 100%;
    max-width: 900px;
    padding: 2rem;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    background: var(--card-bg, #ffffff);
    box-sizing: border-box;
}

.tabs {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    margin-bottom: 1.25rem;
}

.tab {
    padding: 0.45rem 0.9rem;
    border-radius: 999px;
    border: 1px solid var(--gray-medium);
    background: var(--beige-bone);
    cursor: pointer;
    transition: all 0.2s ease;
}

.tab.active {
    background: var(--app-accent);
    color: var(--white-bone);
    border-color: transparent;
}

.form-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.input-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.input-icon-wrapper {
    display: block;
    width: 100%;
    position: relative;
}

.input-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--earth-dark);
    z-index: 1;
}

.password-toggle {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--gray-earth);
    cursor: pointer;
    z-index: 1;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.password-toggle:hover {
    color: var(--app-accent);
}

.custom-input {
    width: 100%;
    background: var(--beige-bone) !important;
    border: 1px solid var(--gray-medium) !important;
    color: var(--app-text) !important;
    border-radius: 6px !important;
    padding: 0.75rem 0.75rem 0.75rem 2.5rem !important;
    transition: all 0.2s ease !important;
    font-size: 1rem;
    box-sizing: border-box;
}

.custom-input:hover {
    border-color: var(--app-accent) !important;
}

.custom-input:focus {
    border-color: var(--app-accent) !important;
    box-shadow: 0 0 0 1px var(--app-accent) !important;
    outline: none !important;
}

.custom-select-wrapper {
    position: relative;
    width: 100%;
}

.select-trigger {
    width: 100%;
    background: var(--beige-bone);
    border: 1px solid var(--gray-medium);
    color: var(--app-text);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 48px;
    font-size: 1rem;
    box-sizing: border-box;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    backdrop-filter: blur(10px);
}

.select-trigger:hover {
    border-color: var(--earth-light);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 115, 85, 0.1);
}

.custom-select-wrapper.select-open .select-trigger {
    border-color: var(--app-accent);
    box-shadow: 0 0 0 3px rgba(139, 115, 85, 0.15);
    transform: translateY(-1px);
}

.select-value {
    color: var(--app-text);
    font-weight: 500;
}

.select-value:empty::before {
    content: 'Selecciona rol';
    color: var(--gray-earth);
    font-weight: normal;
}

.select-arrow {
    color: var(--gray-earth);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-select-wrapper.select-open .select-arrow {
    transform: rotate(180deg);
    color: var(--app-accent);
}

/* DROPDOWN MODERNO */
.select-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--beige-bone);
    border: 1px solid var(--gray-medium);
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05);
    margin-top: 8px;
    z-index: 1000;
    max-height: 280px;
    overflow-y: auto;
    backdrop-filter: blur(20px);
    background: rgba(250, 248, 244, 0.95);
}

/* Animación de entrada */
.dropdown-enter-active {
    animation: dropdownSlide 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-leave-active {
    animation: dropdownSlide 0.15s cubic-bezier(0.4, 0, 1, 1) reverse;
}

@keyframes dropdownSlide {
    from {
        opacity: 0;
        transform: translateY(-8px) scale(0.95);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* OPCIONES MODERNAS */
.select-option {
    padding: 14px 16px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    color: var(--app-text);
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
}

.select-option::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--app-accent);
    transform: scaleX(0);
    transition: transform 0.2s ease;
}

.select-option:first-child {
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
}

.select-option:last-child {
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
}

.select-option:hover {
    background: linear-gradient(135deg, var(--earth-light) 0%, var(--app-accent) 100%);
    color: var(--white-bone);
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(139, 115, 85, 0.3);
}

.select-option:hover::before {
    transform: scaleX(1);
}

.select-option.selected {
    background: var(--app-accent);
    color: var(--white-bone);
    font-weight: 600;
}

.select-option.selected::before {
    transform: scaleX(1);
}

.option-text {
    flex: 1;
}

.check-icon {
    opacity: 0;
    transition: opacity 0.2s ease;
}

.select-option.selected .check-icon {
    opacity: 1;
}

/* SCROLLBAR PERSONALIZADO */
.select-dropdown::-webkit-scrollbar {
    width: 6px;
}

.select-dropdown::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 3px;
    margin: 8px 0;
}

.select-dropdown::-webkit-scrollbar-thumb {
    background: var(--earth-light);
    border-radius: 3px;
    transition: background 0.2s ease;
}

.select-dropdown::-webkit-scrollbar-thumb:hover {
    background: var(--app-accent);
}

/* MODO OSCURO */
@media (prefers-color-scheme: dark) {
    .select-trigger {
        background: var(--app-input-bg);
        border-color: var(--gray-input);
        color: var(--app-text);
    }

    .select-dropdown {
        background: rgba(43, 43, 43, 0.95);
        border-color: var(--gray-input);
        backdrop-filter: blur(20px);
    }

    .select-value:empty::before {
        color: var(--gray-earth-light);
    }
}

/* MOBILE */
@media (max-width: 520px) {
    .select-trigger {
        padding: 0.625rem 0.875rem;
        min-height: 44px;
        font-size: 0.95rem;
    }

    .select-option {
        padding: 12px 14px;
        font-size: 0.9rem;
    }

    .select-dropdown {
        border-radius: 10px;
        margin-top: 6px;
    }
}

.row.between {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.remember {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
    position: relative;
    padding-left: 1.75rem;
}

.custom-checkbox {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
}

.checkmark {
    position: absolute;
    top: 0;
    left: 0;
    height: 1.25rem;
    width: 1.25rem;
    background-color: var(--beige-bone);
    border: 2px solid var(--gray-medium);
    border-radius: 4px;
    transition: all 0.2s ease;
}

.remember:hover .checkmark {
    border-color: var(--app-accent);
}

.custom-checkbox:checked~.checkmark {
    background-color: var(--app-accent);
    border-color: var(--app-accent);
}

.checkmark:after {
    content: "";
    position: absolute;
    display: none;
    left: 5px;
    top: 2px;
    width: 4px;
    height: 8px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
}

.custom-checkbox:checked~.checkmark:after {
    display: block;
}

.error {
    color: #c0392b;
    font-size: 0.95rem;
    text-align: center;
    padding: 0.5rem;
    background: #ffeaea;
    border-radius: 4px;
}

.custom-button {
    width: 100%;
    background: var(--app-accent) !important;
    border: 1px solid var(--app-accent) !important;
    color: var(--white-bone) !important;
    border-radius: 6px !important;
    padding: 0.75rem 1.5rem !important;
    font-weight: 500 !important;
    transition: all 0.2s ease !important;
    font-size: 1rem;
    cursor: pointer;
    box-sizing: border-box;
}

.custom-button:hover:not(:disabled) {
    background: var(--app-accent-dark) !important;
    border-color: var(--app-accent-dark) !important;
    transform: translateY(-1px) !important;
}

.custom-button:focus {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
    outline: none !important;
}

.custom-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none !important;
}

.muted {
    color: var(--app-accent);
    text-decoration: none;
    font-size: 0.9rem;
}

.muted:hover {
    text-decoration: underline;
}

.label {
    font-weight: 500;
    color: var(--app-text);
    margin-bottom: 0.25rem;
}

/* Mobile tweaks: reduce padding and use full width */
@media (max-width: 520px) {
    .login-root {
        padding: 1.25rem;
    }

    .login-card {
        max-width: 100%;
        padding: 1rem;
        border-radius: 10px;
    }

    .brand .logo {
        font-size: 2rem
    }

    .brand h1 {
        font-size: 1.4rem
    }

    .custom-input,
    .custom-select {
        padding: 0.625rem 0.625rem 0.625rem 2.25rem !important;
        min-height: 44px !important;
    }

    .custom-select {
        padding: 0.625rem 2.25rem 0.625rem 0.75rem !important;
    }

    .custom-button {
        padding: 0.625rem 1.25rem !important;
    }

    .input-icon,
    .select-arrow {
        left: 0.625rem;
    }

    .password-toggle {
        right: 0.625rem;
    }

    .select-arrow {
        right: 0.625rem;
    }
}
</style>
