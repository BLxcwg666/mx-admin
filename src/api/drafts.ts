import type { Image, PaginateResult } from '~/models/base'
import type {
  DraftHistoryListItem,
  DraftModel,
  DraftRefType,
  TypeSpecificData,
} from '~/models/draft'

import { RESTManager } from '~/utils/rest'

export interface GetDraftsParams {
  page?: number
  size?: number
  refType?: DraftRefType
  hasRef?: boolean
  sortBy?: string
  sortOrder?: 1 | -1
}

export interface CreateDraftData {
  refType: DraftRefType
  refId?: string
  title?: string
  text?: string
  images?: Image[]
  meta?: Record<string, any>
  typeSpecificData?: TypeSpecificData
}

export interface UpdateDraftData extends Partial<CreateDraftData> {}

export const draftsApi = {
  // 获取草稿列表
  getList: (params?: GetDraftsParams) =>
    RESTManager.api.drafts.get<PaginateResult<DraftModel>>({ params }),

  // 获取单个草稿
  getById: (id: string) => RESTManager.api.drafts(id).get<DraftModel>(),

  // 根据引用获取草稿
  getByRef: (refType: DraftRefType, refId: string) =>
    RESTManager.api.drafts('by-ref')(refType)(refId).get<DraftModel | null>(),

  // 获取新草稿列表（无关联的草稿）
  getNewDrafts: (refType: DraftRefType) =>
    RESTManager.api.drafts('by-ref')(refType)('new').get<DraftModel[]>(),

  // 获取历史版本列表
  getHistory: (id: string) =>
    RESTManager.api.drafts(id)('history').get<DraftHistoryListItem[]>(),

  // 获取特定历史版本
  getHistoryVersion: (id: string, version: number) =>
    RESTManager.api.drafts(id)('history')(String(version)).get<DraftModel>(),

  // 创建草稿
  create: (data: CreateDraftData) =>
    RESTManager.api.drafts.post<DraftModel>({ data }),

  // 更新草稿
  update: (id: string, data: UpdateDraftData) =>
    RESTManager.api.drafts(id).put<DraftModel>({ data }),

  // 删除草稿
  delete: (id: string) =>
    RESTManager.api.drafts(id).delete<{ success: boolean }>(),

  // 恢复到特定版本
  restoreVersion: (id: string, version: number) =>
    RESTManager.api.drafts(id)('restore')(String(version)).post<DraftModel>(),
}
