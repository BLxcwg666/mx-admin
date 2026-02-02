import { NTabPane, NTabs } from 'naive-ui'
import { defineComponent, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ContentLayout } from '~/layouts/content'

import { TabAuth } from './tabs/auth'
import { TabMetaPresets } from './tabs/meta-presets'
import { TabSecurity } from './tabs/security'
import { TabSystem } from './tabs/system'
import { TabUser } from './tabs/user'

enum SettingTab {
  User = 'user',
  System = 'system',
  Security = 'security',
  Auth = 'auth',
  MetaPresets = 'meta-presets',
}
export default defineComponent({
  setup() {
    const route = useRoute()
    const router = useRouter()
    const tabValue = ref(route.params.type as string)

    watch(
      () => route.params.type,
      (n) => {
        if (!n) {
          return
        }
        tabValue.value = n as any
      },
    )
    const headerActionsEl = ref<null | VNode>(null)
    return () => (
      <ContentLayout actionsElement={headerActionsEl.value}>
        <NTabs
          value={tabValue.value}
          onUpdateValue={(e) => {
            // @ts-expect-error
            router.replace({ ...route, params: { ...route.params, type: e } })
          }}
        >
          <NTabPane tab="用户" name={SettingTab.User}>
            <TabUser />
          </NTabPane>

          <NTabPane tab="系统" name={SettingTab.System}>
            <TabSystem />
          </NTabPane>

          <NTabPane tab="安全" name={SettingTab.Security}>
            <TabSecurity />
          </NTabPane>
          <NTabPane tab="登入方式" name={SettingTab.Auth}>
            <TabAuth />
          </NTabPane>
          <NTabPane tab="Meta 预设" name={SettingTab.MetaPresets}>
            <TabMetaPresets />
          </NTabPane>
        </NTabs>
      </ContentLayout>
    )
  },
})
