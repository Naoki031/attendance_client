import type { RouteType, DividerType } from '@/types'

type TranslateFunction = (key: string) => string

type RouteItem = Pick<RouteType, 'icon' | 'link'> & {
  textKey: string
  name?: string
}

type RouteGroup = {
  icon: string
  textKey: string
  active: string
  children: RouteItem[]
}

const userRoutes: RouteItem[] = [
  { icon: 'mdi-home-outline', link: '/home', textKey: 'nav.home' },
  { icon: 'mdi-chat-outline', link: '/chat', textKey: 'nav.chat' },
  { icon: 'mdi-video-outline', link: '/meetings', textKey: 'nav.meetings' },
  {
    icon: 'mdi-clipboard-text-clock-outline',
    link: '/requests',
    textKey: 'nav.myRequests',
    name: 'requests.index',
  },
  {
    icon: 'mdi-bug-check-outline',
    link: '/bug-reports',
    textKey: 'nav.myBugReports',
    name: 'bug-reports.index',
  },
  { icon: 'mdi-account', link: '/profile', textKey: 'nav.profile' },
  { icon: 'mdi-cog-outline', link: '/settings', textKey: 'nav.settings' },
]

const adminGroups: RouteGroup[] = [
  {
    icon: 'mdi-domain',
    textKey: 'nav.organization',
    active: 'Organization',
    children: [
      {
        icon: 'mdi-account-multiple',
        link: '/management/users',
        textKey: 'nav.users',
        name: 'admin.users.index',
      },
      {
        icon: 'mdi-office-building',
        link: '/management/companies',
        textKey: 'nav.companies',
        name: 'admin.companies.index',
      },
      {
        icon: 'mdi-account-group-outline',
        link: '/management/groups',
        textKey: 'nav.groups',
        name: 'admin.groups.index',
      },
      {
        icon: 'mdi-account-supervisor',
        link: '/management/departments',
        textKey: 'nav.departments',
        name: 'admin.departments.index',
      },
      {
        icon: 'mdi-city',
        link: '/management/cities',
        textKey: 'nav.cities',
        name: 'admin.cities.index',
      },
      {
        icon: 'mdi-earth',
        link: '/management/countries',
        textKey: 'nav.countries',
        name: 'admin.countries.index',
      },
    ],
  },
  {
    icon: 'mdi-shield-lock-outline',
    textKey: 'nav.accessControl',
    active: 'AccessControl',
    children: [
      {
        icon: 'mdi-account-key',
        link: '/management/roles',
        textKey: 'nav.roles',
        name: 'admin.roles.index',
      },
      {
        icon: 'mdi-key-outline',
        link: '/management/permissions',
        textKey: 'nav.permissions',
        name: 'admin.permissions.index',
      },
      {
        icon: 'mdi-key-chain',
        link: '/management/permission-groups',
        textKey: 'nav.permissionGroups',
        name: 'admin.permission_groups.index',
      },
    ],
  },
  {
    icon: 'mdi-clipboard-check-outline',
    textKey: 'nav.requests',
    active: 'Requests',
    children: [
      {
        icon: 'mdi-check-circle-outline',
        link: '/management/approvals',
        textKey: 'nav.approvals',
        name: 'admin.approvals.index',
      },
      {
        icon: 'mdi-history',
        link: '/management/requests',
        textKey: 'nav.requestHistory',
        name: 'admin.requests.index',
      },
      {
        icon: 'mdi-bug-outline',
        link: '/management/bug-reports',
        textKey: 'nav.bugReports',
        name: 'admin.bug-reports.index',
      },
    ],
  },
  {
    icon: 'mdi-calendar-clock',
    textKey: 'nav.attendance',
    active: 'Attendance',
    children: [
      {
        icon: 'mdi-clipboard-clock-outline',
        link: '/management/attendance-logs',
        textKey: 'nav.attendanceLogs',
        name: 'admin.attendance-logs.index',
      },
      {
        icon: 'mdi-face-recognition',
        link: '/management/kyc',
        textKey: 'nav.kycApproval',
        name: 'admin.kyc.index',
      },
      {
        icon: 'mdi-help-circle-outline',
        link: '/management/how-it-works',
        textKey: 'nav.howItWorks',
        name: 'admin.how-it-works.index',
      },
    ],
  },
  {
    icon: 'mdi-connection',
    textKey: 'nav.integrations',
    active: 'Integrations',
    children: [
      {
        icon: 'mdi-slack',
        link: '/management/slack-channels',
        textKey: 'nav.slackChannels',
        name: 'admin.slack-channels.index',
      },
      {
        icon: 'mdi-google-spreadsheet',
        link: '/management/google-sheets',
        textKey: 'nav.googleSheets',
        name: 'admin.google-sheets.index',
      },
    ],
  },
  {
    icon: 'mdi-cog-outline',
    textKey: 'nav.settings',
    active: 'Settings',
    children: [
      {
        icon: 'mdi-tune',
        link: '/management/settings',
        textKey: 'nav.systemSettings',
        name: 'admin.settings.index',
      },
      {
        icon: 'mdi-translate',
        link: '/management/translation-logs',
        textKey: 'nav.translationLogs',
        name: 'admin.translation-logs.index',
      },
      {
        icon: 'mdi-alert-circle-outline',
        link: '/management/error-logs',
        textKey: 'nav.errorLogs',
        name: 'admin.error-logs.index',
      },
      {
        icon: 'mdi-email-edit-outline',
        link: '/management/email-templates',
        textKey: 'nav.emailTemplates',
        name: 'admin.email-templates.index',
      },
    ],
  },
]

function toItem(item: RouteItem, translate: TranslateFunction): RouteType {
  return {
    icon: item.icon,
    text: translate(item.textKey),
    link: item.link,
    ...(item.name && { name: item.name }),
  }
}

function toGroup(group: RouteGroup, translate: TranslateFunction): RouteType {
  return {
    icon: group.icon,
    text: translate(group.textKey),
    link: '',
    active: group.active,
    children: group.children.map((child) => toItem(child, translate)),
  }
}

/** Sidebar route definitions for regular users. */
export function getUserRoutes(translate: TranslateFunction): Array<RouteType | DividerType> {
  return userRoutes.map((item) => toItem(item, translate))
}

/** Sidebar route definitions for admin users. */
export function getAdminRoutes(translate: TranslateFunction): Array<RouteType | DividerType> {
  return adminGroups.map((group) => toGroup(group, translate))
}
