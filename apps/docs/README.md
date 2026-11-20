# 使用說明（`/docs/`）

以 VitePress 2 建置的文件站：使用說明、規則、開發者文件與更新紀錄。內容就是這個資料夾裡的 Markdown（`guide/`、`rules/`、`dev/`、`changelog.md`），本檔不會出現在網站上。

```sh
pnpm dev --filter docs   # 透過 dev gateway，http://localhost:5173/docs/
pnpm --filter @avalon/docs build
```

- **不是 PWA**：沒有 manifest 與 service worker；registry 中為 `kind: 'docs'`，首頁的 service worker 不接手 `/docs/`。`pnpm build` 會檢查。
- **主題**：`.vitepress/theme/custom.css` 把 `@avalon/theme` 的 `--ctp-*` 對應到 VitePress 變數；`appearance.ts` 讓深淺色與 `avalon:global:theme`（所有工具共用）雙向同步。
- **產生的表格**：`.vitepress/data/` 從 `@avalon/rules`（人數、出隊、陣營、角色、視野）、`@avalon/registry`（工具清單）與 `@avalon/record-core` 的 zod schema（匯出格式）計算，`.vitepress/theme/components/` 以 Vue 元件（`.ts`，納入 typecheck）呈現。改規則後重新建置，表格就會更新。
- **匯出格式**：欄位說明寫在 `.vitepress/data/exportFormat.ts` 的 `FIELD_DOC`；schema 增減欄位而沒有更新說明時測試會失敗。`dev/export-example.json` 由測試以匯入流程驗證。
- **Mermaid**：` ```mermaid ` 區塊由 `.vitepress/theme/Mermaid.ts` 在瀏覽器端繪製，跟隨深淺色。
- **更新紀錄**：`changelog.md` 引入根目錄的 `CHANGELOG.md`，不需要另外維護。
- 不確定的內容以 `::: warning 待確認` 標示；截圖位置以 `<!-- TODO: 截圖 -->` 標示。
