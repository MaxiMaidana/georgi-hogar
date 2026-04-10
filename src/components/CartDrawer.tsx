"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Minus, Plus, Trash2, X, Store, Truck, Loader2 } from "lucide-react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { createBrowserClient } from "@supabase/ssr";
import { useCartStore, CartItem } from "@/src/store/cartStore";

const WHATSAPP_NUMBER = "5491100000000";
const LIBRARIES: ["places"] = ["places"];

type MetodoEntrega = "retiro" | "envio" | null;

type ShippingConfig = {
  direccion_deposito: string;
  precio_base_envio: number;
  precio_por_km: number;
};

function formatARS(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
}

function useSupabase() {
  return useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );
}

export default function CartDrawer() {
  const supabase = useSupabase();

  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  // Shipping config from Supabase
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig | null>(null);

  // Checkout state
  const [metodoEntrega, setMetodoEntrega] = useState<MetodoEntrega>(null);
  const [direccionCliente, setDireccionCliente] = useState("");
  const [costoEnvio, setCostoEnvio] = useState<number | null>(null);
  const [distanciaKm, setDistanciaKm] = useState<number | null>(null);
  const [calculandoEnvio, setCalculandoEnvio] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: LIBRARIES,
  });

  // Load shipping config once
  useEffect(() => {
    async function fetchConfig() {
      const { data } = await supabase
        .from("configuracion_envios")
        .select("direccion_deposito, precio_base_envio, precio_por_km")
        .limit(1)
        .single();
      if (data) setShippingConfig(data as ShippingConfig);
    }
    fetchConfig();
  }, [supabase]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!isCartOpen) {
      setMetodoEntrega(null);
      setDireccionCliente("");
      setCostoEnvio(null);
      setDistanciaKm(null);
      setErrorEnvio(null);
    }
  }, [isCartOpen]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isCartOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isCartOpen]);

  function handleSelectMetodo(metodo: MetodoEntrega) {
    setMetodoEntrega(metodo);
    setDireccionCliente("");
    setCostoEnvio(null);
    setDistanciaKm(null);
    setErrorEnvio(null);
  }

  async function calcularEnvio(destino: string) {
    if (!shippingConfig || !destino.trim()) return;

    setCalculandoEnvio(true);
    setCostoEnvio(null);
    setDistanciaKm(null);
    setErrorEnvio(null);

    try {
      const service = new window.google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [shippingConfig.direccion_deposito],
          destinations: [destino],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
        },
        (response, status) => {
          setCalculandoEnvio(false);
          if (
            status !== "OK" ||
            !response ||
            response.rows[0]?.elements[0]?.status !== "OK"
          ) {
            setErrorEnvio("No se pudo calcular la distancia. Verificá la dirección.");
            return;
          }

          const metros = response.rows[0].elements[0].distance.value;
          const km = metros / 1000;
          const costo = Math.round(
            shippingConfig.precio_base_envio + km * shippingConfig.precio_por_km
          );

          setDistanciaKm(Math.round(km * 10) / 10);
          setCostoEnvio(costo);
        }
      );
    } catch {
      setCalculandoEnvio(false);
      setErrorEnvio("Error al conectar con Google Maps.");
    }
  }

  function handlePlaceChanged() {
    const place = autocompleteRef.current?.getPlace();
    const address = place?.formatted_address ?? "";
    if (address) {
      setDireccionCliente(address);
      calcularEnvio(address);
    }
  }

  const subtotal = items.reduce(
    (sum: number, item: CartItem) => sum + item.price * item.quantity,
    0
  );
  const envioTotal = metodoEntrega === "envio" && costoEnvio !== null ? costoEnvio : 0;
  const total = subtotal + envioTotal;

  const whatsappEnabled =
    metodoEntrega === "retiro" ||
    (metodoEntrega === "envio" && costoEnvio !== null);

  function handleWhatsAppOrder() {
    if (!whatsappEnabled) return;

    const lines = items.map(
      (item: CartItem) =>
        `- ${item.quantity}x ${item.name} (${formatARS(item.price)})`
    );

    const envioLineas =
      metodoEntrega === "envio" && costoEnvio !== null
        ? [
            `Dirección de envío: ${direccionCliente}`,
            `Distancia: ${distanciaKm} km`,
            `Costo de envío: ${formatARS(costoEnvio)}`,
          ]
        : [];

    const text = [
      "Hola! Quiero hacer un pedido:",
      "",
      ...lines,
      "",
      `Subtotal: ${formatARS(subtotal)}`,
      ...(envioLineas.length ? envioLineas : []),
      `*Total: ${formatARS(total)}*`,
      "",
      `Método de entrega: ${
        metodoEntrega === "retiro" ? "Retiro en el local" : "Envío a domicilio"
      }`,
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${
          isCartOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-zinc-950 shadow-xl transition-transform duration-300 ease-in-out ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Carrito de compras"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4">
          <h2 className="text-lg font-semibold text-white">Tu carrito</h2>
          <button
            onClick={closeCart}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="Cerrar carrito"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-zinc-500">Tu carrito está vacío.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item: CartItem) => (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                      <span className="text-[10px] text-zinc-400">Sin img</span>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-zinc-100">
                        {item.name}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="rounded p-0.5 text-zinc-400 transition-colors hover:text-red-500"
                        aria-label={`Eliminar ${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700 text-zinc-400 transition-colors hover:bg-zinc-800"
                          aria-label="Reducir cantidad"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm font-medium text-zinc-100">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700 text-zinc-400 transition-colors hover:bg-zinc-800"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-zinc-100">
                        {formatARS(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-zinc-800 px-4 py-4">
            {/* Método de entrega */}
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-400">
                Método de entrega
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectMetodo("retiro")}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-colors ${
                    metodoEntrega === "retiro"
                      ? "border-green-500 bg-green-950/30 text-green-400"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  <Store size={18} />
                  <span className="text-xs font-medium leading-tight">
                    Retiro en el local
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectMetodo("envio")}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-colors ${
                    metodoEntrega === "envio"
                      ? "border-green-500 bg-green-950/30 text-green-400"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  <Truck size={18} />
                  <span className="text-xs font-medium leading-tight">
                    Envío a domicilio
                  </span>
                </button>
              </div>
            </div>

            {/* Autocomplete de dirección */}
            {metodoEntrega === "envio" && (
              <div className="flex flex-col gap-2">
                {isLoaded ? (
                  <Autocomplete
                    onLoad={(ref) => { autocompleteRef.current = ref; }}
                    onPlaceChanged={handlePlaceChanged}
                    options={{ types: ["address"], componentRestrictions: { country: "ar" } }}
                  >
                    <input
                      type="text"
                      defaultValue={direccionCliente}
                      placeholder="Ingresá tu dirección"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-4 pr-4 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    />
                  </Autocomplete>
                ) : (
                  <input
                    type="text"
                    disabled
                    placeholder="Cargando Google Maps..."
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 py-2.5 px-4 text-sm text-zinc-400 outline-none"
                  />
                )}

                {/* Estado del cálculo */}
                {calculandoEnvio && (
                  <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
                    <Loader2 size={14} className="animate-spin text-zinc-500" />
                    <span className="text-xs text-zinc-400">Calculando costo de envío...</span>
                  </div>
                )}

                {errorEnvio && !calculandoEnvio && (
                  <div className="rounded-xl border border-red-900 bg-red-950/30 px-3 py-2">
                    <span className="text-xs text-red-400">{errorEnvio}</span>
                  </div>
                )}
              </div>
            )}

            {/* Totales */}
            <div className="flex flex-col gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Subtotal</span>
                <span className="text-zinc-100">{formatARS(subtotal)}</span>
              </div>

              {metodoEntrega === "envio" && (
                <div className="flex items-start justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-zinc-400">Envío</span>
                    {distanciaKm !== null && (
                      <span className="text-[11px] text-zinc-600">
                        {distanciaKm} km de distancia
                      </span>
                    )}
                  </div>
                  <span className="text-zinc-100">
                    {calculandoEnvio ? (
                      <Loader2 size={13} className="animate-spin text-zinc-500" />
                    ) : costoEnvio !== null ? (
                      formatARS(costoEnvio)
                    ) : (
                      <span className="text-zinc-500 text-xs">Ingresá tu dirección</span>
                    )}
                  </span>
                </div>
              )}

              <div className="mt-1 flex items-center justify-between border-t border-zinc-800 pt-1.5">
                <span className="text-sm font-medium text-zinc-300">Total</span>
                <span className="text-xl font-bold text-white">{formatARS(total)}</span>
              </div>
            </div>

            {/* WhatsApp */}
            <button
              onClick={handleWhatsAppOrder}
              disabled={!whatsappEnabled}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors ${
                whatsappEnabled
                  ? "bg-green-600 hover:bg-green-700"
                  : "cursor-not-allowed bg-green-600 opacity-40"
              }`}
            >
              {whatsappEnabled
                ? "Pedir por WhatsApp"
                : metodoEntrega === "envio"
                ? "Seleccioná tu dirección"
                : "Elegí un método de entrega"}
            </button>

            <button
              onClick={clearCart}
              className="w-full rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
