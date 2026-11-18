# 阿瓦隆紀錄 Avalon Recorder

在實體《阿瓦隆（The Resistance: Avalon）》桌遊進行時，用手機依序記錄每一輪的組隊、投票、任務結果與湖中女神，隨時呈現進度；遊戲結束後可保存、瀏覽、匯出與匯入紀錄。手機優先、可安裝為 PWA、離線可用。

## 功能

- **開局設定**：5–10 人、座位順序、第一位隊長、從玩家名冊依座位順序點選帶入、遊戲名稱（可留空自動命名）、角色配置與指派（可選）、湖中女神（7 人以上預設開啟）。
- **派票記錄**：
  - 依座位順時針輪替隊長，隊員人數不符無法送出；贊成票嚴格過半才通過。
  - 兩種輸入方式，可隨時切換且內容不遺失：**派票**（點贊成者）、**派跳**（只點場外白／場內黑）。
  - 新的派票自動沿用上一次使用的輸入方式。
  - 第 5 次派票為**強制局**；可設定自動記為全員贊成。
- **任務**：記錄失敗票數；7 人以上第 4 局需 2 張失敗。3 敗壞人勝；3 成功進入刺殺（已指派梅林時自動判定）。
- **湖中女神**：第 2、3、4 個任務後使用，不可跳過，記錄後不提供編輯（可用「復原上一步」）；不能查驗自己或曾持有者。
- **進度總覽**：任務圓點（含需 2 敗、湖中女神時機）、目前隊長、派票次數與強制局警示、湖中女神持有者。
- **歷史表格**：每個任務一張表（座位號為欄），派票檢視／派跳檢視切換；任務表以顏色標出當局湖中女神持有者。「顯示設定」可切換顯示角色、局次結果與湖中結果的簡化／詳細，以及湖中女神與任務的緊密（每局後一列）／分離（上方一列查驗順序，如 `3 → 4 (好) → 6 (壞)`）。進行中的遊戲角色預設隱藏。
- **結算與瀏覽**：勝方、刺殺修正、角色指派、名稱與備註；遊戲列表可搜尋名稱與備註、依勝方與日期篩選、刪除、複製為新局；賽後統計。
- **匯出**：遊戲紀錄頁最下方「匯出這場」提供單場 JSON（完整、可還原）、CSV、Markdown、純文字（逐次派票的完整過程）、PNG；可選呈現方式與是否包含角色；下載、複製、Web Share。設定頁「資料備份」提供全部匯出（JSON 陣列）與匯入。
- **分享連結**：遊戲詳情右上角「分享」呼叫 Web Share API（不支援時顯示可複製的連結）。整場紀錄壓縮在網址 `?s=` 參數中（10 人完整一局約 300 字元）；對方開啟後可預覽並「匯入到本機」。
- **匯入**：單場或多場 JSON，zod 驗證、清楚的錯誤訊息；ID 重複時可選覆蓋或另存；單一 transaction，失敗整批回滾。
- **主題**：Catppuccin，系統／淺色（Latte）／深色（Macchiato）與 14 種強調色，載入前套用避免閃爍。

## 開發

需要 Node 22+ 與 pnpm 10。

```sh
pnpm install
pnpm dev            # 開發伺服器（apps/web）
pnpm build          # 型別檢查並建置所有套件
pnpm lint           # oxlint
pnpm format         # oxfmt（format:check 只檢查）
pnpm typecheck
pnpm test           # vitest（core、theme、web）
```

其他指令：

```sh
pnpm --filter @avalon/theme generate   # 由 @catppuccin/palette 重新產生 flavors.generated.css
pnpm --filter @avalon/web icons        # 重新產生 PWA 圖示（Tabler crown + Catppuccin）
```

## 部署（GitHub Pages）

`.github/workflows/deploy.yml` 在推送到 `main`（或手動執行）時，執行 lint、format:check、typecheck、test，再建置並部署 `apps/web/dist`。

1. 在 GitHub 專案的 **Settings → Pages → Build and deployment** 將 Source 設為 **GitHub Actions**。
2. 推送到 `main`。

