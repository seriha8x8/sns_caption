import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import type { VideoType } from "@/lib/types";
import { extractFrames, type ExtractedFrame } from "./frames";
import { transcribeVideo } from "./transcribe";

export type AnalysisResult =
  | { kind: "transcript"; text: string }
  | { kind: "frames"; frames: ExtractedFrame[] };

/**
 * Writes the uploaded video to a scratch directory, runs the appropriate
 * analysis pipeline for the given video type, then cleans up.
 *
 * - "long": extract audio track and transcribe it (Whisper).
 * - "short": extract evenly-spaced frames for vision analysis (Claude).
 */
export async function analyzeVideo(
  videoBuffer: Buffer,
  videoType: VideoType
): Promise<AnalysisResult> {
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "sns-caption-"));
  const inputPath = path.join(workDir, `${randomUUID()}.mp4`);

  try {
    await fs.writeFile(inputPath, videoBuffer);

    if (videoType === "long") {
      const text = await transcribeVideo(inputPath, workDir);
      return { kind: "transcript", text };
    }

    const frames = await extractFrames(inputPath, workDir);
    return { kind: "frames", frames };
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}
