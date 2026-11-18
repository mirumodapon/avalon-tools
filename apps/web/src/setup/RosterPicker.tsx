import { MAX_PLAYERS, MIN_PLAYERS } from '@avalon/core'
import { IconCheck, IconUsersPlus } from '@tabler/icons-react'
import { useState } from 'react'
import { Sheet } from '../components/Sheet.tsx'
import { Button, cx } from '../components/ui.tsx'

/** Pick players from the roster in seat order; tapping again removes a pick. */
export function RosterPicker({
  roster,
  onDone,
}: {
  roster: readonly string[]
  onDone: (names: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [order, setOrder] = useState<string[]>([])
  const valid = order.length >= MIN_PLAYERS && order.length <= MAX_PLAYERS

  function toggle(name: string) {
    setOrder((o) =>
      o.includes(name) ? o.filter((n) => n !== name) : o.length >= MAX_PLAYERS ? o : [...o, name],
    )
  }

  function finish() {
    onDone(order)
    setOpen(false)
  }

  return (
    <>
      <Button
        className="w-full"
        disabled={roster.length === 0}
        onClick={() => {
          setOrder([])
          setOpen(true)
        }}
      >
        <IconUsersPlus size={20} aria-hidden />
        從名冊依序選擇玩家
      </Button>
      <Sheet
        title="依座位順序點選玩家"
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <div className="flex items-center gap-3">
            <span className="text-sm text-subtext1" aria-live="polite">
              已選 {order.length} 人{!valid && `（需 ${MIN_PLAYERS}–${MAX_PLAYERS} 人）`}
            </span>
            <Button variant="primary" className="flex-1" disabled={!valid} onClick={finish}>
              <IconCheck size={20} aria-hidden />
              完成
            </Button>
          </div>
        }
      >
        <p className="mb-3 text-sm text-subtext0">
          從第一位隊長位置開始順時針點選，再點一次可取消。
        </p>
        <ul className="grid grid-cols-2 gap-2" aria-label="玩家名冊">
          {roster.map((name) => {
            const pos = order.indexOf(name)
            const picked = pos >= 0
            return (
              <li key={name}>
                <button
                  type="button"
                  aria-pressed={picked}
                  aria-label={picked ? `${name}，第 ${pos + 1} 位` : name}
                  disabled={!picked && order.length >= MAX_PLAYERS}
                  onClick={() => toggle(name)}
                  className={cx(
                    'flex min-h-12 w-full items-center gap-2 rounded-xl border-2 px-3 text-left disabled:opacity-40',
                    picked ? 'border-accent bg-accent/15' : 'border-transparent bg-surface0',
                  )}
                >
                  <span
                    className={cx(
                      'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      picked ? 'bg-accent text-on-accent' : 'bg-base text-overlay1',
                    )}
                    aria-hidden
                  >
                    {picked ? pos + 1 : ''}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </Sheet>
    </>
  )
}
