"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2, ImageOff, Plus, X, Save } from "lucide-react";

const BUCKET = "products";

const CATEGORIES = ["Bazar", "Cocinas y Hornos", "Parrillas y Discos"] as const;

export interface ProductToEdit {
  id: string;
  name: string;
  category: string | null;
  short_description: string | null;
  description: string | null;
  price: number;
  previous_price: number | null;
  stock: number;
  material: string | null;
  measurements: string | null;
  burners: number | null;
  color: string | null;
  recommended_use: string | null;
  image_url: string | null;
  imagenes: string[] | null;
  estado: boolean;
}

interface FormData {
  name: string;
  category: string;
  short_description: string;
  description: string;
  price: string;
  previous_price: string;
  stock: string;
  material: string;
  measurements: string;
  burners: string;
  color: string;
  recommended_use: string;
  estado: boolean;
}

interface PendingFile {
  file: File;
  preview: string;
}

const INPUT_CLASSES =
  "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
      <h2 className="mb-4 text-base font-semibold text-zinc-100">{title}</h2>
      {children}
    </div>
  );
}

function Label({
  htmlFor,
  children,
  optional,
}: {
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-zinc-400">
      {children}
      {optional && <span className="ml-1 font-normal text-zinc-600">(opcional)</span>}
    </label>
  );
}

