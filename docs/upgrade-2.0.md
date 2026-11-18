# 從 1.x 升級到 2.0

## 使用者會看到什麼

| 1.x                                   | 2.0                                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| `https://<網站>/` 是阿瓦隆紀錄        | `/` 是阿瓦隆工具集首頁，遊戲紀錄在 `/record/`                                       |
| 安裝的 App「阿瓦隆」                  | 原本的 App 自動更新成首頁（名稱「阿瓦隆工具集」）；遊戲紀錄可另外安裝成「遊戲紀錄」 |
| 書籤 `/#/play/<id>`、分享連結 `/?s=…` | 自動轉到 `/record/#/play/<id>`、`/record/?s=…`                                      |

已安裝的 1.x App 第一次以 2.0 開啟時，首頁會顯示一次說明卡，可直接打開遊戲紀錄。

## 資料搬移

遊戲紀錄每次啟動時執行 `apps/record/src/migration/fromV1.ts`：

| 1.x                                                | 2.0                                        |
| -------------------------------------------------- | ------------------------------------------ |
| localStorage `avalon-recorder:settings` 的 `theme` | `avalon:global:theme`（所有工具共用）      |
| `avalon-recorder:settings` 的其他欄位              | `avalon:record:<欄位>`（每個設定一個 key） |
| `avalon-recorder:session`                          | `avalon:record:session`                    |
| `avalon-recorder:ui:*`（記錄到一半的內容）         | `avalon:record:ui:*`                       |
| IndexedDB `avalon-recorder`                        | IndexedDB `avalon-record`                  |

- 新位置已有值時不覆蓋，所以可以重複執行；遊戲複製後逐筆確認都在新資料庫中才算完成。
- 完成後寫入 `avalon:global:migratedFrom = 1.9.1` 與 `avalon:global:legacyCleanupAfter = 2.1.0`。
- 1.x 資料不刪除，保留到 2.1.0 之後再清除。
- 失敗時不寫入完成標記（下次開啟再試），並顯示「舊版資料搬移失敗」，可匯出 1.x 遊戲的 JSON 備份。
- 主題的防閃爍腳本在新 key 不存在時讀 `avalon-recorder:settings`，升級後第一次開啟也不會閃色。

## Service worker 與快取

- 1.x 的 service worker 在 `/sw.js`，2.0 的首頁沿用同一路徑與 manifest id（`/`），所以已安裝的 App 原地更新；1.x 的自動更新會立即套用新版。
- 每個工具的 service worker 只在自己的 scope 內（首頁 `/`、遊戲紀錄 `/record/`），快取名稱以 `avalon-<id>` 開頭。
- 首頁的 service worker 不處理其他工具路徑的導覽（`navigateFallbackDenylist`），也不 precache 它們的檔案。
- 各工具啟動時只刪除「剛好在自己 scope」的舊 precache，因此會清掉 1.x 的 `workbox-precache-v2-<網站>/`，但不會碰到 `/record/` 的快取（Workbox 內建的清理會誤刪，所以停用）。首頁頁面也會直接刪除 1.x 快取。

## 開發者

- `apps/web` → `apps/record`、`packages/core` → `packages/record-core`；新增 `packages/avalon-rules`、`registry`、`storage`、`ui`、`pwa`。
- 儲存一律透過 `@avalon/storage` 的 `storageKey(appId, name)`、`globalKey(name)`、`appDatabaseName(appId)`。
- 部署改為上傳整個 `dist/`（`pnpm build` 組合），見 [deploy.md](deploy.md)。
