/**
 * Meta Presets Management Tab
 * Meta 预设字段管理
 */
import {
  NButton,
  NDataTable,
  NDivider,
  NDynamicTags,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPopconfirm,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  NText,
  useMessage,
} from 'naive-ui'
import { defineComponent, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import type {
  CreateMetaPresetDto,
  MetaFieldType,
  MetaPresetField,
  MetaPresetScope,
} from '~/models/meta-preset'
import type { DataTableColumns } from 'naive-ui'

import { HeaderActionButton } from '~/components/button/rounded-button'
import { AddIcon } from '~/components/icons'
import { useLayout } from '~/layouts/content'
import { RESTManager } from '~/utils'

const fieldTypeOptions = [
  { label: '文本', value: 'text' },
  { label: '长文本', value: 'textarea' },
  { label: '数字', value: 'number' },
  { label: 'URL', value: 'url' },
  { label: '单选', value: 'select' },
  { label: '多选', value: 'multi-select' },
  { label: '复选框', value: 'checkbox' },
  { label: '标签', value: 'tags' },
  { label: '布尔值', value: 'boolean' },
  { label: '对象', value: 'object' },
]

const scopeOptions = [
  { label: '文章', value: 'post' },
  { label: '手记', value: 'note' },
  { label: '全部', value: 'both' },
]

const getScopeLabel = (scope: MetaPresetScope) => {
  const option = scopeOptions.find((o) => o.value === scope)
  return option?.label || scope
}

const getTypeLabel = (type: MetaFieldType) => {
  const option = fieldTypeOptions.find((o) => o.value === type)
  return option?.label || type
}

export const TabMetaPresets = defineComponent({
  name: 'TabMetaPresets',
  setup() {
    const message = useMessage()
    const { setHeaderButtons } = useLayout()

    const presets = ref<MetaPresetField[]>([])
    const loading = ref(false)
    const showModal = ref(false)
    const editingId = ref<string | null>(null)

    const formData = reactive<CreateMetaPresetDto>({
      key: '',
      label: '',
      type: 'text',
      description: '',
      placeholder: '',
      scope: 'both',
      options: [],
      allowCustomOption: false,
      children: [],
      enabled: true,
    })

    const resetForm = () => {
      formData.key = ''
      formData.label = ''
      formData.type = 'text'
      formData.description = ''
      formData.placeholder = ''
      formData.scope = 'both'
      formData.options = []
      formData.allowCustomOption = false
      formData.children = []
      formData.enabled = true
      editingId.value = null
    }

    const fetchPresets = async () => {
      loading.value = true
      try {
        const data = await RESTManager.api('meta-presets').get<{
          data: MetaPresetField[]
        }>()

        const processData = (items: any[], parentKey = ''): any[] => {
          return items.map((item) => {
            const uniqueKey =
              item.id || (parentKey ? `${parentKey}.${item.key}` : item.key)
            const children = item.children
              ? processData(item.children, uniqueKey)
              : undefined
            return {
              ...item,
              _rowKey: uniqueKey,
              children,
            }
          })
        }

        presets.value = processData(data.data || [])
      } catch (error) {
        console.error('Failed to fetch presets:', error)
      } finally {
        loading.value = false
      }
    }

    const handleAdd = () => {
      resetForm()
      showModal.value = true
    }

    // 设置 header 按钮
    onMounted(() => {
      setHeaderButtons(
        <HeaderActionButton icon={<AddIcon />} onClick={handleAdd} />,
      )
      fetchPresets()
    })

    onBeforeUnmount(() => {
      setHeaderButtons(null)
    })

    const handleEdit = (preset: MetaPresetField) => {
      editingId.value = preset.id
      formData.key = preset.key
      formData.label = preset.label
      formData.type = preset.type
      formData.description = preset.description || ''
      formData.placeholder = preset.placeholder || ''
      formData.scope = preset.scope
      formData.options = preset.options || []
      formData.allowCustomOption = preset.allowCustomOption || false
      formData.children = preset.children || []
      formData.enabled = preset.enabled
      showModal.value = true
    }

    const handleDelete = async (id: string) => {
      try {
        await RESTManager.api('meta-presets')(id).delete()
        message.success('删除成功')
        fetchPresets()
      } catch (error: any) {
        message.error(error?.message || '删除失败')
      }
    }

    const handleToggleEnabled = async (preset: MetaPresetField) => {
      try {
        await RESTManager.api('meta-presets')(preset.id).patch({
          data: { enabled: !preset.enabled },
        })
        preset.enabled = !preset.enabled
        message.success(preset.enabled ? '已启用' : '已禁用')
      } catch (error: any) {
        message.error(error?.message || '操作失败')
      }
    }

    const handleSubmit = async () => {
      if (!formData.key || !formData.label) {
        message.error('请填写字段键名和显示名称')
        return
      }

      try {
        if (editingId.value) {
          await RESTManager.api('meta-presets')(editingId.value).patch({
            data: formData,
          })
          message.success('更新成功')
        } else {
          await RESTManager.api('meta-presets').post({
            data: formData,
          })
          message.success('创建成功')
        }
        showModal.value = false
        resetForm()
        fetchPresets()
      } catch (error: any) {
        message.error(error?.message || '操作失败')
      }
    }

    // 是否显示选项配置
    const showOptionsConfig = () =>
      ['select', 'multi-select', 'checkbox'].includes(formData.type)

    const columns: DataTableColumns<MetaPresetField> = [
      {
        title: '键名',
        key: 'key',
        width: 200,
        ellipsis: { tooltip: true },
        render: (row) => <NText code>{row.key}</NText>,
      },
      {
        title: '名称',
        key: 'label',
        width: 120,
      },
      {
        title: '类型',
        key: 'type',
        width: 100,
        render: (row) => <NTag size="small">{getTypeLabel(row.type)}</NTag>,
      },
      {
        title: '范围',
        key: 'scope',
        width: 80,
        render: (row) =>
          row.scope ? (
            <NTag size="small" type="info">
              {getScopeLabel(row.scope)}
            </NTag>
          ) : null,
      },
      {
        title: '描述',
        key: 'description',
        ellipsis: { tooltip: true },
      },
      {
        title: '启用',
        key: 'enabled',
        width: 80,
        render: (row) =>
          row.enabled !== undefined ? (
            <NSwitch
              value={row.enabled}
              disabled={row.isBuiltin === true}
              onUpdateValue={() => handleToggleEnabled(row)}
            />
          ) : null,
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        fixed: 'right',
        render: (row) =>
          row.id ? (
            <NSpace size="small">
              <NButton
                size="tiny"
                quaternary
                type="primary"
                disabled={row.isBuiltin === true}
                onClick={() => handleEdit(row)}
              >
                编辑
              </NButton>
              <NPopconfirm
                positiveText="取消"
                negativeText="删除"
                onNegativeClick={() => handleDelete(row.id)}
              >
                {{
                  trigger: () => (
                    <NButton
                      size="tiny"
                      quaternary
                      type="error"
                      disabled={row.isBuiltin === true}
                    >
                      删除
                    </NButton>
                  ),
                  default: () => `确定删除预设 "${row.label}"？`,
                }}
              </NPopconfirm>
            </NSpace>
          ) : null,
      },
    ]

    return () => (
      <>
        <div class="pt-4">
          <NText depth={3} class="mb-4 block text-sm">
            配置可复用的自定义 meta 字段（如音乐、电影、书籍等元数据模板）
          </NText>

          <NDataTable
            columns={columns}
            data={presets.value}
            rowKey={(row: any) => row._rowKey}
            loading={loading.value}
            bordered={false}
            size="small"
            scrollX={800}
          />
        </div>

        <NModal
          show={showModal.value}
          onUpdateShow={(v) => {
            showModal.value = v
          }}
          preset="card"
          title={editingId.value ? '编辑预设字段' : '新增预设字段'}
          style={{ width: '600px', maxWidth: '90vw' }}
        >
          <NForm labelPlacement="left" labelWidth={100}>
            <NFormItem label="字段键名" required>
              <NInput
                value={formData.key}
                onUpdateValue={(v) => (formData.key = v)}
                placeholder="如: music, movie, book"
                disabled={!!editingId.value}
              />
            </NFormItem>

            <NFormItem label="显示名称" required>
              <NInput
                value={formData.label}
                onUpdateValue={(v) => (formData.label = v)}
                placeholder="如: 音乐, 电影, 书籍"
              />
            </NFormItem>

            <NFormItem label="字段类型">
              <NSelect
                value={formData.type}
                onUpdateValue={(v) => (formData.type = v)}
                options={fieldTypeOptions}
              />
            </NFormItem>

            <NFormItem label="适用范围">
              <NSelect
                value={formData.scope}
                onUpdateValue={(v) => (formData.scope = v)}
                options={scopeOptions}
              />
            </NFormItem>

            <NFormItem label="描述">
              <NInput
                value={formData.description}
                onUpdateValue={(v) => (formData.description = v)}
                placeholder="字段说明"
              />
            </NFormItem>

            <NFormItem label="占位符">
              <NInput
                value={formData.placeholder}
                onUpdateValue={(v) => (formData.placeholder = v)}
                placeholder="输入框占位提示"
              />
            </NFormItem>

            {showOptionsConfig() && (
              <>
                <NDivider>选项配置</NDivider>
                <NFormItem label="选项列表">
                  <NDynamicTags
                    value={
                      formData.options?.map((o) => o.label as string) || []
                    }
                    onUpdateValue={(values: string[]) => {
                      formData.options = values.map((label) => ({
                        value: label,
                        label,
                      }))
                    }}
                  />
                </NFormItem>
                <NFormItem label="允许自定义">
                  <NSwitch
                    value={formData.allowCustomOption}
                    onUpdateValue={(v) => (formData.allowCustomOption = v)}
                  />
                </NFormItem>
              </>
            )}

            <NFormItem label="启用">
              <NSwitch
                value={formData.enabled}
                onUpdateValue={(v) => (formData.enabled = v)}
              />
            </NFormItem>
          </NForm>

          <div class="mt-4 flex justify-end gap-2">
            <NButton onClick={() => (showModal.value = false)}>取消</NButton>
            <NButton type="primary" onClick={handleSubmit}>
              {editingId.value ? '更新' : '创建'}
            </NButton>
          </div>
        </NModal>
      </>
    )
  },
})
