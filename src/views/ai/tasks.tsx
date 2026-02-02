import { format, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  NAlert,
  NButton,
  NButtonGroup,
  NCard,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NFlex,
  NPagination,
  NPopconfirm,
  NProgress,
  NSelect,
  NSpace,
  NSpin,
  NStatistic,
  NTag,
  NText,
  NTimeline,
  NTimelineItem,
  useDialog,
  useMessage,
} from 'naive-ui'
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import type { DataTableColumns } from 'naive-ui'

import { RefreshIcon, TrashIcon } from '~/components/icons'
import { ContentLayout } from '~/layouts/content'
import { RESTManager } from '~/utils'

// Task types
enum TaskStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  PartialFailed = 'partial_failed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

enum AITaskType {
  Summary = 'ai:summary',
  Translation = 'ai:translation',
  TranslationBatch = 'ai:translation:batch',
  TranslationAll = 'ai:translation:all',
}

interface TaskLog {
  timestamp: number
  level: 'info' | 'warn' | 'error'
  message: string
}

interface SubTaskStats {
  total: number
  completed: number
  partialFailed: number
  failed: number
  running: number
  pending: number
}

interface Task {
  id: string
  type: string
  status: TaskStatus
  payload: Record<string, unknown>
  groupId?: string
  progress?: number
  progressMessage?: string
  totalItems?: number
  completedItems?: number
  tokensGenerated?: number
  createdAt: number
  startedAt?: number
  completedAt?: number
  result?: unknown
  error?: string
  logs: TaskLog[]
  workerId?: string
  retryCount: number
  subTaskStats?: SubTaskStats
}

const getStatusType = (
  status: TaskStatus,
): 'default' | 'info' | 'success' | 'warning' | 'error' => {
  switch (status) {
    case TaskStatus.Pending:
      return 'default'
    case TaskStatus.Running:
      return 'info'
    case TaskStatus.Completed:
      return 'success'
    case TaskStatus.PartialFailed:
      return 'warning'
    case TaskStatus.Failed:
      return 'error'
    case TaskStatus.Cancelled:
      return 'default'
    default:
      return 'default'
  }
}

const getStatusLabel = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.Pending:
      return '等待中'
    case TaskStatus.Running:
      return '运行中'
    case TaskStatus.Completed:
      return '已完成'
    case TaskStatus.PartialFailed:
      return '部分失败'
    case TaskStatus.Failed:
      return '失败'
    case TaskStatus.Cancelled:
      return '已取消'
    default:
      return status
  }
}

const getTaskTypeLabel = (type: string): string => {
  switch (type) {
    case AITaskType.Summary:
      return 'AI 摘要'
    case AITaskType.Translation:
      return 'AI 翻译'
    case AITaskType.TranslationBatch:
      return 'AI 批量翻译'
    case AITaskType.TranslationAll:
      return 'AI 全量翻译'
    default:
      return type
  }
}

const formatTime = (timestamp: number): string => {
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss')
}

const formatRelativeTime = (timestamp: number): string => {
  return formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: zhCN,
  })
}

