# 資料儲存

這一頁說明各工具把資料存在哪裡：localStorage 的命名空間、IndexedDB 的結構，以及資料格式升級（migration）的做法。

## 命名規則

一律透過 `@avalon/storage` 產生名稱，不直接寫字串：

| 函式                      | 結果                    | 用途                           |
| ------------------------- | ----------------------- | ------------------------------ |
| `globalKey(name)`         | `avalon:global:<name>`  | 所有工具共用（目前主要是主題） |
| `storageKey(appId, name)` | `avalon:<appId>:<name>` | 單一工具自己的設定             |
| `appDatabaseName(appId)`  | `avalon-<appId>`        | 單一工具的 IndexedDB           |

各工具只讀寫自己的命名空間與 `global`，彼此不讀寫對方的資料。

## localStorage

每個值都存成 `{ "version": N, "data": … }`，由 `StoreSpec` 描述：

```ts
interface StoreSpec<T> {
  key: string // storageKey() / globalKey()
  version: number
  migrations?: Record<number, Migration> // migrations[n]：版本 n → n + 1
  parse: (data: unknown) => T // 驗證；丟出錯誤時改用 fallback
  fallback: () => T
}
```

- `readStore(spec)` 不會丟出錯誤：版本較舊時依序執行 migration，資料損毀時回傳 `fallback()`。
- `writeStore(spec, data)` 失敗（例如空間不足）時回傳 `false`，並通知 `onStorageError` 的訂閱者。
- `onStoreChange(key, cb)` 監聽其他分頁或其他工具的修改（`storage` 事件），主題就是這樣跨工具同步。

目前使用的 key：

| Key                                | 內容                                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `avalon:global:theme`              | 主題 `{ mode, accent }`，所有工具與使用說明共用                                                          |
| `avalon:global:migratedFrom`       | 1.x 資料搬移完成的標記                                                                                   |
| `avalon:global:legacyCleanupAfter` | 1.x 資料可以清除的版本                                                                                   |
| `avalon:record:<設定欄位>`         | 遊戲紀錄的設定，每個欄位一個 key（預設紀錄模式、名冊、命名規則等）                                       |
| `avalon:record:session`            | 遊戲紀錄關閉前的畫面與捲動位置                                                                           |
| `avalon:record:ui:*`               | 遊戲紀錄記錄到一半的內容                                                                                 |
| `avalon:deal:settings`             | 角色發牌的設定 `{ playerCount, special, recordView, tab }`（人數、特殊角色、檢視的呈現方式、上次的分頁） |
| `avalon:deal:records`              | 角色發牌的歷史紀錄（只在 IndexedDB 無法使用時）                                                          |
| `avalon:home:upgradeNotice`        | 首頁的 1.x 升級說明卡是否已顯示                                                                          |

使用說明（VitePress）另外有 `vitepress-theme-appearance`，開啟時從 `avalon:global:theme` 同步，切換深淺色時再寫回去。

## IndexedDB

使用 Dexie。

| 資料庫          | Table     | 索引                                             | 內容                                        |
| --------------- | --------- | ------------------------------------------------ | ------------------------------------------- |
| `avalon-record` | `games`   | `id`, `createdAt`, `date`, `winner`, `updatedAt` | 一場遊戲一筆（[匯出格式](./export-format)） |
| `avalon-deal`   | `records` | `id`, `createdAt`                                | 發角色、出任務、湖中女神的紀錄，最多 50 筆  |

遊戲紀錄的 UI 只透過 `GameRepository` 存取資料庫；每次操作後延遲寫入，頁面隱藏時立即寫入。啟動時會申請 `navigator.storage.persist()`，降低瀏覽器自動清除資料的機會。

## 資料遷移

| 要改的東西           | 做法                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| localStorage 的值    | 提高 `StoreSpec.version`，在 `migrations[舊版本]` 加上轉換                              |
| 遊戲資料（匯出格式） | 提高 `SCHEMA_VERSION`，在 `packages/record-core/src/schema.ts` 的 `MIGRATIONS` 加上步驟 |
| IndexedDB 的索引     | 提高 Dexie 的 `version()`，加上新的 `stores()`                                          |
| 角色發牌的舊紀錄     | `normalizeRecord` 在讀取時補上預設值（例如沒有 `kind` 的舊紀錄視為發角色）              |

1.x（阿瓦隆紀錄）到 2.0 的資料搬移見「更新紀錄」的升級說明。
