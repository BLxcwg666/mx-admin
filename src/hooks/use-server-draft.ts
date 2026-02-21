import { throttle } from 'es-toolkit/compat'
import { computed, onUnmounted, ref } from 'vue'
import type { DraftModel, DraftRefType, TypeSpecificData } from '~/models/draft'

import { draftsApi } from '~/api/drafts'

export interface DraftData {
  title: string
  text: string
  images?: any[]
  meta?: Record<string, any>
  typeSpecificData: TypeSpecificData
}

export const useServerDraft = (
  refType: DraftRefType,
  options: {
    refId?: string
    draftId?: string
    interval?: number
    getData: () => DraftData
    onDraftCreated?: (draftId: string) => void
    onTitleFallback?: (defaultTitle: string) => void
  },
) => {
  const {
    refId,
    interval = 10000,
    getData,
    onDraftCreated,
    onTitleFallback,
  } = options

  const draftId = ref<string | undefined>(options.draftId)
  const currentRefId = ref<string | undefined>(refId)
  const lastSavedVersion = ref(0)
  const isSaving = ref(false)
  const lastSavedTime = ref<Date | null>(null)
  const hasUnsavedChanges = ref(false)

  let memoPreviousData: DraftData | null = null
  let autoSaveTimer: ReturnType<typeof setInterval> | null = null

  const hasChanges = (current: DraftData): boolean => {
    if (!memoPreviousData) return true
    return (
      current.title !== memoPreviousData.title ||
      current.text !== memoPreviousData.text ||
      JSON.stringify(current.typeSpecificData) !==
        JSON.stringify(memoPreviousData.typeSpecificData)
    )
  }

  const doSave = async () => {
    const data = getData()

    if (!data.text && !data.title) return
    if (!hasChanges(data)) {
      hasUnsavedChanges.value = false
      return
    }

    let title = data.title?.trim()
    if (!title) {
      title = 'Untitled'
      onTitleFallback?.(title)
    }

    isSaving.value = true
    try {
      let response: DraftModel

      const validImages = data.images?.filter((img) => img != null && img.src)

      if (draftId.value) {
        response = await draftsApi.update(draftId.value, {
          title,
          text: data.text,
          images: validImages,
          meta: data.meta,
          typeSpecificData: data.typeSpecificData,
        })
      } else {
        response = await draftsApi.create({
          refType,
          refId: currentRefId.value,
          title,
          text: data.text,
          images: validImages,
          meta: data.meta,
          typeSpecificData: data.typeSpecificData,
        })
        draftId.value = response.id
        onDraftCreated?.(response.id)
      }

      memoPreviousData = { ...data }
      lastSavedVersion.value = response.version
      lastSavedTime.value = new Date()
      hasUnsavedChanges.value = false
    } catch (error) {
      console.error('[Draft] Save failed:', error)
    } finally {
      isSaving.value = false
    }
  }

  const saveDraft = throttle(doSave, 1000)

  const loadDraftById = async (id: string): Promise<DraftModel | null> => {
    try {
      const draft = await draftsApi.getById(id)
      if (draft?.id) {
        draftId.value = draft.id
        lastSavedVersion.value = draft.version
        lastSavedTime.value = new Date(draft.updated)
        memoPreviousData = {
          title: draft.title,
          text: draft.text,
          images: draft.images,
          meta: draft.meta,
          typeSpecificData: draft.typeSpecificData || {},
        }
        if (draft.refId) {
          currentRefId.value = draft.refId
        }
      }
      return draft
    } catch {
      return null
    }
  }

  const loadDraftByRef = async (
    type: DraftRefType,
    id: string,
  ): Promise<DraftModel | null> => {
    currentRefId.value = id
    try {
      const draft = await draftsApi.getByRef(type, id)
      if (draft?.id) {
        draftId.value = draft.id
        lastSavedVersion.value = draft.version
        lastSavedTime.value = new Date(draft.updated)
        memoPreviousData = {
          title: draft.title,
          text: draft.text,
          images: draft.images,
          meta: draft.meta,
          typeSpecificData: draft.typeSpecificData || {},
        }
      }
      return draft
    } catch {
      return null
    }
  }

  const getNewDrafts = async (type: DraftRefType): Promise<DraftModel[]> => {
    try {
      return await draftsApi.getNewDrafts(type)
    } catch {
      return []
    }
  }

  const createDraft = async (
    initialTitle?: string,
  ): Promise<DraftModel | null> => {
    try {
      const response = await draftsApi.create({
        refType,
        refId: currentRefId.value,
        title: initialTitle?.trim() || 'Untitled',
        text: '',
        typeSpecificData: {},
      })
      draftId.value = response.id
      lastSavedVersion.value = response.version
      lastSavedTime.value = new Date(response.updated || response.created)
      return response
    } catch {
      return null
    }
  }

  const deleteDraft = async () => {
    if (!draftId.value) return

    try {
      await draftsApi.delete(draftId.value)
      draftId.value = undefined
      lastSavedVersion.value = 0
      lastSavedTime.value = null
      memoPreviousData = null
    } catch (error) {
      console.error('[Draft] Delete failed:', error)
    }
  }

  const startAutoSave = () => {
    stopAutoSave()
    autoSaveTimer = setInterval(() => {
      const data = getData()
      if (hasChanges(data)) {
        hasUnsavedChanges.value = true
        saveDraft()
      }
    }, interval)
  }

  const stopAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  const saveImmediately = async () => {
    await doSave()
  }

  const setRefId = (id?: string) => {
    currentRefId.value = id
  }

  const setDraftId = (id?: string) => {
    draftId.value = id
  }

  const syncMemory = () => {
    memoPreviousData = getData()
  }

  const checkIsSynced = (): boolean => {
    const data = getData()
    if (!data.text && !data.title && !memoPreviousData) return true
    return !hasChanges(data)
  }

  onUnmounted(() => {
    stopAutoSave()
  })

  return {
    draftId: computed(() => draftId.value),
    refId: computed(() => currentRefId.value),
    isSaving: computed(() => isSaving.value),
    lastSavedTime: computed(() => lastSavedTime.value),
    lastSavedVersion: computed(() => lastSavedVersion.value),
    hasUnsavedChanges: computed(() => hasUnsavedChanges.value),

    saveDraft,
    saveImmediately,
    setRefId,
    setDraftId,
    loadDraftById,
    loadDraftByRef,
    getNewDrafts,
    createDraft,
    deleteDraft,
    startAutoSave,
    stopAutoSave,
    syncMemory,
    checkIsSynced,
  }
}
