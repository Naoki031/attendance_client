<template>
  <div v-if="todayPeople.length > 0 || otherPeople.length > 0" class="birthday-banner mb-6">
    <!-- Left: header + this-month others -->
    <div class="birthday-banner__left">
      <div class="birthday-banner__header">
        <span class="birthday-banner__cake-icon">🎂</span>
        <span class="text-body-2 font-weight-bold text-white">
          {{ $t('birthday.title', { month: currentMonth }) }}
        </span>
        <v-chip size="x-small" color="white" variant="tonal" class="font-weight-bold ml-1">
          {{ totalCount }}
        </v-chip>
      </div>

      <!-- Others in month (when today has spotlight) -->
      <template v-if="todayPeople.length > 0">
        <div v-if="otherPeople.length > 0" class="birthday-banner__others-label text-caption">
          {{ $t('birthday.others') }}
        </div>
        <div v-if="otherPeople.length > 0" class="birthday-banner__scroll">
          <div v-for="person in otherPeople" :key="person.id" class="birthday-card">
            <div class="birthday-card__avatar-wrap">
              <v-avatar size="44" color="primary" rounded="circle">
                <v-img v-if="person.avatar" :src="person.avatar" cover />
                <span v-else class="text-caption font-weight-bold text-white">
                  {{ getInitials(person) }}
                </span>
              </v-avatar>
            </div>
            <div class="birthday-card__name text-caption">{{ getShortName(person) }}</div>
            <div class="birthday-card__date">{{ formatDay(person.date_of_birth) }}</div>
          </div>
        </div>
      </template>

      <!-- No today birthday: show all people in scroll -->
      <div v-else class="birthday-banner__scroll">
        <div v-for="person in otherPeople" :key="person.id" class="birthday-card">
          <div class="birthday-card__avatar-wrap">
            <v-avatar size="52" color="primary" rounded="circle">
              <v-img v-if="person.avatar" :src="person.avatar" cover />
              <span v-else class="text-body-1 font-weight-bold text-white">
                {{ getInitials(person) }}
              </span>
            </v-avatar>
          </div>
          <div class="birthday-card__name text-caption font-weight-medium">
            {{ getShortName(person) }}
          </div>
          <div class="birthday-card__date">{{ formatDay(person.date_of_birth) }}</div>
        </div>
      </div>
    </div>

    <!-- Center: spotlight for today's birthday people -->
    <div v-if="todayPeople.length > 0" class="birthday-banner__spotlight">
      <!-- Deco emojis — 4 corners + 2 sides -->
      <span class="deco deco--tl" aria-hidden="true">🎈</span>
      <span class="deco deco--tr" aria-hidden="true">🎉</span>
      <span class="deco deco--bl" aria-hidden="true">🎁</span>
      <span class="deco deco--br" aria-hidden="true">⭐</span>
      <span class="deco deco--ml" aria-hidden="true">✨</span>
      <span class="deco deco--mr" aria-hidden="true">🎂</span>

      <!-- Person cards + wish in normal flow, centered -->
      <div class="spotlight-inner">
        <div class="spotlight-cards-row">
          <div v-for="person in todayPeople" :key="person.id" class="spotlight-card">
            <div class="spotlight-card__avatar-wrap">
              <v-avatar size="80" color="primary" rounded="circle">
                <v-img v-if="person.avatar" :src="person.avatar" cover />
                <span v-else class="text-h5 font-weight-bold text-white">
                  {{ getInitials(person) }}
                </span>
              </v-avatar>
            </div>
            <div class="spotlight-card__name text-body-1 font-weight-bold">
              {{ getShortName(person) }}
            </div>
            <div class="spotlight-card__date text-caption">
              {{ formatDay(person.date_of_birth) }}
            </div>
            <v-chip size="x-small" color="white" variant="tonal" class="font-weight-bold mt-1">
              🎉 {{ $t('birthday.today') }}
            </v-chip>
          </div>
        </div>
        <div class="spotlight-wish text-caption font-weight-bold">{{ $t('birthday.wish') }} 🥳</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import { useAppNotifications } from '@/composables/useAppNotifications'
import UserService from '@/services/UserService'
import type { UserModel } from '@/interfaces/models/UserModel'
/* END IMPORT */

/** START DEFINE STATE */
const { moment } = useMoment()
const { t } = useI18n()
const { notifyError } = useAppNotifications()

const people = ref<UserModel[]>([])
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const currentMonth = computed(() => moment().month() + 1)

const todayPeople = computed(() => people.value.filter((person) => isToday(person.date_of_birth)))

const otherPeople = computed(() => {
  const todayDay = moment().date()
  return people.value
    .filter((person) => {
      if (!person.date_of_birth) return false
      return moment(person.date_of_birth).date() !== todayDay
    })
    .sort(
      (personA, personB) =>
        moment(personA.date_of_birth).date() - moment(personB.date_of_birth).date(),
    )
})

