"use client";

import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5491100000000";
const MESSAGE = "Hola! Me interesa un producto de Georgi Hogar 🙌";

export default function WhatsAppButton() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE)}`;

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
