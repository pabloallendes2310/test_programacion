<template>
  <!-- App Bar -->
    <v-app-bar color="primary" prominent>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      
      <v-toolbar-title class="text-h5 font-weight-bold">
        Records Manager
      </v-toolbar-title>
      
      <v-spacer></v-spacer>
      
      <v-chip class="mr-4" prepend-icon="mdi-account-circle">
        {{ authStore.user?.email }}
      </v-chip>
      
      <v-btn icon @click="handleLogout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" temporary>
      <v-list>
        <v-list-item
          prepend-icon="mdi-home"
          title="Dashboard"
          @click="router.push('/dashboard')"
        ></v-list-item>
        
        <v-list-item
          prepend-icon="mdi-table"
          title="Records"
          @click="router.push('/records')"
        ></v-list-item>
        
        <v-divider class="my-2"></v-divider>
        
        <v-list-item
          prepend-icon="mdi-account"
          :title="authStore.user?.name"
          :subtitle="authStore.user?.email"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main class="bg-grey-lighten-3">
      <v-container fluid>
        <!-- Stats Cards -->
        <v-row v-if="recordsStore.stats" class="mb-4">
          <v-col cols="12" sm="6" md="3">
            <v-card color="primary" variant="elevated">
              <v-card-text>
                <div class="text-h4 font-weight-bold text-white">
                  {{ recordsStore.stats.totalRecords }}
                </div>
                <div class="text-subtitle-1 text-white">Total Records</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card color="success" variant="elevated">
              <v-card-text>
                <div class="text-h4 font-weight-bold text-white">
                  ${{ recordsStore.stats.totalAmount.toLocaleString() }}
                </div>
                <div class="text-subtitle-1 text-white">Monto Total</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card color="info" variant="elevated">
              <v-card-text>
                <div class="text-h4 font-weight-bold text-white">
                  {{ recordsStore.stats.byStatus.find(s => s.status === 'activo')?.count || 0 }}
                </div>
                <div class="text-subtitle-1 text-white">Activos</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card color="warning" variant="elevated">
              <v-card-text>
                <div class="text-h4 font-weight-bold text-white">
                  {{ recordsStore.stats.byCategory.length }}
                </div>
                <div class="text-subtitle-1 text-white">Categorías</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Filters and Actions -->
        <v-card class="mb-4">
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="filters.category"
                  label="Categoría"
                  prepend-inner-icon="mdi-filter"
                  variant="outlined"
                  density="compact"
                  clearable
                  @update:model-value="applyFilters"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="3">
                <v-select
                  v-model="filters.status"
                  label="Status"
                  :items="statusOptions"
                  prepend-inner-icon="mdi-flag"
                  variant="outlined"
                  density="compact"
                  clearable
                  @update:model-value="applyFilters"
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="2">
                <v-text-field
                  v-model="filters.startDate"
                  label="Desde"
                  type="date"
                  variant="outlined"
                  density="compact"
                  clearable
                  @update:model-value="applyFilters"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="2">
                <v-text-field
                  v-model="filters.endDate"
                  label="Hasta"
                  type="date"
                  variant="outlined"
                  density="compact"
                  clearable
                  @update:model-value="applyFilters"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="2">
                <v-btn
                  color="primary"
                  block
                  prepend-icon="mdi-plus"
                  @click="openCreateDialog"
                >
                  Crear
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Records Table -->
        <v-card>
          <v-data-table
            :headers="headers"
            :items="recordsStore.records"
            :loading="recordsStore.loading"
            :items-per-page="filters.limit"
            class="elevation-1"
          >
            <template v-slot:item.amount="{ item }">
              ${{ item.amount.toLocaleString() }}
            </template>
            
            <template v-slot:item.status="{ item }">
              <v-chip
                :color="getStatusColor(item.status)"
                size="small"
              >
                {{ item.status }}
              </v-chip>
            </template>
            
            <template v-slot:item.date="{ item }">
              {{ formatDate(item.date) }}
            </template>
            
            <template v-slot:item.actions="{ item }">
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                @click="openEditDialog(item)"
              ></v-btn>
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                @click="openDeleteDialog(item)"
              ></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-container>
    </v-main>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ editingRecord ? 'Editar Record' : 'Crear Record' }}</span>
        </v-card-title>
        
        <v-card-text>
          <v-form ref="recordForm">
            <v-text-field
              v-model="recordData.sourceId"
              label="Source ID"
              variant="outlined"
              :rules="[rules.required]"
              :disabled="!!editingRecord"
            ></v-text-field>
            
            <v-text-field
              v-model="recordData.date"
              label="Fecha"
              type="date"
              variant="outlined"
              :rules="[rules.required]"
            ></v-text-field>
            
            <v-text-field
              v-model="recordData.category"
              label="Categoría"
              variant="outlined"
              :rules="[rules.required]"
            ></v-text-field>
            
            <v-text-field
              v-model.number="recordData.amount"
              label="Monto"
              type="number"
              variant="outlined"
              :rules="[rules.required]"
            ></v-text-field>
            
            <v-select
              v-model="recordData.status"
              label="Status"
              :items="statusOptions"
              variant="outlined"
              :rules="[rules.required]"
            ></v-select>
            
            <v-textarea
              v-model="recordData.description"
              label="Descripción"
              variant="outlined"
              :rules="[rules.required]"
            ></v-textarea>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closeDialog">
            Cancelar
          </v-btn>
          <v-btn color="primary" variant="text" @click="saveRecord">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">
          Confirmar eliminación
        </v-card-title>
        
        <v-card-text>
          ¿Estás seguro de eliminar el record "{{ recordToDelete?.sourceId }}"?
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="deleteDialog = false">
            Cancelar
          </v-btn>
          <v-btn color="error" variant="text" @click="confirmDelete">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRecordsStore, type Record } from '@/stores/records'