export default defineComponent({
  name: 'AITasks',
  setup() {
    const message = useMessage()
    const dialog = useDialog()
    const loading = ref(false)
    const page = ref(1)
    const pageSize = ref(20)
    const statusFilter = ref<TaskStatus | undefined>(undefined)
    const typeFilter = ref<AITaskType | undefined>(undefined)

    const tasks = ref<Task[]>([])
    const pagination = ref({
      currentPage: 1,
      totalPage: 1,
      total: 0,
    })

    // 自动刷新
    let refreshInterval: ReturnType<typeof setInterval> | null = null

    const fetchTasks = async () => {
      loading.value = true
      try {
        const result = await RESTManager.api.ai.tasks.get<{
          data: Task[]
          pagination: { currentPage: number; totalPage: number; total: number }
        }>({
          params: {
            page: page.value,
            size: pageSize.value,
            status: statusFilter.value || undefined,
            type: typeFilter.value || undefined,
          },
        })
        tasks.value = result.data
        pagination.value = result.pagination
      } catch (error) {
        console.error('Failed to fetch tasks:', error)
        message.error('获取任务列表失败')
      } finally {
        loading.value = false
      }
    }

    watch([page, statusFilter, typeFilter], () => {
      fetchTasks()
    })

    onMounted(() => {
      fetchTasks()
      // 每 5 秒刷新一次
      refreshInterval = setInterval(() => {
        if (!loading.value) {
          fetchTasks()
        }
      }, 5000)
    })

    onUnmounted(() => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    })

    // Task actions
    const handleCancelTask = async (taskId: string) => {
      try {
        await RESTManager.api.ai.tasks(taskId).cancel.post()
        message.success('任务已取消')
        fetchTasks()
      } catch (error) {
        message.error('取消任务失败')
      }
    }

    const handleRetryTask = async (taskId: string) => {
      try {
        await RESTManager.api.ai.tasks(taskId).retry.post()
        message.success('任务已重试')
        fetchTasks()
      } catch (error) {
        message.error('重试任务失败')
      }
    }

    const handleDeleteTask = async (taskId: string) => {
      try {
        await RESTManager.api.ai.tasks(taskId).delete()
        message.success('任务已删除')
        fetchTasks()
      } catch (error) {
        message.error('删除任务失败')
      }
    }

    const handleBatchDelete = () => {
      dialog.warning({
        title: '批量删除',
        content: '确定要删除所有已完成、失败和已取消的任务吗？',
        positiveText: '确认',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            const before = Date.now()
            await RESTManager.api.ai.tasks.delete({
              params: { before },
            })
            message.success('批量删除成功')
            fetchTasks()
          } catch (error) {
            message.error('批量删除失败')
          }
        },
      })
    }

    // Task detail drawer
    const showDetailDrawer = ref(false)
    const selectedTask = ref<Task | null>(null)

    const handleViewDetail = (task: Task) => {
      selectedTask.value = task
      showDetailDrawer.value = true
    }

    const columns: DataTableColumns<Task> = [
      {
        title: '类型',
        key: 'type',
        width: 120,
        render: (row) => <NTag size="small">{getTaskTypeLabel(row.type)}</NTag>,
      },
      {
        title: '状态',
        key: 'status',
        width: 100,
        render: (row) => (
          <NTag size="small" type={getStatusType(row.status)}>
            {getStatusLabel(row.status)}
          </NTag>
        ),
      },
      {
        title: '进度',
        key: 'progress',
        width: 150,
        render: (row) => {
          if (row.status === TaskStatus.Running && row.progress !== undefined) {
            return (
              <NProgress
                type="line"
                percentage={Math.round(row.progress * 100)}
                indicator-placement="inside"
                processing
              />
            )
          }
          if (row.totalItems && row.completedItems !== undefined) {
            return (
              <NText depth={3}>
                {row.completedItems} / {row.totalItems}
              </NText>
            )
          }
          return <NText depth={3}>-</NText>
        },
      },
      {
        title: '描述',
        key: 'payload',
        ellipsis: { tooltip: true },
        render: (row) => {
          const payload = row.payload as any
          if (payload.title) {
            return payload.title
          }
          if (payload.refId) {
            return `ID: ${payload.refId}`
          }
          if (payload.refIds) {
            return `批量: ${payload.refIds.length} 篇`
          }
          if (payload.articleCount) {
            return `全量: ${payload.articleCount} 篇`
          }
          return '-'
        },
      },
      {
        title: '创建时间',
        key: 'createdAt',
        width: 150,
        render: (row) => (
          <NText depth={3}>{formatRelativeTime(row.createdAt)}</NText>
        ),
      },
      {
        title: '操作',
        key: 'actions',
        width: 200,
        render: (row) => (
          <NButtonGroup size="small">
            <NButton onClick={() => handleViewDetail(row)}>详情</NButton>
            {(row.status === TaskStatus.Pending ||
              row.status === TaskStatus.Running) && (
              <NPopconfirm onPositiveClick={() => handleCancelTask(row.id)}>
                {{
                  trigger: () => <NButton>取消</NButton>,
                  default: () => '确定要取消此任务吗？',
                }}
              </NPopconfirm>
            )}
            {(row.status === TaskStatus.Failed ||
              row.status === TaskStatus.PartialFailed ||
              row.status === TaskStatus.Cancelled) && (
              <NButton type="primary" onClick={() => handleRetryTask(row.id)}>
                重试
              </NButton>
            )}
            {(row.status === TaskStatus.Completed ||
              row.status === TaskStatus.Failed ||
              row.status === TaskStatus.PartialFailed ||
              row.status === TaskStatus.Cancelled) && (
              <NPopconfirm onPositiveClick={() => handleDeleteTask(row.id)}>
                {{
                  trigger: () => <NButton type="error">删除</NButton>,
                  default: () => '确定要删除此任务吗？',
                }}
              </NPopconfirm>
            )}
          </NButtonGroup>
        ),
      },
    ]

    const statusOptions = [
      { label: '全部状态', value: '' },
      { label: '等待中', value: TaskStatus.Pending },
      { label: '运行中', value: TaskStatus.Running },
      { label: '已完成', value: TaskStatus.Completed },
      { label: '部分失败', value: TaskStatus.PartialFailed },
      { label: '失败', value: TaskStatus.Failed },
      { label: '已取消', value: TaskStatus.Cancelled },
    ]

    const typeOptions = [
      { label: '全部类型', value: '' },
      { label: 'AI 摘要', value: AITaskType.Summary },
      { label: 'AI 翻译', value: AITaskType.Translation },
      { label: 'AI 批量翻译', value: AITaskType.TranslationBatch },
      { label: 'AI 全量翻译', value: AITaskType.TranslationAll },
    ]

    // Stats
    const stats = computed(() => {
      const pending = tasks.value.filter(
        (t) => t.status === TaskStatus.Pending,
      ).length
      const running = tasks.value.filter(
        (t) => t.status === TaskStatus.Running,
      ).length
      const completed = tasks.value.filter(
        (t) => t.status === TaskStatus.Completed,
      ).length
      const failed = tasks.value.filter(
        (t) =>
          t.status === TaskStatus.Failed ||
          t.status === TaskStatus.PartialFailed,
      ).length
      return { pending, running, completed, failed }
    })

    return () => (
      <ContentLayout>
        <NSpace vertical size="large" class="w-full">
          {/* Stats */}
          <NFlex justify="space-between" wrap={false}>
            <NSpace size="large">
              <NStatistic label="等待中" value={stats.value.pending} />
              <NStatistic label="运行中" value={stats.value.running} />
              <NStatistic label="已完成" value={stats.value.completed} />
              <NStatistic label="失败" value={stats.value.failed} />
            </NSpace>
          </NFlex>

          {/* Filters */}
          <NFlex justify="space-between" align="center">
            <NSpace>
              <NSelect
                value={statusFilter.value || ''}
                onUpdateValue={(v) => {
                  statusFilter.value = v || undefined
                }}
                options={statusOptions}
                style="width: 140px"
              />
              <NSelect
                value={typeFilter.value || ''}
                onUpdateValue={(v) => {
                  typeFilter.value = v || undefined
                }}
                options={typeOptions}
                style="width: 160px"
              />
            </NSpace>
            <NSpace>
              <NButton onClick={fetchTasks} disabled={loading.value}>
                {{
                  icon: () => <RefreshIcon />,
                  default: () => '刷新',
                }}
              </NButton>
              <NButton type="error" onClick={handleBatchDelete}>
                {{
                  icon: () => <TrashIcon />,
                  default: () => '清理',
                }}
              </NButton>
            </NSpace>
          </NFlex>

          {/* Table */}
          <NSpin show={loading.value}>
            {tasks.value.length > 0 ? (
              <>
                <NDataTable
                  columns={columns}
                  data={tasks.value}
                  bordered={false}
                  size="small"
                />
                <NFlex justify="end" class="mt-4">
                  <NPagination
                    page={page.value}
                    pageCount={pagination.value.totalPage}
                    onUpdatePage={(p) => {
                      page.value = p
                    }}
                  />
                </NFlex>
              </>
            ) : (
              <NEmpty description="暂无任务" />
            )}
          </NSpin>

          {/* Detail Drawer */}
          <NDrawer
            show={showDetailDrawer.value}
            onUpdateShow={(v) => {
              showDetailDrawer.value = v
            }}
            width={600}
          >
            <NDrawerContent title="任务详情" closable>
              {selectedTask.value && (
                <TaskDetailContent task={selectedTask.value} />
              )}
            </NDrawerContent>
          </NDrawer>
        </NSpace>
      </ContentLayout>
    )
  },
})

