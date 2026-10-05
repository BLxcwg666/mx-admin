import { NButton, NInput, NSpace } from 'naive-ui'
import type { PropType } from 'vue'

import { RESTManager } from '~/utils'

interface CommentReviewResult {
  isSpam: boolean
  score?: number
  reason?: string
}

const openTestAIReviewDialog = () => {
  const text = ref('')
  const loading = ref(false)

  const $dialog = window.dialog.create({
    title: '测试 AI 审核',
    content: () => (
      <NSpace vertical>
        <NInput
          value={text.value}
          onUpdateValue={(v) => void (text.value = v)}
          type="textarea"
          autosize={{ minRows: 3, maxRows: 8 }}
          placeholder="输入一段评论内容"
        />
        <div class="text-right">
          <NButton
            type="primary"
            round
            loading={loading.value}
            disabled={!text.value.trim()}
            onClick={async () => {
              loading.value = true
              try {
                const result = await RESTManager.api.ai[
                  'comment-review'
                ].test.post<CommentReviewResult>({
                  data: { text: text.value },
                })
                const detail = result.reason
                  ? ` (${result.reason})`
                  : result.score != null
                    ? ` (score: ${result.score})`
                    : ''
                if (result.isSpam) {
                  window.message.warning(`AI 判定为垃圾评论${detail}`, {
                    duration: 5000,
                  })
                } else {
                  window.message.success(`AI 判定为正常评论${detail}`, {
                    duration: 3000,
                  })
                }
                $dialog.destroy()
              } finally {
                loading.value = false
              }
            }}
          >
            测试
          </NButton>
        </div>
      </NSpace>
    ),
  })
}

const actions: Record<string, () => void> = {
  'test-ai-review': openTestAIReviewDialog,
}

/** Button for `ui.component: 'action'` fields of the config form schema. */
export const ConfigAction = defineComponent({
  props: {
    actionId: { type: String as PropType<string | undefined> },
    label: { type: String as PropType<string | undefined> },
  },
  setup(props) {
    return () => {
      const run = props.actionId ? actions[props.actionId] : undefined
      if (!run) return null
      return (
        <NButton round onClick={run}>
          {props.label || '执行'}
        </NButton>
      )
    }
  },
})