base path 由 `actions/configure-pages` 自動提供：專案站台為 `/<repo>/`，自訂網域或使用者站台為 `/`。本機可用 `BASE_PATH=/repo/ pnpm build` 模擬。

## 專案結構

```
apps/web/            Vite + React 19 PWA（UI、IndexedDB repository、匯出 UI）
packages/core/       純 TS：規則、型別、reducer、投票轉換、角色、湖中女神、命名範本、schema、匯出格式
packages/theme/      Catppuccin 色票 → CSS 變數與 Tailwind 語意 token、防閃爍腳本
packages/tsconfig/   共用 tsconfig
```

`packages/core` 不依賴 React 或 icon 套件；角色與 icon 的對應在 `apps/web/src/roles/roleIcons.tsx`。

## 資料與儲存

- **遊戲**：IndexedDB（Dexie），一場一筆，索引 `createdAt`、`date`、`winner`。UI 只透過 `GameRepository` 存取；每次動作後 debounce 寫入，頁面隱藏時立即寫入。啟動時申請 `navigator.storage.persist()`。
- **設定**（主題、強調色、預設模式、命名規則、名冊、顯示選項）：localStorage `avalon-recorder:settings`，格式 `{ version, data }`，可 migration。

### 遊戲 JSON（`schemaVersion: 1`）

```jsonc
{
  "schemaVersion": 1,
  "id": "…",
  "createdAt": "2026-11-18T12:00:00.000Z",
  "updatedAt": "…",
  "savedAt": null, // 結算保存時間
  "name": { "custom": null, "auto": "2026-11-18 第3場", "seq": 3 },
  "note": "地點、特殊規則…",
  "players": [{ "id": "p1", "name": "阿明" }], // 陣列順序即座位（順時針）
  "firstLeaderId": "p1",
  "roleConfig": { "merlin": 1, "loyal": 2 }, // 或 null
  "roleAssignment": { "p1": "merlin" }, // 可只填部分
  "rounds": [
    {
      "proposals": [
        {
          "id": "q1-p1",
          "leaderId": "p1",
          "team": ["p1", "p2"],
          "votes": { "p1": "approve", "p2": "reject" }, // 一律存完整投票
          "inputMode": "approvals", // 或 "anomalies"，只記錄當初怎麼輸入
          "forced": false,
        },
      ],
      "result": { "failCount": 0 },
    },
  ],
  "assassination": { "targetId": "p3", "manualHit": null },
  "lady": {
    "initialHolderId": "p7",
    "uses": [
      { "afterQuest": 1, "holderId": "p7", "targetId": "p3", "declared": "good", "note": "" },
    ],
  },
}
```

勝方、目前階段、隊長等皆由 `deriveState(game)` 推導，不存入資料。

分享連結使用另一種精簡格式（`packages/core/src/share.ts`）：玩家以座位索引表示，每次派票壓成一個整數（隊長、隊員與贊成者的位元遮罩、輸入方式），再以 deflate-raw 壓縮並 base64url 編碼，前綴 `z`（壓縮）或 `j`（未壓縮，較短時使用）。資料版本升級時在 `packages/core/src/schema.ts` 的 `MIGRATIONS` 加上步驟；IndexedDB 索引變更則提升 Dexie 的 schema version。

## 命名範本

在設定頁編輯，有即時預覽。未自訂名稱的遊戲會即時套用目前範本；自訂名稱不受影響。

| 佔位符      | 說明                                                             |
| ----------- | ---------------------------------------------------------------- |
| `{date}`    | 遊戲日期，格式依設定（預設 `YYYY-MM-DD`）；也可寫 `{date:MM/DD}` |
| `{seq}`     | 當天第幾場（建立時固定，刪除其他遊戲不會改變；匯入保留原值）     |
| `{time}`    | 開始時間 `HH:mm`                                                 |
| `{players}` | 人數                                                             |
| `{winner}`  | 勝方（好人／壞人；未結束時為空）                                 |

預設範本為 `{date} 第{seq}場`，例如 `2026-11-18 第3場`。匯出檔名使用遊戲名稱並移除不合法字元，例如 `2026-11-18_第3場.json`。
