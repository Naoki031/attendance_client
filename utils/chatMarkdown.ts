import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { ChatRoomMemberModel } from '@/interfaces/models/ChatRoomModel'
import { isCustomEmoji, getCustomEmojiUrl, getCustomEmojiLabel } from '@/utils/customEmoji'

marked.setOptions({
  breaks: true,
  gfm: true,
})

/**
 * Detects [memories_photo](url|thumbnail|caption|message) tokens and replaces them
 * with an HTML photo card before markdown parsing.
 */
function replaceMemoriesPhoto(text: string): string {
  return text.replace(/\[memories_photo\]\(([^)]+)\)/g, (_match, payload: string) => {
    const [photoUrl, thumbnailUrl, caption, message] = payload.split('|')
    const thumb = (thumbnailUrl ?? photoUrl).trim()
    const source = (photoUrl ?? '').trim()
    const captionText = (caption ?? '').trim()
    const messageText = (message ?? '').trim()

    const captionHtml = captionText
      ? `<span class="memories-photo-card__caption">${escapeHtml(captionText)}</span>`
      : ''
    const messageHtml = messageText
      ? `<span class="memories-photo-card__message">${escapeHtml(messageText)}</span>`
      : ''

    return (
      `<div class="memories-photo-card">` +
      `<img src="${escapeHtml(thumb)}" alt="memories photo" loading="lazy" class="memories-photo-card__img" data-full="${escapeHtml(source)}" />` +
      `${captionHtml}${messageHtml}` +
      `</div>`
    )
  })
}

/**
 * Detects [memories_album](albumId|coverUrl|title|photoCount|eventType|message) tokens
 * and replaces them with a clickable album card div before markdown parsing.
 */
function replaceMemoriesAlbum(text: string): string {
  return text.replace(/\[memories_album\]\(([^)]+)\)/g, (_match, payload: string) => {
    const [albumId, coverUrl, title, photoCount, eventType, message] = payload.split('|')
    const id = (albumId ?? '').trim()
    const cover = (coverUrl ?? '').trim()
    const titleText = (title ?? '').trim()
    const countText = (photoCount ?? '0').trim()
    const eventText = (eventType ?? '').trim()
    const messageText = (message ?? '').trim()

    const coverHtml = cover
      ? `<img src="${escapeHtml(cover)}" alt="album cover" loading="lazy" class="memories-album-card__cover" />`
      : `<div class="memories-album-card__cover-placeholder"></div>`

    const countLabel = `${escapeHtml(countText)} photos${eventText ? ' · ' + escapeHtml(eventText.replace(/_/g, ' ')) : ''}`
    const messageHtml = messageText
      ? `<span class="memories-album-card__message">${escapeHtml(messageText)}</span>`
      : ''

    return (
      `<div class="memories-album-card" data-album-id="${escapeHtml(id)}">` +
      `${coverHtml}` +
      `<div class="memories-album-card__meta">` +
      `<span class="memories-album-card__title">${escapeHtml(titleText)}</span>` +
      `<span class="memories-album-card__count">${countLabel}</span>` +
      `</div>` +
      `${messageHtml}` +
      `</div>`
    )
  })
}

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
  'div',
]
const ALLOWED_ATTR = ['class', 'src', 'alt', 'loading', 'data-full', 'data-album-id']

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
 * Only same-origin relative paths (e.g. /emoji/blob/...) are allowed as img src.
 * This blocks markdown images like ![x](https://external.com/pixel.gif) that could
 * be used for pixel tracking, while still allowing our custom emoji images.
 */
const ALLOWED_URI_REGEXP = /^\/[^/]/

/**
 * Renders chat message content as HTML with markdown formatting, custom emoji, and mention highlighting.
 * Output is sanitized with DOMPurify to prevent XSS from user-supplied content.
 *
 * Security notes:
 * - marked.parse() is NOT safe on its own; DOMPurify must always follow it.
 * - highlightMentions runs after DOMPurify and only injects escapeHtml'd user data.
 * - ALLOWED_URI_REGEXP restricts img src to same-origin paths, blocking external tracking pixels.
 */
export function renderChatMarkdown(content: string, members?: ChatRoomMemberModel[]): string {
  const withAlbumCards = replaceMemoriesAlbum(content)
  const withPhotoCards = replaceMemoriesPhoto(withAlbumCards)
  const withEmoji = replaceCustomEmoji(withPhotoCards)
  const rawHtml = marked.parse(withEmoji) as string

  // DOMPurify requires a DOM — only available on the client side.
  // Chat messages are never SSR-rendered (fetched after auth), so this guard is safe.
  const sanitizedHtml =
    typeof window !== 'undefined'
      ? DOMPurify.sanitize(rawHtml, {
          ALLOWED_TAGS,
          ALLOWED_ATTR,
          ALLOWED_URI_REGEXP,
          ALLOW_DATA_ATTR: true,
        })
      : rawHtml

  return highlightMentions(sanitizedHtml, members)
}

/**
 * Renders plain comment text with custom emoji support only (no markdown).
 * Escapes all user HTML first, then replaces :emoji: tokens with <img> tags.
 * Safe without DOMPurify because the HTML is built entirely from escaped input + known-safe URLs.
 */
export function renderCommentText(text: string): string {
  const escaped = escapeHtml(text)
  return escaped.replace(/(:[a-z0-9-]+:)/g, (match) => {
    if (!isCustomEmoji(match)) return match
    const url = getCustomEmojiUrl(match)
    if (!url) return match
    const label = getCustomEmojiLabel(match)
    return `<img src="${url}" alt="${escapeHtml(label)}" class="chat-custom-emoji" loading="lazy" />`
  })
}
