import { computed, ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { PublishedContent } from '~/components/draft/draft-recovery-modal'
import type { DraftModel, DraftRefType } from '~/models/draft'
import type { DraftData } from './use-server-draft'

import { useServerDraft } from './use-server-draft'

export interface UseWriteDraftOptions<T> {
  refType: DraftRefType
  interval?: number
  getData: () => DraftData
  applyDraft: (draft: DraftModel, data: T, isPartial?: boolean) => void
  loadPublished: (id: string) => Promise<void>
  draftLabel?: string
  onTitleFallback?: (defaultTitle: string) => void
}

export function useWriteDraft<T>(data: T, options: UseWriteDraftOptions<T>) {
  const {
    refType,
    interval = 10000,
    getData,
    applyDraft,
    loadPublished,
    draftLabel = '内容',
    onTitleFallback,
  } = options

  const route = useRoute()
  const router = useRouter()

  const id = computed(() => route.query.id as string | undefined)
  const draftIdFromRoute = computed(
    () => route.query.draftId as string | undefined,
  )

  const draftInitialized = ref(false)

  const showRecoveryModal = ref(false)
  const recoveryModalDraft = shallowRef<DraftModel | null>(null)
  const recoveryModalPublishedContent = shallowRef<PublishedContent | null>(
    null,
  )

  const showListModal = ref(false)
  const listModalDrafts = shallowRef<DraftModel[]>([])

  const serverDraft = useServerDraft(refType, {
    refId: id.value,
    draftId: draftIdFromRoute.value,
    interval,
    getData,
    onDraftCreated: (draftId) => {
      router.replace({ query: { ...route.query, draftId } })
    },
    onTitleFallback,
  })

  const isEditing = computed(() => !!(serverDraft.refId.value || id.value))
  const actualRefId = computed(() => serverDraft.refId.value || id.value)

  const handleRecoveryModalRecover = (
    version: number | 'published',
    versionData?: DraftModel,
  ) => {
    if (version === 'published') {
      serverDraft.syncMemory()
      serverDraft.startAutoSave()
    } else if (versionData) {
      applyDraft(versionData, data, true)
      serverDraft.syncMemory()
      serverDraft.startAutoSave()
    }
  }

  const handleRecoveryModalClose = () => {
    showRecoveryModal.value = false
    serverDraft.syncMemory()
    serverDraft.startAutoSave()
  }

  const handleListModalSelect = async (draftId: string) => {
    const draft = await serverDraft.loadDraftById(draftId)
    if (draft) {
      applyDraft(draft, data, false)
      serverDraft.syncMemory()
      serverDraft.startAutoSave()
    }
    router.replace({ query: { ...route.query, draftId } })
  }

  const handleListModalCreate = () => {
    serverDraft.startAutoSave()
  }

  const handleListModalClose = () => {
    showListModal.value = false
    serverDraft.startAutoSave()
  }

  const initialize = async (onBeforeLoadPublished?: () => void) => {
    const $id = id.value
    const $draftId = draftIdFromRoute.value

    // Scene 1: Load draft via draftId
    if ($draftId) {
      const draft = await serverDraft.loadDraftById($draftId)
      if (draft) {
        applyDraft(draft, data, false)
        serverDraft.syncMemory()
        serverDraft.startAutoSave()
        draftInitialized.value = true
        return
      }
    }

    // Scene 2: Edit published content
    if ($id && typeof $id === 'string') {
      onBeforeLoadPublished?.()
      await loadPublished($id)

      const currentData = getData()
      const publishedContent: PublishedContent = {
        title: currentData.title,
        text: currentData.text,
        updated: new Date().toISOString(),
      }

      const relatedDraft = await serverDraft.loadDraftByRef(refType, $id)
      if (relatedDraft) {
        recoveryModalDraft.value = relatedDraft
        recoveryModalPublishedContent.value = publishedContent
        showRecoveryModal.value = true
      } else {
        serverDraft.syncMemory()
        serverDraft.startAutoSave()
      }

      draftInitialized.value = true
      return
    }

    // Scene 3: New entry
    const pendingDrafts = await serverDraft.getNewDrafts(refType)
    if (pendingDrafts.length > 0) {
      listModalDrafts.value = pendingDrafts
      showListModal.value = true
    } else {
      serverDraft.startAutoSave()
    }

    draftInitialized.value = true
  }

  return {
    id,
    draftIdFromRoute,
    draftInitialized,
    serverDraft,
    isEditing,
    actualRefId,
    initialize,

    recoveryModal: {
      show: showRecoveryModal,
      draft: recoveryModalDraft,
      publishedContent: recoveryModalPublishedContent,
      onClose: handleRecoveryModalClose,
      onRecover: handleRecoveryModalRecover,
    },

    listModal: {
      show: showListModal,
      drafts: listModalDrafts,
      draftLabel,
      onClose: handleListModalClose,
      onSelect: handleListModalSelect,
      onCreate: handleListModalCreate,
    },
  }
}
