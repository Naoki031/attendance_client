<template>
  <div class="message-input pa-3">
    <v-sheet rounded="xl" border elevation="0" class="d-flex flex-column pa-2">
      <!-- Formatting toolbar (collapsible) -->
      <div v-if="showToolbar" class="format-toolbar d-flex ga-1 mb-2 flex-wrap">
        <v-tooltip text="Bold (Ctrl+B)" location="top">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              size="x-small"
              variant="text"
              icon
              density="comfortable"
              :color="editor?.isActive('bold') ? 'primary' : undefined"
              v-bind="tooltipProps"
              @click="editor?.chain().focus().toggleBold().run()"
            >
              <v-icon size="16">mdi-format-bold</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Italic (Ctrl+I)" location="top">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              size="x-small"
              variant="text"
              icon
              density="comfortable"
              :color="editor?.isActive('italic') ? 'primary' : undefined"
              v-bind="tooltipProps"
              @click="editor?.chain().focus().toggleItalic().run()"
            >
              <v-icon size="16">mdi-format-italic</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Underline" location="top">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              size="x-small"
              variant="text"
              icon
              density="comfortable"
              :color="editor?.isActive('underline') ? 'primary' : undefined"
              v-bind="tooltipProps"
              @click="editor?.chain().focus().toggleUnderline().run()"
            >
              <v-icon size="16">mdi-format-underline</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Strikethrough" location="top">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              size="x-small"
              variant="text"
              icon
              density="comfortable"
              :color="editor?.isActive('strike') ? 'primary' : undefined"
              v-bind="tooltipProps"
              @click="editor?.chain().focus().toggleStrike().run()"
            >
              <strong class="text-body-2" style="text-decoration: line-through">S</strong>
            </v-btn>
          </template>
        </v-tooltip>
        <v-divider vertical inset class="mx-1" />
        <v-tooltip text="Code" location="top">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              size="x-small"
              variant="text"
              icon
              density="comfortable"
              :color="editor?.isActive('code') ? 'primary' : undefined"
              v-bind="tooltipProps"
              @click="editor?.chain().focus().toggleCode().run()"
            >
              <v-icon size="16">mdi-code-tags</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Code Block" location="top">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              size="x-small"
              variant="text"
              icon
              density="comfortable"
              :color="editor?.isActive('codeBlock') ? 'primary' : undefined"
              v-bind="tooltipProps"
              @click="editor?.chain().focus().toggleCodeBlock().run()"
            >
              <v-icon size="16">mdi-code-braces</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-divider vertical inset class="mx-1" />
        <v-tooltip text="Quote" location="top">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              size="x-small"
              variant="text"
              icon
              density="comfortable"
              :color="editor?.isActive('blockquote') ? 'primary' : undefined"
              v-bind="tooltipProps"
              @click="editor?.chain().focus().toggleBlockquote().run()"
            >
              <v-icon size="16">mdi-format-quote-close</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Bullet List" location="top">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              size="x-small"
              variant="text"
              icon
              density="comfortable"
              :color="editor?.isActive('bulletList') ? 'primary' : undefined"
              v-bind="tooltipProps"
              @click="editor?.chain().focus().toggleBulletList().run()"
            >
              <v-icon size="16">mdi-format-list-bulleted</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Numbered List" location="top">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              size="x-small"
              variant="text"
              icon
              density="comfortable"
              :color="editor?.isActive('orderedList') ? 'primary' : undefined"
              v-bind="tooltipProps"
              @click="editor?.chain().focus().toggleOrderedList().run()"
            >
              <v-icon size="16">mdi-format-list-numbered</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </div>

      <!-- Input area -->
      <div class="d-flex align-end ga-2">
        <!-- TipTap Editor -->
        <div class="flex-grow-1" style="position: relative; min-width: 0">
          <div class="message-editor" @click="editor?.commands.focus()">
            <EditorContent :editor="editor" />
          </div>

          <!-- Mention dropdown -->
          <div v-if="showMentionDropdown && filteredMembers.length > 0" class="mention-dropdown">
            <v-card rounded="lg" elevation="6">
              <v-list density="compact" max-height="200" class="overflow-y-auto py-0">
                <v-list-item
                  v-for="(member, index) in filteredMembers"
                  :key="member.user_id"
                  :class="{ 'v-list-item--active': index === mentionSelectedIndex }"
                  @click="insertMention(member)"
                >
                  <template #prepend>
                    <v-avatar
                      size="24"
                      :color="member.user?.avatar ? undefined : 'primary'"
                      class="mr-2"
                    >
                      <v-img v-if="member.user?.avatar" :src="member.user.avatar" cover />
                      <span v-else class="text-caption text-white font-weight-bold">{{
                        getInitials(member.user?.full_name ?? '')
                      }}</span>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-body-2">{{
                    member.user?.full_name
                  }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>
          </div>
        </div>

        <!-- Send button -->
        <v-btn
          icon
          size="small"
          variant="tonal"
          color="primary"
          class="flex-shrink-0"
          :disabled="!canSend"
          @click="handleSend"
        >
          <v-icon size="20">mdi-send</v-icon>
        </v-btn>
      </div>

      <!-- Bottom action bar -->
      <div class="d-flex align-center ga-0 mt-1">
        <v-tooltip :text="showToolbar ? 'Hide Formatting' : 'Show Formatting'" location="top">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              size="small"
              variant="text"
              icon
              density="compact"
              :color="showToolbar ? 'primary' : undefined"
              v-bind="tooltipProps"
              @click="showToolbar = !showToolbar"
            >
              <v-icon size="18">mdi-format-text</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-menu v-model="showEmojiPicker" location="top end" :close-on-content-click="false">
          <template #activator="{ props: menuProps }">
            <v-btn size="small" variant="text" icon density="compact" v-bind="menuProps">
              <v-icon size="18">mdi-emoticon-outline</v-icon>
            </v-btn>
          </template>
          <EmojiPicker @select="insertEmoji" />
        </v-menu>

        <span class="text-caption text-medium-emphasis ml-2">{{ $t('chat.shiftEnterHint') }}</span>
        <v-spacer />
        <span
          class="text-caption char-counter"
          :class="
            charCount >= MAX_CHARS
              ? 'text-error'
              : charCount >= MAX_CHARS - 200
                ? 'text-warning'
                : 'text-disabled'
          "
        >
          {{ charCount }} / {{ MAX_CHARS }}
        </span>
      </div>
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
/** START IMPORT */
import type { PropType } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { Markdown } from 'tiptap-markdown'
import EmojiPicker from '@/components/chat/EmojiPicker.vue'
import type { ChatRoomMemberModel } from '@/interfaces/models/ChatRoomModel'
/* END IMPORT */

