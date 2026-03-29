<template>
  <v-menu v-model="menuOpen" :close-on-content-click="false" :attach="false" :eager="true">
    <template #activator="{ props: menuProps }">
      <v-text-field
        v-bind="menuProps"
        :model-value="modelValue"
        variant="filled"
        rounded="lg"
        flat
        density="comfortable"
        :error-messages="errorMessages"
        prepend-inner-icon="mdi-calendar"
        readonly
      />
    </template>
    <v-date-picker
      :model-value="toPickerDate(modelValue)"
      hide-header
      @update:model-value="onDateSelected"
    >
      <template #day="daySlot">
        <v-btn
          v-bind="(daySlot as any).props"
          :class="{ 'weekend-day': isWeekendIso((daySlot as any).item.isoDate) }"
          :disabled="disableWeekends && isWeekendIso((daySlot as any).item.isoDate)"
          >{{ (daySlot as any).item.localized }}</v-btn
        >
      </template>
    </v-date-picker>
  </v-menu>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { PropType } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: false,
    default: '',
  },
  errorMessages: {
    type: Array as PropType<string[]>,
    required: false,
    default: () => [],
  },
  disableWeekends: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const { moment } = useMoment()

const menuOpen = ref(false)

const toPickerDate = (dateString: string): Date | undefined => {
  if (!dateString) return undefined
  return moment(dateString, 'YYYY-MM-DD').toDate()
}

const formatDate = (date: Date): string => {
  return moment(date).format('YYYY-MM-DD')
}

/** Returns true if the ISO date string (YYYY-MM-DD) falls on Saturday or Sunday. */
const isWeekendIso = (isoDate: string): boolean => {
  const dayOfWeek = moment(isoDate, 'YYYY-MM-DD').day()
  return dayOfWeek === 0 || dayOfWeek === 6
}

const onDateSelected = (selectedDate: Date) => {
  if (props.disableWeekends && isWeekendIso(formatDate(selectedDate))) return
  emit('update:modelValue', formatDate(selectedDate))
  menuOpen.value = false
}
</script>

<style>
/* Non-scoped: date picker renders in a portal overlay, scoped styles won't reach it */
.v-date-picker-month__day .weekend-day .v-btn__content {
  color: #ef5350 !important;
  font-weight: 700;
}
</style>
