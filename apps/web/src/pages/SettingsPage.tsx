import { IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { Page } from '../components/Layout.tsx'
import { RosterEditor } from '../components/RosterEditor.tsx'
import { ConfirmSheet } from '../components/Sheet.tsx'
import { StorageStatus } from '../components/StorageStatus.tsx'
import { ThemePicker } from '../components/ThemePicker.tsx'
import { Button, Card, SectionTitle, Segmented, Switch } from '../components/ui.tsx'
import { VIEW_MODE_OPTIONS } from '../components/ViewModeToggle.tsx'
import { useGames } from '../games/store.ts'
import { NamingSettings } from '../naming/NamingSettings.tsx'
import { INPUT_MODE_OPTIONS } from '../play/ProposalForm.tsx'
import { navigate } from '../router.ts'
import { useSettings } from '../settings/store.ts'
import { clearNamespace } from '../storage/storage.ts'

export function SettingsPage() {
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  const resetSettings = useSettings((s) => s.reset)
  const clearGames = useGames((s) => s.clearAll)
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0)

  async function clearEverything() {
    await clearGames()
    clearNamespace()
    resetSettings()
    navigate({ name: 'home' }, { replace: true })
  }

  return (
    <Page title="設定" back={{ name: 'home' }}>
      <div className="space-y-4 pt-2">
        <Card>
          <SectionTitle>主題</SectionTitle>
          <ThemePicker />
        </Card>

        <Card className="space-y-4">
          <SectionTitle>紀錄與呈現</SectionTitle>
          <div>
            <p className="mb-1 text-sm text-subtext0">預設紀錄模式（會自動跟隨上次使用的模式）</p>
            <Segmented
              label="預設紀錄模式"
              value={settings.defaultInputMode}
              options={INPUT_MODE_OPTIONS}
              onChange={(v) => update({ defaultInputMode: v })}
            />
          </div>
          <div>
            <p className="mb-1 text-sm text-subtext0">預設呈現模式</p>
            <Segmented
              label="預設呈現模式"
              value={settings.viewMode}
              options={VIEW_MODE_OPTIONS}
              onChange={(v) => update({ viewMode: v })}
            />
          </div>
          <Switch
            label="瀏覽時預設顯示角色"
            description="進行中的遊戲永遠預設隱藏"
            checked={settings.showRoles}
            onChange={(v) => update({ showRoles: v })}
          />
          <Switch
            label="強制局自動設為全員不贊成"
            description="第 5 次派票只需選隊員"
            checked={settings.forcedAutoReject}
            onChange={(v) => update({ forcedAutoReject: v })}
          />
        </Card>

        <Card>
          <SectionTitle>命名規則</SectionTitle>
          <NamingSettings />
        </Card>

        <Card>
          <SectionTitle>玩家名冊</SectionTitle>
          <RosterEditor />
        </Card>

        <Card>
          <SectionTitle>儲存空間</SectionTitle>
          <StorageStatus />
        </Card>

        <Card>
          <SectionTitle>危險區域</SectionTitle>
          <Button variant="danger" className="w-full" onClick={() => setConfirmStep(1)}>
            <IconTrash size={20} aria-hidden />
            清除所有資料
          </Button>
        </Card>
      </div>

      <ConfirmSheet
        open={confirmStep === 1}
        title="清除所有資料？"
        message="所有遊戲紀錄、玩家名冊與設定都會被刪除。建議先到遊戲列表匯出備份。"
        confirmLabel="繼續"
        danger
        onConfirm={() => setTimeout(() => setConfirmStep(2))}
        onClose={() => setConfirmStep((s) => (s === 1 ? 0 : s))}
      />
      <ConfirmSheet
        open={confirmStep === 2}
        title="最後確認"
        message="此動作無法復原。確定要永久刪除全部資料嗎？"
        confirmLabel="永久刪除"
        danger
        onConfirm={() => void clearEverything()}
        onClose={() => setConfirmStep(0)}
      />
    </Page>
  )
}
