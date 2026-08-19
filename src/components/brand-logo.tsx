import clsx from "clsx";
import Image from "next/image";

type BrandLogoVariant = "sidebar" | "mobile" | "auth";

const logoSizes: Record<BrandLogoVariant, string> = {
  sidebar: "w-[150px]",
  mobile: "w-[104px]",
  auth: "w-[220px] sm:w-[260px]"
};

export function BrandLogo({
  variant = "sidebar",
  className,
  showModule = true,
  forceDark = false
}: {
  variant?: BrandLogoVariant;
  className?: string;
  showModule?: boolean;
  forceDark?: boolean;
}) {
  const isMobile = variant === "mobile";
  const isAuth = variant === "auth";

  return (
    <div
      className={clsx(
        "flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2",
        isMobile && "flex-nowrap gap-x-2",
        className
      )}
      aria-label="Panel360 Autos"
    >
      <span className="logo-envoltura inline-flex shrink-0 items-center">
        <Image
          src="/logo-panel360.svg"
          alt="Panel360"
          width={840}
          height={320}
          priority={!isMobile}
          sizes={isAuth ? "260px" : isMobile ? "104px" : "150px"}
          className={clsx("logo-imagen h-auto object-contain", logoSizes[variant], forceDark ? "hidden" : "dark:hidden")}
        />
        <Image
          src="/logo-panel360-dark.svg"
          alt="Panel360"
          width={840}
          height={320}
          priority={!isMobile}
          sizes={isAuth ? "260px" : isMobile ? "104px" : "150px"}
          className={clsx("logo-imagen h-auto object-contain", logoSizes[variant], forceDark ? "block" : "hidden dark:block")}
        />
      </span>

      {showModule ? (
        <span
          className={clsx(
            "min-w-0 border-l pl-3 leading-tight",
            forceDark ? "border-white/15" : "border-graphite/14 dark:border-white/15",
            isMobile && "pl-2",
            isAuth && "pl-4"
          )}
        >
          <span className={clsx("block font-black uppercase", forceDark ? "text-white" : "text-ink dark:text-white", isMobile ? "text-[10px]" : "text-xs")}>
            Autos
          </span>
          {!isMobile ? (
            <span className={clsx("block font-semibold", forceDark ? "text-slate-300" : "text-steel dark:text-slate-300", isAuth ? "text-sm" : "text-[11px]")}>
              Venta automotriz inteligente
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
