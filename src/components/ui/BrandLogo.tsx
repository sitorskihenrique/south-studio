import Image from "next/image";

export function BrandLogo({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/cologne-wordmark.webp"
      alt="Cologne"
      width={1000}
      height={155}
      priority={priority}
      className={`h-auto w-[154px] object-contain ${className}`}
    />
  );
}
