import React from "react";

export default function HeaderBar({ title, onBack }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 text-white">
      <button
        onClick={onBack}
        className="px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition"
      >
        ⟵ Back
      </button>
      <h1 className="text-2xl md:text-3xl font-extrabold drop-shadow">{title}</h1>
      <div className="w-[92px]" />
    </div>
  );
}
