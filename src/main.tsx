import { StrictMode, useEffect, useRef, useState, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import "./index.css";
import "@/styles/custom-overrides.css";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";

import { Header } from "@/components/sections/Header";
import { ConfigProvider, useAppConfig } from "@/config";
import { DynamicContent } from "@/components/DynamicContent";
import { useThemeManager, useTheme } from "@/hooks/useTheme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NodeDataProvider } from "@/contexts/NodeDataContext";
import { LiveDataProvider } from "@/contexts/LiveDataContext";
import Footer from "@/components/sections/Footer";
import Loading from "./components/loading";
import type { StatsBarProps } from "./components/sections/StatsBar";
import { useNodeListCommons } from "@/hooks/useNodeCommons";
import SettingsPanel from "./components/settings/SettingsPanel";
import { useIsMobile } from "./hooks/useMobile";
import type { SiteStatus } from "./config/default";
import { Toaster } from "@/components/ui/sonner";
const HomePage = lazy(() => import("@/pages/Home"));
const InstancePage = lazy(() => import("@/pages/instance"));
const NotFoundPage = lazy(() => import("@/pages/NotFound"));
const PrivatePage = lazy(() => import("@/pages/Private"));



const AppRoutes = ({
  searchTerm,
  setSearchTerm,
  isSettingsOpen,
  setIsSettingsOpen,
  headerRef,
  headerHeight,
  footerHeight,
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
  headerRef: React.RefObject<HTMLElement | null>;
  headerHeight: number;
  footerHeight: number;
}) => {
    const {
    loading,
    groups,
    filteredNodes,
    stats,
    selectedGroup,
    setSelectedGroup,
    handleSort,
  } = useNodeListCommons(searchTerm);
  const { statusCardsVisibility, setStatusCardsVisibility } = useTheme();
  const { enableGroupedBar, selectedHeaderStyle, selectedFooterStyle } =
    useAppConfig();

  

  const statsBarProps: StatsBarProps = {
    displayOptions: statusCardsVisibility,
    setDisplayOptions: setStatusCardsVisibility,
    stats,
    loading,
    enableGroupedBar,
    groups,
    selectedGroup,
    onSelectGroup: setSelectedGroup,
    onSort: handleSort,
  };

  // 原生 window 滚动会自动处理滚动恢复，此处无需手动干预

  return (
    <>
      <Header
        ref={headerRef}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setIsSettingsOpen={setIsSettingsOpen}
        isSettingsOpen={isSettingsOpen}
        {...statsBarProps}
      />
      <div className="flex-1 min-h-0 w-full">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route
              path="/"
              element={
                <div
                  className="flex flex-col w-full min-h-screen">
                  <main
                    className="w-(--main-width) max-w-screen-2xl mx-auto flex-grow shrink-0"
                    style={{
                      paddingTop:
                        (selectedHeaderStyle === "levitation" ? headerHeight * 0 : 0),
                      paddingBottom:
                        selectedFooterStyle === "levitation"
                          ? footerHeight
                          : 0,
                    }}>
                    <HomePage
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      filteredNodes={filteredNodes}
                      selectedGroup={selectedGroup}
                      setSelectedGroup={setSelectedGroup}
                      stats={stats}
                      groups={groups}
                      handleSort={handleSort}
                    />
                  </main>
                  {selectedFooterStyle === "followContent" && (
                    <Footer isSettingsOpen={isSettingsOpen} ref={null} />
                  )}
                </div>
              }
            />
            <Route
              path="/instance/:uuid"
              element={
                <div
                  className="flex flex-col w-full min-h-screen">
                  <main
                    className="w-(--main-width) max-w-screen-2xl mx-auto flex-1 shrink-0"
                    style={{
                      paddingTop:
                        (selectedHeaderStyle === "levitation" ? headerHeight * 0 : 0),
                      paddingBottom:
                        selectedFooterStyle === "levitation"
                          ? footerHeight
                          : 0,
                    }}>
                    <InstancePage />
                  </main>
                  {selectedFooterStyle === "followContent" && (
                    <Footer isSettingsOpen={isSettingsOpen} ref={null} />
                  )}
                </div>
              }
            />
            <Route
              path="*"
              element={
                <div className="flex flex-col w-full min-h-screen">
                  <main className="w-(--main-width) max-w-screen-2xl mx-auto flex-1 shrink-0 pt-16">
                    <NotFoundPage />
                  </main>
                  {selectedFooterStyle === "followContent" && (
                    <Footer isSettingsOpen={isSettingsOpen} ref={null} />
                  )}
                </div>
              }
            />
          </Routes>
        </Suspense>
      </div>
    </>
  );
};

export const AppContent = () => {
  const { siteStatus, mainWidth, selectedFooterStyle } = useAppConfig();
  const { appearance, color } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isMobile = useIsMobile();
  const footerRef = useRef<HTMLElement | null>(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const resizeObserver = new ResizeObserver(() => {
      setHeaderHeight(header.offsetHeight);
    });

    resizeObserver.observe(header);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const resizeObserver = new ResizeObserver(() => {
      setFooterHeight(footer.offsetHeight);
    });

    resizeObserver.observe(footer);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isSettingsOpen && !isMobile) {
      document.documentElement.style.setProperty(
        "--main-width",
        `calc(${mainWidth}vw - var(--setting-width))`
      );
    } else {
      document.documentElement.style.setProperty(
        "--main-width",
        `${mainWidth}vw`
      );
    }
  }, [isSettingsOpen, isMobile, mainWidth]);

  useEffect(() => {
    // 延迟一小段时间以确保 Radix UI 渲染完毕并应用了相应的 CSS 变量
    const timer = setTimeout(() => {
      const radixTheme = document.querySelector('.radix-themes');
      if (radixTheme) {
        const accent9 = getComputedStyle(radixTheme).getPropertyValue('--accent-9').trim();
        if (accent9) {
          let metaThemeColor = document.querySelector('meta[name="theme-color"]');
          if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.setAttribute('name', 'theme-color');
            document.head.appendChild(metaThemeColor);
          }
          metaThemeColor.setAttribute('content', accent9);
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [color, appearance]);

  return (
    <Theme
      appearance={appearance}
      accentColor={color}
      scaling="110%"
      style={{ backgroundColor: "transparent" }}>
      <Toaster />
      <DynamicContent>
        <div
          className={`grid transition-all duration-300 ${
            isSettingsOpen && !isMobile
              ? "grid-cols-[1fr_auto]"
              : "grid-cols-[1fr]"
          } w-full min-h-screen`}>
          <div className="flex flex-col text-sm flex-1 w-full">
            {siteStatus === "private-unauthenticated" ? (
              <>
                <Header
                  isPrivate={true}
                  setIsSettingsOpen={setIsSettingsOpen}
                />
                <Suspense fallback={<Loading />}>
                  <div className="flex flex-col w-full min-h-screen">
                    <main className="w-(--main-width) max-w-screen-2xl mx-auto flex-1 shrink-0 pt-16">
                      <PrivatePage />
                    </main>
                    {selectedFooterStyle === "followContent" && (
                      <Footer isSettingsOpen={isSettingsOpen} ref={null} />
                    )}
                  </div>
                </Suspense>
              </>
            ) : (
              <AppRoutes
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                isSettingsOpen={isSettingsOpen}
                setIsSettingsOpen={setIsSettingsOpen}
                headerRef={headerRef}
                headerHeight={headerHeight}
                footerHeight={footerHeight}
              />
            )}
            {selectedFooterStyle !== "followContent" &&
              selectedFooterStyle !== "hidden" && (
                <Footer ref={footerRef} isSettingsOpen={isSettingsOpen} />
              )}
          </div>
          <SettingsPanel
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
        </div>
      </DynamicContent>
    </Theme>
  );
};

const AppProviders = ({
  siteStatus,
  children,
}: {
  siteStatus: SiteStatus;
  children: React.ReactNode;
}) => {
  if (siteStatus === "private-unauthenticated") {
    return <>{children}</>;
  }
  return (
    <NodeDataProvider>
      <LiveDataProvider>{children}</LiveDataProvider>
    </NodeDataProvider>
  );
};

const App = () => {
  const themeManager = useThemeManager();
  const { siteStatus } = useAppConfig();

  return (
    <ThemeProvider value={themeManager}>
      <AppProviders siteStatus={siteStatus}>
        <AppContent />
      </AppProviders>
    </ThemeProvider>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider>
      <Router>
        <App />
      </Router>
    </ConfigProvider>
  </StrictMode>
);
