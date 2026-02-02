import { NSkeleton } from 'naive-ui'
import { defineComponent, onMounted, ref, shallowRef, watch } from 'vue'

import { Chart } from '@antv/g2/esm'

import { RESTManager } from '~/utils'

interface TrafficSource {
  os: { name: string; count: number }[]
  browser: { name: string; count: number }[]
}

interface CommentActivity {
  date: string
  count: number
}

const SectionTitle = defineComponent((_, { slots }) => () => (
  <div class="my-[12px] font-semibold text-gray-400">{slots.default?.()}</div>
))

export const TrafficAnalysis = defineComponent({
  name: 'TrafficAnalysis',
  setup() {
    const loading = ref(true)
    const trafficData = shallowRef<TrafficSource>({ os: [], browser: [] })
    const commentData = shallowRef<CommentActivity[]>([])

    const osChartRef = ref<HTMLDivElement>()
    const browserChartRef = ref<HTMLDivElement>()
    const commentChartRef = ref<HTMLDivElement>()

    let osChart: Chart | null = null
    let browserChart: Chart | null = null
    let commentChart: Chart | null = null

    const fetchData = async () => {
      loading.value = true
      try {
        const [traffic, comments] = await Promise.all([
          RESTManager.api.aggregate.stat['traffic-source'].get<TrafficSource>(),
          RESTManager.api.aggregate.stat['comment-activity'].get<
            CommentActivity[]
          >(),
        ])

        trafficData.value = traffic
        commentData.value = comments
      } catch (error) {
        console.error('Failed to fetch traffic analysis data:', error)
      } finally {
        loading.value = false
      }
    }

    const renderOsChart = () => {
      if (!osChartRef.value || trafficData.value.os.length === 0) return

      if (osChart) {
        osChart.destroy()
      }

      const total = trafficData.value.os.reduce(
        (sum, item) => sum + item.count,
        0,
      )
      const data = trafficData.value.os.map((item) => ({
        name: item.name || '未知',
        count: item.count,
        percent: item.count / total,
      }))

      osChart = new Chart({
        container: osChartRef.value,
        autoFit: true,
        height: 250,
      })

      osChart.coordinate('theta', { radius: 0.75 })
      osChart.data(data)

      osChart.tooltip({
        showTitle: false,
        showMarkers: false,
      })

      osChart.legend(false)

      osChart
        .interval()
        .position('count')
        .color('name')
        .label('percent', {
          content: (row) => `${row.name}: ${(row.percent * 100).toFixed(1)}%`,
        })
        .adjust('stack')

      osChart.render()
    }

    const renderBrowserChart = () => {
      if (!browserChartRef.value || trafficData.value.browser.length === 0)
        return

      if (browserChart) {
        browserChart.destroy()
      }

      const total = trafficData.value.browser.reduce(
        (sum, item) => sum + item.count,
        0,
      )
      const data = trafficData.value.browser.map((item) => ({
        name: item.name || '未知',
        count: item.count,
        percent: item.count / total,
      }))

      browserChart = new Chart({
        container: browserChartRef.value,
        autoFit: true,
        height: 250,
      })

      browserChart.coordinate('theta', { radius: 0.75 })
      browserChart.data(data)

      browserChart.tooltip({
        showTitle: false,
        showMarkers: false,
      })

      browserChart.legend(false)

      browserChart
        .interval()
        .position('count')
        .color('name')
        .label('percent', {
          content: (row) => `${row.name}: ${(row.percent * 100).toFixed(1)}%`,
        })
        .adjust('stack')

      browserChart.render()
    }

    const renderCommentChart = () => {
      if (!commentChartRef.value || commentData.value.length === 0) return

      if (commentChart) {
        commentChart.destroy()
      }

      commentChart = new Chart({
        container: commentChartRef.value,
        autoFit: true,
        height: 250,
        padding: [30, 20, 50, 40],
      })

      commentChart.data(
        commentData.value.map((item) => ({
          date: item.date.slice(5), // MM-DD
          count: item.count,
        })),
      )

      commentChart.tooltip({
        showCrosshairs: true,
        shared: true,
      })

      commentChart.scale({
        date: { range: [0, 1] },
        count: { min: 0, nice: true },
      })

      commentChart
        .area()
        .position('date*count')
        .color('#8884d8')
        .shape('smooth')
        .style({ fillOpacity: 0.25 })

      commentChart
        .line()
        .position('date*count')
        .color('#8884d8')
        .shape('smooth')

      commentChart
        .point()
        .position('date*count')
        .color('#8884d8')
        .shape('circle')

      commentChart.render()
    }

    onMounted(() => {
      fetchData()
    })

    watch(
      [loading, osChartRef, browserChartRef, commentChartRef],
      () => {
        if (!loading.value) {
          requestAnimationFrame(() => {
            renderOsChart()
            renderBrowserChart()
            renderCommentChart()
          })
        }
      },
      { immediate: true },
    )

    return () => (
      <div class="space-y-6">
        {loading.value ? (
          <div class="space-y-4">
            <NSkeleton animated height={250} />
            <NSkeleton animated height={250} />
          </div>
        ) : (
          <>
            <div class="phone:grid-cols-1 grid grid-cols-2 gap-6">
              {/* OS Distribution */}
              <div>
                <SectionTitle>操作系统分布 (近7天)</SectionTitle>
                {trafficData.value.os.length > 0 ? (
                  <div ref={osChartRef} />
                ) : (
                  <div class="flex h-[250px] items-center justify-center text-gray-400">
                    暂无数据
                  </div>
                )}
              </div>

              {/* Browser Distribution */}
              <div>
                <SectionTitle>浏览器分布 (近7天)</SectionTitle>
                {trafficData.value.browser.length > 0 ? (
                  <div ref={browserChartRef} />
                ) : (
                  <div class="flex h-[250px] items-center justify-center text-gray-400">
                    暂无数据
                  </div>
                )}
              </div>
            </div>

            {/* Comment Activity */}
            <div>
              <SectionTitle>评论活跃度 (近30天)</SectionTitle>
              {commentData.value.length > 0 ? (
                <div ref={commentChartRef} />
              ) : (
                <div class="flex h-[250px] items-center justify-center text-gray-400">
                  暂无评论数据
                </div>
              )}
            </div>

            {/* Summary Stats */}
            {trafficData.value.os.length > 0 && (
              <div class="phone:grid-cols-1 grid grid-cols-2 gap-6">
                <div>
                  <SectionTitle>操作系统详情</SectionTitle>
                  <div class="space-y-2">
                    {trafficData.value.os.map((item) => {
                      const total = trafficData.value.os.reduce(
                        (s, i) => s + i.count,
                        0,
                      )
                      const percentage = Math.round((item.count / total) * 100)
                      return (
                        <div
                          key={item.name}
                          class="flex items-center gap-3 text-sm"
                        >
                          <span class="w-24 flex-shrink-0 truncate text-gray-600 dark:text-gray-400">
                            {item.name || '未知'}
                          </span>
                          <div class="min-w-0 flex-1">
                            <div class="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                              <div
                                class="bg-primary-400 h-full rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <span class="w-12 flex-shrink-0 text-right text-gray-500">
                            {percentage}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <SectionTitle>浏览器详情</SectionTitle>
                  <div class="space-y-2">
                    {trafficData.value.browser.map((item) => {
                      const total = trafficData.value.browser.reduce(
                        (s, i) => s + i.count,
                        0,
                      )
                      const percentage = Math.round((item.count / total) * 100)
                      return (
                        <div
                          key={item.name}
                          class="flex items-center gap-3 text-sm"
                        >
                          <span class="w-24 flex-shrink-0 truncate text-gray-600 dark:text-gray-400">
                            {item.name || '未知'}
                          </span>
                          <div class="min-w-0 flex-1">
                            <div class="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                              <div
                                class="h-full rounded-full bg-blue-400 transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <span class="w-12 flex-shrink-0 text-right text-gray-500">
                            {percentage}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )
  },
})
