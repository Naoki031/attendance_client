<template>
  <v-dialog v-model="isOpen" max-width="440" rounded="xl">
    <v-card rounded="xl" style="overflow: hidden">
      <!-- Gradient header -->
      <div class="modal-header">
        <div class="modal-header__confetti">🎊</div>
        <div class="modal-header__content">
          <div class="text-h6 font-weight-bold text-white">{{ $t('birthday.modal.title') }}</div>
          <div class="text-body-2 text-white" style="opacity: 0.88">
            {{ $t('birthday.modal.subtitle') }}
          </div>
        </div>
        <div class="modal-header__confetti modal-header__confetti--right">🎉</div>
      </div>

      <!-- People list -->
      <v-card-text class="pa-0">
        <div v-for="person in todayBirthdays" :key="person.id" class="birthday-person-row">
          <v-avatar size="48" color="primary" rounded="circle" class="flex-shrink-0">
            <v-img v-if="person.avatar" :src="person.avatar" cover />
            <span v-else class="text-body-1 font-weight-bold text-white">
              {{ getInitials(person) }}
            </span>
          </v-avatar>

          <div class="birthday-person-row__info">
            <div class="text-body-2 font-weight-bold">
              {{
                person.full_name || [person.first_name, person.last_name].filter(Boolean).join(' ')
              }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ formatDay(person.date_of_birth) }}
            </div>
          </div>

          <v-chip
            size="x-small"
            color="warning"
            variant="tonal"
            class="flex-shrink-0 font-weight-bold"
          >
            🎂 {{ $t('birthday.today') }}
          </v-chip>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn color="primary" variant="tonal" rounded="lg" @click="dismiss">
          {{ $t('birthday.modal.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import { useAppNotifications } from '@/composables/useAppNotifications'
import UserService from '@/services/UserService'
import type { UserModel } from '@/interfaces/models/UserModel'
/* END IMPORT */

/** START DEFINE STATE */
const { moment, TIMEZONE } = useMoment()
const { t } = useI18n()
const { notifyError } = useAppNotifications()
const userStore = useUserStore()

const isOpen = ref<boolean>(false)
const todayBirthdays = ref<UserModel[]>([])
/* END DEFINE STATE */

/** START DEFINE METHOD */
function getStorageKey(): string | null {
  const userId = userStore.user?.id
  if (!userId) return null
  return `birthday_modal_dismissed_${userId}`
}

function getTodayString(): string {
  return moment().tz(TIMEZONE).format('YYYY-MM-DD')
}

function isAlreadyDismissedToday(): boolean {
  if (typeof window === 'undefined') return true
  const key = getStorageKey()
  if (!key) return false
  return localStorage.getItem(key) === getTodayString()
}

function isToday(dateOfBirth: string | undefined): boolean {
  if (!dateOfBirth) return false
  const today = moment().tz(TIMEZONE)
  const dob = moment(dateOfBirth)
  return dob.date() === today.date() && dob.month() === today.month()
}

function getInitials(person: UserModel): string {
  const name = person.full_name ?? [person.first_name, person.last_name].filter(Boolean).join(' ')
  const parts = name.trim().split(' ').filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  return parts.length >= 2 ? (first + last).toUpperCase() : first.toUpperCase()
}

function formatDay(dateOfBirth: string | undefined): string {
  if (!dateOfBirth) return ''
  return moment(dateOfBirth).format(t('birthday.dayFormat'))
}

function dismiss(): void {
  if (typeof window !== 'undefined') {
    const key = getStorageKey()
    if (key) {
      localStorage.setItem(key, getTodayString())
    }
  }
  isOpen.value = false
}

async function load(): Promise<void> {
  if (!userStore.user?.id) return
  if (isAlreadyDismissedToday()) return
  try {
    const allBirthdays = await UserService.getBirthdaysThisMonth()
    todayBirthdays.value = allBirthdays.filter((person) => isToday(person.date_of_birth))
    if (todayBirthdays.value.length > 0) {
      isOpen.value = true
    }
  } catch {
    notifyError(t('birthday.loadFailed'))
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => userStore.user?.id,
  (userId) => {
    if (userId) load()
  },
  { immediate: true },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
/* ── Birthday theme tokens ── */
.modal-header {
  --bday-rose: #f43f5e;
  --bday-orange: #f97316;
  --bday-amber: #fbbf24;
}

.modal-header {
  background: linear-gradient(
    135deg,
    var(--bday-rose) 0%,
    var(--bday-orange) 55%,
    var(--bday-amber) 100%
  );
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header__confetti {
  font-size: 28px;
  flex-shrink: 0;
}

.modal-header__confetti--right {
  margin-left: auto;
}

.modal-header__content {
  flex: 1 1 0;
  min-width: 0;
}

.birthday-person-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.birthday-person-row:last-child {
  border-bottom: none;
}

.birthday-person-row__info {
  flex: 1 1 0;
  min-width: 0;
}
</style>
