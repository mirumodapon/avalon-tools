import { parseGamesJson, type Game } from '@avalon/record-core'
import { IconClipboardText, IconFile, IconFileImport } from '@tabler/icons-react'
import { useRef, useState } from 'react'
import { Sheet } from '@avalon/ui'
import { Button, Segmented } from '@avalon/ui'
import type { ConflictChoice } from '../db/repository.ts'
import { newId, useGames } from '../games/store.ts'
import { useNamer } from '../naming/useDisplayName.ts'

interface Parsed {
  games: Game[]
  errors: { index: number; error: string }[]
}

/** Imports JSON (one or many games) with validation and per-game conflict choices. */
export function ImportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const existing = useGames((s) => s.games)
  const importGames = useGames((s) => s.importGames)
  const nameOf = useNamer()
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [choices, setChoices] = useState<Record<string, ConflictChoice>>({})
  const [paste, setPaste] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const existingIds = new Set(existing.map((g) => g.id))
  const conflicts = parsed?.games.filter((g) => existingIds.has(g.id)) ?? []

  function load(text: string) {
    setResult(null)
    const r = parseGamesJson(text)
    setParsed(r)
    setChoices(
      Object.fromEntries(r.games.filter((g) => existingIds.has(g.id)).map((g) => [g.id, 'copy'])),
    )
  }

  async function onFile(file: File | undefined) {
    if (file) load(await file.text())
  }

  async function confirm() {
    if (!parsed) return
    setBusy(true)
    try {
      const s = await importGames(
        parsed.games.map((game) => ({ game, onConflict: choices[game.id] })),
        newId,
      )
      setResult(`已匯入：新增 ${s.added}、覆蓋 ${s.overwritten}、另存 ${s.copied}`)
      setParsed(null)
      setPaste('')
    } catch (e) {
      setResult(`匯入失敗，未寫入任何資料：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  function close() {
    setParsed(null)
    setResult(null)
    setPaste('')
    onClose()
  }

  return (
    <Sheet
      title="匯入 JSON"
      open={open}
      onClose={close}
      footer={
        parsed && parsed.games.length > 0 ? (
          <Button
            variant="primary"
            className="w-full"
            disabled={busy}
            onClick={() => void confirm()}
          >
            <IconFileImport size={20} aria-hidden />
            匯入 {parsed.games.length} 場
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <div>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            aria-label="選擇 JSON 檔案"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0]
              setFileName(file?.name ?? null)
              void onFile(file)
              e.target.value = ''
            }}
          />
          <Button className="w-full" onClick={() => fileInput.current?.click()}>
            <IconFile size={20} aria-hidden />
            選擇 JSON 檔案（單場或多場）
          </Button>
          {fileName && <p className="mt-1 truncate text-xs text-subtext0">已選擇：{fileName}</p>}
        </div>
        <div>
          <Button
            variant="ghost"
            className="min-h-9 px-2 text-sm"
            aria-expanded={pasteOpen}
            onClick={() => setPasteOpen((v) => !v)}
          >
            <IconClipboardText size={16} aria-hidden />
            或貼上 JSON 內容
          </Button>
          {pasteOpen && (
            <div className="mt-2">
              <textarea
                aria-label="貼上 JSON"
                className="h-32 w-full rounded-xl border border-overlay0 bg-base p-2 font-mono text-xs"
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
              />
              <Button className="mt-2" disabled={!paste.trim()} onClick={() => load(paste)}>
                讀取
              </Button>
            </div>
          )}
        </div>

        {result && <output className="block rounded-xl bg-surface0 p-3 text-sm">{result}</output>}

        {parsed && parsed.errors.length > 0 && (
          <div role="alert" className="rounded-xl border border-fail p-3 text-sm text-fail-fg">
            <p className="mb-1 font-semibold">
              {parsed.games.length > 0
                ? `有 ${parsed.errors.length} 筆無法匯入，將略過：`
                : '無法匯入：'}
            </p>
            <ul className="space-y-1 whitespace-pre-wrap">
              {parsed.errors.map((e) => (
                <li key={e.index}>
                  {e.index >= 0 && `第 ${e.index + 1} 筆：`}
                  {e.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {parsed && parsed.games.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm">
              將匯入 {parsed.games.length} 場
              {conflicts.length > 0 && `，其中 ${conflicts.length} 場與現有遊戲 ID 相同`}
            </p>
            {conflicts.length > 1 && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="min-h-9 flex-1 text-sm"
                  onClick={() =>
                    setChoices(Object.fromEntries(conflicts.map((g) => [g.id, 'overwrite'])))
                  }
                >
                  全部覆蓋
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-9 flex-1 text-sm"
                  onClick={() =>
                    setChoices(Object.fromEntries(conflicts.map((g) => [g.id, 'copy'])))
                  }
                >
                  全部另存
                </Button>
              </div>
            )}
            <ul className="space-y-2">
              {parsed.games.map((g) => (
                <li key={g.id} className="rounded-xl bg-surface0/60 p-3">
                  <p className="truncate font-semibold">{nameOf(g)}</p>
                  <p className="text-xs text-subtext0">
                    {g.players.length} 人・{g.createdAt.slice(0, 10)}
                  </p>
                  {existingIds.has(g.id) && (
                    <Segmented
                      className="mt-2"
                      label={`${nameOf(g)} 已存在`}
                      value={choices[g.id] ?? 'copy'}
                      options={[
                        { value: 'overwrite', label: '覆蓋' },
                        { value: 'copy', label: '另存一份' },
                      ]}
                      onChange={(v) => setChoices({ ...choices, [g.id]: v })}
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Sheet>
  )
}
