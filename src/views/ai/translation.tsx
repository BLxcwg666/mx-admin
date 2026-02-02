import { format } from 'date-fns'
import {
  NButton,
  NButtonGroup,
  NCard,
  NCode,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NFlex,
  NInput,
  NModal,
  NPagination,
  NSelect,
  NSpace,
  NSpin,
  NTag,
  NText,
  useDialog,
  useMessage,
} from 'naive-ui'
import { computed, defineComponent, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import type { AITranslationModel, TranslationGroupedItem } from '~/models/ai'
import type { DataTableColumns } from 'naive-ui'

import { AddIcon, RefreshIcon } from '~/components/icons'
import { ContentLayout } from '~/layouts/content'
import { RouteName } from '~/router/name'
import { RESTManager } from '~/utils'

// 支持的语言列表
const SUPPORTED_LANGUAGES = [
  { label: '英语', value: 'en' },
  { label: '日语', value: 'ja' },
  { label: '韩语', value: 'ko' },
  { label: '法语', value: 'fr' },
  { label: '德语', value: 'de' },
  { label: '西班牙语', value: 'es' },
  { label: '俄语', value: 'ru' },
  { label: '葡萄牙语', value: 'pt' },
  { label: '意大利语', value: 'it' },
  { label: '繁体中文', value: 'zh-TW' },
  { label: '简体中文', value: 'zh-CN' },
]

const getLanguageLabel = (code: string) => {
  return SUPPORTED_LANGUAGES.find((l) => l.value === code)?.label || code
}

export default defineComponent({
  name: 'AITranslation',
  setup() {
    const route = useRoute()
    const refId = computed(() => route.query.refId as string | undefined)

    return () => (
      <ContentLayout>
        {refId.value ? (
          <TranslationDetail refId={refId.value} />
        ) : (
          <TranslationList />
        )}
      </ContentLayout>
    )
  },
})

// 翻译列表组件
const TranslationList = defineComponent({
  name: 'TranslationList',
  setup() {
    const message = useMessage()
    const dialog = useDialog()
    const loading = ref(false)
    const page = ref(1)
    const pageSize = ref(20)
    const searchQuery = ref('')
    const data = ref<{
      items: TranslationGroupedItem[]
      pagination: { currentPage: number; totalPage: number; total: number }
    } | null>(null)

    const fetchData = async () => {
      loading.value = true
      try {
        const result = await RESTManager.api.ai.translations.grouped.get<{
          data: TranslationGroupedItem[]
          pagination: { currentPage: number; totalPage: number; total: number }
        }>({
          params: {
            page: page.value,
            size: pageSize.value,
            search: searchQuery.value || undefined,
          },
        })
        data.value = {
          items: result.data,
          pagination: result.pagination,
        }
      } catch (error) {
        console.error('Failed to fetch translations:', error)
        message.error('获取翻译列表失败')
      } finally {
        loading.value = false
      }
    }

    watch([page, searchQuery], () => {
      fetchData()
    })

    // 初始加载
    fetchData()

    const handleBatchTranslate = () => {
      dialog.warning({
        title: '批量翻译',
        content: '此操作将为所有文章生成翻译，可能需要较长时间，是否继续？',
        positiveText: '确认',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            await RESTManager.api.ai.translations.task.all.post()
            message.success('批量翻译任务已创建')
          } catch (error) {
            message.error('创建批量翻译任务失败')
          }
        },
      })
    }

    const columns: DataTableColumns<TranslationGroupedItem> = [
      {
        title: '文章',
        key: 'article',
        render: (row) => (
          <div class="space-y-1">
            <RouterLink
              to={{
                name:
                  row.refType === 'Post'
                    ? RouteName.EditPost
                    : RouteName.EditNote,
                query: { id: row.refId },
              }}
              class="text-primary-500 hover:text-primary-600"
            >
              {row.article.title}
            </RouterLink>
            <div class="text-xs text-gray-400">
              {row.refType === 'Post' ? '文章' : '日记'} ·{' '}
              {row.article.slug || `#${row.article.nid}`}
            </div>
          </div>
        ),
      },
      {
        title: '已翻译语言',
        key: 'translations',
        render: (row) => (
          <NSpace size="small">
            {row.translations.map((t) => (
              <NTag key={t.lang} size="small" type="info">
                {getLanguageLabel(t.lang)}
              </NTag>
            ))}
            {row.translations.length === 0 && <NText depth={3}>暂无翻译</NText>}
          </NSpace>
        ),
      },
      {
        title: '操作',
        key: 'actions',
        width: 150,
        render: (row) => (
          <NButtonGroup size="small">
            <RouterLink
              to={{
                name: RouteName.AiTranslation,
                query: { refId: row.refId },
              }}
            >
              <NButton>查看</NButton>
            </RouterLink>
            <NButton
              type="primary"
              onClick={() => handleGenerateTranslation(row.refId, row.refType)}
            >
              生成
            </NButton>
          </NButtonGroup>
        ),
      },
    ]

    const showGenerateModal = ref(false)
    const generateRefId = ref('')
    const generateRefType = ref<'Post' | 'Note'>('Post')
    const selectedLanguages = ref<string[]>(['en', 'ja'])

    const handleGenerateTranslation = (
      refId: string,
      refType: 'Post' | 'Note',
    ) => {
      generateRefId.value = refId
      generateRefType.value = refType
      showGenerateModal.value = true
    }

    const handleConfirmGenerate = async () => {
      if (selectedLanguages.value.length === 0) {
        message.warning('请选择至少一种目标语言')
        return
      }

      try {
        await RESTManager.api.ai.translations.task.post({
          data: {
            refId: generateRefId.value,
            targetLanguages: selectedLanguages.value,
          },
        })
        message.success('翻译任务已创建')
        showGenerateModal.value = false
        fetchData()
      } catch (error) {
        message.error('创建翻译任务失败')
      }
    }

    return () => (
      <NSpace vertical size="large" class="w-full">
        <NFlex justify="space-between" align="center">
          <NInput
            v-model:value={searchQuery.value}
            placeholder="搜索文章标题..."
            clearable
            style="width: 300px"
          />
          <NSpace>
            <NButton onClick={fetchData} disabled={loading.value}>
              {{
                icon: () => <RefreshIcon />,
                default: () => '刷新',
              }}
            </NButton>
            <NButton type="primary" onClick={handleBatchTranslate}>
              {{
                icon: () => <AddIcon />,
                default: () => '批量翻译',
              }}
            </NButton>
          </NSpace>
        </NFlex>

        <NSpin show={loading.value}>
          {data.value && data.value.items.length > 0 ? (
            <>
              <NDataTable
                columns={columns}
                data={data.value.items}
                bordered={false}
                size="small"
              />
              <NFlex justify="end" class="mt-4">
                <NPagination
                  page={page.value}
                  pageCount={data.value.pagination.totalPage}
                  onUpdatePage={(p) => {
                    page.value = p
                  }}
                />
              </NFlex>
            </>
          ) : (
            <NEmpty description="暂无翻译数据" />
          )}
        </NSpin>

        {/* 生成翻译弹窗 */}
        <NModal
          show={showGenerateModal.value}
          onUpdateShow={(v) => {
            showGenerateModal.value = v
          }}
          preset="dialog"
          title="生成翻译"
          positiveText="确认"
          negativeText="取消"
          onPositiveClick={handleConfirmGenerate}
        >
          <NSpace vertical>
            <NText>选择目标语言：</NText>
            <NSelect
              v-model:value={selectedLanguages.value}
              multiple
              options={SUPPORTED_LANGUAGES}
              placeholder="选择要翻译的语言"
            />
          </NSpace>
        </NModal>
      </NSpace>
    )
  },
})

