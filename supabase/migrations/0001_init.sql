-- YouTube投稿アシスタント: 初期スキーマ

create extension if not exists pgcrypto;

-- ジャンルの基本設定
create table if not exists genres (
  id text primary key,
  display_name text not null,
  target_audience text,
  tone text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- YouTube用設定(ジャンルに1:1)
create table if not exists youtube_settings (
  genre_id text references genres(id) on delete cascade,
  title_count integer default 5,
  title_style text,
  description_footer text,
  hashtag_count integer default 30,
  hashtag_ratio text,
  weighted_hashtags text[] default '{}',
  tag_char_target integer default 900,
  required_keywords text[] default '{}',
  primary key (genre_id)
);

-- Instagram用設定
create table if not exists instagram_settings (
  genre_id text references genres(id) on delete cascade,
  caption_style text,
  hashtag_min integer,
  hashtag_max integer,
  primary key (genre_id)
);

-- TikTok用設定
create table if not exists tiktok_settings (
  genre_id text references genres(id) on delete cascade,
  caption_style text,
  hashtag_count integer,
  primary key (genre_id)
);

-- 生成履歴(自動保存・削除可能)
create table if not exists generations (
  id uuid primary key default gen_random_uuid(),
  genre_id text references genres(id) on delete set null,
  video_type text,
  additional_tags text[] default '{}',
  output_youtube jsonb,
  output_instagram jsonb,
  output_tiktok jsonb,
  created_at timestamp default now()
);

create index if not exists generations_created_at_idx on generations (created_at desc);

-- 初期データ: 編み物ジャンル
insert into genres (id, display_name, target_audience, tone)
values (
  'knitting',
  '編み物',
  '編み物初心者〜少し慣れてきた層(20〜30代女性)',
  '共感・やさしい・専門用語を避ける・上から目線NG'
)
on conflict (id) do update set
  display_name = excluded.display_name,
  target_audience = excluded.target_audience,
  tone = excluded.tone,
  updated_at = now();

insert into youtube_settings (
  genre_id, title_count, title_style, description_footer,
  hashtag_count, hashtag_ratio, weighted_hashtags,
  tag_char_target, required_keywords
)
values (
  'knitting',
  5,
  'SEOキーワード＋感情を動かす言葉の組み合わせ、記号・数字・【】使用可',
  E'⑅ _ ⑅ _ ⑅ _ ⑅ _ ⑅ _ ⑅ _\n🧶　りぃのおすすめ毛糸　🧶\nhttps://room.rakuten.co.jp/rii_amimono/items\nSNSも更新中🌷\nInstagram\nhttp://www.instagram.com/rii_amimono\nTikTok\nhttps://tiktok.com/@rii_amimono\nThreads\nhttp://threads.net/@rii_amimono',
  30,
  '日本8:海外2',
  array['初心者', 'かぎ針', '簡単', '毛糸'],
  900,
  array['毛糸', '編み物', '編み物初心者', '編み物 初心者', 'かぎ針', 'かぎ針編み', 'かぎ針初心者', 'かぎ針編み初心者', 'かぎ針 初心者', 'かぎ針編み 初心者', 'かぎ針編み 簡単']
)
on conflict (genre_id) do update set
  title_count = excluded.title_count,
  title_style = excluded.title_style,
  description_footer = excluded.description_footer,
  hashtag_count = excluded.hashtag_count,
  hashtag_ratio = excluded.hashtag_ratio,
  weighted_hashtags = excluded.weighted_hashtags,
  tag_char_target = excluded.tag_char_target,
  required_keywords = excluded.required_keywords;

insert into instagram_settings (genre_id, caption_style, hashtag_min, hashtag_max)
values (
  'knitting',
  '共感・保存したくなる文章、やさしく丁寧な世界観',
  10,
  20
)
on conflict (genre_id) do update set
  caption_style = excluded.caption_style,
  hashtag_min = excluded.hashtag_min,
  hashtag_max = excluded.hashtag_max;

insert into tiktok_settings (genre_id, caption_style, hashtag_count)
values (
  'knitting',
  '冒頭にスクロールを止める一言、テンポよくカジュアル',
  5
)
on conflict (genre_id) do update set
  caption_style = excluded.caption_style,
  hashtag_count = excluded.hashtag_count;
