import {
  NCheckbox,
  NCheckboxGroup,
  NDynamicTags,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
} from 'naive-ui'
import { defineComponent, onMounted, ref } from 'vue'
import type { MetaPresetField } from '~/models/meta-preset'
import type { PropType } from 'vue'

import { RESTManager } from '~/utils'

export const MetaPresetRenderer = defineComponent({
  name: 'MetaPresetRenderer',
  props: {
    meta: {
      type: Object as PropType<Record<string, any>>,
      required: true,
    },
    scope: {
      type: String as PropType<'post' | 'note'>,
      required: false,
    },
    onUpdateMeta: {
      type: Function as PropType<(key: string, value: any) => void>,
      required: true,
    },
  },
  setup(props) {
    const presets = ref<MetaPresetField[]>([])
    const loading = ref(false)

    const fetchPresets = async () => {
      loading.value = true
      try {
        const { data } = await RESTManager.api('meta-presets').get<{
          data: MetaPresetField[]
        }>()
        presets.value = data.filter(
          (p) =>
            p.enabled &&
            (!props.scope || p.scope === 'both' || p.scope === props.scope),
        )
      } catch (error) {
        console.error('Failed to fetch meta presets:', error)
      } finally {
        loading.value = false
      }
    }

    onMounted(fetchPresets)

    const renderField = (
      field: MetaPresetField,
      parentValue: any,
      updateValue: (val: any) => void,
    ) => {
      const value = parentValue?.[field.key]

      switch (field.type) {
        case 'text':
        case 'url':
          return (
            <NInput
              value={value}
              placeholder={field.placeholder}
              onUpdateValue={updateValue}
            />
          )
        case 'textarea':
          return (
            <NInput
              type="textarea"
              value={value}
              placeholder={field.placeholder}
              onUpdateValue={updateValue}
            />
          )
        case 'number':
          return (
            <NInputNumber
              value={Number(value)}
              placeholder={field.placeholder}
              onUpdateValue={updateValue}
            />
          )
        case 'boolean':
          return <NSwitch value={!!value} onUpdateValue={updateValue} />
        case 'select':
          return (
            <NSelect
              value={value}
              options={field.options}
              placeholder={field.placeholder}
              onUpdateValue={updateValue}
              filterable={field.allowCustomOption}
              tag={field.allowCustomOption}
            />
          )
        case 'multi-select':
          return (
            <NSelect
              multiple
              value={value || []}
              options={field.options}
              placeholder={field.placeholder}
              onUpdateValue={updateValue}
              filterable={field.allowCustomOption}
              tag={field.allowCustomOption}
            />
          )
        case 'checkbox':
          return (
            <NCheckboxGroup value={value || []} onUpdateValue={updateValue}>
              <div class="grid grid-cols-2 gap-2">
                {field.options?.map((opt) => (
                  <NCheckbox value={opt.value} label={opt.label as string} />
                ))}
              </div>
            </NCheckboxGroup>
          )
        case 'tags':
          return (
            <NDynamicTags value={value || []} onUpdateValue={updateValue} />
          )
        case 'object':
          return (
            <div class="w-full rounded border border-gray-200 p-4 dark:border-gray-700">
              {field.children?.map((child) => (
                <NFormItem
                  label={child.label}
                  key={child.key}
                  labelPlacement="top"
                >
                  {renderField(child as any, value || {}, (childVal) => {
                    updateValue({
                      ...(value || {}),
                      [child.key]: childVal,
                    })
                  })}
                </NFormItem>
              ))}
            </div>
          )
        default:
          return null
      }
    }

    return () => (
      <>
        {presets.value.map((preset) => (
          <NFormItem
            label={preset.label}
            key={preset.key}
            showRequireMark={false}
            labelAlign="left"
          >
            <div class="w-full">
              {renderField(preset, props.meta, (val) =>
                props.onUpdateMeta(preset.key, val),
              )}
              {preset.description && (
                <div class="mt-1 text-xs text-gray-500">
                  {preset.description}
                </div>
              )}
            </div>
          </NFormItem>
        ))}
      </>
    )
  },
})
