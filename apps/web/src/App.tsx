import { IconCrown } from '@tabler/icons-react'
import { ThemePicker } from './components/ThemePicker.tsx'
import { useApplyTheme } from './settings/useApplyTheme.ts'

export function App() {
  useApplyTheme()
  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="flex items-center gap-2 text-xl font-bold">
        <IconCrown aria-hidden className="text-crown" /> 阿瓦隆紀錄
      </h1>
      <ThemePicker />
    </main>
  )
}