const totalCount = computed(() => people.value.length)
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
function isToday(dateOfBirth: string | undefined): boolean {
  if (!dateOfBirth) return false
  const today = moment()
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

function getShortName(person: UserModel): string {
  const parts = (person.full_name ?? '').trim().split(' ').filter(Boolean)
  return parts.at(-1) ?? person.first_name ?? ''
}

function formatDay(dateOfBirth: string | undefined): string {
  if (!dateOfBirth) return ''
  return moment(dateOfBirth).format(t('birthday.dayFormat'))
}

async function load(): Promise<void> {
  try {
    people.value = await UserService.getBirthdaysThisMonth()
  } catch {
    notifyError(t('birthday.loadFailed'))
  }
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  load()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
/* ── Birthday theme tokens (intentional fixed palette, not theme-aware) ── */
.birthday-banner {
  --bday-rose: #f43f5e;
  --bday-orange: #f97316;
  --bday-amber: #fbbf24;
  --bday-amber-light: #fde68a;
  --bday-amber-dark: #f59e0b;
  --bday-white-faint: rgba(255, 255, 255, 0.18);
  --bday-white-mid: rgba(255, 255, 255, 0.55);
  --bday-white-strong: rgba(255, 255, 255, 0.85);
  --bday-white-text: rgba(255, 255, 255, 0.82);
  --bday-white-date: rgba(255, 255, 255, 0.78);
  --bday-white-sub: rgba(255, 255, 255, 0.65);
  --bday-white-name: rgba(255, 255, 255, 0.92);
  --bday-shadow: rgba(244, 63, 94, 0.28);
  --bday-text-shadow: rgba(0, 0, 0, 0.15);
}

/* ── Banner shell ─────────────────────────────────── */
.birthday-banner {
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    var(--bday-rose) 0%,
    var(--bday-orange) 55%,
    var(--bday-amber) 100%
  );
  box-shadow: 0 4px 20px var(--bday-shadow);
  display: flex;
  align-items: stretch;
  min-height: 130px;
}

/* ── Left pane: header + others ───────────────────── */
.birthday-banner__left {
  flex: 0 0 auto;
  max-width: 260px;
  padding: 14px 12px 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  border-right: 1px solid var(--bday-white-faint);
}

.birthday-banner__header {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.birthday-banner__cake-icon {
  font-size: 18px;
  line-height: 1;
}

.birthday-banner__others-label {
  color: var(--bday-white-sub);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 10px;
  font-weight: 700;
}

/* ── Card scroll row ─────────────────────────────── */
.birthday-banner__scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
  flex: 1 1 0;
  align-items: flex-start;
}

.birthday-banner__scroll::-webkit-scrollbar {
  display: none;
}

/* ── Individual small card ───────────────────────── */
.birthday-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 56px;
  flex-shrink: 0;
}

.birthday-card__avatar-wrap {
  border-radius: 50%;
  padding: 2px;
  background: var(--bday-white-faint);
}

.birthday-card__name {
  color: var(--bday-white-name);
  text-align: center;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.birthday-card__date {
  color: var(--bday-white-sub);
  font-size: 10px;
  text-align: center;
}

/* ── Center spotlight ─────────────────────────────── */
.birthday-banner__spotlight {
  flex: 1 1 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 14px 124px 14px 24px;
  overflow: hidden;
}

.spotlight-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.spotlight-card__avatar-wrap {
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(
    135deg,
    var(--bday-amber-light),
    var(--bday-amber),
    var(--bday-amber-dark)
  );
  box-shadow: 0 0 0 3px var(--bday-white-mid);
  animation: pulse-ring 2s ease-in-out infinite;
}

.spotlight-card__name {
  color: var(--bday-white-name);
  text-align: center;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spotlight-card__date {
  color: var(--bday-white-date);
  font-size: 11px;
  text-align: center;
}

/* Floating decorative emojis — 4 corners + 2 sides */
.deco {
  position: absolute;
  user-select: none;
  pointer-events: none;
  opacity: 0.55;
  animation: float 4s ease-in-out infinite;
}

.deco--tl {
  top: 8px;
  left: 10%;
  font-size: 28px;
  animation-delay: 0s;
}
.deco--tr {
  top: 8px;
  right: 10%;
  font-size: 24px;
  animation-delay: 0.7s;
}
.deco--bl {
  bottom: 8px;
  left: 12%;
  font-size: 22px;
  animation-delay: 1.3s;
}
.deco--br {
  bottom: 8px;
  right: 12%;
  font-size: 18px;
  animation-delay: 1.9s;
}
.deco--ml {
  top: 50%;
  left: 5%;
  font-size: 16px;
  animation-delay: 0.4s;
  transform: translateY(-50%);
}
.deco--mr {
  top: 50%;
  right: 5%;
  font-size: 22px;
  animation-delay: 1.1s;
  transform: translateY(-50%);
}

/* Inner flex column: cards + wish */
.spotlight-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.spotlight-cards-row {
  display: flex;
  gap: 20px;
  align-items: flex-end;
}

/* Wish text — centered below cards */
.spotlight-wish {
  color: var(--bday-white-text);
  white-space: nowrap;
  text-shadow: 0 1px 4px var(--bday-text-shadow);
  letter-spacing: 0.02em;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(-4deg);
  }
  50% {
    transform: translateY(-6px) rotate(4deg);
  }
}

@keyframes pulse-ring {
  0%,
  100% {
    box-shadow: 0 0 0 3px var(--bday-white-mid);
  }
  50% {
    box-shadow: 0 0 0 7px var(--bday-white-strong);
  }
}

/* ── Responsive ──────────────────────────────────── */
@media (max-width: 600px) {
  .birthday-banner__left {
    display: none;
  }

  .birthday-banner__spotlight {
    padding: 14px 16px;
    border-right: none;
  }

  .deco--tr,
  .deco--br,
  .deco--ml,
  .deco--mr {
    display: none;
  }

  .spotlight-wish {
    display: none;
  }
}
</style>
