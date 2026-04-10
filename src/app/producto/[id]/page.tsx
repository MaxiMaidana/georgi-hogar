import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import ProductGallery from "@/src/components/ProductGallery";
import AddToCartButton from "@/src/components/AddToCartButton";

export const revalidate = 60;

interface ProductDetail {
  id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  price: number;
  previous_price: number | null;
  stock: number;
  image_url: string | null;
  imagenes: string[] | null;
  category: string | null;
  material: string | null;
  measurements: string | null;
  burners: number | null;
  color: string | null;
  recommended_use: string | null;
  estado: boolean;
}

function formatARS(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single<ProductDetail>();

  if (!product || !product.estado) return notFound();

  const images: string[] = [
    ...(product.imagenes ?? []),
    ...(product.image_url && !(product.imagenes ?? []).includes(product.image_url)
      ? [product.image_url]
      : []),
  ];

  const thumbnail = images[0] ?? null;

  const hasDiscount =
    product.previous_price != null &&
    product.previous_price > 0 &&
    product.previous_price > product.price;

  const discountPercent = hasDiscount
    ? Math.round(
        ((product.previous_price! - product.price) / product.previous_price!) *
          100
      )
    : 0;

  const specs: { label: string; value: string }[] = [
    product.material ? { label: "Material", value: product.material } : null,
    product.measurements
      ? { label: "Medidas", value: product.measurements }
      : null,
    product.burners
      ? { label: "Hornallas", value: String(product.burners) }
      : null,
    product.color ? { label: "Color", value: product.color } : null,
    product.recommended_use
      ? { label: "Uso recomendado", value: product.recommended_use }
      : null,
  ].filter((s): s is { label: string; value: string } => s !== null);

  return (
    <div className="flex flex-1 flex-col bg-black">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          Volver al catálogo
        </Link>

        {/* Top section: Gallery + Info */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
          {/* Gallery */}
          <ProductGallery images={images} />

          {/* Product info */}
          <div className="flex flex-col gap-4">
            {product.category && (
              <span className="w-fit rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-400">
                {product.category}
              </span>
            )}

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {product.name}
            </h1>

            {product.short_description && (
              <p className="text-base text-zinc-400">
                {product.short_description}
              </p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-white">
                {formatARS(product.price)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-zinc-500 line-through">
                    {formatARS(product.previous_price!)}
                  </span>
                  <span className="rounded-full bg-green-900/30 px-2.5 py-0.5 text-xs font-semibold text-green-400">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Stock */}
            {product.stock > 0 ? (
              <p className="text-sm text-green-400">En stock</p>
            ) : (
              <p className="text-sm text-red-500">Sin stock</p>
            )}

            {/* Add to cart */}
            <div className="mt-2">
              <AddToCartButton
                id={product.id}
                name={product.name}
                price={product.price}
                image_url={thumbnail}
                stock={product.stock}
              />
            </div>

            {/* Specs – compact on desktop beside gallery */}
            {specs.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                  >
                    <p className="text-xs font-medium text-zinc-500">
                      {spec.label}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-zinc-100">
                      {spec.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description section */}
        {product.description && (
          <section className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
            <h2 className="mb-4 text-lg font-bold text-white">
              Descripción
            </h2>
            <p className="whitespace-pre-line leading-relaxed text-zinc-400">
              {product.description}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
