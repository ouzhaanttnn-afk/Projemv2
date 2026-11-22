// Bridge between the web page and the iPhone app (Capacitor). Only bundled
// into the app build; the website never loads it. Exposes window.RBNative.

import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { ArrayBufferTarget, Muxer } from "mp4-muxer";

function toBase64(bytes: Uint8Array): string {
  let s = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) s += String.fromCharCode(...bytes.subarray(i, i + step));
  return btoa(s);
}

/** Writes a file to the app's cache and opens the iPhone share sheet with it. */
async function shareFile(name: string, bytes: Uint8Array, title: string): Promise<void> {
  const written = await Filesystem.writeFile({ path: name, data: toBase64(bytes), directory: Directory.Cache });
  await Share.share({ title, files: [written.uri] });
}

async function shareText(text: string, url: string): Promise<void> {
  await Share.share({ text, url });
}

function tap(): void {
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

/** Can this phone encode AAC (needed for ringtones)? iOS 26 and newer can. */
async function canMakeRingtone(): Promise<boolean> {
  const AE = (globalThis as { AudioEncoder?: typeof AudioEncoder }).AudioEncoder;
  if (!AE) return false;
  try {
    const r = await AE.isConfigSupported({ codec: "mp4a.40.2", sampleRate: 44100, numberOfChannels: 1, bitrate: 128000 });
    return !!r.supported;
  } catch {
    return false;
  }
}

/**
 * Encodes mono 16-bit samples as an AAC .m4a file. iPhone ringtones must be
 * M4A or MP3 and shorter than 30 seconds; the caller keeps it under 29 s.
 */
async function encodeM4a(pcm: Int16Array, sampleRate: number): Promise<Uint8Array> {
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    audio: { codec: "aac", numberOfChannels: 1, sampleRate },
    fastStart: "in-memory",
  });
  let failure: unknown = null;
  const encoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: (e) => (failure = e),
  });
  encoder.configure({ codec: "mp4a.40.2", sampleRate, numberOfChannels: 1, bitrate: 128000 });
  const frame = 1024 * 8;
  for (let i = 0; i < pcm.length; i += frame) {
    const part = pcm.subarray(i, Math.min(pcm.length, i + frame));
    const f32 = new Float32Array(part.length);
    for (let k = 0; k < part.length; k++) f32[k] = part[k] / 32768;
    const data = new AudioData({
      format: "f32-planar",
      sampleRate,
      numberOfFrames: f32.length,
      numberOfChannels: 1,
      timestamp: Math.round((i / sampleRate) * 1e6),
      data: f32,
    });
    encoder.encode(data);
    data.close();
  }
  await encoder.flush();
  encoder.close();
  if (failure) throw failure;
  muxer.finalize();
  return new Uint8Array(muxer.target.buffer);
}

(globalThis as Record<string, unknown>).RBNative = {
  isApp: Capacitor.isNativePlatform(),
  shareFile,
  shareText,
  tap,
  canMakeRingtone,
  encodeM4a,
};