/** START DEFINE PROPS */
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  members: {
    type: Array as PropType<ChatRoomMemberModel[]>,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: '',
  },
})
/* END DEFINE PROPS */

/** START DEFINE EMITS */
const emit = defineEmits<{
  send: [content: string, mentionedUserIds: number[]]
  typing: [isTyping: boolean]
}>()
/* END DEFINE EMITS */

/** START DEFINE STATE */
const MAX_CHARS = 5000
const showToolbar = ref(false)
const showEmojiPicker = ref(false)
const mentionSearch = ref<string | null>(null)
const mentionStartIndex = ref(0)
const mentionSelectedIndex = ref(0)
const charCount = ref(0)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const canSend = computed(() => {
  if (!editor.value || props.disabled) return false

  return editor.value.getText().trim().length > 0 && charCount.value <= MAX_CHARS
})

const filteredMembers = computed(() => {
  if (mentionSearch.value === null || props.members.length === 0) return []

  const search = mentionSearch.value.toLowerCase()

  if (search === '') {
    return props.members
  }

  return props.members.filter((member) => {
    const fullName = (member.user?.full_name ?? '').toLowerCase()
    const parts = fullName.split(' ')

    return fullName.startsWith(search) || parts.some((part) => part.startsWith(search))
  })
})

const showMentionDropdown = computed(
  () => mentionSearch.value !== null && filteredMembers.value.length > 0,
)
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const editor = useEditor({
  editable: !props.disabled,
  content: '',
  extensions: [
    StarterKit.configure({
      heading: false,
      horizontalRule: false,
    }),
    Underline,
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    Markdown,
  ],
  editorProps: {
    attributes: {
      class: 'tiptap-editor',
    },
    handlePaste: (_view, event) => {
      const text = event.clipboardData?.getData('text/plain') ?? ''
      const currentLength = editor.value?.getText().length ?? 0
      const remaining = MAX_CHARS - currentLength

      if (remaining <= 0) {
        event.preventDefault()
        return true
      }

      if (text.length > remaining) {
        event.preventDefault()
        editor.value?.chain().focus().insertContent(text.slice(0, remaining)).run()
        return true
      }

      return false
    },
    handleKeyDown: (_view, event) => {
      // Block input when at character limit (allow control keys)
      if (
        charCount.value >= MAX_CHARS &&
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault()

        return true
      }

      // Mention dropdown navigation
      if (showMentionDropdown.value) {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          mentionSelectedIndex.value =
            (mentionSelectedIndex.value + 1) % filteredMembers.value.length

          return true
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault()
          mentionSelectedIndex.value =
            (mentionSelectedIndex.value - 1 + filteredMembers.value.length) %
            filteredMembers.value.length

          return true
        }

        if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault()
          const selectedMember = filteredMembers.value[mentionSelectedIndex.value]
          if (!selectedMember) return true
          insertMention(selectedMember)

          return true
        }

        if (event.key === 'Escape') {
          event.preventDefault()
          mentionSearch.value = null

          return true
        }
      }

      // Enter to send (without shift), but let TipTap handle Enter inside lists
      if (event.key === 'Enter' && !event.shiftKey) {
        const inList = editor.value?.isActive('bulletList') || editor.value?.isActive('orderedList')

        if (inList) return false

        event.preventDefault()
        handleSend()

        return true
      }

      return false
    },
  },
  onUpdate: ({ editor: updatedEditor }) => {
    charCount.value = updatedEditor.getText().length
    emit('typing', true)

    const { from } = updatedEditor.state.selection
    const textBefore = updatedEditor.state.doc.textBetween(Math.max(0, from - 51), from, '\n')

    const lastAtIndex = textBefore.lastIndexOf('@')

    if (
      lastAtIndex >= 0 &&
      (lastAtIndex === 0 || /[ \n]/.test(textBefore[lastAtIndex - 1] ?? ''))
    ) {
      const searchText = textBefore.substring(lastAtIndex + 1)

      if (!searchText.includes('\n') && searchText.length <= 50 && !searchText.includes(' ')) {
        mentionSearch.value = searchText
        mentionStartIndex.value = from - (textBefore.length - lastAtIndex)
        mentionSelectedIndex.value = 0

        return
      }
    }

    mentionSearch.value = null
  },
})

