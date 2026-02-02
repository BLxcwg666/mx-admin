import { cloneDeep, isEmpty } from 'es-toolkit/compat'
import {
  NButton,
  NColorPicker,
  NFormItem,
  NSpace,
  useThemeVars,
} from 'naive-ui'
import {
  defineComponent,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  toRaw,
  watch,
} from 'vue'
import type { FormDSL } from '~/components/config-form/types'

import { HeaderActionButton } from '~/components/button/rounded-button'
import { ConfigForm } from '~/components/config-form'
import { CheckCircleOutlinedIcon, MailIcon } from '~/components/icons'
import { useLayout } from '~/layouts/content'
import { deepDiff, RESTManager } from '~/utils'
import { colorRef, defineColors } from '~/utils/color'

import { AIConfigSection } from './sections/ai-config'

export const autosizeableProps = {
  autosize: true,
  clearable: true,
  style: 'min-width: 300px; max-width: 100%',
} as const

export const TabSystem = defineComponent(() => {
  const { setHeaderButtons: setHeaderButton } = useLayout()

  onMounted(() => {
    setHeaderButton(
      <HeaderActionButton
        disabled={true}
        onClick={save}
        icon={<CheckCircleOutlinedIcon />}
      />,
    )
  })

  onBeforeUnmount(() => {
    setHeaderButton(null)
  })

  const schema = ref<FormDSL | null>(null)

  onBeforeMount(async () => {
    // Use new form-schema endpoint
    schema.value = await RESTManager.api.config('form-schema').get({
      transform: false,
    })
    await fetchConfig()
  })

  let originConfigs: any = {}
  const configs = reactive<Record<string, any>>({})
  const diff = ref({} as any)

  watch(
    () => configs,
    (n) => {
      diff.value = deepDiff(originConfigs, toRaw(n))
    },
    { deep: true },
  )
  watch(
    () => diff.value,
    (n) => {
      let canSave = false
      if (isEmpty(n)) {
        canSave = false
      } else {
        canSave = true
      }
      setHeaderButton(
        <HeaderActionButton
          disabled={!canSave}
          icon={<CheckCircleOutlinedIcon />}
          onClick={save}
        />,
      )
    },
  )

  async function save() {
    if (isEmpty(diff.value)) {
      return
    }

    const entries = Object.entries(diff.value) as [string, any][]

    for await (const [key, value] of entries) {
      const val = Object.fromEntries(
        Object.entries(value).map(([k, v]) => {
          if (Array.isArray(v)) {
            return [k, configs[key][k]]
          }
          return [k, v]
        }),
      )

      await RESTManager.api.options(key).patch({
        data: val,
      })
    }

    await fetchConfig()
    message.success('修改成功')
  }

  const fetchConfig = async () => {
    let response = (await RESTManager.api.options.get({
      transform: false,
    })) as any

    // Merge defaults from schema if available
    if (schema.value?.defaults) {
      const { merge } = await import('es-toolkit/compat')
      response = merge(cloneDeep(schema.value.defaults), response) as any
    }

    originConfigs = cloneDeep(response)
    Object.assign(configs, response)
  }

  // 测试邮件发送
  const isSendingTestEmail = ref(false)
  const handleSendTestEmail = async () => {
    if (isSendingTestEmail.value) return
    isSendingTestEmail.value = true
    try {
      const result = await RESTManager.api.health.email.test.get<{
        message?: string
      }>()
      if (result.message) {
        message.error(`发送失败: ${result.message}`)
      } else {
        message.success('测试邮件已发送，请检查收件箱')
      }
    } catch (error: any) {
      message.error(error?.message || '发送测试邮件失败')
    } finally {
      isSendingTestEmail.value = false
    }
  }

  return () => (
    <Fragment>
      <div class="pt-4" />

      {schema.value && (
        <ConfigForm
          initialValue={configs}
          schema={schema.value}
          v-slots={{
            ai: () => (
              <AIConfigSection
                value={configs.ai || {}}
                onUpdate={(value: any) => {
                  configs.ai = value
                }}
              />
            ),
          }}
          appendSlots={{
            adminExtra: () => (
              <NFormItem label={'主题色'}>
                <AppColorSetter />
              </NFormItem>
            ),
            mailOptions: () => (
              <NFormItem label={'测试'}>
                <NSpace align="center">
                  <NButton
                    size="small"
                    secondary
                    loading={isSendingTestEmail.value}
                    onClick={handleSendTestEmail}
                  >
                    {{
                      icon: () => <MailIcon />,
                      default: () => '发送测试邮件',
                    }}
                  </NButton>
                </NSpace>
              </NFormItem>
            ),
          }}
        />
      )}
    </Fragment>
  )
})

const AppColorSetter = defineComponent({
  setup() {
    const vars = useThemeVars()

    const $style = document.createElement('style')
    $style.innerHTML = `* { transition: none !important; }`

    return () => (
      <div class={'flex items-center gap-2'}>
        <NColorPicker
          class={'w-36'}
          value={vars.value.primaryColor}
          onUpdateValue={(value) => {
            document.head.appendChild($style)

            Object.assign(colorRef.value, defineColors(value))
            setTimeout(() => {
              document.head.removeChild($style)
            })
          }}
        />

        <NButton
          size="small"
          ghost
          onClick={() => {
            // Reset to default primary color
            Object.assign(colorRef.value, defineColors('#36ad6a'))
          }}
        >
          <span>重置</span>
        </NButton>
      </div>
    )
  },
})
