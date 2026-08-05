/**
 * Adapter boundary for future YouTube Data API v3 integration.
 *
 * The generation module only produces `YoutubeOutput` data (titles,
 * description, tags) and has no knowledge of how/whether it gets published.
 * A future implementation of `publishToYoutube` can upload the source video
 * as "private" using this output without touching the generation or
 * analysis modules.
 */
export interface YoutubePublishRequest {
  videoFilePath: string;
  title: string;
  description: string;
  tags: string[];
  privacyStatus: "private" | "unlisted" | "public";
}

export interface YoutubePublishResult {
  videoId: string;
  studioUrl: string;
}

export async function publishToYoutube(
  request: YoutubePublishRequest
): Promise<YoutubePublishResult> {
  throw new Error(
    `YouTube Data API連携は未実装です(video: ${request.videoFilePath})。将来的にここにアップロード処理を実装してください。`
  );
}
