import { IconCheck, IconPencil, IconPlus, IconTrash, IconX } from '@tabler/icons-react'
import { useState, type FormEvent } from 'react'
import { useSettings } from '../settings/store.ts'
import { addName, NAME_MAX_LENGTH, removeName, renameName } from '../settings/roster.ts'
import { Button, IconButton } from './ui.tsx'

const inputClass =
  'min-h-11 min-w-0 flex-1 rounded-xl border border-overlay0 bg-base px-3 focus:border-accent focus:outline-none'

/** Add, rename and delete saved player names. */
export function RosterEditor() {
  const roster = useSettings((s) => s.settings.roster)
  const update = useSettings((s) => s.update)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function add(e: FormEvent) {
    e.preventDefault()
    const r = addName(roster, draft)
    if (!r.ok) return setError(r.error)
    update({ roster: r.roster })
    setDraft('')
    setError(null)
  }

  function saveEdit(e: FormEvent) {
    e.preventDefault()
    if (editing === null) return
    const r = renameName(roster, editing, editValue)
    if (!r.ok) return setError(r.error)
    update({ roster: r.roster })
    setEditing(null)
    setError(null)
  }

  return (
    <div>
      <form onSubmit={add} className="flex gap-2">
        <input
          aria-label="新增玩家名字"
          className={inputClass}
          placeholder="輸入名字後新增"
          value={draft}
          maxLength={NAME_MAX_LENGTH}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" variant="primary" disabled={!draft.trim()}>
          <IconPlus size={18} aria-hidden />
          新增
        </Button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm text-fail-fg">
          {error}
        </p>
      )}

      {roster.length === 0 ? (
        <p className="mt-3 text-sm text-subtext0">名冊是空的。開局時輸入的名字也會自動加入名冊。</p>
      ) : (
        <ul className="mt-3 divide-y divide-surface0">
          {roster.map((name, i) =>
            editing === i ? (
              <li key={name}>
                <form onSubmit={saveEdit} className="flex items-center gap-1 py-1">
                  <input
                    aria-label={`修改「${name}」`}
                    className={inputClass}
                    value={editValue}
                    maxLength={NAME_MAX_LENGTH}
                    // oxlint-disable-next-line jsx-a11y/no-autofocus -- focus the field the user just chose to edit
                    autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                  />
                  <IconButton label="儲存" type="submit">
                    <IconCheck size={20} />
                  </IconButton>
                  <IconButton
                    label="取消"
                    onClick={() => {
                      setEditing(null)
                      setError(null)
                    }}
                  >
                    <IconX size={20} />
                  </IconButton>
                </form>
              </li>
            ) : (
              <li key={name} className="flex items-center gap-1 py-1">
                <span className="min-w-0 flex-1 truncate">{name}</span>
                <IconButton
                  label={`編輯「${name}」`}
                  onClick={() => {
                    setEditing(i)
                    setEditValue(name)
                    setError(null)
                  }}
                >
                  <IconPencil size={20} />
                </IconButton>
                <IconButton
                  label={`刪除「${name}」`}
                  className="hover:text-fail-fg"
                  onClick={() => {
                    update({ roster: removeName(roster, i) })
                    if (editing !== null && editing > i) setEditing(editing - 1)
                  }}
                >
                  <IconTrash size={20} />
                </IconButton>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  )
}
