import { LexaLoader } from "@/components/lexa-loader";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LexaLoader size={96} label="Lexa" />
    </div>
  );
}
