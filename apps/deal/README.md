# 角色發牌（`/deal/`）

一支手機輪流傳遞：設定人數與角色 → 開始發牌（隨機分配並立即存成歷史紀錄）→ 每位玩家長按卡背 2 秒看自己的角色、雙擊蓋牌交給下一位 → 全部看完。

設定頁用分頁區隔三種彼此獨立的模式（互不讀取對方的資料）：

- **發角色**：上述流程。
- **出任務**：只選出任務的人數（2–5 人），手機依序交給每一位出任務的玩家，長按後選「任務成功」或「任務失敗」（兩個按鈕位置每人隨機），全部出完後長按公布：「任務成功」或「N 張失敗」，牌一律先排成功再排失敗。結果存進歷史紀錄，並依出牌順序記下每一張牌（第 1 位、第 2 位……），公布結果時仍先排成功再排失敗。
- **湖中女神**：不需設定。手機交給被查驗的玩家選擇要亮出的身分，再交給持有者長按查看，看完雙擊蓋上；亮出的身分存進歷史紀錄。

歷史紀錄包含三種模式，合計保留最近 50 筆。發角色的紀錄可以「檢視」（長按一次顯示全部座位的角色，可切換依座位或依陣營呈現）或「回放」（用同一組結果再輪流傳一次手機，讓每位玩家各自重看，不會新增紀錄）；出任務直接顯示結果與出牌順序；湖中女神的結果需長按才顯示。

## 程式結構

| 檔案                                  | 內容                                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `packages/avalon-rules/src/roles.ts`  | 角色定義（名稱、陣營、是否唯一），各 app 共用                                                               |
| `packages/avalon-rules/src/rules.ts`  | 各人數的好人／壞人數                                                                                        |
| `packages/avalon-rules/src/vision.ts` | 視野計算 `visionFor`（純函式）                                                                              |
| `packages/ui/src/roleIcons.tsx`       | 角色圖示                                                                                                    |
| `src/roles/config.ts`                 | 可開關的特殊角色、補位角色、配置驗證 `checkConfig`、`rolesInPlay`                                           |
| `src/roles/text.ts`                   | 卡片上的能力說明、額外提示、視野文字                                                                        |
| `src/deal/shuffle.ts`                 | Fisher–Yates 洗牌與發牌（亂數來源見 `src/random.ts`，舊手機沒有 Web Crypto 時改用 `Math.random`）           |
| `src/history/records.ts`              | 三種紀錄的型別、舊紀錄讀取 `normalizeRecord`、保留上限 `MAX_RECORDS`（50）與修剪 `recordsToPrune`（純函式） |
| `src/history/store.ts`                | 儲存模組：IndexedDB（`avalon-deal`），失敗時用 localStorage（`avalon:deal:records`）                        |
| `src/flow/machine.ts`                 | 發牌與回放共用的流程狀態機（待機 → 翻牌 → 下一位 → 完成）                                                   |
| `src/quest/quest.ts`                  | 出任務：人數、按鈕隨機順序、出牌狀態機（只記失敗張數）                                                      |
| `src/lady/lady.ts`                    | 湖中女神：查驗狀態機（被查驗者選擇 → 持有者查看）                                                           |
| `src/settings.ts`                     | 設定（人數、角色），存在 `avalon:deal:settings`                                                             |

## 新增角色或調整規則

1. **新角色**：在 `packages/avalon-rules/src/types.ts` 的 `RoleId` 加上 id，並在 `roles.ts` 的 `ROLES` 加上名稱與陣營。
2. **視野**：在 `vision.ts` 的 `visionFor` 加上這個角色看到誰（必要時新增 `Vision` 種類），並在 `src/roles/text.ts` 的 `visionText` 寫出卡片文字。別忘了其他角色是否看得到它（例如梅林看不到莫德雷德、壞人看不到奧伯倫）。
3. **卡片文字與圖示**：`src/roles/text.ts` 的 `ABILITY`（必填）與 `EXTRA`，以及 `packages/ui/src/roleIcons.tsx` 的 `ROLE_ICONS`（TypeScript 會提醒缺少的項目）。
4. **可開關**：把 id 加進 `src/roles/config.ts` 的 `SPECIAL_ROLES`；需要提醒的組合加在 `checkConfig`。
5. **人數規則**：好人／壞人數在 `packages/avalon-rules/src/rules.ts` 的 `FACTION_COUNTS`。

每一項都有對應的單元測試（`vision.test.ts`、`config.test.ts`、`text.test.ts`），改規則時一起更新。
