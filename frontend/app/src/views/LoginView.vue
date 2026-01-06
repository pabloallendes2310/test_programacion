<template>
  <v-main>
    <v-container fluid fill-height class="pa-0">
      <v-row no-gutters align="center" justify="center" class="fill-height">
          <v-col cols="12" sm="8" md="5" lg="4">
            <v-card elevation="12" class="mx-auto" max-width="500">
              <v-card-title class="text-h4 text-center pa-6 bg-primary">
                <span class="text-white">Iniciar Sesión</span>
              </v-card-title>
              
              <v-card-text class="pa-6">
                <v-form @submit.prevent="handleLogin" ref="form">
                  <v-text-field
                    v-model="email"
                    label="Email"
                    type="email"
                    prepend-inner-icon="mdi-email"
                    variant="outlined"
                    :rules="[rules.required, rules.email]"
                    :disabled="authStore.loading"
                    class="mb-2"
                  />
                  
                  <v-text-field
                    v-model="password"
                    label="Contraseña"
                    :type="showPassword ? 'text' : 'password'"
                    prepend-inner-icon="mdi-lock"
                    :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="showPassword = !showPassword"
                    variant="outlined"
                    :rules="[rules.required]"
                    :disabled="authStore.loading"
                  />
                  
                  <v-alert
                    v-if="authStore.error"
                    type="error"
                    variant="tonal"
                    class="mb-4"
                  >
                    {{ authStore.error }}
                  </v-alert>
                  
                  <v-btn
                    type="submit"
                    color="primary"
                    size="large"
                    block
                    :loading="authStore.loading"
                    class="mb-3"
                  >
                    Ingresar
                  </v-btn>
                  
                  <v-divider class="my-4"></v-divider>
                  
                  <v-btn
                    color="secondary"
                    variant="outlined"
                    size="large"
                    block
                    @click="goToRegister"
                    :disabled="authStore.loading"
                  >
                    Crear cuenta
                  </v-btn>
                </v-form>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const form = ref()

const rules = {
  required: (value: string) => !!value || 'Campo requerido',
  email: (value: string) => /.+@.+\..+/.test(value) || 'Email inválido',
}

async function handleLogin() {
  const { valid } = await form.value.validate()
  
  if (valid) {
    const success = await authStore.login({
      email: email.value,
      password: password.value,
    })
    
    if (success) {
      router.push('/records')
    }
  }
}

function goToRegister() {
  router.push('/register')
}
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
