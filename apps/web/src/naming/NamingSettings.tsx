import { DATE_FORMATS, DEFAULT_NAMING, PLACEHOLDERS, renderName } from '@avalon/core'
import { IconRestore } from '@tabler/icons-react'
import { useRef } from 'react'
import { SelectField } from '../components/Select.tsx'
import { Button } from '../components/ui.tsx'
import { useSettings } from '../settings/store.ts'

const SAMPLE_DATE = () => new Date()

/** Naming template editor with placeholder help and a live preview. */
export function NamingSettings() {
  const naming = useSettings((s) => s.settings.naming)
  const update = useSettings((s) => s.update)
  const input = useRef<HTMLInputElement>(null)

  function set(patch: Partial<typeof naming>) {
    update({ naming: { ...naming, ...patch } })
  }

  function insert(token: string) {
    const el = input.current
    const start = el?.selectionStart ?? naming.template.length
    const end = el?.selectionEnd ?? start
    const template = naming.template.slice(0, start) + token + naming.template.slice(end)
    set({ template })
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  const sample = { startedAt: SAMPLE_DATE(), seq: 3, players: 7 }
  const preview = renderName(naming, { ...sample, winner: null })
  const previewDone = renderName(naming, { ...sample, winner: 'good' })

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm text-subtext0">名稱範本</span>
        <input
          ref={input}
          className="min-h-11 w-full rounded-xl border border-overlay0 bg-base px-3 font-mono focus:border-accent focus:outline-none"
          value={naming.template}
          maxLength={80}
          onChange={(e) => set({ template: e.target.value })}
        />
      </label>
      <div className="flex flex-wrap gap-2" aria-label="插入佔位符">
        {PLACEHOLDERS.map((p) => (
          <button
            key={p.token}
            type="button"
            onClick={() => insert(p.token)}
            className="min-h-9 rounded-lg bg-surface0 px-2 text-left text-sm"
          >
            <code className="text-accent-fg">{p.token}</code>
            <span className="ml-1 text-subtext0">{p.description}</span>
          </button>
        ))}
      </div>
      <div>
        <SelectField
          label="日期格式"
          value={naming.dateFormat}
          options={DATE_FORMATS.map((f) => ({ value: f, label: f }))}
          onChange={(dateFormat) => set({ dateFormat })}
        />
        <p className="mt-1 text-xs text-subtext0">
          也可在範本中直接寫 <code>{'{date:MM/DD}'}</code>
        </p>
      </div>
      <div className="rounded-xl bg-surface0 p-3" aria-live="polite">
        <p className="text-xs text-subtext0">預覽（今天第 3 場、7 人）</p>
        <p className="font-semibold">{preview || '（空白，將使用備用名稱）'}</p>
        {previewDone !== preview && (
          <p className="text-sm text-subtext1">好人勝利後：{previewDone}</p>
        )}
      </div>
      <p className="text-xs text-subtext0">
        修改範本會即時套用到所有未自訂名稱的遊戲；自訂名稱不受影響。
      </p>
      <Button
        variant="ghost"
        className="min-h-9 px-2 text-sm"
        onClick={() => update({ naming: DEFAULT_NAMING })}
      >
        <IconRestore size={16} aria-hidden />
        還原預設（{DEFAULT_NAMING.template}）
      </Button>
    </div>
  )
}
