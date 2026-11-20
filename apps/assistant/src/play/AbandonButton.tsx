import { ConfirmSheet, IconButton } from '@avalon/ui'
import { IconX } from '@tabler/icons-react'
import { useState } from 'react'
import { useSession } from '../session/store.ts'

/** 放棄這場: deletes the game in progress after a confirmation; there is no undo. */
export function AbandonButton() {
  const clear = useSession((s) => s.clear)
  const [open, setOpen] = useState(false)
  return (
    <>
      <IconButton label="放棄這場" onClick={() => setOpen(true)}>
        <IconX size={22} />
      </IconButton>
      <ConfirmSheet
        open={open}
        title="放棄這場？"
        message="這場遊戲的進度會被刪除，無法復原。"
        confirmLabel="放棄"
        danger
        onConfirm={clear}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
