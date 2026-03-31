import { marked } from 'marked'
import type { ChatRoomMemberModel } from '@/interfaces/models/ChatRoomModel'
import { isCustomEmoji, getCustomEmojiUrl, getCustomEmojiLabel } from '@/utils/customEmoji'

marked.setOptions({
  breaks: true,
  gfm: true,
})

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightMentions(html: string, members?: ChatRoomMemberModel[]): string {
  if (!members || members.length === 0) return html

  let result = html

  for (const member of members) {
    const fullName = member.user?.full_name
    if (!fullName) continue

    result = result.replace(
      new RegExp(`@${escapeRegex(fullName)}`, 'g'),
      `<span class="chat-mention">@${fullName}</span>`,
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

    return `<img src="${url}" alt="${label}" class="chat-custom-emoji" loading="lazy" />`
  })
}

/**
 * Renders chat message content as HTML with markdown formatting, custom emoji, and mention highlighting.
 */
export function renderChatMarkdown(content: string, members?: ChatRoomMemberModel[]): string {
  const withEmoji = replaceCustomEmoji(content)
  const html = marked.parse(withEmoji) as string

  return highlightMentions(html, members)
}
