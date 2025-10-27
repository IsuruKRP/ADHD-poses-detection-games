import React, { useEffect, useMemo, useState } from "react";
import useWebcamRecorder from "./hooks/useWebcamRecorder";
import HeaderBar from "./common/HeaderBar";
import SessionControls from "./common/SessionControls";
import DownloadPanel from "./common/DownloadPanel";

export default function FocusDistract({ onBack }) {
  const totalSec = 180;
  const [running, setRunning] = useState(false);
  const [childId, setChildId] = useState("");
  const [blob, setBlob] = useState(null);
  const [meta, setMeta] = useState(null);
  const { videoRef, setupStream, startRecording, stopRecording } = useWebcamRecorder();
  const [timeLeft, setTimeLeft] = useState(totalSec);
  const [tick, setTick] = useState(0);

  useEffect(() => { setupStream(); }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTick((k) => k + 1), 60);
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timer); endSession(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { clearInterval(t); clearInterval(timer); };
  }, [running]);

  const distractors = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 10; i++) {
      const phase = (tick / 20 + i) % (2 * Math.PI);
      const x = 50 + Math.sin(phase + i) * 40;
      const y = 50 + Math.cos(phase * 1.3) * 25;
      arr.push({ id: i, x, y, emoji: ["🎈", "🪀", "🪁", "🛝", "🧸"][i % 5] });
    }
    return arr;
  }, [tick]);

  const startSession = async () => {
    const ok = await startRecording();
    if (!ok) return;
    setRunning(true);
  };

  const endSession = async () => {
    const b = await stopRecording();
    setBlob(b);
    setMeta({ game: "FocusDistract", childId, timestamp: Date.now(), durationSec: totalSec });
    setRunning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e1b4d] via-[#1b3a8f] to-[#274690] pb-10">
      <HeaderBar title="🎯 Focus & Distract" onBack={onBack} />
      <video ref={videoRef} className="hidden" playsInline muted />

      <SessionControls
        childId={childId}
        setChildId={setChildId}
        onStart={startSession}
        onStop={endSession}
        running={running}
        gameKey="FocusDistract"
        timeLeft={timeLeft}
        totalSec={totalSec}
      />

      <div className="mx-auto mt-6 w-full max-w-3xl p-6 rounded-3xl bg-white/10 text-white text-center relative overflow-hidden">
        <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-white/10">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-24 w-24 rounded-full bg-white/30 flex items-center justify-center border border-white/40">
              <span className="text-4xl">🎯</span>
            </div>
            <p className="mt-2 text-sm opacity-90">Keep eyes on the target!</p>
          </div>

          {running &&
            distractors.map((d) => (
              <div key={d.id} className="absolute text-3xl"
                style={{ left: `calc(${d.x}% - 16px)`, top: `calc(${d.y}% - 16px)` }}>
                {d.emoji}
              </div>
            ))}

          {!running && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <h2 className="text-3xl font-extrabold">Don’t get distracted! 👀</h2>
              <p className="mt-2 opacity-80">Stare at the target while toys float around.</p>
            </div>
          )}
        </div>
      </div>

      <DownloadPanel blob={blob} meta={meta} />
    </div>
  );
}
