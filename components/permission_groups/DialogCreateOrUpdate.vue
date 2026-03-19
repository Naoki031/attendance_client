<template>
  <v-dialog :model-value="dialog" :max-width="maxWidth" persistent>
    <v-card>
      <v-card-title class="text-h5">{{ title }}</v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <v-container>
          <!-- Name field -->
          <v-text-field
            v-model="nameField"
            prepend-inner-icon="mdi-alphabetical-variant"
            label="Name"
            :error-messages="errors.name"
          ></v-text-field>

          <!-- Permission field -->
          <v-select
            v-model="permissionsField"
            prepend-inner-icon="mdi-shield-account"
            label="Permissions"
            :items="permissions"
            :item-title="(item) => item.name"
            :item-value="(item) => item.key"
            :error-messages="errors.permissions"
            chips
            multiple
          ></v-select>

          <!-- Descriptions field -->
          <v-textarea
            v-model="descriptionsField"
            prepend-inner-icon="mdi-comment"
            label="Descriptions"
            :error-messages="errors.descriptions"
            clearable
          ></v-textarea>
        </v-container>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue-grey-darken-4" variant="text" @click="close">Cancel</v-btn>
        <v-btn color="blue-darken-1" variant="elevated" @click="confirm">OK</v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import * as Yup from 'yup'
import type { PermissionGroupModel } from '@/interfaces/models/PermissionGroupModel'
import type { PermissionModel } from '@/interfaces/models/PermissionModel'
import PermissionGroupService from '@/services/PermissionGroupService'
import PermissionService from '@/services/PermissionService'
import type { PermissionGroupFormType } from '@/types/index'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
/* END  DEFINE */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  item: {
    type: Object as PropType<PermissionGroupModel | null>,
    required: false,
    default: null,
  },

  dialog: {
    type: Boolean,
    required: true,
  },
})
const emit = defineEmits(['confirm', 'close-modal'])

const form: PermissionGroupModel = {
  id: null as number | null,
  name: '' as string,
  permissions: [] as string[],
  descriptions: '' as string | null,
}
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
const schema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  permissions: Yup.array().of(Yup.string()).required('Permissions is required'),
  descriptions: Yup.string().nullable(),
})

const { values, errors, handleSubmit, setFieldError, setFieldValue } = useForm({
  validationSchema: schema,
  initialValues: form,
})

const { value: nameField } = useField<string>('name')
const { value: permissionsField } = useField<string[]>('permissions')
const { value: descriptionsField } = useField<string | null>('descriptions')
/* end define validate */
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const isLoading = ref(false)
const permissions = ref<Array<PermissionModel>>([])
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const title = computed(() => {
  return props.item ? 'Edit Permission Group' : 'New Permission Group'
})

const maxWidth = computed(() => {
  return '500px'
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const handleCreate = handleSubmit(async (form: PermissionGroupFormType) => {
  await schema.validate(values, { abortEarly: false })
  PermissionGroupService.create(form)
    .then((permission: PermissionGroupModel) => {
      emit('confirm', permission)
    })
    .catch((error) => {
      console.error('Failed to add permission group:', error)
    })
})

const handleUpdate = handleSubmit(async (form: PermissionGroupFormType) => {
  await schema.validate(values, { abortEarly: false })
  PermissionGroupService.update(props.item?.id as number, form)
    .then((permission: PermissionGroupModel) => {
      emit('confirm', permission)
    })
    .catch((error) => {
      console.error('Failed to update permission group:', error)
    })
})

const confirm = () => {
  if (!props.item) {
    handleCreate()
  } else {
    handleUpdate()
  }
}

const close = () => {
  emit('close-modal', null)
}

const getPermissions = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    const data = await PermissionService.getAll()
    permissions.value = Object.values(data)

    setTimeout(() => {
      isLoading.value = false
    }, 1000)
  } catch (error) {
    console.error('Failed to fetch permissions:', error)
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,

  (newValue) => {
    if (!newValue) {
      close()
    }
  },

  { immediate: false },
)

watch(
  () => permissionsField,

  async (newPermissions) => {
    if (newPermissions.value.includes('all_privileges') && newPermissions.value.length > 1) {
      const updatedPermissions = ['all_privileges']

      if (newPermissions.value.includes('grant_option')) {
        updatedPermissions.push('grant_option')
      }

      if (JSON.stringify(updatedPermissions) !== JSON.stringify(newPermissions.value)) {
        setFieldValue('permissions', updatedPermissions)
      }
    } else if (
      permissionsField.value.length > 1 &&
      permissionsField.value.includes('all_privileges')
    ) {
      // remove all_privileges from permissionsField
      const updatedPermissions = (permissionsField.value as unknown as string[]).filter(
        (item: string) => item !== 'all_privileges' && item !== 'grant_option',
      )

      // check if permissionsField has changed
      if (JSON.stringify(updatedPermissions) !== JSON.stringify(newPermissions.value)) {
        setFieldValue('permissions', updatedPermissions)
      }
    }
  },

  { deep: true },
)

watchEffect(() => {
  if (props.item) {
    setFieldValue('id', props.item?.id ?? null)
    setFieldValue('name', props.item?.name)
    setFieldValue('permissions', props.item?.permissions)
    setFieldValue('descriptions', String(props.item?.descriptions ?? ''))
  }
})
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  getPermissions()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>
