import { defineComponent } from 'vue'
import type { PropType } from 'vue'

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const VersionListItem = defineComponent({
  name: 'VersionListItem',
  props: {
    version: {
      type: [Number, String] as PropType<number | 'published' | 'current'>,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    savedAt: {
      type: String,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    isFullSnapshot: {
      type: Boolean,
      default: false,
    },
    diffStats: {
      type: Object as PropType<{ added: number; removed: number }>,
      default: undefined,
    },
    onClick: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const getVersionLabel = () => {
      if (props.version === 'published') return '已发布'
      if (props.isCurrent) return '当前草稿'
      return `v${props.version}`
    }

    return () => (
      <div
        class={[
          'cursor-pointer px-4 py-3 transition-colors',
          props.isSelected
            ? 'bg-gray-100 dark:bg-gray-800'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        ]}
        onClick={props.onClick}
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span
                class={[
                  'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium',
                  props.version === 'published'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                    : props.isCurrent
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                ]}
              >
                {getVersionLabel()}
              </span>
              {props.isFullSnapshot && (
                <span class="text-xs text-gray-400">快照</span>
              )}
            </div>

            <p class="mt-1 truncate text-sm text-gray-900 dark:text-gray-100">
              {props.title || '无标题'}
            </p>

            <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {formatDate(props.savedAt)}
            </p>
          </div>

          {props.diffStats && (
            <div class="flex-shrink-0 text-xs">
              {props.diffStats.added > 0 && (
                <span class="text-green-600 dark:text-green-400">
                  +{props.diffStats.added}
                </span>
              )}
              {props.diffStats.removed > 0 && (
                <span class="ml-1 text-red-600 dark:text-red-400">
                  -{props.diffStats.removed}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  },
})
