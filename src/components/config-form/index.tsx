import { get, set } from 'es-toolkit/compat'
import { marked } from 'marked'
import {
  NCollapse,
  NCollapseItem,
  NDynamicTags,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NSwitch,
  NText,
} from 'naive-ui'
import type { PropType, Ref, VNode } from 'vue'
import type { FormDSL, FormField } from './types'

import { useStoreRef } from '~/hooks/use-store-ref'
import { UIStore } from '~/stores/ui'
import { uuid } from '~/utils'

export * from './types'

const NFormPrefixCls = 'mt-6'
const NFormBaseProps = {
  class: NFormPrefixCls,
  labelPlacement: 'left',
  labelAlign: 'right',
  labelWidth: 150,
  autocomplete: 'do-not-autofill',
}

/**
 * Check if a field should be shown based on showWhen conditions.
 */
function shouldShowField(
  field: FormField,
  formData: Ref<any>,
  sectionPrefix: string,
): boolean {
  const { showWhen } = field.ui
  if (!showWhen) return true

  for (const [key, expected] of Object.entries(showWhen)) {
    const actualValue = get(formData.value, `${sectionPrefix}.${key}`)
    if (Array.isArray(expected)) {
      if (!expected.includes(actualValue)) return false
    } else {
      if (actualValue !== expected) return false
    }
  }
  return true
}

/**
 * New ConfigForm component that works with FormDSL format
 * Renders groups as collapsible sections with Naive UI styling
 */
export const ConfigForm = defineComponent({
  props: {
    schema: {
      type: Object as PropType<FormDSL>,
      required: true,
    },
    initialValue: {
      type: Object as PropType<Record<string, any>>,
      required: true,
    },
    onValueChange: {
      type: Function as PropType<(val: any) => any>,
      required: false,
    },
    /**
     * Custom slots for specific sections (by section key)
     * Completely replaces the auto-generated form for that section
     * e.g., { ai: () => <AIConfigSection /> }
     */
    sectionSlots: {
      type: Object as PropType<Record<string, () => VNode>>,
      default: () => ({}),
    },
    /**
     * Append slots for specific sections (by section key)
     * Adds content AFTER the auto-generated form for that section
     * e.g., { adminExtra: () => <NFormItem label="主题色">...</NFormItem> }
     */
    appendSlots: {
      type: Object as PropType<Record<string, () => VNode>>,
      default: () => ({}),
    },
  },

  setup(props, { slots }) {
    const formData = ref(props.initialValue)

    watchEffect(
      () => {
        props.onValueChange?.(formData.value)
      },
      { flush: 'post' },
    )

    const uiStore = useStoreRef(UIStore)
    const formProps = reactive({ ...NFormBaseProps }) as any

    watch(
      () => uiStore.viewport.value.mobile,
      (isMobile) => {
        if (isMobile) {
          formProps.labelPlacement = 'top'
          formProps.labelAlign = 'left'
        } else {
          formProps.labelPlacement = 'left'
          formProps.labelAlign = 'right'
        }
      },
      { immediate: true },
    )

    // First group expanded by default
    const expandedNames = ref<string[]>(
      props.schema.groups.length > 0 ? [props.schema.groups[0].key] : [],
    )

    return () => {
      const { schema, sectionSlots, appendSlots } = props

      return (
        <>
          <NCollapse
            accordion
            defaultExpandedNames={expandedNames.value}
            displayDirective="if"
          >
            {schema.groups.map((group) => (
              <NCollapseItem
                key={group.key}
                name={group.key}
                title={group.title}
              >
                {{
                  default: () => (
                    <div class="space-y-6 pl-4">
                      {group.sections
                        .filter((section) => !section.hidden)
                        .map((section) => {
                          // Check if there's a custom slot that replaces this section
                          const customSlot =
                            sectionSlots[section.key] || slots[section.key]
                          // Check if there's an append slot for after this section
                          const appendSlot = appendSlots[section.key]

                          if (customSlot) {
                            return (
                              <div key={section.key}>
                                {group.sections.length > 1 && (
                                  <NText
                                    class="mb-3 block text-sm font-medium"
                                    depth={2}
                                  >
                                    {section.title}
                                  </NText>
                                )}
                                <NForm {...formProps}>{customSlot()}</NForm>
                              </div>
                            )
                          }

                          return (
                            <div key={section.key}>
                              {group.sections.length > 1 && (
                                <NText
                                  class="mb-3 block text-sm font-medium"
                                  depth={2}
                                >
                                  {section.title}
                                </NText>
                              )}
                              <NForm {...formProps}>
                                <SectionFields
                                  fields={section.fields}
                                  formData={formData}
                                  dataKeyPrefix={section.key}
                                />
                                {appendSlot?.()}
                              </NForm>
                            </div>
                          )
                        })}
                    </div>
                  ),
                  'header-extra': () => (
                    <NText class="text-xs" depth={3}>
                      {group.description}
                    </NText>
                  ),
                }}
              </NCollapseItem>
            ))}
          </NCollapse>
        </>
      )
    }
  },
})