// 翻译详情组件
const TranslationDetail = defineComponent({
  name: 'TranslationDetail',
  props: {
    refId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const message = useMessage()
    const dialog = useDialog()
    const loading = ref(false)
    const translations = ref<AITranslationModel[]>([])
    const article = ref<{ title: string; type: string } | null>(null)
    const availableLanguages = ref<string[]>([])

    const fetchTranslations = async () => {
      loading.value = true
      try {
        const [translationsData, languagesData] = await Promise.all([
          RESTManager.api.ai.translations.ref(props.refId).get<{
            data: AITranslationModel[]
            article: { title: string; type: string }
          }>(),
          RESTManager.api.ai.translations
            .article(props.refId)
            .languages.get<string[]>(),
        ])

        translations.value = translationsData.data
        article.value = translationsData.article
        availableLanguages.value = languagesData
      } catch (error) {
        console.error('Failed to fetch translations:', error)
        message.error('获取翻译详情失败')
      } finally {
        loading.value = false
      }
    }

    fetchTranslations()

    // 流式生成状态
    const streamingLang = ref<string | null>(null)
    const streamingContent = ref('')
    const streamingAbortController = ref<AbortController | null>(null)

    const handleStreamGenerate = async (lang: string) => {
      if (streamingLang.value) {
        message.warning('正在生成中，请稍候')
        return
      }

      streamingLang.value = lang
      streamingContent.value = ''
      streamingAbortController.value = new AbortController()

      try {
        const response = await fetch(
          `${RESTManager.endpoint}/ai/translations/article/${props.refId}/generate?lang=${lang}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            signal: streamingAbortController.value.signal,
          },
        )

        if (!response.ok) {
          throw new Error('Failed to generate translation')
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No reader available')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                // 完成
                message.success('翻译生成完成')
                fetchTranslations()
              } else {
                try {
                  const parsed = JSON.parse(data)
                  if (parsed.content) {
                    streamingContent.value += parsed.content
                  }
                  if (parsed.error) {
                    message.error(parsed.error)
                  }
                } catch {
                  // 忽略解析错误
                }
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Stream generation failed:', error)
          message.error('生成翻译失败')
        }
      } finally {
        streamingLang.value = null
        streamingContent.value = ''
        streamingAbortController.value = null
      }
    }

    const handleCancelStream = () => {
      streamingAbortController.value?.abort()
    }

    const handleDeleteTranslation = (translation: AITranslationModel) => {
      dialog.warning({
        title: '删除翻译',
        content: `确定要删除 ${getLanguageLabel(translation.lang)} 翻译吗？`,
        positiveText: '确认',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            await RESTManager.api.ai.translations(translation.id).delete()
            message.success('删除成功')
            fetchTranslations()
          } catch (error) {
            message.error('删除失败')
          }
        },
      })
    }

    // 查看翻译详情
    const showDetailDrawer = ref(false)
    const selectedTranslation = ref<AITranslationModel | null>(null)

    const handleViewDetail = (translation: AITranslationModel) => {
      selectedTranslation.value = translation
      showDetailDrawer.value = true
    }

    onUnmounted(() => {
      streamingAbortController.value?.abort()
    })

    return () => (
      <NSpace vertical size="large" class="w-full">
        <NFlex justify="space-between" align="center">
          <NSpace align="center">
            <RouterLink to={{ name: RouteName.AiTranslation }}>
              <NButton quaternary>← 返回列表</NButton>
            </RouterLink>
            {article.value && <NText strong>{article.value.title}</NText>}
          </NSpace>
          <NButton onClick={fetchTranslations} disabled={loading.value}>
            刷新
          </NButton>
        </NFlex>

        {/* 流式生成进度 */}
        {streamingLang.value && (
          <NCard
            title={`正在生成 ${getLanguageLabel(streamingLang.value)} 翻译...`}
          >
            <NSpace vertical>
              <NSpin size="small" />
              {streamingContent.value && (
                <NCode
                  language="markdown"
                  code={streamingContent.value}
                  wordWrap
                />
              )}
              <NButton onClick={handleCancelStream} type="error" size="small">
                取消
              </NButton>
            </NSpace>
          </NCard>
        )}

        <NSpin show={loading.value}>
          {/* 已有翻译 */}
          {translations.value.length > 0 ? (
            <NSpace vertical>
              {translations.value.map((t) => (
                <NCard key={t.id} size="small">
                  <NFlex justify="space-between" align="center">
                    <NSpace align="center">
                      <NTag type="info">{getLanguageLabel(t.lang)}</NTag>
                      <NText strong>{t.title}</NText>
                      <NText depth={3} class="text-xs">
                        {t.updated
                          ? format(new Date(t.updated), 'yyyy-MM-dd HH:mm')
                          : format(new Date(t.created), 'yyyy-MM-dd HH:mm')}
                      </NText>
                    </NSpace>
                    <NButtonGroup size="small">
                      <NButton onClick={() => handleViewDetail(t)}>
                        查看
                      </NButton>
                      <NButton
                        type="primary"
                        onClick={() => handleStreamGenerate(t.lang)}
                        disabled={!!streamingLang.value}
                      >
                        重新生成
                      </NButton>
                      <NButton
                        type="error"
                        onClick={() => handleDeleteTranslation(t)}
                      >
                        删除
                      </NButton>
                    </NButtonGroup>
                  </NFlex>
                </NCard>
              ))}
            </NSpace>
          ) : (
            <NEmpty description="暂无翻译" />
          )}

          {/* 生成新翻译 */}
          <NCard title="生成新翻译" size="small" class="mt-4">
            <NSpace>
              {SUPPORTED_LANGUAGES.filter(
                (l) => !translations.value.some((t) => t.lang === l.value),
              ).map((lang) => (
                <NButton
                  key={lang.value}
                  onClick={() => handleStreamGenerate(lang.value)}
                  disabled={!!streamingLang.value}
                >
                  生成 {lang.label}
                </NButton>
              ))}
            </NSpace>
          </NCard>
        </NSpin>

        {/* 翻译详情抽屉 */}
        <NDrawer
          show={showDetailDrawer.value}
          onUpdateShow={(v) => {
            showDetailDrawer.value = v
          }}
          width={600}
        >
          <NDrawerContent
            title={`${getLanguageLabel(selectedTranslation.value?.lang || '')} 翻译详情`}
            closable
          >
            {selectedTranslation.value && (
              <NSpace vertical size="large">
                <NDescriptions bordered column={1}>
                  <NDescriptionsItem label="标题">
                    {selectedTranslation.value.title}
                  </NDescriptionsItem>
                  <NDescriptionsItem label="源语言">
                    {getLanguageLabel(selectedTranslation.value.sourceLang)}
                  </NDescriptionsItem>
                  <NDescriptionsItem label="目标语言">
                    {getLanguageLabel(selectedTranslation.value.lang)}
                  </NDescriptionsItem>
                  {selectedTranslation.value.summary && (
                    <NDescriptionsItem label="摘要">
                      {selectedTranslation.value.summary}
                    </NDescriptionsItem>
                  )}
                  {selectedTranslation.value.tags &&
                    selectedTranslation.value.tags.length > 0 && (
                      <NDescriptionsItem label="标签">
                        <NSpace size="small">
                          {selectedTranslation.value.tags.map((tag) => (
                            <NTag key={tag} size="small">
                              {tag}
                            </NTag>
                          ))}
                        </NSpace>
                      </NDescriptionsItem>
                    )}
                  {selectedTranslation.value.aiModel && (
                    <NDescriptionsItem label="AI 模型">
                      {selectedTranslation.value.aiModel}
                    </NDescriptionsItem>
                  )}
                </NDescriptions>

                <NCard title="翻译内容" size="small">
                  <NCode
                    language="markdown"
                    code={selectedTranslation.value.text}
                    wordWrap
                  />
                </NCard>
              </NSpace>
            )}
          </NDrawerContent>
        </NDrawer>
      </NSpace>
    )
  },
})
