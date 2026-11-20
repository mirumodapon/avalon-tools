import { defineComponent, h } from 'vue'
import { exportFields } from '../../data/exportFormat.ts'

/** The fields of an exported game, generated from the record's zod schema. */
export const ExportFieldTable = defineComponent({
  name: 'ExportFieldTable',
  setup() {
    return () =>
      h('table', [
        h(
          'thead',
          h(
            'tr',
            ['欄位', '型別', '必填', '說明'].map((c) => h('th', c)),
          ),
        ),
        h(
          'tbody',
          exportFields().map((f) =>
            h('tr', [
              h('td', h('code', f.path)),
              h('td', [
                h('code', f.type),
                ...(f.nullable ? [' 或 ', h('code', 'null')] : []),
                ...(f.limits ? [h('br'), h('small', f.limits)] : []),
              ]),
              h('td', f.required ? '是' : '否'),
              h('td', f.description),
            ]),
          ),
        ),
      ])
  },
})
