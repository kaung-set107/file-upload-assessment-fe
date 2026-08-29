import Image, { type StaticImageData } from "next/image";

import logo from "@/app/logo.png";

type FileStorageLogoProps = {
  compact?: boolean;
  tone?: "light" | "dark";
  className?: string;
};

export function FileStorageLogo({
  compact = false,
  tone = "light",
  className = "",
}: FileStorageLogoProps) {
  const dark = tone === "dark";
  const logoWidth = compact ? 132 : 210;

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden rounded-full border px-3 py-2 ${
        dark
          ? "border-white/10 bg-white/95 shadow-[0_18px_42px_-28px_rgba(15,23,42,0.7)]"
          : "border-slate-200/80 bg-white shadow-[0_14px_36px_-28px_rgba(15,23,42,0.32)]"
      } ${className}`}
    >
      <Image
        src={logo as StaticImageData}
        alt="FileStorage"
        priority
        width={logo.width}
        height={logo.height}
        sizes={`${logoWidth}px`}
        style={{ width: `${logoWidth}px`, height: "auto" }}
        className="block max-w-none"
      />
    </div>
  );
}