function getInitials(name: string): string {
  const parts = name.trim().split(' ')

  if (parts.length > 1 && parts[0] && parts.at(-1)) {
    return `${parts[0][0]}${parts.at(-1)![0]}`.toUpperCase()
  }

  return parts[0]?.[0]?.toUpperCase() ?? ''
}

function insertEmoji(emoji: string) {
  editor.value?.chain().focus().insertContent(emoji).run()
}

function parseMentions(content: string): number[] {
  const ids: number[] = []

  for (const member of props.members) {
    const fullName = member.user?.full_name

    if (fullName && content.includes(`@${fullName}`)) {
      ids.push(member.user_id)
    }
  }

  return ids
}

function insertMention(member: ChatRoomMemberModel) {
  if (!editor.value) return

  const fullName = member.user?.full_name ?? ''
  const currentFrom = editor.value.state.selection.from

  editor.value
    .chain()
    .focus()
    .deleteRange({
      from: mentionStartIndex.value,
      to: currentFrom,
    })
    .insertContent(`@${fullName} `)
    .run()

  mentionSearch.value = null
}

function handleSend() {
  if (!canSend.value) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markdown = (editor.value!.storage as any).markdown.getMarkdown() as string
  const content = markdown.trim()
  if (!content) return

  const mentionedUserIds = parseMentions(content)

  emit('send', content, mentionedUserIds)
  editor.value!.commands.clearContent()
  mentionSearch.value = null
  emit('typing', false)
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(filteredMembers, () => {
  mentionSelectedIndex.value = 0
})

watch(
  () => props.disabled,
  (disabled) => {
    editor.value?.setEditable(!disabled)
  },
)

watch(showToolbar, (value) => {
  localStorage.setItem('chat-toolbar-visible', String(value))
})

onMounted(() => {
  showToolbar.value = localStorage.getItem('chat-toolbar-visible') === 'true'
})
/* END DEFINE WATCHER */
</script>

<style scoped>
.message-input {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.format-toolbar {
  padding: 2px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 4px;
}

.message-editor :deep(.tiptap) {
  outline: none;
  min-height: 36px;
  font-size: 14px;
  padding: 6px 0;
  max-height: calc(4 * 1.5em + 12px);
  overflow-y: auto;
}

.message-editor :deep(.tiptap) p {
  margin: 0;
}

.message-editor :deep(.ProseMirror) {
  padding: 0 !important;
}

.message-editor :deep(.tiptap strong) {
  font-weight: 600;
}

.message-editor :deep(.tiptap em) {
  font-style: italic;
}

.message-editor :deep(.tiptap u) {
  text-decoration: underline;
}

.message-editor :deep(.tiptap s) {
  text-decoration: line-through;
  opacity: 0.7;
}

.message-editor :deep(.tiptap code) {
  background: #fff3e0;
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 0.85em;
  font-family: monospace;
  color: #e65100;
}

.message-editor :deep(.tiptap pre) {
  background: #fff3e0;
  border-radius: 6px;
  padding: 8px;
  overflow-x: auto;
  margin: 4px 0;
}

.message-editor :deep(.tiptap pre code) {
  background: none;
  padding: 0;
  color: #e65100;
}

.message-editor :deep(.tiptap blockquote) {
  border-left: 3px solid rgb(var(--v-theme-primary));
  margin: 4px 0;
  padding-left: 8px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.message-editor :deep(.tiptap ul),
.message-editor :deep(.tiptap ol) {
  margin: 4px 0 4px 16px;
  padding: 0;
}

.message-editor :deep(.tiptap ul) {
  list-style-type: disc;
}

.message-editor :deep(.tiptap ol) {
  list-style-type: decimal;
}

.message-editor :deep(.tiptap li) {
  margin: 0;
  padding: 0;
}

.message-editor :deep(.tiptap li p) {
  margin: 0;
}

.mention-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  margin-bottom: 4px;
}
</style>

<style>
/* Placeholder styles must be global for TipTap pseudo-element */
.message-editor .tiptap p.is-editor-empty:first-child::before {
  color: rgba(0, 0, 0, 0.4);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