// Task detail content component
const TaskDetailContent = defineComponent({
  name: 'TaskDetailContent',
  props: {
    task: {
      type: Object as () => Task,
      required: true,
    },
  },
  setup(props) {
    return () => {
      const task = props.task

      return (
        <NSpace vertical size="large">
          {/* Basic Info */}
          <NDescriptions bordered column={1}>
            <NDescriptionsItem label="任务 ID">
              <NText code>{task.id}</NText>
            </NDescriptionsItem>
            <NDescriptionsItem label="类型">
              <NTag>{getTaskTypeLabel(task.type)}</NTag>
            </NDescriptionsItem>
            <NDescriptionsItem label="状态">
              <NTag type={getStatusType(task.status)}>
                {getStatusLabel(task.status)}
              </NTag>
            </NDescriptionsItem>
            {task.groupId && (
              <NDescriptionsItem label="分组 ID">
                <NText code>{task.groupId}</NText>
              </NDescriptionsItem>
            )}
            <NDescriptionsItem label="重试次数">
              {task.retryCount}
            </NDescriptionsItem>
          </NDescriptions>

          {/* Progress */}
          {task.status === TaskStatus.Running &&
            task.progress !== undefined && (
              <NCard title="进度" size="small">
                <NSpace vertical>
                  <NProgress
                    type="line"
                    percentage={Math.round(task.progress * 100)}
                    processing
                  />
                  {task.progressMessage && (
                    <NText depth={3}>{task.progressMessage}</NText>
                  )}
                  {task.totalItems !== undefined && (
                    <NText depth={3}>
                      {task.completedItems ?? 0} / {task.totalItems} 项
                    </NText>
                  )}
                </NSpace>
              </NCard>
            )}

          {/* Sub-task stats */}
          {task.subTaskStats && (
            <NCard title="子任务统计" size="small">
              <NFlex justify="space-around">
                <NStatistic label="总计" value={task.subTaskStats.total} />
                <NStatistic label="完成" value={task.subTaskStats.completed} />
                <NStatistic label="运行中" value={task.subTaskStats.running} />
                <NStatistic label="失败" value={task.subTaskStats.failed} />
              </NFlex>
            </NCard>
          )}

          {/* Timestamps */}
          <NDescriptions bordered column={1}>
            <NDescriptionsItem label="创建时间">
              {formatTime(task.createdAt)}
            </NDescriptionsItem>
            {task.startedAt && (
              <NDescriptionsItem label="开始时间">
                {formatTime(task.startedAt)}
              </NDescriptionsItem>
            )}
            {task.completedAt && (
              <NDescriptionsItem label="完成时间">
                {formatTime(task.completedAt)}
              </NDescriptionsItem>
            )}
            {task.tokensGenerated !== undefined && (
              <NDescriptionsItem label="生成 Tokens">
                {task.tokensGenerated.toLocaleString()}
              </NDescriptionsItem>
            )}
          </NDescriptions>

          {/* Error */}
          {task.error && (
            <NAlert type="error" title="错误信息">
              {task.error}
            </NAlert>
          )}

          {/* Payload */}
          <NCollapse>
            <NCollapseItem title="任务参数" name="payload">
              <pre class="overflow-auto rounded bg-gray-100 p-3 text-xs dark:bg-gray-800">
                {JSON.stringify(task.payload, null, 2)}
              </pre>
            </NCollapseItem>
            {task.result && (
              <NCollapseItem title="任务结果" name="result">
                <pre class="overflow-auto rounded bg-gray-100 p-3 text-xs dark:bg-gray-800">
                  {JSON.stringify(task.result, null, 2)}
                </pre>
              </NCollapseItem>
            )}
          </NCollapse>

          {/* Logs */}
          {task.logs.length > 0 && (
            <NCard title="任务日志" size="small">
              <NTimeline>
                {task.logs.map((log, index) => (
                  <NTimelineItem
                    key={index}
                    type={
                      log.level === 'error'
                        ? 'error'
                        : log.level === 'warn'
                          ? 'warning'
                          : 'info'
                    }
                    title={log.message}
                    time={format(new Date(log.timestamp), 'HH:mm:ss')}
                  />
                ))}
              </NTimeline>
            </NCard>
          )}
        </NSpace>
      )
    }
  },
})