export default function EditProductForm({ product }: { product: ProductToEdit }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // Form fields
  const [form, setForm] = useState<FormData>({
    name: product.name,
    category: product.category ?? "",
    short_description: product.short_description ?? "",
    description: product.description ?? "",
    price: String(product.price),
    previous_price: String(product.previous_price ?? ""),
    stock: String(product.stock),
    material: product.material ?? "",
    measurements: product.measurements ?? "",
    burners: product.burners != null ? String(product.burners) : "",
    color: product.color ?? "",
    recommended_use: product.recommended_use ?? "",
    estado: product.estado,
  });

  // Two-phase image management
  const [existingImages, setExistingImages] = useState<string[]>(() => {
    if (product.imagenes && product.imagenes.length > 0) return product.imagenes;
    if (product.image_url) return [product.image_url];
    return [];
  });
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleRemoveExisting(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleRemovePending(index: number) {
    setPendingFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const newPending: PendingFile[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPendingFiles((prev) => [...prev, ...newPending]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // 1. Upload pending files
      const uploadedUrls: string[] = [];
      for (const pf of pendingFiles) {
        const ext = pf.file.name.split(".").pop() ?? "jpg";
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { data, error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(fileName, pf.file, { upsert: false });
        if (uploadError) throw new Error(`Error subiendo imagen: ${uploadError.message}`);
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
        uploadedUrls.push(urlData.publicUrl);
      }

      // 2. Merge images
      const finalImages = [...existingImages, ...uploadedUrls];

      // 3. Build payload
      const payload = {
        name: form.name,
        category: form.category || null,
        short_description: form.short_description || null,
        description: form.description || null,
        price: Number(form.price) || 0,
        previous_price: form.previous_price !== "" ? Number(form.previous_price) : null,
        stock: Number(form.stock) || 0,
        material: form.material || null,
        measurements: form.measurements || null,
        burners: form.burners !== "" ? Number(form.burners) : null,
        color: form.color || null,
        recommended_use: form.recommended_use || null,
        estado: form.estado,
        imagenes: finalImages,
        image_url: finalImages[0] ?? null,
      };

      // 4. Update in DB
      const { error: updateError } = await supabase
        .from("products")
        .update(payload)
        .eq("id", product.id);

      if (updateError) throw new Error(updateError.message);

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      setSaving(false);
    }
  }

  const totalImages = existingImages.length + pendingFiles.length;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Información Principal */}
      <SectionCard title="Información Principal">
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className={INPUT_CLASSES}
              placeholder="Ej: Cocina Industrial 4 Hornallas"
            />
          </div>

          <div>
            <Label htmlFor="category">Categoría</Label>
            <select
              id="category"
              name="category"
              required
              value={form.category}
              onChange={handleChange}
              className={INPUT_CLASSES}
            >
              <option value="" disabled>Seleccioná una categoría</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="short_description" optional>Descripción Corta</Label>
            <textarea
              id="short_description"
              name="short_description"
              rows={2}
              maxLength={150}
              value={form.short_description}
              onChange={handleChange}
              className={INPUT_CLASSES}
              placeholder="Resumen breve del producto (máx. 150 caracteres)"
            />
            <p className="mt-1 text-right text-xs text-zinc-600">
              {form.short_description.length}/150
            </p>
          </div>

          <div>
            <Label htmlFor="description" optional>Descripción Larga</Label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={form.description}
              onChange={handleChange}
              className={INPUT_CLASSES}
              placeholder="Descripción detallada del producto..."
            />
          </div>
        </div>
      </SectionCard>

      {/* Precios y Stock */}
      <SectionCard title="Precios y Stock">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="price">Precio Actual (ARS)</Label>
            <input
              id="price"
              name="price"
              type="number"
              required
              min="0"
              value={form.price}
              onChange={handleChange}
              className={INPUT_CLASSES}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="previous_price" optional>Precio Anterior (ARS)</Label>
            <input
              id="previous_price"
              name="previous_price"
              type="number"
              min="0"
              value={form.previous_price}
              onChange={handleChange}
              className={INPUT_CLASSES}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="stock">Stock</Label>
            <input
              id="stock"
              name="stock"
              type="number"
              required
              min="0"
              value={form.stock}
              onChange={handleChange}
              className={INPUT_CLASSES}
              placeholder="0"
            />
          </div>
        </div>
      </SectionCard>

      {/* Estado */}
      <SectionCard title="Estado">
        <select
          name="estado"
          value={form.estado ? "1" : "0"}
          onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value === "1" }))}
          className={INPUT_CLASSES}
        >
          <option value="1">Activo (visible en la tienda)</option>
          <option value="0">Pausado (oculto en la tienda)</option>
        </select>
      </SectionCard>

      {/* Características */}
      <SectionCard title="Características">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="material" optional>Material</Label>
            <input
              id="material"
              name="material"
              type="text"
              value={form.material}
              onChange={handleChange}
              className={INPUT_CLASSES}
              placeholder="Ej: Acero inoxidable"
            />
          </div>
          <div>
            <Label htmlFor="measurements" optional>Medidas</Label>
            <input
              id="measurements"
              name="measurements"
              type="text"
              value={form.measurements}
              onChange={handleChange}
              className={INPUT_CLASSES}
              placeholder="Ej: 80x60x90 cm"
            />
          </div>
          <div>
            <Label htmlFor="burners" optional>Cant. de Hornallas</Label>
            <input
              id="burners"
              name="burners"
              type="number"
              min="0"
              value={form.burners}
              onChange={handleChange}
              className={INPUT_CLASSES}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="color" optional>Color</Label>
            <input
              id="color"
              name="color"
              type="text"
              value={form.color}
              onChange={handleChange}
              className={INPUT_CLASSES}
              placeholder="Ej: Negro mate"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="recommended_use" optional>Uso Recomendado</Label>
            <input
              id="recommended_use"
              name="recommended_use"
              type="text"
              value={form.recommended_use}
              onChange={handleChange}
              className={INPUT_CLASSES}
              placeholder="Ej: Restaurantes, foodtrucks"
            />
          </div>
        </div>
      </SectionCard>

      {/* Imágenes */}
      <SectionCard title="Imágenes">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {/* Empty state */}
            {totalImages === 0 && (
              <div className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-700 bg-zinc-800">
                <ImageOff size={20} className="text-zinc-600" />
                <span className="text-[10px] text-zinc-600">Sin fotos</span>
              </div>
            )}

            {/* Existing images */}
            {existingImages.map((url, i) => (
              <div key={`existing-${i}`} className="relative h-24 w-24 shrink-0">
                <img
                  src={url}
                  alt={`Foto ${i + 1}`}
                  className="h-full w-full rounded-xl object-cover"
                />
                {i === 0 && totalImages > 1 && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] text-white">
                    Principal
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveExisting(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
                  aria-label={`Eliminar foto ${i + 1}`}
                >
                  <X size={11} />
                </button>
              </div>
            ))}

            {/* Pending (not yet uploaded) */}
            {pendingFiles.map((pf, i) => (
              <div
                key={`pending-${i}`}
                className="relative h-24 w-24 shrink-0 rounded-xl ring-2 ring-amber-500/60"
              >
                <img
                  src={pf.preview}
                  alt={`Nueva foto ${i + 1}`}
                  className="h-full w-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePending(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
                  aria-label={`Quitar foto nueva ${i + 1}`}
                >
                  <X size={11} />
                </button>
              </div>
            ))}

            {/* Add button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-700 bg-zinc-800 text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
              aria-label="Agregar foto"
            >
              <Plus size={20} />
              <span className="text-[10px]">Agregar</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <p className="text-[11px] text-zinc-600">
            La primera foto es la imagen principal del producto.
            {pendingFiles.length > 0 && (
              <span className="ml-1 text-amber-500/80">
                Las fotos con borde naranja se subirán al guardar.
              </span>
            )}
          </p>
        </div>
      </SectionCard>

      {/* Actions */}
      <div className="flex gap-3 pb-8">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={saving}
          className="flex-1 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50 sm:flex-none sm:px-6"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50 sm:flex-none sm:px-8"
        >
          {saving ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              {pendingFiles.length > 0 ? "Subiendo fotos..." : "Guardando..."}
            </>
          ) : (
            <>
              <Save size={15} />
              Guardar cambios
            </>
          )}
        </button>
      </div>
    </form>
  );
}
