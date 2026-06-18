import Image from "next/image";

export function BrandLogo({
  className = "",
  priority = false,
  tone = "light",
}: {
  className?: string;
  priority?: boolean;
  tone?: "light" | "dark";
}) {
  return (
    <Image
      src={tone === "dark" ? "/brand/cologne-wordmark-dark.webp" : "/brand/cologne-wordmark.webp"}
      alt="Cologne"
      width={1000}
      height={155}
      priority={priority}
      className={`h-auto w-[154px] object-contain ${className}`}
    />
  );
}