/**
 * Renders fields for a section
 */
export const SectionFields = defineComponent({
  props: {
    fields: {
      type: Array as PropType<FormField[]>,
      required: true,
    },
    formData: {
      type: Object as PropType<Ref<any>>,
      required: true,
    },
    dataKeyPrefix: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const uiStore = useStoreRef(UIStore)
    const gridCols = computed(() => (uiStore.viewport.value.mobile ? 1 : 2))

    return () => {
      const { fields, formData, dataKeyPrefix } = props

      return (
        <>
          {fields
            .filter((field) => !field.ui.hidden)
            .filter((field) => shouldShowField(field, formData, dataKeyPrefix))
            .map((field) => {
              const fieldPath = `${dataKeyPrefix}.${field.key}`

              // Handle nested fields (object type)
              if (field.fields && field.fields.length > 0) {
                return (
                  <SectionFields
                    key={fieldPath}
                    fields={field.fields}
                    formData={formData}
                    dataKeyPrefix={fieldPath}
                  />
                )
              }

              return (
                <FormFieldItem
                  key={fieldPath}
                  field={field}
                  value={get(formData.value, fieldPath, undefined)}
                  onUpdateValue={(val) => {
                    const parentPath = dataKeyPrefix
                    if (get(formData.value, parentPath)) {
                      set(formData.value, fieldPath, val)
                    } else {
                      set(formData.value, parentPath, {
                        ...get(formData.value, parentPath, {}),
                        [field.key]: val,
                      })
                    }
                  }}
                  gridCols={gridCols.value}
                />
              )
            })}
        </>
      )
    }
  },
})

/**
 * Renders a single form field
 */
const FormFieldItem = defineComponent({
  props: {
    field: {
      type: Object as PropType<FormField>,
      required: true,
    },
    value: {
      type: Object as any,
      required: false,
    },
    onUpdateValue: {
      type: Function as PropType<(value: any) => void>,
      required: true,
    },
    gridCols: {
      type: Number,
      default: 2,
    },
  },
  setup(props) {
    const innerValue = ref(props.value)

    watch(
      () => props.value,
      (newVal) => {
        innerValue.value = newVal
      },
    )

    watchEffect(() => {
      props.onUpdateValue(innerValue.value)
    })

    const renderComponent = () => {
      const { field } = props
      const { ui } = field

      switch (ui.component) {
        case 'input':
          return (
            <NInput
              inputProps={{ id: uuid() }}
              value={innerValue.value}
              onUpdateValue={(val) => {
                innerValue.value = val
              }}
              placeholder={ui.placeholder}
              clearable
            />
          )

        case 'password':
          return (
            <NInput
              inputProps={{ id: uuid() }}
              value={innerValue.value}
              onUpdateValue={(val) => {
                innerValue.value = val
              }}
              type="password"
              showPasswordOn="click"
              placeholder={ui.placeholder}
              clearable
            />
          )

        case 'textarea':
          return (
            <NInput
              inputProps={{ id: uuid() }}
              value={innerValue.value}
              onUpdateValue={(val) => {
                innerValue.value = val
              }}
              type="textarea"
              autosize={{ maxRows: 5, minRows: 3 }}
              placeholder={ui.placeholder}
              clearable
            />
          )

        case 'number':
          return (
            <NInputNumber
              value={innerValue.value}
              onUpdateValue={(val) => {
                innerValue.value = val
              }}
              placeholder={ui.placeholder}
            />
          )

        case 'switch':
          return (
            <NSwitch
              value={innerValue.value}
              onUpdateValue={(val) => {
                innerValue.value = val
              }}
            />
          )

        case 'select':
          return (
            <NSelect
              value={innerValue.value}
              onUpdateValue={(val) => {
                innerValue.value = val
              }}
              options={ui.options}
              filterable
              placeholder={ui.placeholder}
            />
          )

        case 'tags':
          return (
            <NDynamicTags
              value={innerValue.value}
              onUpdateValue={(val) => {
                innerValue.value = val
              }}
            />
          )

        default:
          return null
      }
    }

    return () => {
      const { field, gridCols } = props
      const { title, description, ui } = field

      const base = (
        <NFormItem label={title}>
          {description ? (
            <NSpace class="w-full" vertical>
              {renderComponent()}
              <NText class="text-xs" depth={3}>
                <span innerHTML={marked.parse(description) as string} />
              </NText>
            </NSpace>
          ) : (
            renderComponent()
          )}
        </NFormItem>
      )

      if (ui.halfGrid && gridCols === 2) {
        return <div class="inline-block w-1/2">{base}</div>
      }

      return base
    }
  },
})
