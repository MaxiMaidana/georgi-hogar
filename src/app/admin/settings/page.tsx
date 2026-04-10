import ConfiguracionEnvios from "@/src/components/ConfiguracionEnvios";
import CategoriaManager from "@/src/components/CategoriaManager";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-12">
      <ConfiguracionEnvios />
      <CategoriaManager />
    </div>
  );
}
