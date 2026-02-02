import { NDataTable, NSkeleton, NTag } from 'naive-ui'
import { defineComponent, onMounted, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { DataTableColumns } from 'naive-ui'

import { Chart } from '@antv/g2/esm'

import { RouteName } from '~/router/name'
import { RESTManager } from '~/utils'

interface CategoryDistribution {
  id: string
  name: string
  slug: string
  count: number
}

interface TagCloud {
  tag: string
  count: number
}

interface PublicationTrend {
  date: string
  posts: number
  notes: number
}

interface TopArticle {
  id: string
  title: string
  slug: string
  reads: number
  likes: number
  category: { name: string; slug: string } | null
}

const SectionTitle = defineComponent((_, { slots }) => () => (
  <div class="my-[12px] font-semibold text-gray-400">{slots.default?.()}</div>
))

export const ContentAnalysis = defineComponent({
  name: 'ContentAnalysis',
  setup() {
    const router = useRouter()
    const loading = ref(true)
    const categoryData = shallowRef<CategoryDistribution[]>([])
    const tagData = shallowRef<TagCloud[]>([])
    const publicationData = shallowRef<PublicationTrend[]>([])
    const topArticles = shallowRef<TopArticle[]>([])

    const categoryChartRef = ref<HTMLDivElement>()
    const publicationChartRef = ref<HTMLDivElement>()
    let categoryChart: Chart | null = null
    let publicationChart: Chart | null = null

    const fetchData = async () => {
      loading.value = true
      try {
        const [categories, tags, publication, articles] = await Promise.all([
          RESTManager.api.aggregate.stat['category-distribution'].get<
            CategoryDistribution[]
          >(),
          RESTManager.api.aggregate.stat['tag-cloud'].get<TagCloud[]>(),
          RESTManager.api.aggregate.stat['publication-trend'].get<
            PublicationTrend[]
          >(),
          RESTManager.api.aggregate.stat['top-articles'].get<TopArticle[]>(),
        ])

        categoryData.value = categories
        tagData.value = tags
        publicationData.value = publication
        topArticles.value = articles
      } catch (error) {
        console.error('Failed to fetch content analysis data:', error)
      } finally {
        loading.value = false
      }
    }

    const renderCategoryChart = () => {
      if (!categoryChartRef.value || categoryData.value.length === 0) return

      if (categoryChart) {
        categoryChart.destroy()
      }

      categoryChart = new Chart({
        container: categoryChartRef.value,
        autoFit: true,
        height: 250,
        padding: [20, 20, 50, 80],
      })

      categoryChart.data(
        categoryData.value.map((item) => ({
          name: item.name,
          count: item.count,
        })),
      )

      categoryChart.coordinate('rect').transpose()

      categoryChart.scale('count', {
        nice: true,
      })

      categoryChart
        .interval()
        .position('name*count')
        .color('name')
        .label('count', {
          position: 'right',
          offset: 4,
        })

      categoryChart.legend(false)
      categoryChart.render()
    }

    const renderPublicationChart = () => {
      if (!publicationChartRef.value || publicationData.value.length === 0)
        return

      if (publicationChart) {
        publicationChart.destroy()
      }

      // Transform data for G2
      const chartData: { date: string; type: string; count: number }[] = []
      publicationData.value.forEach((item) => {
        chartData.push({ date: item.date, type: '文章', count: item.posts })
        chartData.push({ date: item.date, type: '日记', count: item.notes })
      })

      publicationChart = new Chart({
        container: publicationChartRef.value,
        autoFit: true,
        height: 250,
        padding: [30, 20, 50, 40],
      })

      publicationChart.data(chartData)

      publicationChart.tooltip({
        showCrosshairs: true,
        shared: true,
      })

      publicationChart.scale({
        date: {
          range: [0, 1],
        },
        count: {
          min: 0,
          nice: true,
        },
      })

      publicationChart
        .line()
        .position('date*count')
        .color('type')
        .shape('smooth')

      publicationChart
        .point()
        .position('date*count')
        .color('type')
        .shape('circle')

      publicationChart.render()
    }

    onMounted(() => {
      fetchData()
    })

    watch(
      [loading, categoryChartRef, publicationChartRef],
      () => {
        if (!loading.value) {
          requestAnimationFrame(() => {
            renderCategoryChart()
            renderPublicationChart()
          })
        }
      },
      { immediate: true },
    )

    const columns: DataTableColumns<TopArticle> = [
      {
        title: '排名',
        key: 'rank',
        width: 60,
        render: (_, index) => (
          <span
            class={[
              'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
              index < 3
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
            ]}
          >
            {index + 1}
          </span>
        ),
      },
      {
        title: '标题',
        key: 'title',
        ellipsis: { tooltip: true },
        render: (row) => (
          <a
            class="text-primary-500 hover:text-primary-600 cursor-pointer"
            onClick={() =>
              router.push({
                name: RouteName.EditPost,
                query: { id: row.id },
              })
            }
          >
            {row.title}
          </a>
        ),
      },
      {
        title: '分类',
        key: 'category',
        width: 100,
        render: (row) =>
          row.category ? (
            <NTag size="small" type="info">
              {row.category.name}
            </NTag>
          ) : (
            <span class="text-gray-400">-</span>
          ),
      },
      {
        title: '阅读',
        key: 'reads',
        width: 80,
        sorter: (a, b) => a.reads - b.reads,
        render: (row) => row.reads.toLocaleString(),
      },
      {
        title: '点赞',
        key: 'likes',
        width: 80,
        sorter: (a, b) => a.likes - b.likes,
        render: (row) => row.likes.toLocaleString(),
      },
    ]

    const maxTagCount = () => {
      return Math.max(...tagData.value.map((t) => t.count), 1)
    }

    return () => (
      <div class="space-y-6">
        {loading.value ? (
          <div class="space-y-4">
            <NSkeleton animated height={250} />
            <NSkeleton animated height={250} />
          </div>
        ) : (
          <>
            {/* Category Distribution */}
            <div class="phone:grid-cols-1 grid grid-cols-2 gap-6">
              <div>
                <SectionTitle>分类分布</SectionTitle>
                {categoryData.value.length > 0 ? (
                  <div ref={categoryChartRef} />
                ) : (
                  <div class="flex h-[250px] items-center justify-center text-gray-400">
                    暂无数据
                  </div>
                )}
              </div>

              {/* Publication Trend */}
              <div>
                <SectionTitle>发布趋势 (近12个月)</SectionTitle>
                {publicationData.value.length > 0 ? (
                  <div ref={publicationChartRef} />
                ) : (
                  <div class="flex h-[250px] items-center justify-center text-gray-400">
                    暂无数据
                  </div>
                )}
              </div>
            </div>

            {/* Tag Cloud */}
            <div>
              <SectionTitle>热门标签 Top 20</SectionTitle>
              {tagData.value.length > 0 ? (
                <div class="flex flex-wrap gap-2">
                  {tagData.value.map((tag, index) => {
                    const percentage = (tag.count / maxTagCount()) * 100
                    const size =
                      index < 5 ? 'large' : index < 10 ? 'medium' : 'small'
                    return (
                      <NTag
                        key={tag.tag}
                        size={size}
                        round
                        type={index < 3 ? 'primary' : 'default'}
                        bordered={index < 5}
                      >
                        {tag.tag}
                        <span class="ml-1 text-xs opacity-60">
                          ({tag.count})
                        </span>
                      </NTag>
                    )
                  })}
                </div>
              ) : (
                <div class="text-gray-400">暂无标签数据</div>
              )}
            </div>

            {/* Top Articles */}
            <div>
              <SectionTitle>热门文章 Top 10</SectionTitle>
              <NDataTable
                columns={columns}
                data={topArticles.value}
                size="small"
                bordered={false}
                singleLine={false}
              />
            </div>
          </>
        )}
      </div>
    )
  },
})
