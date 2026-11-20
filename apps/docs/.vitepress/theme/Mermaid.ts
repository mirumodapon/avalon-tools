import { useData } from 'vitepress'
import { defineComponent, h, onMounted, ref, watch } from 'vue'

let seq = 0

/** Reads a Catppuccin token from the page, so diagrams use the site's colors. */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--ctp-${name}`).trim()
}

/** A Mermaid diagram, rendered in the browser and redrawn when light/dark changes. */
export const Mermaid = defineComponent({
  name: 'Mermaid',
  props: { code: { type: String, required: true } },
  setup(props) {
    const { isDark } = useData()
    const svg = ref('')
    const failed = ref(false)

    async function render() {
      const { default: mermaid } = await import('mermaid')
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        // mermaid 12 lays flowcharts out with ELK by default; ELK is not bundled (elkStub.ts).
        layout: 'dagre',
        flowchart: { htmlLabels: false },
        // Measured and drawn with the same font, so labels are never clipped.
        fontFamily: getComputedStyle(document.body).fontFamily,
        themeVariables: {
          darkMode: isDark.value,
          background: token('base'),
          primaryColor: token('surface0'),
          primaryTextColor: token('text'),
          primaryBorderColor: token('accent'),
          secondaryColor: token('mantle'),
          tertiaryColor: token('crust'),
          lineColor: token('overlay1'),
          textColor: token('text'),
          clusterBkg: token('mantle'),
          clusterBorder: token('surface2'),
        },
      })
      try {
        const out = await mermaid.render(`mermaid-${++seq}`, decodeURIComponent(props.code))
        svg.value = out.svg
        failed.value = false
      } catch (e) {
        // Shown as the diagram's source instead; keep the reason for whoever debugs it.
        console.error('[mermaid]', e)
        failed.value = true
      }
    }

    onMounted(render)
    // The flavor attribute flips in the same tick as `.dark`; wait for it.
    watch(isDark, () => requestAnimationFrame(() => void render()))

    return () =>
      failed.value
        ? h('pre', { class: 'mermaid-error' }, decodeURIComponent(props.code))
        : h('div', { class: 'mermaid', innerHTML: svg.value })
  },
})
