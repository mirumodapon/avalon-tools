# 貢獻流程

這一頁說明 commit 訊息、分支與合併、發布版本的規則。

## Commit 訊息

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <摘要>
```

- `type`：`feat`、`fix`、`refactor`、`docs`、`test`、`build`、`ci`、`chore` 等。
- `scope`：app 或套件名稱，例如 `deal`、`record`、`registry`、`docs`、`guide`。
- 摘要用英文、祈使句，小寫開頭，不加句號。例如 `feat(deal): cover quest results in the history until held`。
- 一個 commit 只做一件事，保持小而完整。

## 分支

- 日常開發在 `dev`；`main` 是已發布的版本，推送到 `main` 會部署。
- 每個功能或修正開一個分支（例如 `feat/quest-history-covered`、`fix/sw-exclude-docs`），完成後合併回來源分支並刪除：

```sh
git switch dev
git switch -c feat/something
# …commit…
git switch dev
git merge --no-ff feat/something
git branch -d feat/something
```

一律用 `--no-ff`，保留「這幾個 commit 是同一個功能」的合併紀錄。

## 合併前

```sh
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build
```

## 發布

整個 repo 只有一個版本號：根目錄 `package.json` 的 `version`（`scripts/check-version.ts` 禁止其他 `package.json` 寫版本）。

1. 把 `dev` 合併到 `main`（`--no-ff`）。
2. 從 `main` 開 `chore/release-X.Y.Z`：修改 `package.json` 的 `version`，在 `CHANGELOG.md` 加上這一版的內容，commit `chore(release): X.Y.Z`。
3. 合併回 `main`（`--no-ff`），建立 tag：`git tag -a vX.Y.Z -m "vX.Y.Z"`。
4. 把 `dev` 快轉到 `main`。
5. 推送 `main`、`dev` 與 tag，GitHub Actions 會檢查並部署。

建置時每個 app 都注入同一個版本字串 `<version>-<git rev>`，顯示在首頁的資訊頁與遊戲紀錄的設定頁。
