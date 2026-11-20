# 阿瓦隆工具集

《阿瓦隆（The Resistance: Avalon）》桌遊的輔助工具。首頁（`/`）列出各個工具，每個工具都是可以單獨安裝、離線使用的 PWA，手機優先。

| 工具                 | 路徑          | 狀態                                                              |
| -------------------- | ------------- | ----------------------------------------------------------------- |
| 阿瓦隆工具集（首頁） | `/`           | 工具列表、資訊頁（版本、空間用量、更新紀錄）                      |
| 遊戲紀錄             | `/record/`    | beta                                                              |
| 夜晚旁白             | `/narrator/`  | 即將推出                                                          |
| 整合遊戲助手         | `/assistant/` | 即將推出                                                          |
| 角色發牌             | `/deal/`      | rc：一支手機輪流查看角色（見 [apps/deal](apps/deal/README.md)）   |
| 使用說明             | `/docs/`      | VitePress 文件站，不是 PWA（見 [apps/docs](apps/docs/README.md)） |

從 1.x（阿瓦隆紀錄）升級請見使用說明的[更新紀錄](apps/docs/changelog.md)，更新內容見 [CHANGELOG.md](CHANGELOG.md)。

## 遊戲紀錄

在實體遊戲進行時，用手機依序記錄每一輪的組隊、投票、任務結果與湖中女神，隨時呈現進度；遊戲結束後可保存、瀏覽、匯出與匯入紀錄。

### 功能

- **開局設定**：5–10 人、座位順序、第一位隊長、從玩家名冊依座位順序點選帶入、遊戲名稱（可留空自動命名）、角色配置與指派（可選）、湖中女神（7 人以上預設開啟）。
- **派票記錄**：
  - 依座位順時針輪替隊長，隊員人數不符無法送出；贊成票嚴格過半才通過。
  - 兩種輸入方式，可隨時切換且內容不遺失：**派票**（點贊成者）、**派跳**（只點場外白／場內黑）。
  - 新的派票自動沿用上一次使用的輸入方式。
  - 第 5 次派票為**強制局**：沒有通過則壞人直接勝利；可設定自動記為全員贊成。
  - 「復原上一步」會先確認要刪除哪一筆紀錄。
- **任務**：記錄失敗票數；7 人以上第 4 局需 2 張失敗。3 敗壞人勝；3 成功進入刺殺（已指派梅林時自動判定）。
- **湖中女神**：第 2、3、4 個任務後使用，不可跳過，記錄後不提供編輯（可用「復原上一步」）；不能查驗自己或曾持有者。
- **進度總覽**：任務圓點（含需 2 敗、湖中女神時機）、目前隊長、派票次數與強制局警示、湖中女神持有者。
- **歷史表格**：每個任務一張表（座位號為欄），派票檢視／派跳檢視切換；任務表以顏色標出當局湖中女神持有者。「顯示設定」可切換顯示角色、局次結果與湖中結果的簡化／詳細，以及湖中女神與任務的緊密（每局後一列）／分離（上方一列查驗順序，如 `3 → 4 (好) → 6 (壞)`）。進行中的遊戲角色預設隱藏。
- **結算與瀏覽**：勝方、刺殺修正、角色指派、名稱與備註；遊戲列表可搜尋名稱與備註、依勝方與日期篩選、刪除、複製為新局；賽後統計。
- **匯出**：遊戲紀錄頁最下方「匯出這場」提供單場 JSON（完整、可還原）、CSV、Markdown、純文字（逐次派票的完整過程）、PNG；可選呈現方式與是否包含角色；下載、複製、Web Share。手機上 PNG 會透過分享選單「儲存影像」存進相簿（網頁無法直接寫入相簿）。設定頁「資料備份」提供全部匯出（JSON 陣列）與匯入。
- **分享連結**：遊戲詳情右上角「分享」開啟分享面板，可切換文字／QR code，並可複製連結或用 Web Share API 分享。整場紀錄壓縮在網址 `?s=` 參數中（10 人完整一局約 300 字元）；對方開啟後可預覽並「匯入到本機」。
- **掃描 QR**：首頁右上角與設定頁「資料備份」可開啟相機掃描分享的 QR code（支援 `BarcodeDetector` 時使用原生辨識，否則以 jsQR 辨識），掃到後進入相同的預覽與匯入流程；不是本 app 的分享內容會顯示「掃描失敗」。
- **匯入**：單場或多場 JSON，zod 驗證、清楚的錯誤訊息；ID 重複時可選覆蓋或另存；單一 transaction，失敗整批回滾。
- **主題**：Catppuccin，系統／淺色（Latte）／深色（Macchiato）與 14 種強調色，載入前套用避免閃爍。

