import React, { useMemo } from "react";

export default function SessionControls({
  childId,
  setChildId,
  age,
  setAge,
  group,
  setGroup,
  onStart,
  onStop,
  running,
  gameKey,
  timeLeft,
  totalSec,
}) {
  const pct = useMemo(
    () => (running ? Math.max(0, Math.min(100, 100 * (1 - timeLeft / totalSec))) : 0),
    [running, timeLeft, totalSec]
  );

  return (
    <div className="mx-auto w-full max-w-3xl p-4 mt-2 rounded-2xl bg-white/10 text-white">
      <div className="grid md:grid-cols-2 gap-3 items-center">
        <div>
          <label className="text-sm opacity-90">Child ID (anonymized)</label>
          <input
            className="mt-1 w-full rounded-xl bg-white/15 text-white placeholder-white/60 px-4 py-2 outline-none"
            placeholder="e.g., LRH001"
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
          />

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm opacity-90">Age</label>
              <input
                type="number"
                min="0"
                className="mt-1 w-full rounded-xl bg-white/15 text-white placeholder-white/60 px-4 py-2 outline-none"
                placeholder="e.g., 8"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm opacity-90">Group</label>
              <select
                className="mt-1 w-full rounded-xl bg-gray-500 text-white placeholder-blue-500 px-4 py-2 outline-none"
                value={group || ""}
                onChange={(e) => setGroup(e.target.value)}
              >
                <option value="" disabled>
                  Select group...
                </option>
                <option value="control">control</option>
                <option value="adhd">adhd</option>
                <option value="other">other</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 items-end md:justify-end">
          {!running ? (
            <button
              className="px-5 py-3 rounded-2xl bg-[#ffd60a] text-black font-bold"
              onClick={onStart}
              disabled={!childId}
            >
              ▶ Start
            </button>
          ) : (
            <button
              className="px-5 py-3 rounded-2xl bg-red-500 text-white font-bold"
              onClick={onStop}
            >
              ⏹ Stop
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm opacity-90">
          <span>Game: <b>{gameKey}</b></span>
          <span>Time left: <b>{timeLeft}s</b></span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full bg-[#ffd60a]" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
