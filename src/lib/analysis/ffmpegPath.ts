import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

let configured = false;

export function ensureFfmpegConfigured() {
  if (configured) return;
  if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
  }
  configured = true;
}

export { ffmpeg };