### App 行為

- **每次開啟都檢查更新**：開啟 app（或從背景回來超過 5 分鐘）時顯示「檢查更新中…」，有新版本就顯示「APP 更新中…」並立即套用、重新載入；離線或網路太慢時最多等 6 秒就直接進入。
- **重新開啟回到原畫面**：以安裝的 app 開啟時，回到關閉前的畫面與捲動位置，並保留記錄到一半的內容（選到一半的隊員、投票、失敗票數、湖中女神查驗）。分享連結或指定頁面的網址不會被覆蓋。

### 資料與儲存

- **遊戲**：IndexedDB `avalon-record`（Dexie），一場一筆，索引 `createdAt`、`date`、`winner`。UI 只透過 `GameRepository` 存取；每次動作後 debounce 寫入，頁面隱藏時立即寫入。啟動時申請 `navigator.storage.persist()`。
- **設定**（預設模式、命名規則、名冊、顯示選項）：localStorage `avalon:record:<欄位>`，每個設定一個 key，格式 `{ version, data }`，可 migration。主題在 `avalon:global:theme`，所有工具共用。

#### 遊戲 JSON（`schemaVersion: 1`）

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

分享連結使用另一種精簡格式（`packages/record-core/src/share.ts`）：玩家以座位索引表示，每次派票壓成一個整數（隊長、隊員與贊成者的位元遮罩、輸入方式），再以 deflate-raw 壓縮並 base64url 編碼，前綴 `z`（壓縮）或 `j`（未壓縮，較短時使用）。資料版本升級時在 `packages/record-core/src/schema.ts` 的 `MIGRATIONS` 加上步驟；IndexedDB 索引變更則提升 Dexie 的 schema version。

### 命名範本

在設定頁編輯，有即時預覽。未自訂名稱的遊戲會即時套用目前範本；自訂名稱不受影響。

| 佔位符      | 說明                                                             |
| ----------- | ---------------------------------------------------------------- |
| `{date}`    | 遊戲日期，格式依設定（預設 `YYYY-MM-DD`）；也可寫 `{date:MM/DD}` |
| `{seq}`     | 當天第幾場（建立時固定，刪除其他遊戲不會改變；匯入保留原值）     |
| `{time}`    | 開始時間 `HH:mm`                                                 |
| `{players}` | 人數                                                             |
| `{winner}`  | 勝方（好人／壞人；未結束時為空）                                 |

預設範本為 `{date} 第{seq}場`，例如 `2026-11-18 第3場`。匯出檔名使用遊戲名稱並移除不合法字元，例如 `2026-11-18_第3場.json`。

## 架構

