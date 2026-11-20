# 部署

這一頁說明 `pnpm build` 產生什麼、伺服器需要做到哪些事，以及 GitHub Pages 與其他平台的設定。

`pnpm build` 會把所有 app 組成一個靜態網站放在 `dist/`：

```
dist/            阿瓦隆工具集（apps/home）
dist/record/     遊戲紀錄（apps/record）
dist/deal/       角色發牌（apps/deal）
dist/docs/       使用說明（apps/docs，VitePress；沒有 manifest 與 service worker）
dist/404.html    = 首頁的 index.html，顯示 404 頁面
```

`pnpm preview` 以和 GitHub Pages 相同的規則在本機提供 `dist/`。

## 伺服器需要做到的事

1. **資料夾導向結尾斜線**：`/record` → `/record/`（301）。
2. **找不到的路徑回 `/404.html`**（狀態碼 404）。不需要 SPA rewrite：各工具都用 hash 路由。
3. **沒有副檔名的路徑找同名 `.html`**：使用說明開啟了 VitePress 的 `cleanUrls`，`/docs/guide/faq` 要回 `/docs/guide/faq.html`（不轉址），重新整理深層頁面才不會 404。
4. **`sw.js`、`workbox-*.js`、`sw-cleanup.js`、`*.webmanifest`、`*.html` 不可被長期快取**（`Cache-Control: no-cache`），否則更新不會生效。`assets/` 內的檔名含 hash，可長期快取。
5. **1.x 的舊網址**（`/#/play/…`、`/?s=…`）由首頁在瀏覽器端轉到 `/record/`；hash 與查詢字串到不了伺服器，所以伺服器不用設定。

## GitHub Pages（預設）

`.github/workflows/deploy.yml` 在 push 到 `main`（或手動執行）時：

1. lint、format:check、typecheck、單元測試
2. 確認 Pages 部署在網域根目錄（需設定自訂網域；`/<repo>/` 這類子路徑會讓工作流程失敗）
3. `pnpm build` 建置 registry 中所有工具並組合 `dist/`
4. 在執行摘要列出部署的工具與路徑，上傳 `dist/` 並部署

設定：Settings → Pages 的 Source 選 GitHub Actions，Custom domain 填網域（目前為 `avalon.mirumo.net`），並勾選 Enforce HTTPS（service worker 只能在 HTTPS 下運作）。新增工具不需要改工作流程。

Pages 已內建 1、2、3，`sw.js` 等檔案的快取時間為 10 分鐘，可接受。

## Netlify（`dist/_redirects` 與 `dist/_headers`）

Netlify 預設會以 `<路徑>.html` 回應無副檔名的網址（Pretty URLs），使用說明不需額外設定。

```
# _redirects
/*  /404.html  404
```

```
# _headers
/sw.js
  Cache-Control: no-cache
/record/sw.js
  Cache-Control: no-cache
/*.webmanifest
  Cache-Control: no-cache
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

## Vercel（`vercel.json`）

```json
{
  "outputDirectory": "dist",
  "buildCommand": "pnpm build",
  "trailingSlash": true,
  "headers": [
    {
      "source": "/(.*)sw(-cleanup)?\\.js",
      "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
    },
    {
      "source": "/(.*)\\.webmanifest",
      "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
    }
  ]
}
```

Vercel 找不到檔案時會自動使用 `404.html`。使用說明的無副檔名網址需要在 `vercel.json` 加上 `"cleanUrls": true`。

## nginx

```nginx
server {
  root /srv/avalon/dist;

  location / {
    try_files $uri $uri.html $uri/ =404;   # $uri.html：使用說明的 cleanUrls；$uri/ 會自動 301 到結尾斜線
  }
  error_page 404 /404.html;

  location ~ (sw|sw-cleanup|workbox-[^/]*)\.js$ { add_header Cache-Control "no-cache"; }
  location ~ \.(webmanifest|html)$            { add_header Cache-Control "no-cache"; }
  location /assets/  { add_header Cache-Control "public, max-age=31536000, immutable"; }
  location ~ ^/[^/]+/assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
}
```
