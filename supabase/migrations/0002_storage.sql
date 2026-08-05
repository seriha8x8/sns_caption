-- 動画アップロード用の一時保管バケット
-- 生成処理が終わったら/api/generateがオブジェクトを削除するため、恒久的な保存領域ではない。

insert into storage.buckets (id, name, public, file_size_limit)
values ('videos', 'videos', false, 314572800) -- 300MB
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit;
