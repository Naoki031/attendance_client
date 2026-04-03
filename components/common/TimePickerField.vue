<template>
  <v-select
    :model-value="modelValue"
    :items="timeOptions"
    variant="filled"
    rounded="lg"
    flat
    density="comfortable"
    :error-messages="errorMessages"
    prepend-inner-icon="mdi-clock-outline"
    @update:model-value="(value: string) => emit('update:modelValue', value)"
  />
</template>

<script lang="ts" setup>
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
  minuteIntervals: {
    type: Array as PropType<number[]>,
    required: false,
    default: () => [0, 15, 30, 45],
  },
})

const emit = defineEmits(['update:modelValue'])

/** Time slots: every hour at specified minute intervals (HH:MM format) */
const timeOptions = computed(() =>
  Array.from({ length: 24 }, (_, hour) =>
    props.minuteIntervals.map(
      (minute) => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    ),
  ).flat(),
)
</script>
