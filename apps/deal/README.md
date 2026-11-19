# 角色發牌（`/deal/`）

一支手機輪流傳遞：設定人數與角色 → 開始發牌（隨機分配並立即存成歷史紀錄）→ 每位玩家長按卡背 2 秒看自己的角色、雙擊蓋牌交給下一位 → 全部看完。

## 程式結構

| 檔案                                  | 內容                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `packages/avalon-rules/src/roles.ts`  | 角色定義（名稱、陣營、是否唯一），各 app 共用                                        |
| `packages/avalon-rules/src/rules.ts`  | 各人數的好人／壞人數                                                                 |
| `packages/avalon-rules/src/vision.ts` | 視野計算 `visionFor`（純函式）                                                       |
| `packages/ui/src/roleIcons.tsx`       | 角色圖示                                                                             |
| `src/roles/config.ts`                 | 可開關的特殊角色、補位角色、配置驗證 `checkConfig`、`rolesInPlay`                    |
| `src/roles/text.ts`                   | 卡片上的能力說明、額外提示、視野文字                                                 |
| `src/deal/shuffle.ts`                 | `crypto.getRandomValues` + Fisher–Yates 洗牌與發牌                                   |
| `src/history/records.ts`              | 紀錄型別與修剪 `recordsToPrune`（純函式）                                            |
| `src/history/store.ts`                | 儲存模組：IndexedDB（`avalon-deal`），失敗時用 localStorage（`avalon:deal:records`） |
| `src/flow/machine.ts`                 | 發牌流程狀態機（待機 → 翻牌 → 下一位 → 完成）                                        |
| `src/settings.ts`                     | 設定（人數、角色、保留筆數），存在 `avalon:deal:settings`                            |

## 新增角色或調整規則

1. **新角色**：在 `packages/avalon-rules/src/types.ts` 的 `RoleId` 加上 id，並在 `roles.ts` 的 `ROLES` 加上名稱與陣營。
2. **視野**：在 `vision.ts` 的 `visionFor` 加上這個角色看到誰（必要時新增 `Vision` 種類），並在 `src/roles/text.ts` 的 `visionText` 寫出卡片文字。別忘了其他角色是否看得到它（例如梅林看不到莫德雷德、壞人看不到奧伯倫）。
3. **卡片文字與圖示**：`src/roles/text.ts` 的 `ABILITY`（必填）與 `EXTRA`，以及 `packages/ui/src/roleIcons.tsx` 的 `ROLE_ICONS`（TypeScript 會提醒缺少的項目）。
4. **可開關**：把 id 加進 `src/roles/config.ts` 的 `SPECIAL_ROLES`；需要提醒的組合加在 `checkConfig`。
5. **人數規則**：好人／壞人數在 `packages/avalon-rules/src/rules.ts` 的 `FACTION_COUNTS`。

每一項都有對應的單元測試（`vision.test.ts`、`config.test.ts`、`text.test.ts`），改規則時一起更新。
