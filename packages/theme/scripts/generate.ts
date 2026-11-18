import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { generateThemeCss } from '../src/css.ts'

const target = fileURLToPath(new URL('../src/flavors.generated.css', import.meta.url))
writeFileSync(target, generateThemeCss())
console.warn(`wrote ${target}`)
