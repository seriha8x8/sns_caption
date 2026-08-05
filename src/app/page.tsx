import VideoUploadForm from "@/components/VideoUploadForm";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">動画から投稿文案を生成</h1>
        <p className="text-sm text-foreground/70 mt-1">
          動画をアップロードすると、内容を解析してYouTube・Instagram・TikTok向けの投稿文案を自動生成します。
        </p>
      </div>
      <VideoUploadForm />
    </div>
  );
}
