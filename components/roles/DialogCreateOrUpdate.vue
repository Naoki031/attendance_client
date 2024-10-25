<template>
  <v-dialog :model-value="dialog" :max-width="maxWidth" persistent>
    <v-card>
      <v-card-title class="text-h5">{{ title }}</v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <v-container>
          <!-- Name field -->
          <v-text-field
            v-model="name"
            prepend-inner-icon="mdi-alphabetical-variant"
            label="Name"
            :error-messages="errors.name"
            @blur="updateKey"
          ></v-text-field>

          <!-- Key field -->
          <v-text-field
            v-model="key"
            prepend-inner-icon="mdi-key"
            label="Key"
            :error-messages="errors.key"
          ></v-text-field>

          <!-- Descriptions field -->
          <v-textarea
            v-model="descriptions"
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
import { computed, watch, PropType, watchEffect } from 'vue'
import * as Yup from 'yup'
import { useField, useForm } from 'vee-validate'
import { RoleModel } from '@/interfaces/models/RoleModel'
import RoleService from '@/services/RoleService'
import { RoleFormType } from '@/types/index'
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
const schema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  key: Yup.string().required('Key is required'),
  descriptions: Yup.string().nullable(),
})

const { values, errors, handleSubmit, setFieldError, setFieldValue } = useForm({
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
  return props.item ? 'Edit Role' : 'New Role'
})

const maxWidth = computed(() => {
  return '500px'
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const handleCreate = handleSubmit(async (form: RoleFormType) => {
  await schema.validate(values, { abortEarly: false })
  RoleService.create(form)
    .then((res: RoleModel) => {
      emit('confirm', res)
    })
    .catch((error) => {
      console.error('Failed to add role:', error)
    })
})

const handleUpdate = handleSubmit(async (form) => {
  await schema.validate(values, { abortEarly: false })
  RoleService.update(props.item?.id as number, form)
    .then((res: RoleModel) => {
      emit('confirm', res)
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

  (val) => {
    if (!val) {
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
