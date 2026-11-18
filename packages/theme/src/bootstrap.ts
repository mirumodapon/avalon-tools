import { DARK_FLAVOR, LIGHT_FLAVOR } from './palette.ts'
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
  const j = JSON.stringify
  const body = `(function(){try{
var d=${j(DEFAULT_THEME)},t=d,L=${j(LIGHT_FLAVOR)},D=${j(DARK_FLAVOR)},c={};c[L]=${j(themeColorOf(LIGHT_FLAVOR))};c[D]=${j(themeColorOf(DARK_FLAVOR))};
try{var raw=localStorage.getItem(${j(storageKey)});var p=raw&&JSON.parse(raw);if(p&&p.data&&p.data.theme)t=p.data.theme}catch(e){}
var m=t.mode;if(m!=='light'&&m!=='dark'&&m!=='system'){m=t.flavor==='latte'?'light':(t.flavor&&t.flavor!=='system'?'dark':'system')}
var dark=m==='dark'||(m==='system'&&window.matchMedia&&window.matchMedia(${j(PREFERS_DARK_QUERY)}).matches);
var f=dark?D:L;
var r=document.documentElement;r.setAttribute('data-flavor',f);r.setAttribute('data-accent',t.accent||d.accent);
var meta=document.querySelector('meta[name="theme-color"]');if(!meta){meta=document.createElement('meta');meta.name='theme-color';document.head.appendChild(meta)}meta.content=c[f];
}catch(e){}})()`
  return body.replace(/\n/g, '')
}
