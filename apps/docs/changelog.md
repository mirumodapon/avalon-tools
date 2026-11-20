# 更新紀錄

這一頁列出每個版本的變更，以及從 1.x（阿瓦隆紀錄）升級到 2.0 時會發生什麼。

整個工具集共用一個版本號，目前的版本可以在首頁的「資訊」頁看到。工具每次開啟時會自動更新到最新版本，不需要手動操作。

## 從 1.x 升級到 2.0

2.0 把原本的「阿瓦隆紀錄」擴充成「阿瓦隆工具集」，遊戲紀錄成為其中一個工具。

### 使用者會看到什麼

| 1.x                                | 2.0                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| 網站首頁就是阿瓦隆紀錄             | 首頁是阿瓦隆工具集，遊戲紀錄在 `/record/`                                             |
| 安裝的 App「阿瓦隆」               | 原本的 App 自動更新成首頁（名稱「阿瓦隆工具集」）；遊戲紀錄可以另外安裝成「遊戲紀錄」 |
| 書籤 `/#/play/…`、分享連結 `/?s=…` | 自動轉到 `/record/#/play/…`、`/record/?s=…`                                           |

已安裝的 1.x App 第一次以 2.0 開啟時，首頁會顯示一次說明卡，可以直接打開遊戲紀錄。

### 資料

- 遊戲紀錄第一次開啟時，會自動把 1.x 的遊戲、設定、主題與記錄到一半的內容搬到新的位置，不需要任何操作，可以重複執行。
- 1.x 的資料目前仍保留在手機裡，不會被刪除。
- 搬移失敗時會顯示「舊版資料搬移失敗」，並提供 1.x 遊戲的 JSON 備份下載；下次開啟會再試一次。

::: warning 待確認
搬移時會標記「2.1.0 之後可以清除 1.x 資料」（`avalon:global:legacyCleanupAfter`），但目前還沒有實作清除。何時清除、是否通知使用者，需要確認。
:::

::: tip 建議
升級前若擔心資料，可以先在 1.x 的設定頁匯出全部遊戲，升級後在遊戲紀錄的「設定 → 資料備份 → 匯入」還原。
:::

### 開發者

- `apps/web` 改名為 `apps/record`，`packages/core` 改名為 `packages/record-core`；新增 `avalon-rules`、`registry`、`storage`、`ui`、`pwa` 等套件，見[架構](./dev/architecture)。
- 部署改為上傳整個 `dist/`（`pnpm build` 組合），見[部署](./dev/deploy)。

#### 資料搬移對照

遊戲紀錄每次啟動時執行 `apps/record/src/migration/fromV1.ts`：

| 1.x                                                | 2.0                                        |
| -------------------------------------------------- | ------------------------------------------ |
| localStorage `avalon-recorder:settings` 的 `theme` | `avalon:global:theme`（所有工具共用）      |
| `avalon-recorder:settings` 的其他欄位              | `avalon:record:<欄位>`（每個設定一個 key） |
| `avalon-recorder:session`                          | `avalon:record:session`                    |
| `avalon-recorder:ui:*`（記錄到一半的內容）         | `avalon:record:ui:*`                       |
| IndexedDB `avalon-recorder`                        | IndexedDB `avalon-record`                  |

- 新位置已有值時不覆蓋，所以可以重複執行；遊戲複製後逐筆確認都在新資料庫中才算完成。
- 完成後寫入 `avalon:global:migratedFrom = 1.9.1` 與 `avalon:global:legacyCleanupAfter = 2.1.0`。失敗時不寫入完成標記，下次開啟再試。
- 主題的防閃爍腳本在新 key 不存在時讀 `avalon-recorder:settings`，升級後第一次開啟也不會閃色。

儲存的命名規則見[資料儲存](./dev/storage)。

#### Service worker 與快取

- 1.x 的 service worker 在 `/sw.js`，2.0 的首頁沿用同一路徑與 manifest id（`/`），所以已安裝的 App 原地更新；1.x 的自動更新會立即套用新版。
- 每個工具的 service worker 只在自己的 scope 內，快取名稱以 `avalon-<id>` 開頭；首頁不處理其他工具路徑的導覽，也不預先快取它們的檔案。
- 各工具啟動時只刪除「剛好在自己 scope」的舊 precache，因此會清掉 1.x 的 `workbox-precache-v2-<網站>/`，但不會碰到 `/record/` 的快取。首頁頁面也會直接刪除 1.x 快取。

詳見 [PWA 與快取](./dev/pwa)。

<!--@include: ../../CHANGELOG.md{3,}-->
