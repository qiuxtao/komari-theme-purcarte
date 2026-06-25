import { forwardRef } from "react";
import { useAppConfig, useLocale } from "@/config/hooks";
import { Card } from "../ui/card";
import { cn } from "@/utils";
import { useIsMobile } from "@/hooks/useMobile";

const Footer = forwardRef<
  HTMLElement,
  {
    isSettingsOpen: boolean;
  }
>(({ isSettingsOpen }, ref) => {
  const { t } = useLocale();
  const { selectedFooterStyle } = useAppConfig();
  const isMobile = useIsMobile();
  return (
    <footer
      ref={ref}
      className={cn(
        selectedFooterStyle === "levitation"
          ? "fixed"
          : selectedFooterStyle === "followContent"
          ? "mb-4 w-(--main-width) max-w-screen-2xl mx-auto"
          : "",
        "bottom-0 left-0 right-0 flex z-10"
      )}
      style={{
        right: isSettingsOpen && !isMobile ? "var(--setting-width)" : "0",
      }}>
      <Card
        className={cn(
          selectedFooterStyle !== "followContent" ? "rounded-none" : "",
          "p-2 w-full flex items-center justify-center inset-shadow-sm inset-shadow-(color:--accent-a4)"
        )}>
        <div className="flex justify-center flex-wrap items-center text-center text-sm text-secondary-foreground theme-text-shadow gap-y-1">
          <span>Copyright © 秋晓桃</span>
          <span className="opacity-50 px-2">|</span>
          <span className="flex items-center">
            {t("footer.poweredBy")}
            <a
              href="https://github.com/komari-monitor/komari"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 transition-colors ml-1">
              Komari Monitor
            </a>
          </span>
          <span className="opacity-50 px-2">|</span>
          <span className="flex items-center">
            {t("footer.themeBy")}
            <a
              href="https://github.com/Montia37/komari-theme-purcarte"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 transition-colors ml-1">
              PurCarte
            </a>
          </span>
        </div>
      </Card>
    </footer>
  );
});

export default Footer;
