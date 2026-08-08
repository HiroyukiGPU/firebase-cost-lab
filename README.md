# Firebase Cost Lab

Firebase Blazeプランの月額・年間コストを概算する日本語Webツールです。

## 主な機能

- MAU、DAU率、利用頻度からのかんたん見積もり
- Firestore、Authentication、SMS、Storage、Functions、Hostingの詳細入力
- 日次無料枠を考慮した計算
- 10万 / 100万 MAUの成長シミュレーション
- USD表示と参考円換算

料金データは2026-08-08時点の入力資料を基準にしています。Firestoreはus-central1、Storageは旧 `appspot.com` バケットの基準価格による概算です。

## 開発

```bash
npm install
npm run dev
```

GitHub Pages用の静的ビルド:

```bash
npm run build:pages
```
