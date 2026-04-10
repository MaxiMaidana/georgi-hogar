"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { createBrowserClient } from "@supabase/ssr";
import { MapPin, DollarSign, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const LIBRARIES: ["places"] = ["places"];

type ConfigRow = {
  id: string | number;
  direccion_deposito: string;
  precio_base_envio: number;
  precio_por_km: number;
};

type ToastState = { type: "success" | "error"; message: string } | null;

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

export default function ConfiguracionEnvios() {
  const supabase = useSupabase();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: LIBRARIES,
  });

  const [configId, setConfigId] = useState<string | number | null>(null);
  const [direccionOrigen, setDireccionOrigen] = useState("");
  const [precioBase, setPrecioBase] = useState<number | "">("");
  const [precioPorKm, setPrecioPorKm] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Load existing config on mount
  useEffect(() => {
    async function fetchConfig() {
      try {
        const { data, error } = await supabase
          .from("configuracion_envios")
          .select("*")
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = row not found — safe to ignore
          throw error;
        }

        if (data) {
          const row = data as ConfigRow;
          setConfigId(row.id);
          setDireccionOrigen(row.direccion_deposito ?? "");
          setPrecioBase(row.precio_base_envio ?? "");
          setPrecioPorKm(row.precio_por_km ?? "");
        }
      } catch (err) {
        console.error("Error cargando configuración:", err);
        showToast("error", "No se pudo cargar la configuración.");
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, [supabase]);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  function handlePlaceChanged() {
    const place = autocompleteRef.current?.getPlace();
    if (place?.formatted_address) {
      setDireccionOrigen(place.formatted_address);
    }
  }

  async function handleSave() {
    if (!direccionOrigen.trim()) {
      showToast("error", "Completá la dirección de origen.");
      return;
    }
    if (precioBase === "" || precioPorKm === "") {
      showToast("error", "Completá todos los campos de precio.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        direccion_deposito: direccionOrigen.trim(),
        precio_base_envio: Number(precioBase),
        precio_por_km: Number(precioPorKm),
      };

      let error;

      if (configId) {
        ({ error } = await supabase
          .from("configuracion_envios")
          .update(payload)
          .eq("id", configId));
      } else {
        const { data, error: insertError } = await supabase
          .from("configuracion_envios")
          .insert(payload)
          .select("id")
          .single();
        error = insertError;
        if (data) setConfigId((data as { id: string }).id);
      }

      if (error) throw error;
      showToast("success", "Configuración guardada correctamente.");
    } catch (err) {
      console.error("Error guardando configuración:", err);
      showToast("error", "Hubo un error al guardar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-zinc-100">
        Configuración de Envíos
      </h1>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-md">
        <div className="flex flex-col gap-5">
          {/* Dirección de origen */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-400">
              Dirección de origen / Depósito
            </label>
            {isLoaded ? (
              <Autocomplete
                onLoad={(ref) => {
                  autocompleteRef.current = ref;
                }}
                onPlaceChanged={handlePlaceChanged}
                options={{ types: ["address"] }}
              >
                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                  <input
                    type="text"
                    value={direccionOrigen}
                    onChange={(e) => setDireccionOrigen(e.target.value)}
                    placeholder="Ej: Av. Corrientes 1234, Buenos Aires"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                  />
                </div>
              </Autocomplete>
            ) : (
              <div className="relative">
                <MapPin
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="text"
                  value={direccionOrigen}
                  onChange={(e) => setDireccionOrigen(e.target.value)}
                  placeholder="Cargando Google Maps..."
                  disabled
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 py-2.5 pl-10 pr-4 text-sm text-zinc-400 outline-none"
                />
              </div>
            )}
          </div>

          {/* Precio base */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-400">
              Precio base de envío ($)
            </label>
            <div className="relative">
              <DollarSign
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="number"
                min={0}
                value={precioBase}
                onChange={(e) =>
                  setPrecioBase(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="Ej: 2000"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              />
            </div>
          </div>

          {/* Precio por km */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-400">
              Precio por kilómetro ($)
            </label>
            <div className="relative">
              <DollarSign
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="number"
                min={0}
                value={precioPorKm}
                onChange={(e) =>
                  setPrecioPorKm(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="Ej: 150"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              />
            </div>
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Configuración"
            )}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`mt-4 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm transition-all ${
            toast.type === "success"
              ? "border-green-800 bg-green-950/50 text-green-400"
              : "border-red-800 bg-red-950/50 text-red-400"
          }`}
          role="alert"
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} className="shrink-0" />
          ) : (
            <AlertCircle size={16} className="shrink-0" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