```
apps/home/               阿瓦隆工具集首頁（/）
apps/record/             遊戲紀錄（/record/）
apps/deal/               角色發牌（/deal/）
apps/docs/               使用說明（/docs/，VitePress，不是 PWA）
packages/avalon-rules/   純 TS：阿瓦隆規則與角色（不依賴 React／DOM）
packages/record-core/    純 TS：遊戲紀錄的型別、reducer、schema、匯出與分享格式
packages/registry/       工具清單（名稱、路徑、圖示、顏色、狀態）
packages/storage/        localStorage 命名空間與 IndexedDB 名稱
packages/theme/          Catppuccin 色票 → CSS token、防閃爍腳本
packages/ui/             共用元件（AppShell、Sheet、主題選擇、更新、空間用量）
packages/pwa/            createPwaConfig、service worker 快取清理、圖示產生
packages/tsconfig/       共用 tsconfig
scripts/                 build-all、dev、preview、new-app、檢查
```

- **各 app 互不 import**（`scripts/check-boundaries.ts` 在 `pnpm lint` 檢查）；共用的東西放 packages。
- **工具清單只有一份**：`packages/registry/src/tools.ts`。首頁的卡片、manifest、service worker 的 scope 與 denylist、建置與 dev proxy 都由它產生。
- **儲存命名空間**：`avalon:global:*` 是所有工具共用（目前只有主題），`avalon:<appId>:*` 與 IndexedDB `avalon-<appId>` 屬於各工具，彼此不讀寫對方的資料。主題變更透過 `storage` 事件同步到其他已開啟的 App。
- **每個工具一個 PWA**：manifest `id`／`scope`／`start_url` 都是工具路徑，Workbox `cacheId` 為 `avalon-<id>`；首頁的 service worker 不處理巢狀工具的導覽。

## 開發

需要 Node 24+ 與 pnpm 12（版本由 `packageManager` 指定，corepack 會自動使用）。

```sh
pnpm install
pnpm dev                 # 所有 app 的 dev server，同源 proxy 在 http://localhost:5173/
pnpm dev --filter record # 只啟動指定的 app（可重複）
pnpm build               # 建置所有 app 並組合到 dist/
pnpm preview             # 以 GitHub Pages 的規則提供 dist/
pnpm lint                # oxlint、catalog、app 邊界與版本檢查
pnpm format              # oxfmt（format:check 只檢查）
pnpm typecheck           # scripts/ 與所有 app、套件
pnpm test                # vitest
pnpm icons [id...]       # 由 registry 的圖示與顏色產生各 app 的 PWA 圖示
```

### 新增工具

```sh
pnpm new:app <id> --name 名稱 --description 說明 --icon IconName --accent blue
```

會建立 `apps/<id>`（路徑 `/<id>/`、狀態 beta）、加入 registry 與首頁圖示、安裝依賴並產生圖示。registry 中已是「即將推出」的工具（如 `narrator`）會直接改為 beta。之後 `pnpm dev` 即可在 `/<id>/` 開發。

### 依賴版本（pnpm catalog）

所有外部套件的版本集中在 `pnpm-workspace.yaml` 的 `catalog:`，各 `package.json` 一律寫 `"catalog:"`（內部套件為 `workspace:*`）。新增或升級套件：

```sh
pnpm --filter @avalon/record add <pkg>   # catalogMode: strict 會自動寫入 catalog
```

`pnpm lint` 會一併執行 `scripts/check-catalog.ts`，若有 `package.json` 直接寫版本號就會失敗。

### 版本

整個 repo 共用一個版本：根目錄 `package.json` 的 `version`。各 app 與套件的 `package.json` 不寫版本（`scripts/check-version.ts` 在 `pnpm lint` 檢查）。建置時每個 app 都注入同一個 `<version>-<git rev>`，顯示在首頁資訊頁與遊戲紀錄的設定頁最下方。

## 部署

`.github/workflows/deploy.yml` 在推送到 `main` 時執行檢查、建置所有工具，並把 `dist/` 部署到 GitHub Pages（Settings → Pages 的 Source 需設為 GitHub Actions）。網站必須部署在網域根目錄（自訂網域），否則工作流程會失敗。其他平台（Netlify、Vercel、nginx）的設定見使用說明的[部署](apps/docs/dev/deploy.md)。
