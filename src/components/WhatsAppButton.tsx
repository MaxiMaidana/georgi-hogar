"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/src/lib/supabase";

const MESSAGE = "Hola! Me interesa un producto de Georgi Hogar 🙌";
const FALLBACK = "5491130594139";

export default function WhatsAppButton() {
  const [numero, setNumero] = useState(FALLBACK);

  useEffect(() => {
    supabase
      .from("configuracion_envios")
      .select("whatsapp_numero")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data?.whatsapp_numero) {
          setNumero(data.whatsapp_numero.replace(/\D/g, ""));
        }
      });
  }, []);

  const url = `https://wa.me/${numero}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-9999 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-[#25D366] p-4 text-white shadow-2xl shadow-black/50 transition-transform hover:scale-110 active:scale-95"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle size={26} fill="white" strokeWidth={0} />
    </a>
  );
}
