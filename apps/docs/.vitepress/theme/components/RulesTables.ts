import { defineComponent, h } from 'vue'
import { defaultConfigRows, playerCountRows, roleRows } from '../../data/rules.ts'

const QUESTS = [1, 2, 3, 4, 5]

function table(head: string[], rows: (string | ReturnType<typeof h>)[][]) {
  return h('table', [
    h(
      'thead',
      h(
        'tr',
        head.map((c) => h('th', c)),
      ),
    ),
    h(
      'tbody',
      rows.map((r) =>
        h(
          'tr',
          r.map((c) => h('td', [c])),
        ),
      ),
    ),
  ])
}

const faction = (f: 'good' | 'evil', text: string) => h('span', { class: `faction-${f}` }, text)

/** 出隊人數 per player count; the quests that need two fail cards are marked. */
export const QuestSizeTable = defineComponent({
  name: 'QuestSizeTable',
  setup() {
    return () =>
      h('div', [
        table(
          ['人數', ...QUESTS.map((q) => `第 ${q} 次任務`)],
          playerCountRows().map((r) => [
            `${r.players} 人`,
            ...r.quests.map((q) =>
              q.fails > 1
                ? h('span', [`${q.size} 人`, h('strong', { class: 'two-fails' }, '＊')])
                : `${q.size} 人`,
            ),
          ]),
        ),
        h('p', { class: 'table-note' }, '＊ 這次任務需要出現兩張失敗，任務才會失敗。'),
      ])
  },
})

/** 好人／壞人 per player count. */
export const FactionCountTable = defineComponent({
  name: 'FactionCountTable',
  setup() {
    return () =>
      table(
        ['人數', '好人', '壞人'],
        playerCountRows().map((r) => [
          `${r.players} 人`,
          faction('good', `${r.good} 位`),
          faction('evil', `${r.evil} 位`),
        ]),
      )
  },
})

/** Each role's faction and ability. */
export const RoleTable = defineComponent({
  name: 'RoleTable',
  setup() {
    return () =>
      table(
        ['角色', '陣營', '能力'],
        roleRows().map((r) => [
          h('span', [h('strong', r.name), h('br'), h('small', r.nameEn)]),
          faction(r.faction, r.factionLabel),
          r.unique ? r.ability : `${r.ability}（可以有多位）`,
        ]),
      )
  },
})

/** What each role learns at night, and who learns about it. */
export const VisionTable = defineComponent({
  name: 'VisionTable',
  setup() {
    return () =>
      table(
        ['角色', '夜晚看到', '看到的角色', '被誰看到'],
        roleRows().map((r) => [
          faction(r.faction, r.name),
          r.sees,
          r.seesRoles.join('、') || '—',
          r.seenBy.join('、') || '—',
        ]),
      )
  },
})

/** The setups the game record fills in when 角色配置 is turned on. */
export const DefaultConfigTable = defineComponent({
  name: 'DefaultConfigTable',
  setup() {
    return () =>
      table(
        ['人數', '角色'],
        defaultConfigRows().map((r) => [
          `${r.players} 人`,
          h(
            'span',
            r.roles.flatMap((role, i) => [
              ...(i ? ['、'] : []),
              faction(role.faction, role.count > 1 ? `${role.name} ×${role.count}` : role.name),
            ]),
          ),
        ]),
      )
  },
})
