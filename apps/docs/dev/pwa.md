# PWA 與快取

這一頁說明每個工具的 PWA 設定（scope、manifest、快取名稱）、更新流程，以及使用說明為什麼不做成 PWA。

## 每個工具一個 PWA

`@avalon/pwa` 的 `createPwaConfig(tool)` 依 registry 產生 vite-plugin-pwa 的設定：

- **manifest**：`id`、`scope`、`start_url` 都是工具路徑（首頁是 `/`），名稱為「阿瓦隆・工具名稱」（首頁是「阿瓦隆工具集」）。每個工具因此可以單獨安裝，互不覆蓋。
- **service worker**：在工具路徑下（`/record/sw.js` 等），預先快取這個 app 的檔案，離線時以 `index.html` 回應導覽。
- **快取名稱**：Workbox `cacheId` 為 `avalon-<id>`，不同工具的快取不會衝突。

<ToolTable />

## 巢狀 scope

首頁的 scope 是 `/`，涵蓋所有其他路徑。為了不讓首頁接手其他工具：

- 首頁 service worker 的 `navigateFallbackDenylist` 由 registry 產生，排除 `/record/`、`/deal/`、`/docs/` 等所有其他路徑；
- 每個 app 只預先快取自己 `dist/` 的檔案；
- `pnpm build` 會檢查建置出來的 `sw.js`：預先快取了別的 app 的檔案，或沒有排除別的 app 的導覽，建置就會失敗。

Workbox 內建的 `cleanupOutdatedCaches` 會刪除名稱**包含** scope 的快取，首頁（scope `/`）因此會誤刪 `/record/` 的快取，所以停用，改用 `sw-cleanup.js`：只刪除剛好在自己 scope、且不是自己的舊 precache（例如 1.x 的 `workbox-precache-v2-<網站>/`）。

## 更新流程

使用 `registerType: 'prompt'`，由 `@avalon/ui` 的 `UpdateGate` 控制：

1. 每次開啟工具（或在背景超過 5 分鐘後回來），顯示「檢查更新中…」並呼叫 `registration.update()`。
2. 有新版本時顯示「APP 更新中…」，立即啟用新的 service worker 並重新載入；10 秒內沒有接手也會重新載入。
3. 沒有新版本、離線，或 6 秒內沒有結果時，直接進入。

所以每次開啟都是最新版本，不會出現「舊版還在跑」的情況。開發模式（`pnpm dev`）不註冊 service worker。

`sw.js`、`sw-cleanup.js`、`workbox-*.js`、`*.webmanifest`、`*.html` 不能被伺服器長期快取，否則更新會延遲；GitHub Pages 的快取時間是 10 分鐘。其他平台的設定見 `docs/deploy.md`。

## 為什麼使用說明不做 PWA

- 文件會經常修改，希望讀者每次都看到最新內容，不需要「檢查更新」；
- 文件不需要離線使用；
- 文件站沒有需要保存的資料。

因此 `apps/docs`：

- 不依賴 `vite-plugin-pwa` 或任何 PWA 套件，不產生 manifest，也不註冊 service worker（`pnpm build` 會檢查）；
- registry 中標示為 `kind: 'docs'`：首頁的 service worker 排除 `/docs/` 的導覽，`pnpm icons` 也會略過它。

::: warning 首頁 scope 的限制
首頁的 scope `/` 在技術上涵蓋 `/docs/`，scope 無法排除子路徑。所以裝過首頁 PWA 的瀏覽器，在 DevTools 會看到首頁的 service worker「控制」`/docs/` 頁面；但它不回應這些請求，所有內容都直接向網路取得。
:::

### 從工具開啟使用說明

工具裡的說明按鈕一律用新分頁開啟（`target="_blank" rel="noopener"`），所以：

- 進行中的遊戲不會被換掉；
- 從已安裝的工具 App（例如 scope `/record/`）開啟時，說明在 App 的 scope 之外，會交給瀏覽器開啟，而不是在 App 視窗裡跳轉。

::: warning 待確認
從已安裝的**首頁** App 開啟 `/docs/` 時，因為 `/docs/` 在首頁的 scope 內，各平台（iOS、Android、桌面版 Chrome）是開在 App 視窗、新視窗還是瀏覽器，需要實機測試確認。
:::
