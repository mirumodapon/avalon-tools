import { checkConfig, RoleSetup } from '@avalon/pass-play'
import { ladyEnabledByDefault } from '@avalon/record-core'
import { docsHref } from '@avalon/registry'
import {
  AppShell,
  BottomBar,
  Button,
  Card,
  SectionTitle,
  Segmented,
  Select,
  Switch,
  TextField,
} from '@avalon/ui'
import { IconPlayCard } from '@tabler/icons-react'
import { useSession } from '../session/store.ts'
import { useSetup, type VoteMode } from '../setup/settings.ts'
import { startGame } from '../setup/startGame.ts'

const VOTE_MODES = [
  { value: 'pass', label: '傳手機投票' },
  { value: 'leader', label: '隊長輸入' },
] as const satisfies readonly { value: VoteMode; label: string }[]

/** 開局: players and roles, how votes are taken, the Lady, then the names (optional). */
export function SetupPage() {
  const settings = useSetup((s) => s.settings)
  const update = useSetup((s) => s.update)
  const start = useSession((s) => s.start)
  const check = checkConfig(settings)

  function begin() {
    const { game } = startGame(settings, new Date().toISOString())
    start({
      game,
      voteMode: settings.voteMode,
      forcedVote: settings.forcedVote,
      stage: 'deal',
      progress: null,
    })
  }

  return (
    <AppShell title="單機遊戲助手" helpHref={docsHref('guide/assistant/')}>
      <div className="flex-1 space-y-4 pt-2">
        <RoleSetup
          playerCount={settings.playerCount}
          special={settings.special}
          onChange={({ playerCount, special }) =>
            update(
              playerCount === settings.playerCount
                ? { special }
                : {
                    playerCount,
                    special,
                    lady: ladyEnabledByDefault(playerCount),
                    ladyHolderSeat: null,
                  },
            )
          }
        />
        <Card>
          <SectionTitle>投票方式</SectionTitle>
          <Segmented
            label="投票方式"
            value={settings.voteMode}
            options={VOTE_MODES}
            onChange={(voteMode) => update({ voteMode })}
          />
          <p className="mt-2 text-sm text-subtext0">
            {settings.voteMode === 'pass'
              ? '手機依序傳給每位玩家投票，全部投完後一起公布。'
              : '大家公開投票，由隊長點選誰同意。'}
          </p>
          <Switch
            label="強制局投票"
            description={
              settings.forcedVote
                ? '第 5 次組隊照常投票，被否決時壞人獲勝。'
                : '第 5 次組隊不投票，自動記為全員贊成，直接出任務。'
            }
            checked={settings.forcedVote}
            onChange={(forcedVote) => update({ forcedVote })}
          />
        </Card>
        <Card>
          <Switch
            label="湖中女神"
            description="第 2、3、4 次任務後使用"
            checked={settings.lady}
            onChange={(lady) => update({ lady })}
          />
          {settings.lady && (
            <Switch
              label="隨機決定初始持有者"
              checked={settings.ladyHolderRandom}
              onChange={(ladyHolderRandom) => update({ ladyHolderRandom })}
            />
          )}
          {settings.lady && !settings.ladyHolderRandom && (
            <Select
              className="mt-2"
              label="湖中女神初始持有者"
              value={String(settings.ladyHolderSeat ?? settings.playerCount)}
              options={settings.names.map((name, i) => ({
                value: String(i + 1),
                label: name.trim() ? `${i + 1} 號・${name.trim()}` : `${i + 1} 號`,
              }))}
              onChange={(v) => update({ ladyHolderSeat: Number(v) })}
            />
          )}
        </Card>
        <Card>
          <SectionTitle>玩家名字（選填）</SectionTitle>
          <div className="space-y-2">
            {settings.names.map((name, i) => (
              <TextField
                // Seats are fixed positions; the index is the identity.
                key={i}
                label={`${i + 1} 號`}
                value={name}
                placeholder="未填則顯示座位號碼"
                maxLength={12}
                onChange={(v) => update({ names: settings.names.with(i, v) })}
              />
            ))}
          </div>
        </Card>
      </div>
      <BottomBar>
        <Button variant="primary" className="w-full" disabled={!check.ok} onClick={begin}>
          <IconPlayCard size={20} aria-hidden />
          開始遊戲
        </Button>
      </BottomBar>
    </AppShell>
  )
}
