<template>
  <v-chip :color="chipColor" variant="tonal" size="small" label>
    <v-icon start size="14">{{ chipIcon }}</v-icon>
    {{ $t(`meetings.invite.status.${status}`) }}
  </v-chip>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type { MeetingInviteStatus } from '@/interfaces/models/MeetingInviteModel'
/* END IMPORT */

/** START DEFINE PROPS */
const props = defineProps({
  status: {
    type: String as PropType<MeetingInviteStatus>,
    required: true,
  },
})
/* END DEFINE PROPS */

/** START DEFINE COMPUTED */
const chipColor = computed(() => {
  const colorMap: Record<MeetingInviteStatus, string> = {
    pending: 'warning',
    accepted: 'success',
    declined: 'error',
    missed: 'grey',
  }
  return colorMap[props.status]
})

const chipIcon = computed(() => {
  const iconMap: Record<MeetingInviteStatus, string> = {
    pending: 'mdi-clock-outline',
    accepted: 'mdi-check-circle-outline',
    declined: 'mdi-close-circle-outline',
    missed: 'mdi-phone-missed',
  }
  return iconMap[props.status]
})
/* END DEFINE COMPUTED */
</script>
