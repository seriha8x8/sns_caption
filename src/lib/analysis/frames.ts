import { promises as fs } from "fs";
import path from "path";
import { ensureFfmpegConfigured, ffmpeg } from "./ffmpegPath";

const FRAME_INTERVAL_SECONDS = 3;
const MAX_FRAMES = 8;

export interface ExtractedFrame {
  base64: string;
  mediaType: "image/jpeg";
}

/**
 * Extracts frames at a fixed interval (rather than by percentage of total
 * duration) so no ffprobe binary is required to know the video length
 * up front.
 */
export async function extractFrames(
  inputPath: string,
  workDir: string
): Promise<ExtractedFrame[]> {
  ensureFfmpegConfigured();

  const pattern = path.join(workDir, "frame-%02d.jpg");

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-vf",
        `fps=1/${FRAME_INTERVAL_SECONDS}`,
        "-vframes",
        String(MAX_FRAMES),
        "-q:v",
        "3",
      ])
      .output(pattern)
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .run();
  });

  const files = (await fs.readdir(workDir))
    .filter((f) => f.startsWith("frame-") && f.endsWith(".jpg"))
    .sort();

  if (files.length === 0) {
    throw new Error("動画からフレームを抽出できませんでした。");
  }

  const frames: ExtractedFrame[] = [];
  for (const file of files) {
    const buf = await fs.readFile(path.join(workDir, file));
    frames.push({ base64: buf.toString("base64"), mediaType: "image/jpeg" });
  }

  return frames;
}
