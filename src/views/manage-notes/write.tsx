import { add } from 'date-fns'
import { isString } from 'es-toolkit/compat'
import {
  NButton,
  NButtonGroup,
  NDatePicker,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NSwitch,
  useMessage,
} from 'naive-ui'
import {
  computed,
  defineComponent,
  onBeforeMount,
  onMounted,
  reactive,
  ref,
  toRaw,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { PaginateResult } from '@mx-space/api-client'
import type { DraftModel } from '~/models/draft'
import type { Coordinate, NoteModel } from '~/models/note'
import type { TopicModel } from '~/models/topic'
import type { WriteBaseType } from '~/shared/types/base'

import { Icon } from '@vicons/utils'

import { AiHelperButton } from '~/components/ai/ai-helper'
import { HeaderActionButton } from '~/components/button/rounded-button'
import {
  DraftListModal,
  DraftRecoveryModal,
  DraftSaveIndicator,
} from '~/components/draft'
import { TextBaseDrawer } from '~/components/drawer/text-base-drawer'
import { Editor } from '~/components/editor/universal'
import { SlidersHIcon, TelegramPlaneIcon } from '~/components/icons'
import { MaterialInput } from '~/components/input/material-input'
import { GetLocationButton } from '~/components/location/get-location-button'
import { SearchLocationButton } from '~/components/location/search-button'
import { CopyTextButton } from '~/components/special-button/copy-text-button'
import { ParseContentButton } from '~/components/special-button/parse-content'
import {
  HeaderPreviewButton,
  PreviewSplitter,
} from '~/components/special-button/preview'
import { WEB_URL } from '~/constants/env'
import { MOOD_SET, WEATHER_SET } from '~/constants/note'
import { useParsePayloadIntoData } from '~/hooks/use-parse-payload'
import { useWriteDraft } from '~/hooks/use-write-draft'
import { ContentLayout } from '~/layouts/content'
import { DraftRefType } from '~/models/draft'
import { RouteName } from '~/router/name'
import { RESTManager } from '~/utils/rest'
import { getDayOfYear } from '~/utils/time'

const CrossBellConnectorIndirector = defineAsyncComponent({
  loader: () =>
    import('~/components/xlog-connect').then(
      (mo) => mo.CrossBellConnectorIndirector,
    ),
  suspensible: true,
})

type NoteReactiveType = {
  mood: string
  weather: string
  password: string | null
  publicAt: Date | null
  bookmark: boolean
  isPublished: boolean

  location: null | string
  coordinates: null | Coordinate
  topicId: string | null | undefined
} & WriteBaseType

const useNoteTopic = () => {
  const topics = ref([] as TopicModel[])

  const fetchTopic = async () => {
    const { data } = await RESTManager.api.topics.get<
      PaginateResult<TopicModel>
    >({
      params: {
        // TODO
        size: 50,
      },
    })

    topics.value = data
  }

  return {
    topics,
    fetchTopic,
  }
}

const NoteWriteView = defineComponent(() => {
  const route = useRoute()

  const defaultTitle = ref('写点什么呢')

  onBeforeMount(() => {
    const $id = route.query.id
    if ($id) {
      return
    }
    const currentTime = new Date()
    defaultTitle.value = `记录 ${currentTime.getFullYear()} 年第 ${getDayOfYear(
      currentTime,
    )} 天`
  })

  const resetReactive: () => NoteReactiveType = () => ({
    text: '',
    title: '',
    bookmark: false,
    mood: '',

    password: null,
    publicAt: null,
    weather: '',
    location: '',
    coordinates: null,
    allowComment: true,
    isPublished: true,

    id: undefined,
    nid: undefined,
    topicId: undefined,
    images: [],
    meta: undefined,
    created: undefined,
  })

  const parsePayloadIntoReactiveData = (payload: NoteModel) =>
    // biome-ignore lint/correctness/useHookAtTopLevel: <explanation>
    useParsePayloadIntoData(data)(payload)
  const data = reactive<NoteReactiveType>(resetReactive())
  const nid = ref<number>()

  const applyDraft = (
    draft: DraftModel,
    _data: NoteReactiveType,
    isPartial?: boolean,
  ) => {
    if (!isPartial) {
      _data.id = draft.refId
    }
    _data.title = draft.title
    _data.text = draft.text
    if (draft.images) {
      _data.images = draft.images
    }
    if (draft.meta) {
      _data.meta = draft.meta
    }
    if (draft.typeSpecificData) {
      const specific = draft.typeSpecificData as any
      if (specific.mood) _data.mood = specific.mood
      if (specific.weather) _data.weather = specific.weather
      if (typeof specific.password === 'string' || specific.password === null)
        _data.password = specific.password
      if (specific.publicAt) _data.publicAt = new Date(specific.publicAt)
      if (typeof specific.bookmark === 'boolean')
        _data.bookmark = specific.bookmark
      if (specific.location) _data.location = specific.location
      if (specific.coordinates) _data.coordinates = specific.coordinates
      if (specific.topicId !== undefined) _data.topicId = specific.topicId
    }
  }

  const loadPublished = async (id: string) => {
    const payload = (await RESTManager.api.notes(id).get({
      params: { single: true },
    })) as any

    const noteData = payload.data

    if (noteData.topic) {
      topics.value.push(noteData.topic)
    }

    nid.value = noteData.nid
    noteData.secret = noteData.secret ? new Date(noteData.secret) : null

    const created = new Date(noteData.created)
    defaultTitle.value = `记录 ${created.getFullYear()} 年第 ${getDayOfYear(
      created,
    )} 天`

    parsePayloadIntoReactiveData(noteData as NoteModel)
  }

  const {
    id: routeId,
    draftInitialized,
    serverDraft,
    isEditing,
    initialize: initializeDraft,
    recoveryModal,
    listModal,
  } = useWriteDraft(data, {
    refType: DraftRefType.Note,
    interval: 10000,
    getData: () => ({
      title: data.title,
      text: data.text,
      images: data.images,
      meta: data.meta,
      typeSpecificData: {
        mood: data.mood,
        weather: data.weather,
        password: data.password,
        publicAt: data.publicAt ? data.publicAt.toISOString() : null,
        bookmark: data.bookmark,
        location: data.location,
        coordinates: data.coordinates,
        topicId: data.topicId,
      },
    }),
    applyDraft,
    loadPublished,
    draftLabel: '日记',
    onTitleFallback: (title) => {
      defaultTitle.value = title
    },
  })

  const loading = computed(() => !draftInitialized.value)

  const { fetchTopic, topics } = useNoteTopic()

  onMounted(async () => {
    await initializeDraft()
  })

  const drawerShow = ref(false)

  const message = useMessage()
  const router = useRouter()

  const enablePassword = computed(() => typeof data.password === 'string')

  const handleSubmit = async () => {
    const parseDataToPayload = (): { [key in keyof NoteModel]?: any } => {
      return {
        ...toRaw(data),
        title:
          data.title && data.title.trim()
            ? data.title.trim()
            : defaultTitle.value,
        password:
          data.password && data.password.length > 0 ? data.password : null,
        publicAt: data.publicAt
          ? (() => {
              const date = new Date(data.publicAt)
              if (+date - Date.now() <= 0) {
                return null
              } else {
                return date
              }
            })()
          : null,
      }
    }

    const { CrossBellConnector } = await import(
      '~/components/xlog-connect/class'
    )

    if (routeId.value) {
      // update
      if (!isString(routeId.value)) {
        return
      }
      const $id = routeId.value as string
      const response = await RESTManager.api.notes($id).put<NoteModel>({
        data: parseDataToPayload(),
      })
      message.success('修改成功')

      await CrossBellConnector.createOrUpdate(response)
    } else {
      const payload = parseDataToPayload()
      // create
      const response = await RESTManager.api.notes.post<NoteModel>({
        data: payload,
      })
      message.success('发布成功')

      await CrossBellConnector.createOrUpdate(response)
    }

    // Delete draft after successful publish
    await serverDraft.deleteDraft()
    await router.push({ name: RouteName.ViewNote, hash: '|publish' })
  }

  return () => (
    <ContentLayout
      title={'记录生活点滴'}
      headerClass="pt-1"
      actionsElement={
        <>
          <DraftSaveIndicator
            isSaving={serverDraft.isSaving}
            lastSavedTime={serverDraft.lastSavedTime}
          />

          <ParseContentButton
            data={data}
            onHandleYamlParsedMeta={(meta) => {
              const { title, mood, weather, ...rest } = meta
              data.title = title ?? data.title
              data.mood = mood ?? data.mood
              data.weather = weather ?? data.weather

              data.meta = { ...rest }
            }}
          />

          <HeaderPreviewButton data={data} iframe />

          <HeaderActionButton
            icon={<TelegramPlaneIcon />}
            onClick={handleSubmit}
          />
        </>
      }
      footerButtonElement={
        <>
          <button
            onClick={() => {
              drawerShow.value = true
            }}
            title="打开设置"
          >
            <Icon>
              <SlidersHIcon />
            </Icon>
          </button>
        </>
      }
    >
      <CrossBellConnectorIndirector />
      <div class={'relative'}>
        <MaterialInput
          class="relative z-10 mt-3"
          label={defaultTitle.value}
          value={data.title}
          onChange={(e) => {
            data.title = e
          }}
        />

        {data.text.length > 0 && (
          <div class={'absolute bottom-0 right-0 top-0 z-10 flex items-center'}>
            <AiHelperButton reactiveData={data} />
          </div>
        )}
      </div>

      <div class={'py-3 text-gray-500'}>
        <label>{`${WEB_URL}/notes/${nid.value ?? ''}`}</label>
        {nid.value && (
          <CopyTextButton text={`${WEB_URL}/notes/${nid.value ?? ''}`} />
        )}
      </div>

      <PreviewSplitter>
        <Editor
          key={data.id}
          loading={loading.value}
          onChange={(v) => {
            data.text = v
          }}
          onSave={handleSubmit}
          text={data.text}
        />
      </PreviewSplitter>

      {/* Drawer  */}
      <TextBaseDrawer
        data={data}
        show={drawerShow.value}
        onUpdateShow={(s) => {
          drawerShow.value = s
        }}
      >
        <NFormItem label="心情" required>
          <NSelect
            clearable
            value={data.mood}
            filterable
            tag
            options={MOOD_SET.map((i) => ({ label: i, value: i }))}
            onUpdateValue={(e) => void (data.mood = e)}
          />
        </NFormItem>
        <NFormItem label="天气" required>
          <NSelect
            clearable
            value={data.weather}
            filterable
            tag
            options={WEATHER_SET.map((i) => ({ label: i, value: i }))}
            onUpdateValue={(e) => void (data.weather = e)}
          />
        </NFormItem>

        <NFormItem label="专栏">
          <NSelect
            options={topics.value.map((topic) => ({
              label: topic.name,
              value: topic.id!,
              key: topic.id,
            }))}
            value={data.topicId}
            onUpdateValue={(value) => {
              data.topicId = value
            }}
            onFocus={() => {
              fetchTopic()
            }}
          />
        </NFormItem>

        <NFormItem label="获取当前地址" labelPlacement="left">
          <NSpace vertical>
            <NButtonGroup>
              <GetLocationButton
                onChange={(amap, coordinates) => {
                  data.location = amap.formattedAddress
                  data.coordinates = {
                    longitude: coordinates[0],
                    latitude: coordinates[1],
                  }
                }}
              />
              <SearchLocationButton
                placeholder={data.location}
                onChange={(locationName, coo) => {
                  data.location = locationName
                  data.coordinates = coo
                }}
              />

              <NButton
                round
                disabled={!data.location}
                onClick={() => {
                  data.location = ''
                  data.coordinates = null
                }}
              >
                清除
              </NButton>
            </NButtonGroup>

            <NSpace vertical>
              <span>{data.location}</span>
              {data.coordinates && (
                <span>
                  {data.coordinates.longitude}, {data.coordinates.latitude}
                </span>
              )}
            </NSpace>
          </NSpace>
        </NFormItem>

        <NFormItem label="设定密码?" labelAlign="right" labelPlacement="left">
          <NSwitch
            value={enablePassword.value}
            onUpdateValue={(e) => {
              if (e) {
                data.password = ''
              } else {
                data.password = null
              }
            }}
          />
        </NFormItem>
        {enablePassword.value && (
          <NFormItem label="输入密码">
            <NInput
              disabled={!enablePassword.value}
              placeholder=""
              type="password"
              value={data.password}
              inputProps={{
                name: 'note-password',
                autocapitalize: 'off',
                autocomplete: 'new-password',
              }}
              onInput={(e) => void (data.password = e)}
            />
          </NFormItem>
        )}
        <NFormItem label="公开时间" labelAlign="right" labelPlacement="left">
          <NDatePicker
            type="datetime"
            isDateDisabled={(ts: number) => +new Date(ts) - Date.now() < 0}
            placeholder="选择时间"
            clearable
            value={data.publicAt ? +new Date(data.publicAt) : undefined}
            onUpdateValue={(e) => {
              data.publicAt = e ? new Date(e) : null
            }}
          >
            {{
              footer: () => {
                const date = new Date()
                return (
                  <NSpace>
                    <NButton
                      round
                      type="default"
                      size="small"
                      onClick={() => {
                        data.publicAt = add(date, { days: 1 })
                      }}
                    >
                      一天后
                    </NButton>
                    <NButton
                      round
                      type="default"
                      size="small"
                      onClick={() => {
                        data.publicAt = add(date, { weeks: 1 })
                      }}
                    >
                      一周后
                    </NButton>
                    <NButton
                      round
                      type="default"
                      size="small"
                      onClick={() => {
                        data.publicAt = add(date, { days: 14 })
                      }}
                    >
                      半个月后
                    </NButton>
                    <NButton
                      round
                      type="default"
                      size="small"
                      onClick={() => {
                        data.publicAt = add(date, { months: 1 })
                      }}
                    >
                      一个月后
                    </NButton>
                  </NSpace>
                )
              },
            }}
          </NDatePicker>
        </NFormItem>

        <NFormItem
          label="标记为回忆项"
          labelAlign="right"
          labelPlacement="left"
        >
          <NSwitch
            value={data.bookmark}
            onUpdateValue={(e) => void (data.bookmark = e)}
          />
        </NFormItem>
        <NFormItem label="发布状态" labelAlign="right" labelPlacement="left">
          <NSwitch
            value={data.isPublished}
            onUpdateValue={(e) => void (data.isPublished = e)}
          >
            {{
              checked: () => '已发布',
              unchecked: () => '草稿',
            }}
          </NSwitch>
        </NFormItem>
      </TextBaseDrawer>

      {/* Draft Modals */}
      {recoveryModal.draft.value && recoveryModal.publishedContent.value && (
        <DraftRecoveryModal
          show={recoveryModal.show.value}
          draft={recoveryModal.draft.value}
          publishedContent={recoveryModal.publishedContent.value}
          onClose={recoveryModal.onClose}
          onRecover={recoveryModal.onRecover}
        />
      )}

      <DraftListModal
        show={listModal.show.value}
        drafts={listModal.drafts.value}
        draftLabel={listModal.draftLabel}
        onClose={listModal.onClose}
        onSelect={listModal.onSelect}
        onCreate={listModal.onCreate}
      />
    </ContentLayout>
  )
})

export default NoteWriteView
