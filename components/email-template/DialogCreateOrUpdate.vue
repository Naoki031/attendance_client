<template>
  <v-dialog :model-value="dialog" max-width="1000px" persistent scrollable>
    <v-card rounded="xl" elevation="2">
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">
            {{ title }}
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0">
        <!-- Key (select for new, display for edit) -->
        <v-select
          v-if="!item"
          v-model="keyValue"
          :items="templateKeyItems"
          item-title="title"
          item-value="key"
          :label="$t('emailTemplates.key')"
          variant="filled"
          density="comfortable"
          rounded="lg"
          :hint="selectedKeyDefinition?.description ?? $t('emailTemplates.keyHint')"
          persistent-hint
          class="mb-3"
        />
        <v-text-field
          v-else
          :model-value="keyValue"
          :label="$t('emailTemplates.key')"
          variant="filled"
          density="comfortable"
          rounded="lg"
          disabled
          :hint="$t('emailTemplates.keyLocked')"
          persistent-hint
          class="mb-3"
        />

        <!-- Subject -->
        <v-text-field
          v-model="subjectValue"
          :label="$t('emailTemplates.subject')"
          variant="filled"
          density="comfortable"
          rounded="lg"
          class="mb-3"
        />

        <!-- Company -->
        <v-autocomplete
          v-model="companyIdValue"
          :items="companyItems"
          item-title="name"
          item-value="id"
          :label="$t('emailTemplates.company')"
          variant="filled"
          density="comfortable"
          rounded="lg"
          clearable
          :hint="$t('emailTemplates.companyHint')"
          persistent-hint
          class="mb-3"
        />

        <!-- Description -->
        <v-text-field
          v-model="descriptionValue"
          :label="$t('emailTemplates.descriptionLabel')"
          variant="filled"
          density="comfortable"
          rounded="lg"
          class="mb-3"
        />

        <!-- Clickable variable chips — click to insert into editor -->
        <div v-if="variableDescriptions.length" class="mb-3">
          <div class="text-caption text-medium-emphasis mb-1">
            {{ $t('emailTemplates.clickToInsert') }}
          </div>
          <div class="d-flex flex-wrap ga-1">
            <v-chip
              v-for="variable in variableDescriptions"
              :key="variable.name"
              size="small"
              variant="tonal"
              color="primary"
              class="clickable-chip"
              @click="insertVariable(variable.name)"
            >
              <code class="mr-1">{{ formatVariable(variable.name) }}</code>
              <span class="text-caption">{{ variable.description }}</span>
            </v-chip>
          </div>
        </div>

        <!-- Body HTML — TipTap editor -->
        <div class="mb-3">
          <div class="text-subtitle-2 font-weight-medium mb-2">
            {{ $t('emailTemplates.bodyHtml') }}
          </div>

          <!-- Toolbar -->
          <div class="d-flex flex-wrap ga-1 pa-2 border rounded-t-lg bg-grey-lighten-4">
            <v-btn
              size="x-small"
              :variant="editor?.isActive('bold') ? 'tonal' : 'text'"
              :color="editor?.isActive('bold') ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleBold().run()"
            >
              <v-icon size="18">mdi-format-bold</v-icon>
            </v-btn>
            <v-btn
              size="x-small"
              :variant="editor?.isActive('italic') ? 'tonal' : 'text'"
              :color="editor?.isActive('italic') ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleItalic().run()"
            >
              <v-icon size="18">mdi-format-italic</v-icon>
            </v-btn>
            <v-btn
              size="x-small"
              :variant="editor?.isActive('underline') ? 'tonal' : 'text'"
              :color="editor?.isActive('underline') ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleUnderline().run()"
            >
              <v-icon size="18">mdi-format-underline</v-icon>
            </v-btn>
            <v-btn
              size="x-small"
              :variant="editor?.isActive('strike') ? 'tonal' : 'text'"
              :color="editor?.isActive('strike') ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleStrike().run()"
            >
              <v-icon size="18">mdi-format-strikethrough</v-icon>
            </v-btn>
            <v-divider vertical class="mx-1" />
            <v-btn
              size="x-small"
              :variant="editor?.isActive('heading', { level: 2 }) ? 'tonal' : 'text'"
              :color="editor?.isActive('heading', { level: 2 }) ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
            >
              <v-icon size="18">mdi-format-header-2</v-icon>
            </v-btn>
            <v-btn
              size="x-small"
              :variant="editor?.isActive('heading', { level: 3 }) ? 'tonal' : 'text'"
              :color="editor?.isActive('heading', { level: 3 }) ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
            >
              <v-icon size="18">mdi-format-header-3</v-icon>
            </v-btn>
            <v-divider vertical class="mx-1" />
            <v-btn
              size="x-small"
              :variant="editor?.isActive('bulletList') ? 'tonal' : 'text'"
              :color="editor?.isActive('bulletList') ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleBulletList().run()"
            >
              <v-icon size="18">mdi-format-list-bulleted</v-icon>
            </v-btn>
            <v-btn
              size="x-small"
              :variant="editor?.isActive('orderedList') ? 'tonal' : 'text'"
              :color="editor?.isActive('orderedList') ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleOrderedList().run()"
            >
              <v-icon size="18">mdi-format-list-numbered</v-icon>
            </v-btn>
            <v-btn
              size="x-small"
              :variant="editor?.isActive('blockquote') ? 'tonal' : 'text'"
              :color="editor?.isActive('blockquote') ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleBlockquote().run()"
            >
              <v-icon size="18">mdi-format-quote-close</v-icon>
            </v-btn>
            <v-divider vertical class="mx-1" />
            <v-btn
              size="x-small"
              :variant="editor?.isActive('highlight') ? 'tonal' : 'text'"
              :color="editor?.isActive('highlight') ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleHighlight().run()"
            >
              <v-icon size="18">mdi-format-color-highlight</v-icon>
            </v-btn>
            <input
              type="color"
              class="toolbar-color-input"
              :value="editor?.getAttributes('textStyle').color || '#000000'"
              title="Text color"
              @input="
                (event) =>
                  editor
                    ?.chain()
                    .focus()
                    .setColor((event.target as HTMLInputElement).value)
                    .run()
              "
            />
            <v-divider vertical class="mx-1" />
            <v-btn
              size="x-small"
              variant="text"
              @click="editor?.chain().focus().setHorizontalRule().run()"
            >
              <v-icon size="18">mdi-minus</v-icon>
            </v-btn>
            <v-btn size="x-small" variant="text" @click="openLinkDialog">
              <v-icon size="18">mdi-link</v-icon>
            </v-btn>
            <v-btn size="x-small" variant="text" @click="openImageDialog">
              <v-icon size="18">mdi-image-outline</v-icon>
            </v-btn>
            <v-divider vertical class="mx-1" />
            <!-- Text alignment -->
            <v-btn
              size="x-small"
              :variant="editor?.isActive({ textAlign: 'left' }) ? 'tonal' : 'text'"
              :color="editor?.isActive({ textAlign: 'left' }) ? 'primary' : 'default'"
              @click="editor?.chain().focus().setTextAlign('left').run()"
            >
              <v-icon size="18">mdi-format-align-left</v-icon>
            </v-btn>
            <v-btn
              size="x-small"
              :variant="editor?.isActive({ textAlign: 'center' }) ? 'tonal' : 'text'"
              :color="editor?.isActive({ textAlign: 'center' }) ? 'primary' : 'default'"
              @click="editor?.chain().focus().setTextAlign('center').run()"
            >
              <v-icon size="18">mdi-format-align-center</v-icon>
            </v-btn>
            <v-btn
              size="x-small"
              :variant="editor?.isActive({ textAlign: 'right' }) ? 'tonal' : 'text'"
              :color="editor?.isActive({ textAlign: 'right' }) ? 'primary' : 'default'"
              @click="editor?.chain().focus().setTextAlign('right').run()"
            >
              <v-icon size="18">mdi-format-align-right</v-icon>
            </v-btn>
            <v-btn
              size="x-small"
              :variant="editor?.isActive({ textAlign: 'justify' }) ? 'tonal' : 'text'"
              :color="editor?.isActive({ textAlign: 'justify' }) ? 'primary' : 'default'"
              @click="editor?.chain().focus().setTextAlign('justify').run()"
            >
              <v-icon size="18">mdi-format-align-justify</v-icon>
            </v-btn>
            <v-divider vertical class="mx-1" />
            <v-btn
              size="x-small"
              variant="text"
              @click="
                editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              "
            >
              <v-icon size="18">mdi-table</v-icon>
            </v-btn>
            <template v-if="editor?.isActive('table')">
              <v-btn
                size="x-small"
                variant="text"
                @click="editor.chain().focus().addRowBefore().run()"
              >
                <v-icon size="16">mdi-table-row-plus-before</v-icon>
              </v-btn>
              <v-btn
                size="x-small"
                variant="text"
                @click="editor.chain().focus().addRowAfter().run()"
              >
                <v-icon size="16">mdi-table-row-plus-after</v-icon>
              </v-btn>
              <v-btn
                size="x-small"
                variant="text"
                @click="editor.chain().focus().deleteRow().run()"
              >
                <v-icon size="16">mdi-table-row-remove</v-icon>
              </v-btn>
              <v-btn
                size="x-small"
                variant="text"
                @click="editor.chain().focus().addColumnBefore().run()"
              >
                <v-icon size="16">mdi-table-column-plus-before</v-icon>
              </v-btn>
              <v-btn
                size="x-small"
                variant="text"
                @click="editor.chain().focus().addColumnAfter().run()"
              >
                <v-icon size="16">mdi-table-column-plus-after</v-icon>
              </v-btn>
              <v-btn
                size="x-small"
                variant="text"
                @click="editor.chain().focus().deleteColumn().run()"
              >
                <v-icon size="16">mdi-table-column-remove</v-icon>
              </v-btn>
              <v-btn
                size="x-small"
                variant="text"
                color="error"
                @click="editor.chain().focus().deleteTable().run()"
              >
                <v-icon size="16">mdi-table-large-remove</v-icon>
              </v-btn>
            </template>
            <v-divider vertical class="mx-1" />
            <!-- Undo / Redo -->
            <v-btn
              size="x-small"
              variant="text"
              :disabled="!editor?.can().undo()"
              @click="editor?.chain().focus().undo().run()"
            >
              <v-icon size="18">mdi-undo</v-icon>
            </v-btn>
            <v-btn
              size="x-small"
              variant="text"
              :disabled="!editor?.can().redo()"
              @click="editor?.chain().focus().redo().run()"
            >
              <v-icon size="18">mdi-redo</v-icon>
            </v-btn>
            <v-divider vertical class="mx-1" />
            <!-- Clear formatting -->
            <v-btn
              size="x-small"
              variant="text"
              @click="editor?.chain().focus().clearNodes().unsetAllMarks().run()"
            >
              <v-icon size="18">mdi-format-clear</v-icon>
            </v-btn>
          </div>

          <!-- Editor content -->
          <div class="border border-t-0 rounded-b-lg">
            <EditorContent :editor="editor" class="email-template-editor" />
          </div>
        </div>

        <!-- Sample preview -->
        <div v-if="selectedKeyDefinition" class="mb-3">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="d-flex align-center ga-2">
              <v-icon size="18" color="primary">mdi-eye-outline</v-icon>
              <div class="text-subtitle-2 font-weight-medium">
                {{ $t('emailTemplates.samplePreview') }}
              </div>
            </div>
            <v-btn
              size="x-small"
              variant="tonal"
              color="primary"
              :disabled="!sampleDataMap[keyValue ?? '']"
              @click="loadSampleContent"
            >
              <v-icon size="16" class="mr-1">mdi-file-import-outline</v-icon>
              {{ $t('emailTemplates.loadSample') }}
            </v-btn>
          </div>
          <v-card variant="outlined" rounded="lg" class="sample-preview-card">
            <div class="pa-4">
              <!-- Sample subject -->
              <div class="text-caption text-medium-emphasis mb-1">
                {{ $t('emailTemplates.subject') }}
              </div>
              <div class="text-body-2 font-weight-medium mb-3">
                {{ sampleSubject }}
              </div>

              <v-divider class="mb-3" />

              <!-- Sample body -->
              <div class="text-caption text-medium-emphasis mb-1">
                {{ $t('emailTemplates.bodyHtml') }}
              </div>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div class="sample-body text-body-2" v-html="sanitizedSampleBodyHtml" />
            </div>
          </v-card>
        </div>
      </v-card-text>

      <div class="d-flex justify-end ga-3 px-6 py-4">
        <v-btn variant="text" color="default" rounded="lg" @click="close">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn color="primary" variant="elevated" rounded="lg" :loading="isSaving" @click="confirm">
          {{ item ? $t('common.save') : $t('common.create') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>

  <!-- Link dialog -->
  <v-dialog v-model="linkDialog" max-width="400px">
    <v-card rounded="xl" elevation="2">
      <v-card-title class="text-body-1 font-weight-bold pa-4">
        {{ $t('emailTemplates.insertLink') }}
      </v-card-title>
      <v-card-text class="px-4 pt-0">
        <v-text-field
          v-model="linkUrl"
          :label="$t('emailTemplates.linkUrl')"
          variant="filled"
          density="comfortable"
          rounded="lg"
          autofocus
          @keydown.enter="applyLink"
        />
      </v-card-text>
      <div class="d-flex justify-end ga-2 pa-4 pt-0">
        <v-btn variant="text" rounded="lg" @click="linkDialog = false">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn color="primary" variant="elevated" rounded="lg" @click="applyLink">
          {{ $t('common.confirm') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>

  <!-- Image dialog -->
  <v-dialog v-model="imageDialog" max-width="400px">
    <v-card rounded="xl" elevation="2">
      <v-card-title class="text-body-1 font-weight-bold pa-4">
        {{ $t('emailTemplates.insertImage') }}
      </v-card-title>
      <v-card-text class="px-4 pt-0">
        <v-text-field
          v-model="imageUrl"
          :label="$t('emailTemplates.imageUrl')"
          variant="filled"
          density="comfortable"
          rounded="lg"
          autofocus
          @keydown.enter="applyImage"
        />
      </v-card-text>
      <div class="d-flex justify-end ga-2 pa-4 pt-0">
        <v-btn variant="text" rounded="lg" @click="imageDialog = false">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn color="primary" variant="elevated" rounded="lg" @click="applyImage">
          {{ $t('common.confirm') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import DOMPurify from 'dompurify'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import type { EmailTemplateModel } from '@/interfaces/models/EmailTemplateModel'
import type {
  TemplateKeyDefinition,
  VariableDefinition,
} from '@/interfaces/models/TemplateKeyDefinition'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import EmailTemplateService from '@/services/EmailTemplateService'
import CompanyService from '@/services/CompanyService'
import { useUserStore } from '@/stores/user'
import { useAppNotifications } from '@/composables/useAppNotifications'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  item: {
    type: Object as PropType<EmailTemplateModel | null>,
    required: false,
    default: null,
  },
  dialog: {
    type: Boolean,
    required: true,
  },
  existingTemplates: {
    type: Array as PropType<Array<EmailTemplateModel>>,
    required: false,
    default: () => [],
  },
})
const emit = defineEmits<{
  (event: 'confirm', value: EmailTemplateModel): void
  (event: 'close-modal', value: null): void
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { t } = useI18n()
const userStore = useUserStore()
const { notifyError } = useAppNotifications()
const isSaving = ref(false)

// Template key definitions
const templateKeys = ref<TemplateKeyDefinition[]>([])

// Companies
const companies = ref<CompanyModel[]>([])

// Form fields
const keyValue = ref<string | null>(null)
const subjectValue = ref('')
const descriptionValue = ref('')
const companyIdValue = ref<number | null>(null)
const linkDialog = ref(false)
const linkUrl = ref('')
const imageDialog = ref(false)
const imageUrl = ref('')

const editor = useEditor({
  extensions: [
    StarterKit.configure({ heading: { levels: [2, 3] } }),
    Underline,
    Placeholder.configure({
      placeholder: t('emailTemplates.bodyPlaceholder'),
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
    }),
    Table.configure(),
    TableRow,
    TableCell,
    TableHeader,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    Image.configure({ inline: false, allowBase64: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
  ],
  content: '',
  editorProps: {
    attributes: {
      class: 'pa-4',
      style: 'min-height: 200px; outline: none;',
    },
  },
})
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const title = computed(() =>
  props.item ? t('emailTemplates.editTemplate') : t('emailTemplates.createTemplate'),
)

const defaultCompanyId = computed<number | null>(
  () => userStore.user?.user_departments?.[0]?.company_id ?? null,
)

const templateKeyItems = computed(() => {
  // Keys already used for the selected company (or global if no company selected)
  const targetCompanyId = companyIdValue.value ?? null
  const usedKeys = new Set(
    props.existingTemplates
      .filter((template) => (template.company_id ?? null) === targetCompanyId)
      .map((template) => template.key),
  )
  return templateKeys.value
    .filter((key) => !usedKeys.has(key.key))
    .map((key) => ({
      title: `${key.key} — ${key.description}`,
      key: key.key,
    }))
})

const selectedKeyDefinition = computed<TemplateKeyDefinition | undefined>(() =>
  templateKeys.value.find((key) => key.key === keyValue.value),
)

const variableDescriptions = computed<VariableDefinition[]>(
  () => selectedKeyDefinition.value?.variables ?? [],
)

const companyItems = computed<Array<CompanyModel & { id: number | null }>>(() => {
  const globalOption = {
    id: null as unknown as number,
    name: t('emailTemplates.globalTemplate'),
  } as CompanyModel & { id: number | null }
  return [globalOption, ...companies.value]
})

/** Sample data for preview — keyed by template key */
const sampleDataMap: Record<string, Record<string, string>> = {
  meeting_invite_rsvp: {
    user_name: 'Nguyen Van A',
    meeting_title: 'Weekly Sync Meeting',
    scheduled_at: 'Monday, April 14 2026 at 09:00',
    description: 'Weekly sync to discuss sprint progress',
    accept_url: 'https://attendance.app/meetings/rsvp?token=abc123&status=accepted',
    decline_url: 'https://attendance.app/meetings/rsvp?token=abc123&status=declined',
  },
  request_submitted_off: {
    user_name: 'Nguyen Van A',
    date_from: '2026-04-15 09:00',
    date_to: '2026-04-16 18:00',
    reason: 'Family event',
    approval_url: 'https://attendance.app/management/requests/1',
  },
  request_submitted_wfh: {
    user_name: 'Nguyen Van A',
    date_from: '2026-04-15 09:00',
    date_to: '2026-04-15 18:00',
    reason: 'Need to take care of a family matter',
    approval_url: 'https://attendance.app/management/requests/2',
  },
  request_submitted_overtime: {
    user_name: 'Nguyen Van A',
    date_from: '2026-04-15 18:00',
    date_to: '2026-04-15 21:00',
    reason: 'Project deadline approaching',
    approval_url: 'https://attendance.app/management/requests/3',
  },
  request_submitted_equipment: {
    user_name: 'Nguyen Van A',
    item_name: 'Dell U2723QE Monitor',
    reason: 'Current monitor is flickering and causing eye strain',
    approval_url: 'https://attendance.app/management/requests/4',
  },
  request_submitted_clock_forget: {
    user_name: 'Nguyen Van A',
    target_date: '2026-04-14',
    clock_in_time: '08:30',
    clock_out_time: '17:30',
    reason: 'Forgot to tap card when arriving',
    approval_url: 'https://attendance.app/management/requests/5',
  },
  request_submitted_business_trip: {
    user_name: 'Nguyen Van A',
    date_from: '2026-04-20 09:00',
    date_to: '2026-04-22 18:00',
    destination: 'Ho Chi Minh City',
    reason: 'Client meeting at HCMC office',
    approval_url: 'https://attendance.app/management/requests/6',
  },
  request_approved: {
    user_name: 'Nguyen Van A',
    request_type: 'Leave Request',
    date_from: '2026-04-15 09:00',
    date_to: '2026-04-16 18:00',
    approver_name: 'Tran Thi B',
    note: 'Enjoy your time off!',
  },
  request_rejected: {
    user_name: 'Nguyen Van A',
    request_type: 'Leave Request',
    date_from: '2026-04-15 09:00',
    date_to: '2026-04-16 18:00',
    approver_name: 'Tran Thi B',
    note: 'Too many people off that week, please choose another date.',
  },
  clock_in_reminder: {
    user_name: 'Nguyen Van A',
    scheduled_time: '08:30',
    clock_url: 'https://attendance.app/attendance',
  },
  clock_out_reminder: {
    user_name: 'Nguyen Van A',
    scheduled_time: '17:30',
    clock_url: 'https://attendance.app/attendance',
  },
}

/** Default template content for each key — used by "Load sample" button */
const sampleTemplateContent: Record<string, { subject: string; body_html: string }> = {
  meeting_invite_rsvp: {
    subject: 'Meeting invitation: {{meeting_title}}',
    body_html: `<h2>You have been invited to a meeting</h2>
<p>Hi {{user_name}},</p>
<p>You have been invited to: <strong>{{meeting_title}}</strong></p>
<p><strong>When:</strong> {{scheduled_at}}</p>
<p><strong>Description:</strong> {{description}}</p>
<p>Please respond to this invitation:</p>
<p><a href="{{accept_url}}">Accept</a> | <a href="{{decline_url}}">Decline</a></p>`,
  },
  request_submitted_off: {
    subject: 'New leave request from {{user_name}}',
    body_html: `<h2>New Leave Request</h2>
<p><strong>{{user_name}}</strong> has submitted a <strong>Leave Request</strong>.</p>
<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">From</td><td style="padding: 8px; border: 1px solid #ddd;">{{date_from}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">To</td><td style="padding: 8px; border: 1px solid #ddd;">{{date_to}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Reason</td><td style="padding: 8px; border: 1px solid #ddd;">{{reason}}</td></tr>
</table>
<p><a href="{{approval_url}}">Review Request</a></p>`,
  },
  request_submitted_wfh: {
    subject: 'New work-from-home request from {{user_name}}',
    body_html: `<h2>New Work-From-Home Request</h2>
<p><strong>{{user_name}}</strong> has submitted a <strong>Work-From-Home</strong> request.</p>
<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">From</td><td style="padding: 8px; border: 1px solid #ddd;">{{date_from}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">To</td><td style="padding: 8px; border: 1px solid #ddd;">{{date_to}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Reason</td><td style="padding: 8px; border: 1px solid #ddd;">{{reason}}</td></tr>
</table>
<p><a href="{{approval_url}}">Review Request</a></p>`,
  },
  request_submitted_overtime: {
    subject: 'New overtime request from {{user_name}}',
    body_html: `<h2>New Overtime Request</h2>
<p><strong>{{user_name}}</strong> has submitted an <strong>Overtime</strong> request.</p>
<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">From</td><td style="padding: 8px; border: 1px solid #ddd;">{{date_from}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">To</td><td style="padding: 8px; border: 1px solid #ddd;">{{date_to}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Reason</td><td style="padding: 8px; border: 1px solid #ddd;">{{reason}}</td></tr>
</table>
<p><a href="{{approval_url}}">Review Request</a></p>`,
  },
  request_submitted_equipment: {
    subject: 'New equipment request from {{user_name}}',
    body_html: `<h2>New Equipment Request</h2>
<p><strong>{{user_name}}</strong> has submitted an <strong>Equipment</strong> request.</p>
<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Item</td><td style="padding: 8px; border: 1px solid #ddd;">{{item_name}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Reason</td><td style="padding: 8px; border: 1px solid #ddd;">{{reason}}</td></tr>
</table>
<p><a href="{{approval_url}}">Review Request</a></p>`,
  },
  request_submitted_clock_forget: {
    subject: 'New clock-forget request from {{user_name}}',
    body_html: `<h2>New Clock-Forget Request</h2>
<p><strong>{{user_name}}</strong> has submitted a <strong>Clock-Forget</strong> request.</p>
<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Date</td><td style="padding: 8px; border: 1px solid #ddd;">{{target_date}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Clock In</td><td style="padding: 8px; border: 1px solid #ddd;">{{clock_in_time}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Clock Out</td><td style="padding: 8px; border: 1px solid #ddd;">{{clock_out_time}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Reason</td><td style="padding: 8px; border: 1px solid #ddd;">{{reason}}</td></tr>
</table>
<p><a href="{{approval_url}}">Review Request</a></p>`,
  },
  request_submitted_business_trip: {
    subject: 'New business trip request from {{user_name}}',
    body_html: `<h2>New Business Trip Request</h2>
<p><strong>{{user_name}}</strong> has submitted a <strong>Business Trip</strong> request.</p>
<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">From</td><td style="padding: 8px; border: 1px solid #ddd;">{{date_from}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">To</td><td style="padding: 8px; border: 1px solid #ddd;">{{date_to}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Destination</td><td style="padding: 8px; border: 1px solid #ddd;">{{destination}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Purpose</td><td style="padding: 8px; border: 1px solid #ddd;">{{reason}}</td></tr>
</table>
<p><a href="{{approval_url}}">Review Request</a></p>`,
  },
  request_approved: {
    subject: 'Your {{request_type}} request has been approved',
    body_html: `<h2>Request Approved</h2>
<p>Hi {{user_name}},</p>
<p>Your <strong>{{request_type}}</strong> request has been <strong>approved</strong>.</p>
<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">From</td><td style="padding: 8px; border: 1px solid #ddd;">{{date_from}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">To</td><td style="padding: 8px; border: 1px solid #ddd;">{{date_to}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Approved by</td><td style="padding: 8px; border: 1px solid #ddd;">{{approver_name}}</td></tr>
</table>
<p><strong>Note:</strong> {{note}}</p>`,
  },
  request_rejected: {
    subject: 'Your {{request_type}} request has been rejected',
    body_html: `<h2>Request Rejected</h2>
<p>Hi {{user_name}},</p>
<p>Your <strong>{{request_type}}</strong> request has been <strong>rejected</strong>.</p>
<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">From</td><td style="padding: 8px; border: 1px solid #ddd;">{{date_from}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">To</td><td style="padding: 8px; border: 1px solid #ddd;">{{date_to}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Rejected by</td><td style="padding: 8px; border: 1px solid #ddd;">{{approver_name}}</td></tr>
</table>
<p><strong>Reason:</strong> {{note}}</p>`,
  },
  clock_in_reminder: {
    subject: 'Reminder: Clock in for today (scheduled at {{scheduled_time}})',
    body_html: `<h2>Clock-In Reminder</h2>
<p>Hi {{user_name}},</p>
<p>This is a friendly reminder that your work day is scheduled to start at <strong>{{scheduled_time}}</strong> and you have not clocked in yet.</p>
<p>Please clock in as soon as possible.</p>
<p><a href="{{clock_url}}">Go to Attendance</a></p>
<p style="color:#999;font-size:12px;">This is an automated reminder. If you are on approved leave, please ignore this message.</p>`,
  },
  clock_out_reminder: {
    subject: 'Reminder: You have not clocked out yet (scheduled end: {{scheduled_time}})',
    body_html: `<h2>Clock-Out Reminder</h2>
<p>Hi {{user_name}},</p>
<p>Your work day was scheduled to end at <strong>{{scheduled_time}}</strong> and it appears you have not clocked out yet.</p>
<p>Please remember to clock out before leaving.</p>
<p><a href="{{clock_url}}">Go to Attendance</a></p>
<p style="color:#999;font-size:12px;">This is an automated reminder. If you are working overtime, please ignore this message.</p>`,
  },
}

const sampleSubject = computed(() => {
  if (!subjectValue.value) return ''
  const sampleData = sampleDataMap[keyValue.value ?? ''] ?? {}
  return renderSample(subjectValue.value, sampleData)
})

const sampleBodyHtml = computed(() => {
  const html = editor.value?.getHTML() ?? ''
  if (!html || html === '<p></p>') return ''
  const sampleData = sampleDataMap[keyValue.value ?? ''] ?? {}
  return renderSample(html, sampleData)
})

const sanitizedSampleBodyHtml = computed(() => {
  if (!sampleBodyHtml.value) return ''
  return DOMPurify.sanitize(sampleBodyHtml.value)
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const formatVariable = (name: string) => `{{${name}}}`

const renderSample = (template: string, sampleData: Record<string, string>): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return sampleData[key] !== undefined
      ? `<span class="sample-replaced">${sampleData[key]}</span>`
      : `<span class="sample-unmatched">{{${key}}}</span>`
  })
}

const insertVariable = (variable: string) => {
  editor.value?.chain().focus().insertContent(`{{${variable}}}`).run()
}

const loadSampleContent = () => {
  const sample = sampleTemplateContent[keyValue.value ?? '']
  if (!sample) return
  subjectValue.value = sample.subject
  editor.value?.commands.setContent(sample.body_html)
}

const openLinkDialog = () => {
  linkUrl.value = ''
  linkDialog.value = true
}

const applyLink = () => {
  if (linkUrl.value && editor.value) {
    editor.value.chain().focus().setLink({ href: linkUrl.value }).run()
  }
  linkDialog.value = false
}

const openImageDialog = () => {
  imageUrl.value = ''
  imageDialog.value = true
}

const applyImage = () => {
  if (imageUrl.value && editor.value) {
    editor.value.chain().focus().setImage({ src: imageUrl.value }).run()
  }
  imageDialog.value = false
}

const handleCreate = async () => {
  const payload: Record<string, unknown> = {
    key: keyValue.value,
    subject: subjectValue.value,
    body_html: editor.value?.getHTML() ?? '',
    description: descriptionValue.value || null,
    variables: selectedKeyDefinition.value?.variables.map((variable) => variable.name) ?? [],
    company_id: companyIdValue.value ?? null,
  }
  const result = await EmailTemplateService.create(payload)
  emit('confirm', result)
}

const handleUpdate = async () => {
  if (!props.item) return
  const payload: Record<string, unknown> = {
    subject: subjectValue.value,
    body_html: editor.value?.getHTML() ?? '',
    description: descriptionValue.value || null,
    variables: selectedKeyDefinition.value?.variables.map((variable) => variable.name) ?? [],
    company_id: companyIdValue.value ?? null,
  }
  const result = await EmailTemplateService.update(props.item.id, payload)
  emit('confirm', result)
}

const confirm = async () => {
  try {
    isSaving.value = true
    if (!props.item) {
      await handleCreate()
    } else {
      await handleUpdate()
    }
  } catch (error) {
    console.error('Failed to save email template:', error)
    notifyError(t('emailTemplates.saveFailed'))
  } finally {
    isSaving.value = false
  }
}

const close = () => {
  emit('close-modal', null)
}

const populateForm = () => {
  // Populate non-editor fields immediately
  if (props.item) {
    keyValue.value = props.item.key
    subjectValue.value = props.item.subject
    descriptionValue.value = props.item.description ?? ''
    companyIdValue.value = props.item.company_id ?? null
  } else {
    keyValue.value = null
    subjectValue.value = ''
    descriptionValue.value = ''
    companyIdValue.value = defaultCompanyId.value
  }

  // Editor needs to be ready before setting content
  const setEditorContent = () => {
    if (editor.value) {
      editor.value.commands.setContent(props.item?.body_html ?? '')
    }
  }
  if (editor.value) {
    setEditorContent()
  }
  // Watch for editor to become available (TipTap initializes async)
  const stopWatch = watch(
    () => editor.value,
    (value) => {
      if (value) {
        setEditorContent()
        stopWatch()
      }
    },
    { immediate: false },
  )
}

const loadTemplateKeys = async () => {
  try {
    templateKeys.value = await EmailTemplateService.getTemplateKeys()
  } catch (error) {
    console.error('Failed to load template keys:', error)
    notifyError(t('emailTemplates.loadKeysFailed'))
  }
}

const loadCompanies = async () => {
  try {
    companies.value = await CompanyService.getAll()
  } catch (error) {
    console.error('Failed to load companies:', error)
    notifyError(t('emailTemplates.loadCompaniesFailed'))
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,
  (value) => {
    if (!value) {
      close()
      return
    }
    // Populate form fields when dialog opens
    populateForm()
  },
  { immediate: false },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  loadTemplateKeys()
  loadCompanies()
  // Dialog is already open when component mounts via v-if — populate immediately
  populateForm()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.clickable-chip {
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.clickable-chip:hover {
  opacity: 0.8;
}

.email-template-editor :deep(.tiptap) {
  min-height: 200px;
  outline: none;
}

.email-template-editor :deep(.tiptap p.is-editor-empty:first-child::before) {
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.email-template-editor :deep(.tiptap a) {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}

/* Headings */
.email-template-editor :deep(.tiptap h2) {
  font-size: 1.4em;
  font-weight: 700;
  margin: 12px 0 8px;
  line-height: 1.3;
}

.email-template-editor :deep(.tiptap h3) {
  font-size: 1.2em;
  font-weight: 600;
  margin: 10px 0 6px;
  line-height: 1.3;
}

/* Lists */
.email-template-editor :deep(.tiptap ul) {
  list-style-type: disc;
  padding-left: 24px;
  margin: 8px 0;
}

.email-template-editor :deep(.tiptap ol) {
  list-style-type: decimal;
  padding-left: 24px;
  margin: 8px 0;
}

.email-template-editor :deep(.tiptap li) {
  margin: 2px 0;
}

.email-template-editor :deep(.tiptap li p) {
  margin: 0;
}

/* Blockquote */
.email-template-editor :deep(.tiptap blockquote) {
  border-left: 4px solid rgba(var(--v-theme-on-surface), 0.2);
  padding-left: 12px;
  margin: 8px 0;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-style: italic;
}

/* Horizontal rule */
.email-template-editor :deep(.tiptap hr) {
  border: none;
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  margin: 12px 0;
}

/* Table */
.email-template-editor :deep(.tiptap table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  overflow: hidden;
}

.email-template-editor :deep(.tiptap td),
.email-template-editor :deep(.tiptap th) {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding: 6px 8px;
  min-width: 60px;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
}

.email-template-editor :deep(.tiptap th) {
  background: rgba(var(--v-theme-on-surface), 0.04);
  font-weight: 600;
}

.email-template-editor :deep(.tiptap .selectedCell) {
  background: rgba(var(--v-theme-primary), 0.1);
}

.email-template-editor :deep(.tiptap .column-resize-handle) {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: -2px;
  width: 4px;
  background-color: rgb(var(--v-theme-primary));
  pointer-events: none;
}

/* Highlight */
.email-template-editor :deep(.tiptap mark) {
  background-color: #fef08a;
  padding: 1px 2px;
  border-radius: 2px;
}

/* Image */
.email-template-editor :deep(.tiptap img) {
  max-width: 100%;
  height: auto;
  margin: 8px 0;
  border-radius: 4px;
}

.email-template-editor :deep(.tiptap img.ProseMirror-selectednode) {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

/* Color input in toolbar */
.toolbar-color-input {
  width: 26px;
  height: 26px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  background: transparent;
  margin: 1px;
}

.toolbar-color-input::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.toolbar-color-input::-webkit-color-swatch {
  border: none;
  border-radius: 2px;
}

.sample-preview-card {
  background-color: rgba(var(--v-theme-on-surface), 0.03);
}

.sample-body :deep(.sample-replaced) {
  background: rgba(var(--v-theme-primary), 0.15);
  color: rgb(var(--v-theme-primary));
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 500;
}

.sample-body :deep(.sample-unmatched) {
  background: rgba(var(--v-theme-error), 0.12);
  color: rgb(var(--v-theme-error));
  padding: 1px 4px;
  border-radius: 3px;
}

.sample-body {
  max-height: 300px;
  overflow-y: auto;
}

.sample-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}

.sample-body :deep(td),
.sample-body :deep(th) {
  padding: 6px 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.sample-body :deep(th) {
  font-weight: 600;
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.sample-body :deep(ul) {
  list-style-type: disc;
  padding-left: 24px;
  margin: 4px 0;
}

.sample-body :deep(ol) {
  list-style-type: decimal;
  padding-left: 24px;
  margin: 4px 0;
}

.sample-body :deep(h2) {
  font-size: 1.4em;
  font-weight: 700;
  margin: 8px 0 4px;
}

.sample-body :deep(h3) {
  font-size: 1.2em;
  font-weight: 600;
  margin: 6px 0 4px;
}

.sample-body :deep(blockquote) {
  border-left: 4px solid rgba(var(--v-theme-on-surface), 0.2);
  padding-left: 12px;
  margin: 8px 0;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.sample-body :deep(hr) {
  border: none;
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  margin: 12px 0;
}

.sample-body :deep(strong) {
  font-weight: 600;
}

.sample-body :deep(a) {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}

.sample-body :deep(mark) {
  background-color: #fef08a;
  padding: 1px 2px;
  border-radius: 2px;
}

.sample-body :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 8px 0;
  border-radius: 4px;
}
</style>
