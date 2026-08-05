import { promises as fs } from "fs";
import path from "path";
import { ensureFfmpegConfigured, ffmpeg } from "./ffmpegPath";

async function extractAudio(inputPath: string, workDir: string): Promise<string> {
  ensureFfmpegConfigured();

  const outputPath = path.join(workDir, "audio.mp3");

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(["-vn", "-acodec", "libmp3lame", "-q:a", "4"])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .run();
  });

  return outputPath;
}

async function transcribeAudio(audioPath: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY が設定されていません。ロング動画の文字起こしには Whisper API 用のキーが必要です。"
    );
  }

  const audioBuffer = await fs.readFile(audioPath);
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(audioBuffer)], { type: "audio/mpeg" }),
    "audio.mp3"
  );
  formData.append("model", "whisper-1");
  formData.append("language", "ja");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Whisper API エラー (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { text: string };
  return json.text;
}

export async function transcribeVideo(
  inputPath: string,
  workDir: string
): Promise<string> {
  const audioPath = await extractAudio(inputPath, workDir);
  return transcribeAudio(audioPath);
}
