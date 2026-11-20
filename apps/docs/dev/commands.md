# 常用指令

這一頁列出開發、建置、檢查與測試的指令。

需要 Node 24 以上與 pnpm 12（版本由根目錄 `package.json` 的 `packageManager` 指定，corepack 會自動使用）。

## 開發

```sh
pnpm install
pnpm dev                    # 所有 app 的 dev server，同源 proxy 在 http://localhost:5173/
pnpm dev --filter record    # 只啟動指定的 app（可重複）
pnpm dev --filter docs      # 只啟動使用說明
pnpm dev --port 5200        # 改用其他 port
```

`scripts/dev.ts` 為每個 app 啟動自己的 dev server（工具用 Vite，使用說明用 `vitepress dev`），再用一個 proxy 依最長路徑前綴轉發，所以 `/record/` 與 `/docs/` 和正式環境一樣在同一個網域下，共用 localStorage。

也可以單獨在 app 目錄執行：

```sh
pnpm --filter @avalon/docs dev       # vitepress dev（http://localhost:5173/docs/）
pnpm --filter @avalon/docs build     # typecheck 後 vitepress build，輸出到 apps/docs/dist
```

## 建置與預覽

```sh
pnpm build      # 建置 registry 中所有 app，組合到 dist/
pnpm preview    # 以 GitHub Pages 的規則提供 dist/（預設 http://localhost:4173/）
```

`pnpm build`（`scripts/build-all.ts`）會檢查：

- 每個 PWA 都有 `index.html`、`manifest.webmanifest`、`sw.js`；
- 使用說明**沒有** `manifest.webmanifest` 與 `sw.js`；
- 每個 app 都有 `licenses.txt`（見下方「授權」）；
- 沒有 service worker 預先快取其他 app 的檔案，或接手其他 app 的導覽（例如首頁的 `sw.js` 必須排除 `/docs/`）。

## 授權

專案本身以 MIT 授權釋出（根目錄 `LICENSE`）。

每個 app 的 Vite 設定都掛著 `@avalon/licenses` 的 `thirdPartyLicensesPlugin`。建置時它找出實際打包進瀏覽器端的 npm 套件，產生 `licenses.txt`（套件清單、各套件的授權全文，以及 Apache-2.0 套件的 NOTICE），放在 app 的根目錄，例如 `/record/licenses.txt`。首頁「資訊 → 授權」與使用說明首頁的頁尾都有連結。

只允許寬鬆授權（`ALLOWED_LICENSES`：MIT、ISC、BSD、Apache-2.0 等）。打包進去的套件若是 GPL、LGPL、EPL、MPL 這類授權，或無法判斷授權，**建置會失敗**；雙授權的套件會選用允許的那一個（例如 dompurify 以 Apache-2.0 使用）。只在建置時使用的工具（sharp、lightningcss 等）不會進入網站，不受這個限制。

mermaid 的 ELK 版面（elkjs，EPL-2.0 / GPL-3.0）因此不打包：文件站把 `elkjs` 換成空模組，圖表一律用 dagre 版面。

`pnpm preview` 和 GitHub Pages 一樣：資料夾導向結尾斜線、無副檔名的路徑找同名 `.html`、找不到時回 `404.html`。

## 檢查

```sh
pnpm lint           # oxlint，以及 catalog、app 邊界、版本檢查
pnpm format         # oxfmt（含 Markdown）
pnpm format:check   # 只檢查格式
pnpm typecheck      # scripts/ 與所有 app、套件（tsc）
pnpm test           # vitest（所有 app 與套件）
```

CI（`.github/workflows/deploy.yml`）在部署前依序執行 `lint`、`format:check`、`typecheck`、`test`。

## 其他

```sh
pnpm icons [id...]   # 由 registry 的圖示與顏色產生各 PWA 的圖示（使用說明除外）
pnpm new:app <id>    # 新增工具，見「新增工具」
```
