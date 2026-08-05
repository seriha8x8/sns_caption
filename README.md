# YouTube投稿アシスタント

個人利用のWebアプリです。動画ファイルをアップロードすると内容を解析し、YouTube・Instagram・TikTok向けの投稿文案を自動生成します。

## 技術スタック

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres) — ジャンル設定・生成履歴の保存
- Anthropic Claude API — 文案生成、ショート動画のフレーム画像解析(vision)
- OpenAI Whisper API — ロング動画の音声文字起こし
- ffmpeg (`fluent-ffmpeg` + `ffmpeg-static`) — 動画からの音声/フレーム抽出

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクトの作成とスキーマ投入

1. [Supabase](https://supabase.com/) で無料プロジェクトを作成
2. SQL Editorで `supabase/migrations/0001_init.sql` の内容を実行
   - `genres` / `youtube_settings` / `instagram_settings` / `tiktok_settings` / `generations` テーブルが作成され、初期ジャンル「編み物」のデータが投入されます
3. Project Settings > API から `Project URL` と `service_role` キーを取得

### 3. 環境変数の設定

`.env.example` を `.env.local` にコピーして値を入力してください。

```bash
cp .env.example .env.local
```

| 変数名 | 説明 |
| --- | --- |
| `SUPABASE_URL` | SupabaseプロジェクトのURL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseの service_role キー(サーバー側のみで使用) |
| `ANTHROPIC_API_KEY` | Claude API キー |
| `ANTHROPIC_MODEL` | (任意)使用するClaudeモデルID。未設定時は `claude-sonnet-4-5` |
| `OPENAI_API_KEY` | Whisper API(音声文字起こし)用のOpenAI APIキー。ロング動画を使わない場合は省略可 |

### 4. ローカル起動

```bash
npm run dev
```

`http://localhost:3000` でアクセスできます。

## 画面構成

1. **動画から生成**(`/`) — ジャンル選択・動画種別選択・動画アップロード・追加タグ入力を行い、生成結果をSNSごとに表示。生成完了時に自動的に履歴へ保存されます。
2. **ジャンル設定**(`/genres`) — ジャンルごとのターゲット層・トーンと、YouTube/Instagram/TikTok別の生成ルールを管理します。
3. **生成履歴**(`/history`) — 過去の生成結果を新しい順に一覧表示。クリックで詳細表示、削除も可能です。

## 解析の仕組み

- **ロング動画**: ffmpegで音声を抽出し、OpenAI Whisper APIで文字起こし → 文字起こしテキストをClaudeに渡して文案生成
- **ショート動画**: ffmpegで一定間隔(3秒ごと、最大8枚)のフレームを抽出 → 画像をClaudeのvision機能に渡して内容を解析・文案生成

生成ロジック(`src/lib/generation`)と将来のYouTube Data API連携(`src/lib/publish/youtube.ts`)は分離した設計にしており、`YoutubeOutput`(タイトル/概要欄/タグ)を渡すだけで非公開アップロード機能を追加できます。Instagram/TikTokは現状API連携せず、生成結果をコピーして手動投稿する運用を想定しています。

## デプロイ(Vercel)

1. GitHubリポジトリをVercelにインポート
2. 上記の環境変数をVercelのProject Settings > Environment Variablesに設定
3. デプロイ

### 注意事項

- 動画処理(ffmpeg)はNode.jsランタイムで実行されます(`export const runtime = "nodejs"`)。Vercelのプラン・関数実行時間制限により、長い動画は失敗する場合があります。必要に応じて `src/app/api/generate/route.ts` の `maxDuration` をプランの上限に合わせて調整してください。
- 個人利用のみを想定しているため、認証機能は実装していません。
