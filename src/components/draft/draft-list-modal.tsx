import { NButton, NCheckbox, NModal, NScrollbar } from 'naive-ui'
import { defineComponent, ref, watch } from 'vue'
import type { DraftModel } from '~/models/draft'
import type { PropType } from 'vue'

export const DraftListModal = defineComponent({
  name: 'DraftListModal',
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true,
    },
    drafts: {
      type: Array as PropType<DraftModel[]>,
      required: true,
    },
    draftLabel: {
      type: String,
      default: '内容',
    },
    onSelect: {
      type: Function as PropType<(draftId: string) => void>,
      required: true,
    },
    onCreate: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const selectedDraftId = ref<string | null>(null)
    const selectedDraft = ref<DraftModel | null>(null)

    watch(
      () => props.show,
      (show) => {
        if (show && props.drafts.length > 0) {
          selectedDraftId.value = props.drafts[0].id
          selectedDraft.value = props.drafts[0]
        }
      },
      { immediate: true },
    )

    const handleSelectDraft = (draft: DraftModel) => {
      selectedDraftId.value = draft.id
      selectedDraft.value = draft
    }

    const handleCreate = () => {
      props.onCreate()
      props.onClose()
    }

    const handleContinue = () => {
      if (selectedDraftId.value) {
        props.onSelect(selectedDraftId.value)
        props.onClose()
      }
    }

    const formatWordCount = (text: string) => {
      return text.length
    }

    return () => (
      <NModal
        show={props.show}
        onUpdateShow={(show) => {
          if (!show) props.onClose()
        }}
        closeOnEsc
        transformOrigin="center"
      >
        <div
          class="flex h-[600px] w-[900px] max-w-[90vw] flex-col rounded-lg bg-white shadow-xl dark:bg-[#303030]"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div class="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              发现未完成的草稿
            </h2>
            <NButton quaternary circle size="small" onClick={props.onClose}>
              ✕
            </NButton>
          </div>

          {/* Body */}
          <div class="flex min-h-0 flex-1">
            {/* Left: Draft List */}
            <div class="w-60 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
              <NScrollbar class="h-full">
                {props.drafts.map((draft, index) => (
                  <div
                    key={draft.id}
                    class={[
                      'cursor-pointer px-4 py-3 transition-colors',
                      selectedDraftId.value === draft.id
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                      index !== props.drafts.length - 1 &&
                        'border-b border-gray-100 dark:border-gray-800',
                    ]}
                    onClick={() => handleSelectDraft(draft)}
                  >
                    <div class="flex items-start gap-3">
                      <div class="mt-0.5 flex-shrink-0">
                        <NCheckbox
                          checked={selectedDraftId.value === draft.id}
                          onUpdateChecked={() => handleSelectDraft(draft)}
                        />
                      </div>

                      <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                          {draft.title || '无标题'}
                        </p>
                        <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          v{draft.version} · {formatWordCount(draft.text)} 字
                        </p>
                        <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                          {new Date(draft.updated).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </NScrollbar>
            </div>

            {/* Right: Content Preview */}
            <div class="min-w-0 flex-1 overflow-auto bg-gray-50 p-4 dark:bg-gray-900">
              {selectedDraft.value ? (
                <div class="h-full">
                  <div class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedDraft.value.title || '无标题'}
                  </div>
                  <pre class="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
                    {selectedDraft.value.text}
                  </pre>
                </div>
              ) : (
                <div class="flex h-full items-center justify-center text-gray-400">
                  选择一个草稿查看内容
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div class="flex flex-shrink-0 items-center justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
            <NButton onClick={handleCreate}>创建新{props.draftLabel}</NButton>
            <NButton
              type="primary"
              onClick={handleContinue}
              disabled={!selectedDraftId.value}
            >
              继续编辑选中的草稿
            </NButton>
          </div>
        </div>
      </NModal>
    )
  },
})
