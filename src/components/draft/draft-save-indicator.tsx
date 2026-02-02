import { computed, defineComponent, onUnmounted, ref, watch } from 'vue'
import type { ComputedRef, PropType } from 'vue'

function formatRelativeTime(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const seconds = Math.floor(diff / 1000)

  if (seconds < 5) {
    return '刚刚'
  }
  if (seconds < 60) {
    return `${seconds} 秒前`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} 分钟前`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} 小时前`
  }

  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

const CloudIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
)

const LoaderIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    class="animate-spin"
  >
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
)

export const DraftSaveIndicator = defineComponent({
  name: 'DraftSaveIndicator',
  props: {
    isSaving: {
      type: Object as PropType<ComputedRef<boolean>>,
      required: true,
    },
    lastSavedTime: {
      type: Object as PropType<ComputedRef<Date | null>>,
      required: true,
    },
  },
  setup(props) {
    const relativeTimeText = ref('')
    let intervalId: ReturnType<typeof setInterval> | null = null

    const updateRelativeTime = () => {
      const time = props.lastSavedTime.value
      if (time) {
        relativeTimeText.value = formatRelativeTime(time)
      }
    }

    watch(
      () => props.lastSavedTime.value,
      (newTime) => {
        if (newTime) {
          updateRelativeTime()

          if (intervalId) {
            clearInterval(intervalId)
          }

          intervalId = setInterval(() => {
            updateRelativeTime()
          }, 1000)
        }
      },
      { immediate: true },
    )

    onUnmounted(() => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    })

    const showIndicator = computed(() => {
      return props.isSaving.value || props.lastSavedTime.value
    })

    return () => {
      if (!showIndicator.value) {
        return null
      }

      const isSaving = props.isSaving.value

      return (
        <div class="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          {isSaving ? (
            <>
              <LoaderIcon />
              <span>保存中...</span>
            </>
          ) : (
            <>
              <span class="text-green-500">
                <CloudIcon />
              </span>
              <span>已保存草稿</span>
              {relativeTimeText.value && (
                <span class="text-gray-400 dark:text-gray-500">
                  · {relativeTimeText.value}
                </span>
              )}
            </>
          )}
        </div>
      )
    }
  },
})
