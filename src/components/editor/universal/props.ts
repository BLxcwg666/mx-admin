import type { PropType } from 'vue'

export const editorBaseProps = {
  text: {
    type: String,
    required: true,
  },
  onChange: {
    type: Function as PropType<(value: string) => void>,
    required: true,
  },
  /**
   * Callback when Ctrl+S / Cmd+S is pressed
   */
  onSave: {
    type: Function as PropType<() => void>,
    required: false,
  },

  unSaveConfirm: {
    type: Boolean,
    default: true,
  },
} as const
