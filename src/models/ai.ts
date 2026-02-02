export interface AISummaryModel {
  id: string
  created: string
  summary: string
  hash: string
  refId: string
  lang: string
}

export interface AITranslationModel {
  id: string
  hash: string
  refId: string
  refType: 'Post' | 'Note'
  lang: string
  sourceLang: string
  title: string
  text: string
  summary?: string
  tags?: string[]
  sourceModified?: string
  aiModel?: string
  aiProvider?: string
  created: string
  updated?: string
}

export interface TranslationGroupedItem {
  refId: string
  refType: 'Post' | 'Note'
  article: {
    title: string
    slug?: string
    nid?: number
  }
  translations: {
    lang: string
    id: string
    updated: string
  }[]
}
