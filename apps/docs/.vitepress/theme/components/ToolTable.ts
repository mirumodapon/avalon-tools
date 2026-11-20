import { isPwa, tools } from '@avalon/registry'
import { defineComponent, h } from 'vue'

const STATUS = { stable: '穩定', rc: 'rc', beta: 'beta', 'coming-soon': '即將推出' } as const

/** Every registry entry with its path and PWA scope, straight from @avalon/registry. */
export const ToolTable = defineComponent({
  name: 'ToolTable',
  setup() {
    return () =>
      h('table', [
        h(
          'thead',
          h(
            'tr',
            ['id', '名稱', '路徑／scope', '狀態', 'PWA 快取名稱'].map((c) => h('th', c)),
          ),
        ),
        h(
          'tbody',
          tools.map((t) => {
            const built = t.status !== 'coming-soon'
            return h('tr', [
              h('td', h('code', t.id)),
              h('td', { class: 'nowrap' }, t.name),
              h('td', h('code', t.path)),
              h('td', { class: 'nowrap' }, STATUS[t.status]),
              h(
                'td',
                !built ? '（沒有 app）' : isPwa(t) ? h('code', `avalon-${t.id}`) : '不是 PWA',
              ),
            ])
          }),
        ),
      ])
  },
})
