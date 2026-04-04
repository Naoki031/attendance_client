<template>
  <v-dialog :model-value="dialog" max-width="520px" persistent>
    <v-card rounded="xl" elevation="2">
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">{{ title }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ $t('slackChannels.subtitle') }}
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0">
        <v-container class="pa-0">
          <div class="field-label">{{ $t('slackChannels.channelName').toUpperCase() }}</div>
          <v-text-field
            v-model="name"
            :error-messages="errors.name"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            autocomplete="off"
          ></v-text-field>

          <div class="field-label">{{ $t('common.company').toUpperCase() }}</div>
          <v-autocomplete
            v-model="companyId"
            :items="companies"
            item-title="name"
            item-value="id"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            clearable
            autocomplete="off"
          ></v-autocomplete>

          <div class="field-label">{{ $t('slackChannels.featureType').toUpperCase() }}</div>
          <v-select
            v-model="feature"
            :items="featureOptions"
            item-title="label"
            item-value="value"
            :error-messages="errors.feature"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
          ></v-select>

          <div class="field-label">{{ $t('slackChannels.webhookUrl').toUpperCase() }}</div>
          <v-text-field
            v-model="webhookUrl"
            :error-messages="errors.webhook_url"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            autocomplete="off"
            :placeholder="
              isEditing
                ? 'Leave blank to keep current webhook'
                : 'https://hooks.slack.com/services/...'
            "
            :hint="
              isEditing
                ? 'Webhook URL is hidden for security — enter a new URL only to change it'
                : ''
            "
            :persistent-hint="isEditing"
          ></v-text-field>

          <div class="field-label">{{ $t('slackChannels.channelId').toUpperCase() }}</div>
          <v-text-field
            v-model="channelId"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            autocomplete="off"
            placeholder="C01234567"
            hint="Slack Channel ID — found in channel details"
            persistent-hint
          ></v-text-field>

          <div class="field-label mt-4">
            {{ $t('slackChannels.messageTemplate').toUpperCase() }}
          </div>

          <!-- Toolbar: variables + action buttons -->
          <div class="d-flex align-center justify-space-between mb-1">
            <div class="d-flex align-center flex-wrap ga-1">
              <v-chip
                v-for="variable in templateVariables"
                :key="variable"
                size="x-small"
                color="primary"
                variant="outlined"
                style="cursor: pointer"
                @click="insertVariable(variable)"
                >{{ variable }}</v-chip
              >
            </div>
            <div class="d-flex align-center ga-1 ml-2 flex-shrink-0">
              <v-btn size="x-small" variant="tonal" color="secondary" @click="insertCodeBlock">
                <v-icon size="14" start>mdi-code-braces</v-icon>
                {{ $t('slackChannels.codeBlock') }}
              </v-btn>
              <v-btn size="x-small" variant="tonal" color="teal" @click="loadExampleTemplate">
                <v-icon size="14" start>mdi-text-box-outline</v-icon>
                {{ $t('slackChannels.loadExample') }}
              </v-btn>
            </div>
          </div>

          <v-textarea
            ref="templateTextareaReference"
            v-model="messageTemplate"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            rows="6"
            auto-grow
            placeholder='Leave blank to use the default message format. Click "Load Example" to see a sample template.'
            hint="Click a variable chip to insert it at the cursor position."
            persistent-hint
            autocomplete="off"
          ></v-textarea>

          <div class="field-label mt-4">{{ $t('slackChannels.mentionUsers').toUpperCase() }}</div>
          <v-autocomplete
            v-model="mentionUserIds"
            :items="allUsers"
            :item-title="(user) => user.full_name + ' (' + user.email + ')'"
            item-value="id"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            multiple
            chips
            closable-chips
            clearable
            placeholder="Search users to @mention..."
            :loading="isLoadingUsers"
            hint="These users will be @mentioned in Slack notifications for this channel"
            persistent-hint
          ></v-autocomplete>

          <div class="field-label mt-4">
            {{ $t('slackChannels.mentionGroupHandles').toUpperCase() }}
          </div>
          <v-combobox
            v-model="mentionSlackGroupHandles"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            multiple
            chips
            closable-chips
            clearable
            :hint="$t('slackChannels.mentionGroupHandlesHint')"
            persistent-hint
          ></v-combobox>

          <!-- Link options -->
          <v-divider class="mt-4 mb-3"></v-divider>
          <div class="text-caption text-medium-emphasis mb-2">
            {{ $t('slackChannels.linkOptionsHint') }}
          </div>
          <v-switch
            v-model="includeApprovalLink"
            :label="$t('slackChannels.includeApprovalLink')"
            color="primary"
            density="compact"
            hide-details
            class="mb-1"
          ></v-switch>
          <v-switch
            v-model="includeMyRequestsLink"
            :label="$t('slackChannels.includeMyRequestsLink')"
            color="primary"
            density="compact"
            hide-details
            class="mb-2"
          ></v-switch>
        </v-container>
      </v-card-text>

      <v-alert
        v-if="serverError"
        type="error"
        variant="tonal"
        density="compact"
        rounded="lg"
        class="mx-6 mb-2"
        >{{ serverError }}</v-alert
      >

      <div class="d-flex justify-end ga-3 px-6 py-4">
        <v-btn color="default" variant="text" rounded="lg" @click="close">{{
          $t('common.cancel')
        }}</v-btn>
        <v-btn color="primary" variant="elevated" rounded="lg" :loading="isSaving" @click="confirm">
          {{ $t('common.save') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** start import */
import { computed, nextTick, ref, watch, watchEffect } from 'vue'
import type { PropType } from 'vue'
import * as Yup from 'yup'
import type { SlackChannelModel } from '@/interfaces/models/SlackChannelModel'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import type { UserModel } from '@/interfaces/models/UserModel'
import SlackChannelService from '@/services/SlackChannelService'
import UserService from '@/services/UserService'
/* end import */

/** start define property and emits */
const props = defineProps({
  item: {
    type: Object as PropType<SlackChannelModel | null>,
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
  isDuplicate: {
    type: Boolean,
    required: false,
    default: false,
  },
})
const emit = defineEmits(['confirm', 'close-modal'])
/* end define property and emits */

/** start define computed */
const { t } = useI18n()

const isEditing = computed(() => !!props.item && !props.isDuplicate)
/* end defined computed — continued below */

/** start define validate */
const schema = computed(() =>
  Yup.object().shape({
    name: Yup.string().required(t('validation.nameRequired')),
    webhook_url: Yup.string()
      .url(t('validation.matches', { field: t('slackChannels.webhookUrl') }))
      .when([], {
        is: () => !isEditing.value,
        then: (schemaInner) =>
          schemaInner.required(t('validation.required', { field: t('slackChannels.webhookUrl') })),
        otherwise: (schemaInner) => schemaInner.optional(),
      }),
    feature: Yup.string().required(
      t('validation.required', { field: t('slackChannels.featureType') }),
    ),
  }),
)

const { handleSubmit, setFieldValue } = useForm({
  validationSchema: schema,
  initialValues: {
    name: '' as string,
    webhook_url: '' as string,
    feature: '' as string,
  },
})

const { value: name, errorMessage: nameError } = useField<string>('name')
const { value: webhookUrl, errorMessage: webhookUrlError } = useField<string>('webhook_url')
const { value: feature, errorMessage: featureError } = useField<string>('feature')
/* end define validate */

/** start defined state */
const templateTextareaReference = ref<{ $el: HTMLElement } | null>(null)
const companyId = ref<number | null>(null)
const channelId = ref<string>('')
const messageTemplate = ref<string>('')
const mentionUserIds = ref<number[]>([])
const mentionSlackGroupHandles = ref<string[]>([])
const includeApprovalLink = ref<boolean>(false)
const includeMyRequestsLink = ref<boolean>(false)

const featureVariables: Record<string, string[]> = {
  wfh: [
    'approvers',
    'requester',
    'requester_name',
    'cc_users',
    'from_datetime',
    'to_datetime',
    'reason',
  ],
  off: [
    'approvers',
    'requester',
    'requester_name',
    'cc_users',
    'from_datetime',
    'to_datetime',
    'unit_hours',
    'leave_type',
    'reason',
  ],
  equipment: [
    'approvers',
    'requester',
    'requester_name',
    'cc_users',
    'from_date',
    'to_date',
    'equipment_name',
    'quantity',
    'location',
    'reason',
  ],
  clock_forget: [
    'approvers',
    'requester',
    'requester_name',
    'cc_users',
    'clock_type',
    'forgot_date',
  ],
  overtime: [
    'approvers',
    'requester',
    'requester_name',
    'cc_users',
    'from_datetime',
    'to_datetime',
    'unit_hours',
    'overtime_type',
    'reason',
  ],
  business_trip: [
    'approvers',
    'requester',
    'requester_name',
    'cc_users',
    'from_datetime',
    'to_datetime',
    'trip_destination',
    'reason',
  ],
  error: ['approvers', 'requester', 'requester_name'],
}

const templateVariables = computed<string[]>(() => {
  return featureVariables[feature.value] ?? []
})
const allUsers = ref<UserModel[]>([])
const isLoadingUsers = ref(false)
const isSaving = ref(false)
const serverError = ref<string>('')

const errors = computed(() => ({
  name: nameError.value ? [nameError.value] : [],
  webhook_url: webhookUrlError.value ? [webhookUrlError.value] : [],
  feature: featureError.value ? [featureError.value] : [],
}))

const featureOptions = computed(() => [
  { label: t('requests.workFromHomeRequest'), value: 'wfh' },
  { label: t('requests.leaveRequest'), value: 'off' },
  { label: t('requests.equipmentRequest'), value: 'equipment' },
  { label: t('requests.clockForgetRequest'), value: 'clock_forget' },
  { label: t('requests.overtimeRequest'), value: 'overtime' },
  { label: t('requests.businessTripRequest'), value: 'business_trip' },
  { label: t('slackChannels.errorNotification'), value: 'error' },
])
/* end defined state */

const title = computed(() => {
  if (props.isDuplicate) return t('slackChannels.duplicateChannel')

  return props.item ? t('slackChannels.editChannel') : t('slackChannels.newChannel')
})
/* end defined computed */

/** start defined methods */
const getRawTextarea = (): HTMLTextAreaElement | null =>
  templateTextareaReference.value?.$el?.querySelector('textarea') ?? null

const insertAtCursor = (text: string) => {
  const textarea = getRawTextarea()

  if (!textarea) {
    messageTemplate.value += text

    return
  }

  const start = textarea.selectionStart ?? messageTemplate.value.length
  const end = textarea.selectionEnd ?? start
  messageTemplate.value =
    messageTemplate.value.substring(0, start) + text + messageTemplate.value.substring(end)
  nextTick(() => {
    textarea.focus()
    const newPosition = start + text.length
    textarea.setSelectionRange(newPosition, newPosition)
  })
}

const insertVariable = (variable: string) => insertAtCursor(`{{${variable}}}`)

const insertCodeBlock = () => {
  const textarea = getRawTextarea()
  const start = textarea?.selectionStart ?? messageTemplate.value.length
  const end = textarea?.selectionEnd ?? start
  const hasSelection = start !== end

  if (hasSelection && textarea) {
    const selected = messageTemplate.value.substring(start, end)
    messageTemplate.value =
      messageTemplate.value.substring(0, start) +
      '```\n' +
      selected +
      '\n```' +
      messageTemplate.value.substring(end)
    nextTick(() => {
      textarea.focus()
      textarea.setSelectionRange(start + 4 + selected.length + 1, start + 4 + selected.length + 1)
    })
  } else {
    insertAtCursor('```\n\n```')
    nextTick(() => {
      const textarea2 = getRawTextarea()

      if (textarea2) {
        const cursorPosition = start + 4
        textarea2.setSelectionRange(cursorPosition, cursorPosition)
      }
    })
  }
}

const exampleTemplates: Record<string, string> = {
  wfh: [
    '{{approvers}}',
    'cc {{requester}}',
    '{{requester}} have a Work From Home request :house:.',
    '```',
    'From: {{from_datetime}}',
    'To: {{to_datetime}}',
    '',
    'Reason: {{reason}}',
    '',
    'Sorry for inconvenience.',
    '',
    'Thank you!',
    '```',
  ].join('\n'),
  off: [
    '{{approvers}}',
    'cc {{requester}}',
    '{{requester}} have a leave request :calendar:.',
    '```',
    'I would like to take a break for {{unit_hours}} hours',
    '',
    'From: {{from_datetime}}',
    'To: {{to_datetime}}',
    'Leave type: {{leave_type}}',
    '',
    'Reason: {{reason}}',
    '',
    'Sorry for inconvenience.',
    '',
    'Thank you!',
    '```',
  ].join('\n'),
  equipment: [
    '{{approvers}}',
    'cc {{requester}}',
    '{{requester}} have a Equipment borrowing request.',
    '```',
    'Please approve my equipment borrowing request.',
    '',
    'From: {{from_date}}',
    'To: {{to_date}}',
    '',
    'Equipment name: {{equipment_name}}',
    'Quantity: {{quantity}}',
    'Location: {{location}}',
    '',
    'Thank you!',
    '```',
  ].join('\n'),
  clock_forget: [
    '{{approvers}}',
    'cc {{requester}}',
    '{{requester_name}} have a {{clock_type}} time request.',
    '```',
    'I forget to {{clock_type}} at {{forgot_date}}',
    '',
    'Please confirm it.',
    '',
    'Sorry for inconvenience.',
    '```',
  ].join('\n'),
  overtime: [
    '{{approvers}}',
    'cc {{requester}}',
    '{{requester}} have a overtime request.',
    '```',
    'Please approve my overtime request.',
    '',
    'From: {{from_datetime}}',
    'To: {{to_datetime}}',
    '',
    'Total hours: {{unit_hours}}',
    'Type: {{overtime_type}}',
    '',
    'Reason: {{reason}}',
    '',
    'Thank you!',
    '```',
  ].join('\n'),
  business_trip: [
    '{{approvers}}',
    'cc {{requester}}',
    '{{requester}} have a Business Trip request :airplane:.',
    '```',
    'From: {{from_datetime}}',
    'To: {{to_datetime}}',
    '',
    'Destination: {{trip_destination}}',
    '',
    'Reason: {{reason}}',
    '',
    'Thank you!',
    '```',
  ].join('\n'),
}

const loadExampleTemplate = () => {
  messageTemplate.value = exampleTemplates[feature.value] ?? exampleTemplates['wfh']!
}

const handleCreate = handleSubmit(async (form) => {
  isSaving.value = true
  serverError.value = ''

  try {
    await SlackChannelService.create({
      ...form,
      company_id: companyId.value,
      channel_id: channelId.value || undefined,
      mention_user_ids: mentionUserIds.value,
      mention_slack_group_handles: mentionSlackGroupHandles.value,
      message_template: messageTemplate.value || undefined,
      include_approval_link: includeApprovalLink.value,
      include_my_requests_link: includeMyRequestsLink.value,
    })
    emit('confirm')
  } catch (error: unknown) {
    const message = (error as { data?: { message?: string } })?.data?.message
    serverError.value = message ?? 'Failed to save. Please try again.'
    console.error('Failed to create slack channel:', error)
  } finally {
    isSaving.value = false
  }
})

const handleUpdate = handleSubmit(async (form) => {
  isSaving.value = true
  serverError.value = ''

  try {
    const { webhook_url, ...restForm } = form
    await SlackChannelService.update(props.item?.id as number, {
      ...restForm,
      ...(webhook_url ? { webhook_url } : {}),
      company_id: companyId.value,
      channel_id: channelId.value || undefined,
      mention_user_ids: mentionUserIds.value,
      mention_slack_group_handles: mentionSlackGroupHandles.value,
      message_template: messageTemplate.value || undefined,
      include_approval_link: includeApprovalLink.value,
      include_my_requests_link: includeMyRequestsLink.value,
    })
    emit('confirm')
  } catch (error: unknown) {
    const message = (error as { data?: { message?: string } })?.data?.message
    serverError.value = message ?? 'Failed to save. Please try again.'
    console.error('Failed to update slack channel:', error)
  } finally {
    isSaving.value = false
  }
})

const confirm = () => {
  if (!props.item || props.isDuplicate) handleCreate()
  else handleUpdate()
}

const close = () => {
  serverError.value = ''
  emit('close-modal')
}
/* end defined methods */

/** start define watcher */
watch(
  () => props.dialog,
  (value) => {
    if (!value) close()
  },
  { immediate: true },
)

watchEffect(() => {
  if (props.item) {
    setFieldValue('name', props.item.name)
    setFieldValue('webhook_url', '') // never pre-fill — webhook is hidden server-side
    setFieldValue('feature', props.item.feature)
    companyId.value = props.item.company_id ?? null
    channelId.value = props.item.channel_id ?? ''
    messageTemplate.value = props.isDuplicate ? '' : (props.item.message_template ?? '')
    mentionUserIds.value = props.isDuplicate ? [] : (props.item.mention_user_ids ?? [])
    mentionSlackGroupHandles.value = props.isDuplicate
      ? []
      : (props.item.mention_slack_group_handles ?? [])
    includeApprovalLink.value = props.isDuplicate
      ? false
      : (props.item.include_approval_link ?? false)
    includeMyRequestsLink.value = props.isDuplicate
      ? false
      : (props.item.include_my_requests_link ?? false)
  }
})
/* end define watcher */

/** start define life cycle hook */
onMounted(async () => {
  isLoadingUsers.value = true

  try {
    const users = await UserService.getAll()
    allUsers.value = Object.values(users)
  } catch (error) {
    console.error('Failed to load users:', error)
  } finally {
    isLoadingUsers.value = false
  }
})
/* end define life cycle hook */
</script>
