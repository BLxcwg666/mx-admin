import { isString } from 'es-toolkit/compat'
import { NFormItem, NInputNumber, useMessage } from 'naive-ui'
import { computed, defineComponent, onMounted, reactive, ref, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { DraftModel } from '~/models/draft'
import type { PageModel } from '~/models/page'
import type { WriteBaseType } from '~/shared/types/base'

import { Icon } from '@vicons/utils'

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
import { UnderlineInput } from '~/components/input/underline-input'
import { ParseContentButton } from '~/components/special-button/parse-content'
import {
  HeaderPreviewButton,
  PreviewSplitter,
} from '~/components/special-button/preview'
import { WEB_URL } from '~/constants/env'
import { useParsePayloadIntoData } from '~/hooks/use-parse-payload'
import { useWriteDraft } from '~/hooks/use-write-draft'
import { ContentLayout } from '~/layouts/content'
import { DraftRefType } from '~/models/draft'
import { RouteName } from '~/router/name'
import { RESTManager } from '~/utils/rest'

type PageReactiveType = WriteBaseType & {
  subtitle: string
  slug: string
  order: number
}

const PageWriteView = defineComponent(() => {
  const route = useRoute()

  const resetReactive: () => PageReactiveType = () => ({
    text: '',
    title: '',
    order: 0,
    slug: '',
    subtitle: '',
    allowComment: true,

    id: undefined,
    images: [],
    meta: undefined,
  })

  const parsePayloadIntoReactiveData = (payload: PageModel) =>
    // biome-ignore lint/correctness/useHookAtTopLevel: <explanation>
    useParsePayloadIntoData(data)(payload)
  const data = reactive<PageReactiveType>(resetReactive())

  const applyDraft = (
    draft: DraftModel,
    _data: PageReactiveType,
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
      if (specific.slug) _data.slug = specific.slug
      if (specific.subtitle) _data.subtitle = specific.subtitle
      if (typeof specific.order === 'number') _data.order = specific.order
    }
  }

  const loadPublished = async (id: string) => {
    const payload = (await RESTManager.api.pages(id).get({})) as any
    parsePayloadIntoReactiveData(payload.data as PageModel)
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
    refType: DraftRefType.Page,
    interval: 10000,
    getData: () => ({
      title: data.title,
      text: data.text,
      images: data.images,
      meta: data.meta,
      typeSpecificData: {
        slug: data.slug,
        subtitle: data.subtitle,
        order: data.order,
      },
    }),
    applyDraft,
    loadPublished,
    draftLabel: '页面',
  })

  const loading = computed(() => !draftInitialized.value)

  onMounted(async () => {
    await initializeDraft()
  })

  const drawerShow = ref(false)

  const message = useMessage()
  const router = useRouter()

  const handleSubmit = async () => {
    const parseDataToPayload = (): { [key in keyof PageModel]?: any } => {
      try {
        if (!data.title || data.title.trim().length == 0) {
          throw '标题为空'
        }
        if (!data.slug) {
          throw '路径为空'
        }
        return {
          ...toRaw(data),
          title: data.title.trim(),
          slug: data.slug.trim(),
        }
      } catch (error) {
        message.error(error as any)

        throw error
      }
    }
    if (routeId.value) {
      // update
      if (!isString(routeId.value)) {
        return
      }
      const $id = routeId.value as string
      await RESTManager.api.pages($id).put({
        data: parseDataToPayload(),
      })
      message.success('修改成功')
    } else {
      // create
      await RESTManager.api.pages.post({
        data: parseDataToPayload(),
      })
      message.success('发布成功')
    }

    // Delete draft after successful publish
    await serverDraft.deleteDraft()
    router.push({ name: RouteName.ListPage, hash: '|publish' })
  }

  return () => (
    <ContentLayout
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
              const { title, slug, subtitle, ...rest } = meta
              data.title = title ?? data.title
              data.slug = slug ?? data.slug
              data.subtitle = subtitle ?? data.subtitle

              data.meta = { ...rest }
            }}
          />

          <HeaderPreviewButton iframe data={data} />

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
          >
            <Icon>
              <SlidersHIcon />
            </Icon>
          </button>
        </>
      }
    >
      <MaterialInput
        class="relative z-10 mt-3"
        label={'与你有个好心情~'}
        value={data.title}
        onChange={(e) => {
          data.title = e
        }}
      />

      <div class={'pt-3 text-gray-700 dark:text-gray-300'}>
        <UnderlineInput
          value={data.subtitle}
          onChange={(e) => void (data.subtitle = e)}
        />
      </div>
      <div class={'py-3 text-gray-500'}>
        <label>{`${WEB_URL}/`}</label>
        <UnderlineInput
          value={data.slug}
          onChange={(e) => void (data.slug = e)}
        />
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
        disabledItem={['date-picker']}
        onUpdateShow={(s) => {
          drawerShow.value = s
        }}
        data={data}
        show={drawerShow.value}
      >
        <NFormItem label="页面顺序">
          <NInputNumber
            placeholder=""
            value={data.order}
            onUpdateValue={(e) => void (data.order = e ?? 0)}
          />
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

export default PageWriteView
