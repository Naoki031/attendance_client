import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { ChatRoomMemberModel } from '@/interfaces/models/ChatRoomModel'
import { isCustomEmoji, getCustomEmojiUrl, getCustomEmojiLabel } from '@/utils/customEmoji'

marked.setOptions({
  breaks: true,
  gfm: true,
})

/** Tags and attributes allowed in chat messages after markdown rendering. */
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  'del',
  's',
  'code',
  'pre',
  'ul',
  'ol',
  'li',
  'blockquote',
  'span',
  'img',
]
const ALLOWED_ATTR = ['class', 'src', 'alt', 'loading']

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function highlightMentions(html: string, members?: ChatRoomMemberModel[]): string {
  if (!members || members.length === 0) return html

  let result = html

  for (const member of members) {
    const fullName = member.user?.full_name
    if (!fullName) continue

    result = result.replace(
      new RegExp(`@${escapeRegex(fullName)}`, 'g'),
      `<span class="chat-mention">@${escapeHtml(fullName)}</span>`,
    )
  }

  return result
}

/**
 * Replaces custom emoji keys (e.g. :blob-happy:) with inline <img> tags.
 */
function replaceCustomEmoji(text: string): string {
  return text.replace(/(:[a-z0-9-]+:)/g, (match) => {
    if (!isCustomEmoji(match)) return match
    const url = getCustomEmojiUrl(match)
    if (!url) return match
    const label = getCustomEmojiLabel(match)

    return `<img src="${url}" alt="${escapeHtml(label)}" class="chat-custom-emoji" loading="lazy" />`
  })
}

/**
 * Renders chat message content as HTML with markdown formatting, custom emoji, and mention highlighting.
 * Output is sanitized with DOMPurify to prevent XSS from user-supplied content.
 */
export function renderChatMarkdown(content: string, members?: ChatRoomMemberModel[]): string {
  const withEmoji = replaceCustomEmoji(content)
  const rawHtml = marked.parse(withEmoji) as string

  // DOMPurify requires a DOM — only available on the client side.
  // Chat messages are never SSR-rendered (fetched after auth), so this guard is safe.
  const sanitizedHtml =
    typeof window !== 'undefined'
      ? DOMPurify.sanitize(rawHtml, { ALLOWED_TAGS, ALLOWED_ATTR })
      : rawHtml

  return highlightMentions(sanitizedHtml, members)
}
