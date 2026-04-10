"use client";

import { useState } from "react";

interface ProductGalleryProps {
  images: string[];
}

export default function ProductGallery({ images }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-zinc-800">
        <span className="text-sm text-zinc-500">Sin imagen</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <img
          src={images[selected]}
          alt={`Imagen ${selected + 1}`}
          className="aspect-square w-full object-cover transition-opacity duration-300"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                i === selected
                  ? "border-white"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={src}
                alt={`Miniatura ${i + 1}`}
                className="h-16 w-16 object-cover sm:h-20 sm:w-20"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
