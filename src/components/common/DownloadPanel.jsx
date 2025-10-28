import React from "react";

export default function DownloadPanel({ blob, meta }) {
  if (!blob) return null;
  const ts = new Date(meta.timestamp).toISOString().replaceAll(":", "").replaceAll("-", "");
  const base = `${meta.childId}_${meta.game}_${ts}`;
  const videoName = `${base}.webm`;
  const jsonName = `${base}.json`;
  const videoUrl = URL.createObjectURL(blob);
  const metaBlob = new Blob([JSON.stringify(meta, null, 2)], { type: "application/json" });
  const metaUrl = URL.createObjectURL(metaBlob);

  return (
    <div className="mx-auto mt-5 w-full max-w-3xl p-4 rounded-2xl bg-white/10 text-white">
      <h3 className="text-xl font-bold mb-2">Downloads</h3>
      <p className="text-sm opacity-90 mb-3">
        Save these files for your dataset. 
      </p>
      <div className="flex flex-wrap gap-3">
        <a className="px-5 py-3 bg-[#ffd60a] text-black rounded-2xl font-bold" href={videoUrl} download={videoName}>
          ⬇ Download Video (.webm)
        </a>
        <a className="px-5 py-3 bg-white/20 text-white rounded-2xl font-bold" href={metaUrl} download={jsonName}>
          ⬇ Download Metadata (.json)
        </a>
      </div>
    </div>
  );
}
