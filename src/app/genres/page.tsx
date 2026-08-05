import GenreSettingsForm from "@/components/GenreSettingsForm";

export default function GenresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">ジャンル設定管理</h1>
        <p className="text-sm text-foreground/70 mt-1">
          ジャンルごとのターゲット層・トーンとSNS別の生成ルールを管理します。
        </p>
      </div>
      <GenreSettingsForm />
    </div>
  );
}
