<template>
  <v-dialog :model-value="dialog" max-width="480px" persistent @update:model-value="close">
    <v-card rounded="xl">
      <v-card-title class="pa-6 pb-2 text-h6 font-weight-bold">
        {{ title }}
      </v-card-title>
      <v-card-text class="pa-6">
        <v-row dense>
          <v-col cols="12">
            <v-text-field
              v-model="name"
              :label="$t('common.name')"
              :error-messages="errors.name"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="slug"
              :label="$t('groups.slug')"
              :error-messages="errors.slug"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              @input="onSlugInput"
            />
          </v-col>
          <v-col cols="12">
            <v-autocomplete
              v-model="companyId"
              :items="companies"
              item-title="name"
              item-value="id"
              :label="$t('common.company')"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              clearable
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="descriptions"
              :label="$t('groups.descriptions')"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="slackChannelId"
              :label="$t('groups.slackChannelId')"
              :hint="$t('groups.slackChannelIdHint')"
              persistent-hint
              prepend-inner-icon="mdi-slack"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="slackUserGroupId"
              :label="$t('groups.slackUserGroupId')"
              :hint="$t('groups.slackUserGroupIdHint')"
              persistent-hint
              prepend-inner-icon="mdi-account-group-outline"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
            />
          </v-col>
        </v-row>
        <v-alert
          v-if="apiError"
          type="error"
          variant="tonal"
          rounded="lg"
          class="mt-3"
          density="compact"
          closable
          @click:close="apiError = ''"
        >
          {{ apiError }}
        </v-alert>
      </v-card-text>
      <div class="d-flex justify-end ga-2 px-6 py-4">
        <v-btn variant="text" rounded="lg" @click="close">{{ $t('common.cancel') }}</v-btn>
        <v-btn color="primary" variant="elevated" rounded="lg" :loading="isSaving" @click="confirm">
          {{ $t('common.save') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import * as Yup from 'yup'
import type { GroupModel } from '@/interfaces/models/GroupModel'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import GroupService from '@/services/GroupService'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  item: {
    type: Object as PropType<GroupModel | null>,
    required: false,
    default: null,
  },
  dialog: {
    type: Boolean,
    required: true,
  },
  companies: {
    type: Array as PropType<CompanyModel[]>,
    required: false,
    default: () => [],
  },
  defaultCompanyId: {
    type: Number as PropType<number | null>,
    required: false,
    default: null,
  },
})
const emit = defineEmits(['confirm', 'close-modal'])
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
const { t } = useI18n()

const schema = computed(() =>
  Yup.object().shape({
    name: Yup.string().required(t('validation.nameRequired')),
    slug: Yup.string().required(t('validation.slugRequired')),
  }),
)

const { errors, handleSubmit, setFieldValue, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    name: '' as string,
    slug: '' as string,
  },
})

const { value: name } = useField<string>('name')
const { value: slug } = useField<string>('slug')
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const descriptions = ref<string>('')
const slackChannelId = ref<string>('')
const slackUserGroupId = ref<string>('')
const companyId = ref<number | null>(null)
const isSaving = ref(false)
const apiError = ref('')
const slugManuallyEdited = ref(false)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const title = computed(() => (props.item ? t('groups.editTitle') : t('groups.createTitle')))
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const toSlug = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const onSlugInput = () => {
  slugManuallyEdited.value = true
}

const handleCreate = handleSubmit(async (formValues) => {
  try {
    isSaving.value = true
    apiError.value = ''
    const result = await GroupService.create({
      name: formValues.name,
      slug: formValues.slug,
      descriptions: descriptions.value || undefined,
      slack_channel_id: slackChannelId.value || undefined,
      slack_user_group_id: slackUserGroupId.value || undefined,
      company_id: companyId.value ?? undefined,
    })
    emit('confirm', result)
    resetForm()
    descriptions.value = ''
    slackChannelId.value = ''
    slackUserGroupId.value = ''
    companyId.value = null
  } catch (error: unknown) {
    const apiErrorObject = error as { data?: { message?: string } }
    apiError.value = apiErrorObject?.data?.message ?? 'Failed to create group'
  } finally {
    isSaving.value = false
  }
})

const handleUpdate = handleSubmit(async (formValues) => {
  try {
    isSaving.value = true
    apiError.value = ''
    const result = await GroupService.update(props.item?.id as number, {
      name: formValues.name,
      slug: formValues.slug,
      descriptions: descriptions.value || undefined,
      slack_channel_id: slackChannelId.value || undefined,
      slack_user_group_id: slackUserGroupId.value || undefined,
      company_id: companyId.value ?? undefined,
    })
    emit('confirm', result)
  } catch (error: unknown) {
    const apiErrorObject = error as { data?: { message?: string } }
    apiError.value = apiErrorObject?.data?.message ?? 'Failed to update group'
  } finally {
    isSaving.value = false
  }
})

const confirm = () => {
  if (!props.item) handleCreate()
  else handleUpdate()
}

const close = () => {
  apiError.value = ''
  emit('close-modal')
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(name, (newName) => {
  if (!slugManuallyEdited.value) {
    setFieldValue('slug', toSlug(newName ?? ''))
  }
})

watch(
  () => props.dialog,
  (isOpen) => {
    if (isOpen) {
      if (props.item) {
        slugManuallyEdited.value = true
        setFieldValue('name', props.item.name)
        setFieldValue('slug', props.item.slug)
        descriptions.value = props.item.descriptions ?? ''
        slackChannelId.value = props.item.slack_channel_id ?? ''
        slackUserGroupId.value = props.item.slack_user_group_id ?? ''
        companyId.value = props.item.company_id ?? null
      } else {
        slugManuallyEdited.value = false
        resetForm()
        descriptions.value = ''
        slackChannelId.value = ''
        slackUserGroupId.value = ''
        companyId.value = props.defaultCompanyId ?? null
      }
      apiError.value = ''
    }
  },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>
