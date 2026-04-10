"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Minus, Plus, Trash2, X, Store, Truck, Loader2 } from "lucide-react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { createBrowserClient } from "@supabase/ssr";
import { useCartStore, CartItem } from "@/src/store/cartStore";

const LIBRARIES: ["places"] = ["places"];

type MetodoEntrega = "retiro" | "envio" | null;

type ShippingConfig = {
  direccion_deposito: string;
  precio_base_envio: number;
  precio_por_km: number;
  whatsapp_numero: string;
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
        .select("direccion_deposito, precio_base_envio, precio_por_km, whatsapp_numero")
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

    const numero = (shippingConfig?.whatsapp_numero ?? "5491130594139").replace(/\D/g, "");
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(text)}`;
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
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Carrito de compras"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Tu carrito</h2>
          <button
            onClick={closeCart}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Cerrar carrito"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-gray-400">Tu carrito está vacío.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item: CartItem) => (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-200">
                      <span className="text-[10px] text-gray-500">Sin img</span>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {item.name}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="rounded p-0.5 text-gray-400 transition-colors hover:text-red-500"
                        aria-label={`Eliminar ${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-gray-500 transition-colors hover:bg-gray-100"
                          aria-label="Reducir cantidad"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm font-medium text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-gray-500 transition-colors hover:bg-gray-100"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
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
          <div className="flex flex-col gap-4 border-t border-gray-200 px-4 py-4">
            {/* Método de entrega */}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-500">
                Método de entrega
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectMetodo("retiro")}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-colors ${
                    metodoEntrega === "retiro"
                      ? "border-navy-500 bg-navy-50 text-navy-700"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-800"
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
                      ? "border-navy-500 bg-navy-50 text-navy-700"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-800"
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
                      className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-4 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-navy-400 focus:ring-1 focus:ring-navy-400"
                    />
                  </Autocomplete>
                ) : (
                  <input
                    type="text"
                    disabled
                    placeholder="Cargando Google Maps..."
                    className="w-full rounded-xl border border-gray-300 bg-gray-100 py-2.5 px-4 text-sm text-gray-400 outline-none"
                  />
                )}

                {/* Estado del cálculo */}
                {calculandoEnvio && (
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                    <Loader2 size={14} className="animate-spin text-gray-400" />
                    <span className="text-xs text-gray-500">Calculando costo de envío...</span>
                  </div>
                )}

                {errorEnvio && !calculandoEnvio && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                    <span className="text-xs text-red-400">{errorEnvio}</span>
                  </div>
                )}
              </div>
            )}

            {/* Totales */}
            <div className="flex flex-col gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">{formatARS(subtotal)}</span>
              </div>

              {metodoEntrega === "envio" && (
                <div className="flex items-start justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-500">Envío</span>
                    {distanciaKm !== null && (
                      <span className="text-[11px] text-gray-400">
                        {distanciaKm} km de distancia
                      </span>
                    )}
                  </div>
                  <span className="text-gray-900">
                    {calculandoEnvio ? (
                      <Loader2 size={13} className="animate-spin text-gray-400" />
                    ) : costoEnvio !== null ? (
                      formatARS(costoEnvio)
                    ) : (
                      <span className="text-gray-400 text-xs">Ingresá tu dirección</span>
                    )}
                  </span>
                </div>
              )}

              <div className="mt-1 flex items-center justify-between border-t border-gray-200 pt-1.5">
                <span className="text-sm font-medium text-gray-600">Total</span>
                <span className="text-xl font-bold text-gray-900">{formatARS(total)}</span>
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
              className="w-full rounded-xl px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
