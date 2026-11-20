# 新增工具

這一頁說明怎麼用 `pnpm new:app` 新增一個工具、它會改哪些檔案，以及之後要補上的事。

## 建立

```sh
pnpm new:app <id> --name 名稱 --description 說明 --icon IconName --accent blue
```

- `id`：小寫英文、數字與 `-`，同時是資料夾名稱（`apps/<id>`）、路徑（`/<id>/`）與儲存命名空間。
- `--icon`：[Tabler Icons](https://tabler.io/icons) 的 React 元件名稱，例如 `IconMoonStars`。
- `--accent`：Catppuccin 強調色名稱，例如 `blue`、`peach`。

registry 中已經是「即將推出」的工具（例如 `narrator`）可以直接 `pnpm new:app narrator`，名稱、說明、圖示會沿用 registry，狀態改為 beta。

## 腳本做了什麼

`scripts/new-app.ts` 依序：

1. 把 `scripts/templates/app` 複製到 `apps/<id>`，填入 id、名稱與說明。
2. 在 `packages/registry/src/tools.ts` 的 `// new:app inserts here` 前加入工具（狀態 `beta`），或把即將推出的工具改成 `beta`。
3. 在 `apps/home/src/toolIcons.ts` 加入圖示（首頁只打包列出的圖示）。
4. 執行 `pnpm install`、`pnpm icons <id>` 產生 PWA 圖示，並格式化改過的檔案。

## Registry 登錄

工具清單只有一份：`packages/registry/src/tools.ts`。以下都由它產生，不需要另外設定：

- 首頁的工具卡片（即將推出的排在最後）；
- 每個工具的 manifest（`id`、`scope`、`start_url` 都是工具路徑）與 service worker 的快取名稱；
- 首頁 service worker 的 `navigateFallbackDenylist`（不接手其他工具的導覽）；
- `pnpm build` 的建置清單與 `pnpm dev` 的 proxy 路由。

欄位：

| 欄位          | 說明                                                           |
| ------------- | -------------------------------------------------------------- |
| `id`          | 資料夾、路徑與儲存命名空間                                     |
| `name`        | 名稱；manifest 名稱為「阿瓦隆・名稱」                          |
| `shortName`   | manifest `short_name`                                          |
| `description` | 首頁卡片與 manifest 的說明                                     |
| `path`        | 首頁是 `/`，其他一律 `/<id>/`                                  |
| `icon`        | Tabler 圖示元件名稱                                            |
| `accent`      | Catppuccin 強調色，用於圖示與卡片                              |
| `status`      | `stable`、`rc`、`beta` 或 `coming-soon`（沒有 app）            |
| `kind`        | 省略或 `app` 為 PWA；`docs` 是使用說明（不是 PWA、不列在首頁） |

registry 的測試會檢查 id 與路徑不重複、格式正確、圖示存在，以及非即將推出的工具都有 app。

## 圖示

改了 `icon` 或 `accent` 之後重新產生圖示：

```sh
pnpm icons <id>
```

圖示會寫入 `apps/<id>/public/`（favicon、apple-touch-icon、PWA 圖示與 maskable 圖示）。

## 之後要做的事

- 在 `apps/<id>/README.md` 說明工具（可參考 `apps/deal/README.md`）。
- 在使用說明加上這個工具的頁面（`apps/docs/guide/<id>/`），並在 `apps/docs/.vitepress/config.ts` 的側邊欄登錄。
- 讓工具首頁的說明按鈕連到這一頁（見各工具的 `AppShell`）。
