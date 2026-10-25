import { BRAND } from "@/lib/brand";
import { BoLoader } from "@/components/bo-loader";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <BoLoader size={96} label={BRAND.app.ar} />
    </div>
  );
}
