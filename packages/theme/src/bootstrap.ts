import { FLAVOR_NAMES } from './palette.ts'
import { DEFAULT_THEME, PREFERS_DARK_QUERY, themeColorOf } from './settings.ts'

export interface BootstrapOptions {
  /** localStorage key holding `{ version, data: { theme } }`. */
  storageKey: string
}

/**
 * Returns a self-contained inline script that applies the stored theme before
 * React mounts, preventing a flash of the wrong theme.
 */
export function themeBootstrapScript({ storageKey }: BootstrapOptions): string {
  const themeColors = Object.fromEntries(FLAVOR_NAMES.map((f) => [f, themeColorOf(f)]))
  const body = `(function(){try{
var d=${JSON.stringify(DEFAULT_THEME)},c=${JSON.stringify(themeColors)},t=d;
try{var raw=localStorage.getItem(${JSON.stringify(storageKey)});var p=raw&&JSON.parse(raw);if(p&&p.data&&p.data.theme)t=p.data.theme}catch(e){}
var dark=window.matchMedia&&window.matchMedia(${JSON.stringify(PREFERS_DARK_QUERY)}).matches;
var f=t.flavor in c?t.flavor:(dark?(t.darkFlavor in c?t.darkFlavor:d.darkFlavor):'latte');
var r=document.documentElement;r.setAttribute('data-flavor',f);r.setAttribute('data-accent',t.accent||d.accent);
var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m)}m.content=c[f];
}catch(e){}})()`
  return body.replace(/\n/g, '')
}
