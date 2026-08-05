import HistoryList from "@/components/HistoryList";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">生成履歴</h1>
        <p className="text-sm text-foreground/70 mt-1">
          過去に生成した投稿文案の一覧です。クリックすると詳細を表示します。
        </p>
      </div>
      <HistoryList />
    </div>
  );
}
