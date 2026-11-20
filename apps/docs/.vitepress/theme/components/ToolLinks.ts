import { listedTools } from '@avalon/registry'
import { defineComponent, h } from 'vue'

/**
 * Links that open the tools themselves. They live outside the docs, so `target="_self"`
 * keeps VitePress's router from treating them as docs pages (a full page load instead).
 */
export const ToolLinks = defineComponent({
  name: 'ToolLinks',
  setup() {
    return () =>
      h(
        'ul',
        listedTools()
          .filter((t) => t.status !== 'coming-soon')
          .map((t) =>
            h('li', [
              h('a', { href: t.path, target: '_self' }, `開啟${t.name}`),
              `：${t.description}`,
            ]),
          ),
      )
  },
})
