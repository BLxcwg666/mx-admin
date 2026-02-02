import type { EditorView } from '@codemirror/view'
import type { Component, FunctionalComponent } from 'vue'

import { commands, setHeadingLevel } from '../toolbar/markdown-commands'

export interface SlashMenuItem {
  id: string
  label: string
  description?: string
  icon?: Component | FunctionalComponent
  keywords?: string[]
  command: (view: EditorView) => boolean
}

export interface SlashMenuGroup {
  id: string
  label: string
  items: SlashMenuItem[]
}

// Simple icon components
const Heading1Icon: FunctionalComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M4 12h8M4 6v12M12 6v12M17 12l3-2v8" />
  </svg>
)

const Heading2Icon: FunctionalComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M4 12h8M4 6v12M12 6v12M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
  </svg>
)

const Heading3Icon: FunctionalComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M4 12h8M4 6v12M12 6v12M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2" />
  </svg>
)

const BoldIcon: FunctionalComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6zM6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
  </svg>
)

const ItalicIcon: FunctionalComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <line x1="19" y1="4" x2="10" y2="4" />
    <line x1="14" y1="20" x2="5" y2="20" />
    <line x1="15" y1="4" x2="9" y2="20" />
  </svg>
)

const StrikethroughIcon: FunctionalComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M16 4H9a3 3 0 0 0-2.83 4M14 12a4 4 0 0 1 0 8H6" />
    <line x1="4" y1="12" x2="20" y2="12" />
  </svg>
)

const CodeIcon: FunctionalComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
)

const CodeBlockIcon: FunctionalComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
    <line x1="12" y1="2" x2="12" y2="22" stroke-dasharray="2 2" />
  </svg>
)

const ListIcon: FunctionalComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)

const ListOrderedIcon: FunctionalComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <line x1="10" y1="6" x2="21" y2="6" />
    <line x1="10" y1="12" x2="21" y2="12" />
    <line x1="10" y1="18" x2="21" y2="18" />
    <path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
  </svg>
)

const TaskListIcon: FunctionalComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <rect x="3" y="5" width="6" height="6" rx="1" />
    <path d="m3 17 2 2 4-4" />
    <path d="M13 6h8M13 12h8M13 18h8" />
  </svg>
)

const QuoteIcon: FunctionalComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21" />
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v4" />
  </svg>
)

const DividerIcon: FunctionalComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const LinkIcon: FunctionalComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

const ImageIcon: FunctionalComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

const TableIcon: FunctionalComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
)

const MathIcon: FunctionalComponent = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M4 4l5 16M7 4h4M4 20h4" />
    <line x1="14" y1="12" x2="22" y2="12" />
    <line x1="18" y1="8" x2="18" y2="16" />
  </svg>
)

const insertImage = (view: EditorView): boolean => {
  const { state } = view
  const { from, to } = state.selection.main
  const selectedText = state.sliceDoc(from, to)
  const alt = selectedText || '图片描述'
  const insert = `![${alt}](https://)`

  view.dispatch({
    changes: { from, to, insert },
    selection: { anchor: from + insert.length - 1 },
  })

  view.focus()
  return true
}

const insertTable = (view: EditorView): boolean => {
  const { state } = view
  const { from } = state.selection.main
  const line = state.doc.lineAt(from)
  const insertPos = line.to
  const needsNewline = line.text.length > 0
  const insert = `${needsNewline ? '\n' : ''}| 列1 | 列2 |\n| --- | --- |\n| 内容1 | 内容2 |\n`
  const cursorOffset = insert.indexOf('列1')

  view.dispatch({
    changes: { from: insertPos, to: insertPos, insert },
    selection: { anchor: insertPos + cursorOffset },
  })

  view.focus()
  return true
}

const insertMathBlock = (view: EditorView): boolean => {
  const { state } = view
  const { from } = state.selection.main
  const line = state.doc.lineAt(from)
  const insertPos = line.to
  const needsNewline = line.text.length > 0
  const insert = `${needsNewline ? '\n' : ''}$$\nE = mc^2\n$$\n`
  const cursorOffset = insert.indexOf('E = mc^2')

  view.dispatch({
    changes: { from: insertPos, to: insertPos, insert },
    selection: { anchor: insertPos + cursorOffset },
  })

  view.focus()
  return true
}