const router = useRouter()
const authStore = useAuthStore()
const recordsStore = useRecordsStore()

const drawer = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const editingRecord = ref<Record | null>(null)
const recordToDelete = ref<Record | null>(null)
const recordForm = ref()

const filters = reactive({
  page: 1,
  limit: 250,
  category: '',
  status: '',
  startDate: '',
  endDate: '',
})

const recordData = reactive({
  sourceId: '',
  date: '',
  category: '',
  amount: 0,
  status: 'activo' as any,
  description: '',
})

const statusOptions = ['activo', 'pendiente', 'cancelado', 'completado']

const headers = [
  { title: 'Source ID', key: 'sourceId', sortable: true },
  { title: 'Fecha', key: 'date', sortable: true },
  { title: 'Categoría', key: 'category', sortable: true },
  { title: 'Monto', key: 'amount', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Descripción', key: 'description', sortable: false },
  { title: 'Acciones', key: 'actions', sortable: false },
]

const rules = {
  required: (value: any) => !!value || 'Campo requerido',
}

onMounted(async () => {
  await loadData()
})

async function loadData() {
  try {
    await recordsStore.fetchRecords(filters)
    await recordsStore.fetchStats()
  } catch (error) {
    showSnackbar('Error al cargar datos', 'error')
  }
}

async function applyFilters() {
  await recordsStore.fetchRecords(filters)
  await recordsStore.fetchStats()
}

function openCreateDialog() {
  editingRecord.value = null
  resetRecordData()
  dialog.value = true
}

function openEditDialog(record: Record) {
  editingRecord.value = record
  recordData.sourceId = record.sourceId
  recordData.date = record.date
  recordData.category = record.category
  recordData.amount = record.amount
  recordData.status = record.status
  recordData.description = record.description
  dialog.value = true
}

function openDeleteDialog(record: Record) {
  recordToDelete.value = record
  deleteDialog.value = true
}

async function saveRecord() {
  const { valid } = await recordForm.value.validate()
  
  if (!valid) return
  
  try {
    if (editingRecord.value) {
      await recordsStore.updateRecord(editingRecord.value.id, recordData)
      showSnackbar('Record actualizado correctamente', 'success')
    } else {
      await recordsStore.createRecord(recordData)
      showSnackbar('Record creado correctamente', 'success')
    }
    
    closeDialog()
    await loadData()
  } catch (error) {
    showSnackbar('Error al guardar record', 'error')
  }
}

async function confirmDelete() {
  if (!recordToDelete.value) return
  
  try {
    await recordsStore.deleteRecord(recordToDelete.value.id)
    showSnackbar('Record eliminado correctamente', 'success')
    deleteDialog.value = false
    recordToDelete.value = null
    await loadData()
  } catch (error) {
    showSnackbar('Error al eliminar record', 'error')
  }
}

function closeDialog() {
  dialog.value = false
  editingRecord.value = null
  resetRecordData()
}

function resetRecordData() {
  recordData.sourceId = ''
  recordData.date = ''
  recordData.category = ''
  recordData.amount = 0
  recordData.status = 'activo'
  recordData.description = ''
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    activo: 'success',
    pendiente: 'warning',
    cancelado: 'error',
    completado: 'info',
  }
  return colors[status] || 'grey'
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES')
}

function showSnackbar(text: string, color: string) {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

function handleLogout() {
  authStore.logout(router)
}
</script>
