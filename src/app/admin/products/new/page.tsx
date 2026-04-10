"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowLeft, ImagePlus, X, Save } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  "Bazar",
  "Cocinas y Hornos",
  "Parrillas y Discos",
] as const;

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
}

const INITIAL_FORM: FormData = {
  name: "",
  category: "",
  short_description: "",
  description: "",
  price: "",
  previous_price: "",
  stock: "0",
  material: "",
  measurements: "",
  burners: "",
  color: "",
  recommended_use: "",
};

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
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
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
    >
      {children}
      {optional && (
        <span className="ml-1 font-normal text-zinc-400 dark:text-zinc-500">
          (opcional)
        </span>
      )}
    </label>
  );
}

const INPUT_CLASSES =
  "w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";

export default function NewProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setImageFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      setPreviews((prev) => [...prev, url]);
    });

    e.target.value = "";
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadImages(files: File[]): Promise<string[]> {
    const urls: string[] = [];

    for (const file of files) {
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Error subiendo ${file.name}: ${uploadError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("products").getPublicUrl(fileName);

      urls.push(publicUrl);
    }

    return urls;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const imageUrls =
        imageFiles.length > 0 ? await uploadImages(imageFiles) : [];

      const payload = {
        name: formData.name,
        category: formData.category,
        short_description: formData.short_description || null,
        description: formData.description || null,
        price: formData.price !== "" ? Number(formData.price) : 0,
        previous_price:
          formData.previous_price !== "" ? Number(formData.previous_price) : 0,
        stock: formData.stock !== "" ? Number(formData.stock) : 0,
        material: formData.material || null,
        measurements: formData.measurements || null,
        burners: formData.burners !== "" ? Number(formData.burners) : 0,
        color: formData.color || null,
        recommended_use: formData.recommended_use || null,
        images: imageUrls,
        image_url: imageUrls[0] ?? null,
        is_active: true,
      };

      const { error: insertError } = await supabase
        .from("products")
        .insert([payload]);

      if (insertError) {
        throw new Error(insertError.message);
      }

      router.push("/admin/products");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/products"
          className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Volver a productos"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Nuevo Producto
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                value={formData.name}
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
                value={formData.category}
                onChange={handleChange}
                className={INPUT_CLASSES}
              >
                <option value="" disabled>
                  Seleccioná una categoría
                </option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="short_description">Descripción Corta</Label>
              <textarea
                id="short_description"
                name="short_description"
                rows={2}
                maxLength={150}
                value={formData.short_description}
                onChange={handleChange}
                className={INPUT_CLASSES}
                placeholder="Resumen breve del producto (máx. 150 caracteres)"
              />
              <p className="mt-1 text-right text-xs text-zinc-400">
                {formData.short_description.length}/150
              </p>
            </div>

            <div>
              <Label htmlFor="description">Descripción Larga</Label>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={formData.description}
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
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className={INPUT_CLASSES}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="previous_price" optional>
                Precio Anterior (ARS)
              </Label>
              <input
                id="previous_price"
                name="previous_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.previous_price}
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
                value={formData.stock}
                onChange={handleChange}
                className={INPUT_CLASSES}
                placeholder="0"
              />
            </div>
          </div>
        </SectionCard>

        {/* Características */}
        <SectionCard title="Características">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="material" optional>
                Material
              </Label>
              <input
                id="material"
                name="material"
                type="text"
                value={formData.material}
                onChange={handleChange}
                className={INPUT_CLASSES}
                placeholder="Ej: Acero inoxidable"
              />
            </div>
            <div>
              <Label htmlFor="measurements" optional>
                Medidas
              </Label>
              <input
                id="measurements"
                name="measurements"
                type="text"
                value={formData.measurements}
                onChange={handleChange}
                className={INPUT_CLASSES}
                placeholder="Ej: 80x60x90 cm"
              />
            </div>
            <div>
              <Label htmlFor="burners" optional>
                Cant. de Hornallas
              </Label>
              <input
                id="burners"
                name="burners"
                type="number"
                min="0"
                value={formData.burners}
                onChange={handleChange}
                className={INPUT_CLASSES}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="color" optional>
                Color
              </Label>
              <input
                id="color"
                name="color"
                type="text"
                value={formData.color}
                onChange={handleChange}
                className={INPUT_CLASSES}
                placeholder="Ej: Negro mate"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="recommended_use" optional>
                Uso Recomendado
              </Label>
              <input
                id="recommended_use"
                name="recommended_use"
                type="text"
                value={formData.recommended_use}
                onChange={handleChange}
                className={INPUT_CLASSES}
                placeholder="Ej: Restaurantes, foodtrucks"
              />
            </div>
          </div>
        </SectionCard>

        {/* Imágenes */}
        <SectionCard title="Imágenes">
          <div className="flex flex-col gap-4">
            <label
              htmlFor="images"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 px-4 py-8 text-center transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
            >
              <ImagePlus
                size={28}
                className="text-zinc-400 dark:text-zinc-500"
              />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Hacé clic para seleccionar imágenes
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                PNG, JPG o WEBP
              </span>
              <input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {previews.map((src, i) => (
                  <div key={src} className="group relative aspect-square">
                    <img
                      src={src}
                      alt={`Preview ${i + 1}`}
                      className="h-full w-full rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                      aria-label={`Quitar imagen ${i + 1}`}
                    >
                      <X size={14} />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        {/* Error */}
        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </p>
        )}

        {/* Submit */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/admin/products"
            className="flex items-center justify-center rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            <Save size={18} />
            {loading ? "Guardando..." : "Guardar Producto"}
          </button>
        </div>
      </form>
    </div>
  );
}