export const slashMenuGroups: SlashMenuGroup[] = [
  {
    id: 'heading',
    label: '标题',
    items: [
      {
        id: 'heading-1',
        label: '标题 1',
        description: '大标题',
        icon: Heading1Icon,
        keywords: ['h1', '一级标题'],
        command: (view) => setHeadingLevel(view, 1),
      },
      {
        id: 'heading-2',
        label: '标题 2',
        description: '中标题',
        icon: Heading2Icon,
        keywords: ['h2', '二级标题'],
        command: (view) => setHeadingLevel(view, 2),
      },
      {
        id: 'heading-3',
        label: '标题 3',
        description: '小标题',
        icon: Heading3Icon,
        keywords: ['h3', '三级标题'],
        command: (view) => setHeadingLevel(view, 3),
      },
    ],
  },
  {
    id: 'text',
    label: '文本格式',
    items: [
      {
        id: 'bold',
        label: '粗体',
        description: '加粗文字',
        icon: BoldIcon,
        keywords: ['bold', 'strong'],
        command: commands.bold,
      },
      {
        id: 'italic',
        label: '斜体',
        description: '倾斜文字',
        icon: ItalicIcon,
        keywords: ['italic', 'em'],
        command: commands.italic,
      },
      {
        id: 'strikethrough',
        label: '删除线',
        description: '划掉文字',
        icon: StrikethroughIcon,
        keywords: ['delete', 'strike'],
        command: commands.strikethrough,
      },
      {
        id: 'inline-code',
        label: '行内代码',
        description: '内联代码片段',
        icon: CodeIcon,
        keywords: ['code', 'inline'],
        command: commands.inlineCode,
      },
    ],
  },
  {
    id: 'list',
    label: '列表',
    items: [
      {
        id: 'bullet-list',
        label: '无序列表',
        description: '项目符号列表',
        icon: ListIcon,
        keywords: ['ul', 'bullet'],
        command: commands.bulletList,
      },
      {
        id: 'ordered-list',
        label: '有序列表',
        description: '编号列表',
        icon: ListOrderedIcon,
        keywords: ['ol', 'number'],
        command: commands.orderedList,
      },
      {
        id: 'task-list',
        label: '任务列表',
        description: '待办事项',
        icon: TaskListIcon,
        keywords: ['todo', 'task'],
        command: commands.taskList,
      },
    ],
  },
  {
    id: 'block',
    label: '块元素',
    items: [
      {
        id: 'code-block',
        label: '代码块',
        description: '多行代码',
        icon: CodeBlockIcon,
        keywords: ['code', 'block'],
        command: commands.codeBlock,
      },
      {
        id: 'quote',
        label: '引用',
        description: '引用文本',
        icon: QuoteIcon,
        keywords: ['blockquote', 'quote'],
        command: commands.quote,
      },
      {
        id: 'divider',
        label: '分隔线',
        description: '水平分隔',
        icon: DividerIcon,
        keywords: ['hr', 'divider'],
        command: commands.horizontalRule,
      },
    ],
  },
  {
    id: 'media',
    label: '媒体与嵌入',
    items: [
      {
        id: 'link',
        label: '链接',
        description: '添加超链接',
        icon: LinkIcon,
        keywords: ['link', 'url'],
        command: commands.link,
      },
      {
        id: 'image',
        label: '图片',
        description: '插入图片',
        icon: ImageIcon,
        keywords: ['image', 'img'],
        command: insertImage,
      },
      {
        id: 'table',
        label: '表格',
        description: '插入表格',
        icon: TableIcon,
        keywords: ['table', 'grid'],
        command: insertTable,
      },
      {
        id: 'math',
        label: '数学公式',
        description: 'LaTeX 公式',
        icon: MathIcon,
        keywords: ['math', 'formula', 'latex'],
        command: insertMathBlock,
      },
    ],
  },
]

export interface SlashMenuItemWithGroup extends SlashMenuItem {
  groupId: string
  groupLabel: string
}

export const slashMenuItems: SlashMenuItemWithGroup[] = slashMenuGroups.flatMap(
  (group) =>
    group.items.map((item) => ({
      ...item,
      groupId: group.id,
      groupLabel: group.label,
    })),
)
