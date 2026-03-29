<template>
  <v-dialog :model-value="dialog" :max-width="maxWidth" persistent>
    <v-card rounded="xl" elevation="2" @keydown="handleCardEnter">
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">{{ title }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">{{ $t('roles.subtitle') }}</div>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0">
        <v-container class="pa-0">
          <div class="field-label">{{ $t('common.name').toUpperCase() }}</div>
          <v-text-field
            v-model="name"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            :error-messages="errors.name"
            autocomplete="off"
            @update:focused="
              (focused: boolean) => {
                if (!focused) updateKey()
              }
            "
          ></v-text-field>

          <div class="field-label">{{ $t('common.key').toUpperCase() }}</div>
          <v-text-field
            v-model="key"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            :error-messages="errors.key"
            autocomplete="off"
          ></v-text-field>

          <div class="field-label">{{ $t('common.description').toUpperCase() }}</div>
          <v-textarea
            v-model="descriptions"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            :error-messages="errors.descriptions"
            clearable
            autocomplete="off"
          ></v-textarea>
        </v-container>
      </v-card-text>

      <div class="d-flex justify-end ga-3 px-6 py-4">
        <v-btn variant="text" color="default" rounded="lg" @click="close">{{
          $t('common.cancel')
        }}</v-btn>
        <v-btn color="primary" variant="elevated" rounded="lg" @click="confirm">{{
          $t('common.save')
        }}</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import * as Yup from 'yup'
import type { RoleModel } from '@/interfaces/models/RoleModel'
import RoleService from '@/services/RoleService'
import type { RoleFormType } from '@/types/index'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
/* END  DEFINE */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  item: {
    type: Object as PropType<RoleModel | null>,
    required: false,
    default: null,
  },

  dialog: {
    type: Boolean,
    required: true,
  },
})
const emit = defineEmits(['confirm', 'close-modal'])

const form: RoleFormType = {
  id: null as number | null,
  name: '' as string | null,
  key: '' as string | null,
  descriptions: '' as string | null,
}
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
const { t } = useI18n()

const schema = computed(() =>
  Yup.object().shape({
    name: Yup.string().required(t('validation.nameRequired')),
    key: Yup.string().required(t('validation.required', { field: t('common.key') })),
    descriptions: Yup.string().nullable(),
  }),
)

const {
  values,
  errors,
  handleSubmit,
  setFieldError: _setFieldError,
  setFieldValue,
} = useForm({
  validationSchema: schema,
  initialValues: form,
})

const { value: name } = useField<string>('name')
const { value: key } = useField<string>('key')
const { value: descriptions } = useField<string | null>('descriptions')
/* end define validate */
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const title = computed(() => {
  return props.item ? t('roles.editRole') : t('roles.newRole')
})

const maxWidth = computed(() => {
  return '500px'
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const handleCreate = handleSubmit(async (form: RoleFormType) => {
  await schema.value.validate(values, { abortEarly: false })
  RoleService.create(form)
    .then((result: RoleModel) => {
      emit('confirm', result)
    })
    .catch((error) => {
      console.error('Failed to add role:', error)
    })
})

const handleUpdate = handleSubmit(async (form) => {
  await schema.value.validate(values, { abortEarly: false })
  RoleService.update(props.item?.id as number, form)
    .then((result: RoleModel) => {
      emit('confirm', result)
    })
    .catch((error) => {
      console.error('Failed to update role:', error)
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

// Submit on Enter key unless the focused element is a textarea
const handleCardEnter = (event: KeyboardEvent) => {
  if (event.key !== 'Enter') return
  if ((event.target as HTMLElement).tagName === 'TEXTAREA') return
  event.preventDefault()
  confirm()
}

const updateKey = () => {
  setFieldValue(
    'key',
    name.value
      .normalize('NFD')
      .replace(/[\u0300-\u036F]/g, '') // Remove accents
      .toLowerCase() // Convert to lowercase
      .replace(/ /g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, ''), // Remove all non-alphanumeric characters except hyphens
  )
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,

  (value) => {
    if (!value) {
      close()
    }
  },

  { immediate: false },
)

watchEffect(() => {
  if (props.item) {
    setFieldValue('id', props.item?.id ?? null)
    setFieldValue('name', props.item?.name)
    setFieldValue('key', props.item?.key)
    setFieldValue('descriptions', String(props.item?.descriptions))
  }
})
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>
