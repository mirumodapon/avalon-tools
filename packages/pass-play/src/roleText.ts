import type { RoleId, Vision } from '@avalon/rules'

/** One line on what the role does. */
export const ABILITY: Record<RoleId, string> = {
  merlin: '你知道壞人是誰，帶領好人完成任務，但別讓刺客發現你',
  percival: '找出真正的梅林並保護他',
  loyal: '協助好人完成 3 次任務',
  assassin: '找出梅林，在最後一刻扭轉戰局',
  morgana: '在派西維爾眼中，你看起來就像梅林',
  mordred: '梅林看不到你',
  oberon: '你是壞人，但獨自行動',
  minion: '協助壞人讓任務失敗',
}

/** Extra reminder shown under the vision. */
export const EXTRA: Partial<Record<RoleId, string>> = {
  assassin: '若好人完成 3 次任務，你可以刺殺梅林',
}

export const seatList = (seats: readonly number[]) => `${seats.join('、')} 號`

/** The vision as one line, e.g. 「壞人：2、5、7 號」. */
export function visionText(v: Vision): string {
  switch (v.kind) {
    case 'evil':
      return v.seats.length ? `壞人：${seatList(v.seats)}` : '你看不到任何壞人'
    case 'merlinOrMorgana':
      return v.seats.length ? `梅林／莫甘娜：${seatList(v.seats)}` : '你沒有額外資訊'
    case 'teammates':
      return v.seats.length ? `壞人隊友：${seatList(v.seats)}` : '你看不到任何壞人隊友'
    case 'isolated':
      return '你不認識隊友，隊友也不認識你'
    case 'none':
      return '你沒有額外資訊'
  }
}
