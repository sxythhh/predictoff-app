"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  createContext,
  type ComponentType,
  type ReactNode,
} from "react";
import { useLive, useSportsNavigation } from "@azuro-org/sdk";
// useLive needed for useSportsNavigation's isLive param
import { AnimatePresence, motion } from "motion/react";
import { useProximityHover } from "@/hooks/use-proximity-hover";
import { springs } from "@/lib/springs";
import {
  useSidebar,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
} from "./sidebar-context";

// ── Types ──────────────────────────────────────────────────────

type SportIconMap = Record<string, ComponentType<{ className?: string }>>;

// ── Country name → ISO code mapping for flag icons ─────────────

const COUNTRY_ISO: Record<string, string> = {
  "england": "gb-eng", "united kingdom": "gb", "scotland": "gb-sct", "wales": "gb-wls",
  "spain": "es", "germany": "de", "france": "fr", "italy": "it", "portugal": "pt",
  "netherlands": "nl", "belgium": "be", "turkey": "tr", "greece": "gr", "austria": "at",
  "switzerland": "ch", "poland": "pl", "czech republic": "cz", "croatia": "hr",
  "serbia": "rs", "romania": "ro", "ukraine": "ua", "russia": "ru", "denmark": "dk",
  "sweden": "se", "norway": "no", "finland": "fi", "iceland": "is",
  "usa": "us", "united states": "us", "canada": "ca", "mexico": "mx",
  "brazil": "br", "argentina": "ar", "colombia": "co", "chile": "cl", "uruguay": "uy",
  "australia": "au", "new zealand": "nz", "japan": "jp", "south korea": "kr", "china": "cn",
  "india": "in", "saudi arabia": "sa", "uae": "ae", "qatar": "qa", "egypt": "eg",
  "south africa": "za", "nigeria": "ng", "morocco": "ma", "tunisia": "tn", "algeria": "dz",
  "kenya": "ke", "ghana": "gh", "cameroon": "cm", "senegal": "sn",
  "ireland": "ie", "hungary": "hu", "bulgaria": "bg", "slovakia": "sk", "slovenia": "si",
  "bosnia and herzegovina": "ba", "north macedonia": "mk", "albania": "al", "montenegro": "me",
  "cyprus": "cy", "malta": "mt", "luxembourg": "lu", "estonia": "ee", "latvia": "lv",
  "lithuania": "lt", "georgia": "ge", "armenia": "am", "azerbaijan": "az",
  "israel": "il", "iran": "ir", "iraq": "iq", "jordan": "jo", "lebanon": "lb",
  "thailand": "th", "vietnam": "vn", "indonesia": "id", "malaysia": "my", "singapore": "sg",
  "philippines": "ph", "peru": "pe", "ecuador": "ec", "venezuela": "ve", "paraguay": "py",
  "bolivia": "bo", "costa rica": "cr", "honduras": "hn", "el salvador": "sv",
  "guatemala": "gt", "panama": "pa", "jamaica": "jm", "trinidad and tobago": "tt",
  "world": "un", "international": "un", "europe": "eu",
};

function CountryFlag({ name, className = "w-4 h-3 rounded-[2px]" }: { name: string; className?: string }) {
  const lower = name.toLowerCase();
  // International/World uses custom icon
  if (lower === "world" || lower === "international") {
    return (
      <img
        src="/images/international-flag.png"
        alt={name}
        className={className}
        loading="lazy"
      />
    );
  }
  const code = COUNTRY_ISO[lower];
  if (!code) return null;
  return (
    <img
      src={`https://hatscripts.github.io/circle-flags/flags/${code}.svg`}
      alt={name}
      className={className}
      loading="lazy"
    />
  );
}

// ── Proximity hover context ─────────────────────────────────────

interface ProximityContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
  activeNavIndices: Set<number>;
  setNavActive: (index: number, active: boolean) => void;
}

const ProximityContext = createContext<ProximityContextValue | null>(null);

// ── ProximityNavSection ─────────────────────────────────────────

function ProximityNavSection({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    activeIndex,
    itemRects,
    sessionRef,
    handlers,
    registerItem,
    measureItems,
  } = useProximityHover(containerRef);

  const [activeNavIndices, setActiveNavIndices] = useState<Set<number>>(
    () => new Set(),
  );

  const setNavActive = useCallback((index: number, active: boolean) => {
    setActiveNavIndices((prev) => {
      const has = prev.has(index);
      if (active && has) return prev;
      if (!active && !has) return prev;
      const next = new Set(prev);
      if (active) next.add(index);
      else next.delete(index);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!disabled) measureItems();
  }, [measureItems, children, disabled]);

  // Don't show hover indicator on active nav items or when disabled
  const showIndicator =
    !disabled && activeIndex !== null && !activeNavIndices.has(activeIndex);
  const activeRect = showIndicator ? itemRects[activeIndex] : null;

  return (
    <ProximityContext.Provider
      value={{ registerItem, activeIndex, activeNavIndices, setNavActive }}
    >
      <div
        ref={containerRef}
        onMouseMove={disabled ? undefined : handlers.onMouseMove}
        onMouseEnter={disabled ? undefined : handlers.onMouseEnter}
        onMouseLeave={disabled ? undefined : handlers.onMouseLeave}
        className="relative flex flex-col gap-0.5"
      >
        <AnimatePresence>
          {activeRect && (
            <motion.div
              key={sessionRef.current}
              className="pointer-events-none absolute rounded-lg bg-sidebar-hover"
              initial={{
                opacity: 0,
                top: activeRect.top,
                left: activeRect.left,
                width: activeRect.width,
                height: activeRect.height,
              }}
              animate={{
                opacity: 1,
                top: activeRect.top,
                left: activeRect.left,
                width: activeRect.width,
                height: activeRect.height,
              }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{
                ...springs.moderate,
                opacity: { duration: 0.16 },
              }}
            />
          )}
        </AnimatePresence>
        {children}
      </div>
    </ProximityContext.Provider>
  );
}

// ── ProximityNavItem ─────────────────────────────────────────────

function ProximityNavItem({
  index,
  active,
  onClick,
  icon,
  label,
  badge,
  suffix,
}: {
  index: number;
  active: boolean;
  onClick?: () => void;
  icon: ReactNode;
  label: string;
  badge?: ReactNode;
  suffix?: ReactNode;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const proximity = useContext(ProximityContext);

  useEffect(() => {
    if (proximity && index !== undefined) {
      proximity.registerItem(index, itemRef.current);
      return () => proximity.registerItem(index, null);
    }
  }, [proximity, index]);

  // Report active state so hover indicator is skipped for active items
  useEffect(() => {
    if (proximity && index !== undefined) {
      proximity.setNavActive(index, active);
    }
  }, [proximity, index, active]);

  return (
    <div ref={itemRef}>
      <button
        type="button"
        onClick={onClick}
        className={`flex h-8 w-full cursor-pointer items-center justify-between rounded-lg px-[10px] text-sm font-medium leading-none transition-[color,background-color] duration-75 ${
          active
            ? "bg-sidebar-active text-sidebar-text"
            : "text-sidebar-text-subtle"
        }`}
      >
        <span className="flex items-center gap-2.5">
          <span className={active ? "opacity-100" : "opacity-50"}>{icon}</span>
          {label}
        </span>
        <span className="ml-2 flex items-center gap-2">
          {badge && <span>{badge}</span>}
          {suffix}
        </span>
      </button>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────

function GearIcon({ className, "data-hovered": hovered, ...rest }: { className?: string; "data-hovered"?: boolean } & React.SVGProps<SVGSVGElement>) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !hovered) return;
    ref.current.animate(
      [{ transform: "rotate(0)" }, { transform: "rotate(180deg)" }],
      { duration: 300 },
    );
  }, [hovered]);

  return (
    <svg ref={ref} width="16" height="16" viewBox="1.8 1.8 20.4 20.4" fill="none" className={className} {...rest}>
      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" fill="currentColor" />
    </svg>
  );
}

function SettingsNavButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-lg px-[10px] text-sm font-medium leading-none text-sidebar-text-subtle transition-[color,background-color] duration-75 hover:bg-sidebar-hover"
    >
      <span className="opacity-50">
        <GearIcon className="size-4" data-hovered={hovered} />
      </span>
      Settings
    </button>
  );
}

function CollapsedSettingsButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      title="Settings"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex size-10 items-center justify-center rounded-lg text-sidebar-text-subtle transition-colors hover:bg-sidebar-hover cursor-pointer"
    >
      <GearIcon className="size-[16px]" data-hovered={hovered} />
    </button>
  );
}

// ── Collapsed Icon Strip with proximity hover ─────────────────

function CollapsedIconStrip({
  disabled,
  activeSport,
  sportIcons,
  sportsOnly,
  isFetching,
  onSportClick,
}: {
  disabled: boolean;
  activeSport: string | null;
  sportIcons: SportIconMap;
  sportsOnly: Array<{ slug: string; name: string; activeLiveGamesCount: number; activePrematchGamesCount: number }>;
  isFetching: boolean;
  onSportClick: (slug: string | null) => void;
}) {
  const { setSettingsOpen } = useSidebar();
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    activeIndex,
    itemRects,
    sessionRef,
    handlers,
    registerItem,
    measureItems,
  } = useProximityHover(containerRef);

  // Track which indices are "active" (selected) so we skip the hover indicator
  const activeIndices = new Set<number>();
  // Index mapping: 0=all, 1+=sports
  if (!isFetching) {
    if (activeSport === null) activeIndices.add(0);
    sportsOnly.forEach((sport, i) => {
      if (activeSport === sport.slug) activeIndices.add(1 + i);
    });
  }

  useEffect(() => {
    if (!disabled) measureItems();
  }, [measureItems, disabled, sportsOnly.length, isFetching]);

  const register = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      registerItem(index, el);
    },
    [registerItem],
  );

  const showIndicator = !disabled && activeIndex !== null && !activeIndices.has(activeIndex);
  const activeRect = showIndicator ? itemRects[activeIndex] : null;

  return (
    <>
      {/* Top: logo + nav icons */}
      <div
        ref={containerRef}
        className="relative flex flex-col items-center gap-1 p-2"
        onMouseMove={disabled ? undefined : handlers.onMouseMove}
        onMouseEnter={disabled ? undefined : handlers.onMouseEnter}
        onMouseLeave={disabled ? undefined : handlers.onMouseLeave}
      >
        {/* Sliding hover highlight */}
        <AnimatePresence>
          {activeRect && (
            <motion.div
              key={sessionRef.current}
              className="pointer-events-none absolute rounded-lg bg-sidebar-hover"
              initial={{
                opacity: 0,
                top: activeRect.top,
                left: activeRect.left,
                width: activeRect.width,
                height: activeRect.height,
              }}
              animate={{
                opacity: 1,
                top: activeRect.top,
                left: activeRect.left,
                width: activeRect.width,
                height: activeRect.height,
              }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{
                ...springs.moderate,
                opacity: { duration: 0.16 },
              }}
            />
          )}
        </AnimatePresence>

        {/* Sport icons */}
        {!isFetching && (
          <>
            <div ref={register(0)}>
              <button
                type="button"
                title="All Events"
                onClick={() => onSportClick(null)}
                className={`relative z-10 flex size-10 items-center justify-center rounded-lg transition-colors duration-75 ${
                  activeSport === null ? "bg-sidebar-active text-sidebar-text" : "text-sidebar-text-subtle"
                }`}
              >
                {sportIcons["top"] && (() => {
                  const Icon = sportIcons["top"];
                  return <Icon className="size-[16px]" />;
                })()}
              </button>
            </div>
            {sportsOnly.map((sport, i) => {
              const Icon = sportIcons[sport.slug] ?? sportIcons["top"];
              const isActive = activeSport === sport.slug;
              return (
                <div key={sport.slug} ref={register(1 + i)}>
                  <button
                    type="button"
                    title={sport.name}
                    onClick={() => onSportClick(sport.slug)}
                    className={`relative z-10 flex size-10 items-center justify-center rounded-lg transition-colors duration-75 ${
                      isActive ? "bg-sidebar-active text-sidebar-text" : "text-sidebar-text-subtle"
                    }`}
                  >
                    {Icon && <Icon className="size-[16px]" />}
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Bottom: settings gear */}
      <div className="flex flex-col items-center gap-3 py-3">
        <CollapsedSettingsButton onClick={() => setSettingsOpen(true)} />
      </div>
    </>
  );
}

// ── Main AppSidebar ────────────────────────────────────────────

// ── League sub-list with "show more" ──────────────────────────

const INITIAL_LEAGUES = 5;

function LeagueSubList({
  sportSlug,
  countries,
  activeLeague,
  isLive,
  onLeagueClick,
}: {
  sportSlug: string;
  countries: Array<{ slug: string; name: string; leagues: Array<{ slug: string; name: string; activeLiveGamesCount: number; activePrematchGamesCount: number }> }>;
  activeLeague: string | null;
  isLive: boolean;
  onLeagueClick: (sportSlug: string, leagueSlug: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // Flatten all leagues with their country info
  const allLeagues = countries.flatMap((country) =>
    country.leagues
      .filter((l) => (isLive ? l.activeLiveGamesCount : l.activePrematchGamesCount) > 0)
      .map((league) => ({
        key: `${country.slug}-${league.slug}`,
        countryName: country.name,
        leagueName: league.name,
        leagueSlug: league.slug,
        count: isLive ? league.activeLiveGamesCount : league.activePrematchGamesCount,
      }))
  );

  const visible = expanded ? allLeagues : allLeagues.slice(0, INITIAL_LEAGUES);
  const hasMore = allLeagues.length > INITIAL_LEAGUES;

  return (
    <div className="pl-3.5 pt-0.5 pb-1" onMouseMove={(e) => e.stopPropagation()} onMouseEnter={(e) => e.stopPropagation()}>
      <div className="flex flex-col gap-0.5 border-l border-sidebar-border pl-2">
        {visible.map((league) => {
          const isLeagueActive = activeLeague === league.leagueSlug;
          return (
            <button
              key={league.key}
              type="button"
              onClick={() => onLeagueClick(sportSlug, league.leagueSlug)}
              className={`flex items-center gap-2 h-7 px-2 rounded-md text-[12px] transition-colors cursor-pointer ${
                isLeagueActive
                  ? "bg-sidebar-active text-sidebar-text font-medium"
                  : "text-sidebar-text-muted hover:bg-sidebar-hover"
              }`}
            >
              <CountryFlag name={league.countryName} className="w-3.5 h-2.5 rounded-[1px] shrink-0" />
              <span className="truncate flex-1 text-left">{league.leagueName}</span>
              <span className={`font-inter text-[10px] shrink-0 ${
                isLeagueActive ? "text-accent-text" : "text-sidebar-text-muted"
              }`}>
                {league.count}
              </span>
            </button>
          );
        })}
        {hasMore && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1 h-7 px-2 rounded-md text-[11px] text-sidebar-text-muted hover:text-sidebar-text-subtle hover:bg-sidebar-hover transition-colors cursor-pointer"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 2V8M2 5H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Show {allLeagues.length - INITIAL_LEAGUES} more
          </button>
        )}
        {hasMore && expanded && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="flex items-center gap-1 h-7 px-2 rounded-md text-[11px] text-sidebar-text-muted hover:text-sidebar-text-subtle hover:bg-sidebar-hover transition-colors cursor-pointer"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
}

export function AppSidebar({
  activeSport,
  activeLeague,
  onSportClick,
  onLeagueClick,
  sportIcons,
}: {
  activeSport: string | null;
  activeLeague: string | null;
  onSportClick: (slug: string | null) => void;
  onLeagueClick: (sportSlug: string, leagueSlug: string) => void;
  sportIcons: SportIconMap;
}) {
  const { collapsed, setSettingsOpen } = useSidebar();
  const { isLive } = useLive();
  const { data: sports, isFetching } = useSportsNavigation({ isLive });

  const targetWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  const handleSportNavClick = useCallback(
    (slug: string | null) => {
      onSportClick(slug);
    },
    [onSportClick]
  );

  const sportsOnly = sports?.filter((s) => s.sporthub?.slug === "sports") ?? [];
  const totalGames = sportsOnly.reduce(
    (sum, s) => sum + (isLive ? s.activeLiveGamesCount : s.activePrematchGamesCount),
    0
  );

  return (
    <div
      className="h-full shrink-0"
      style={{ width: targetWidth }}
    >
      <nav className="relative size-full select-none">
        {/* ─── COLLAPSED VIEW — icon strip with proximity hover ─── */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-between border-r bg-sidebar-bg border-sidebar-border transition-opacity duration-100 ${
            collapsed ? "z-10 opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <CollapsedIconStrip
            disabled={!collapsed}
            activeSport={activeSport}
            sportIcons={sportIcons}
            sportsOnly={sportsOnly}
            isFetching={isFetching}
            onSportClick={handleSportNavClick}
          />
        </div>

        {/* ─── EXPANDED VIEW — full panel (unmounted when collapsed to avoid layout thrash) ─── */}
        {!collapsed && (
          <div className="absolute inset-0 flex flex-col overflow-hidden">

          <div className="flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar-bg">
            {/* Scrollable nav */}
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-clip">
              <div className="flex flex-col px-3 pb-3 pt-2">
                {/* Top Sports */}
                <div className="mb-2 pl-[10px] text-[11px] font-normal tracking-[-0.02em] text-sidebar-section-label">
                  Sports
                </div>

                <ProximityNavSection>
                  {isFetching ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-8 rounded-lg animate-pulse"
                        style={{ background: "var(--sidebar-hover)" }}
                      />
                    ))
                  ) : (
                    <>
                      <ProximityNavItem
                        index={0}
                        active={activeSport === null}
                        onClick={() => handleSportNavClick(null)}
                        icon={sportIcons["top"] ? (() => { const Icon = sportIcons["top"]; return <Icon className="size-4" />; })() : null}
                        label="All Events"
                        suffix={
                          <span
                            className={`font-inter text-[11px] min-w-[28px] text-right ${
                              activeSport === null
                                ? "text-accent-text bg-accent-muted px-1.5 py-0.5 rounded font-semibold"
                                : "text-sidebar-text-muted font-medium"
                            }`}
                          >
                            {totalGames}
                          </span>
                        }
                      />
                      {sportsOnly.map((sport, i) => {
                        const Icon = sportIcons[sport.slug] ?? sportIcons["top"];
                        const gameCount = isLive
                          ? sport.activeLiveGamesCount
                          : sport.activePrematchGamesCount;
                        const isActive = activeSport === sport.slug;
                        return (
                          <div key={sport.slug}>
                            <ProximityNavItem
                              index={i + 1}
                              active={isActive && !activeLeague}
                              onClick={() => handleSportNavClick(sport.slug)}
                              icon={Icon ? <Icon className="size-4" /> : null}
                              label={sport.name}
                              suffix={
                                <span className="flex items-center gap-1.5">
                                  <span
                                    className={`font-inter text-[11px] min-w-[28px] text-right ${
                                      isActive && !activeLeague
                                        ? "text-accent-text bg-accent-muted px-1.5 py-0.5 rounded font-semibold"
                                        : "text-sidebar-text-muted font-medium"
                                    }`}
                                  >
                                    {gameCount}
                                  </span>
                                  {/* Chevron */}
                                  <svg
                                    width="10" height="10" viewBox="0 0 10 10" fill="none"
                                    className={`text-sidebar-text-muted transition-transform duration-150 ${isActive ? "rotate-90" : ""}`}
                                  >
                                    <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </span>
                              }
                            />
                            {/* League sub-items — show when sport is active */}
                            {isActive && sport.countries && (
                              <LeagueSubList
                                sportSlug={sport.slug}
                                countries={sport.countries}
                                activeLeague={activeLeague}
                                isLive={isLive}
                                onLeagueClick={onLeagueClick}
                              />
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                </ProximityNavSection>

                {/* Divider */}
                <div className="my-2" />

                {/* Quick Links section */}
                <div className="mb-2 pl-[10px] pt-1 text-[11px] font-normal tracking-[-0.02em] text-sidebar-section-label">
                  Quick Links
                </div>
                <ProximityNavSection>
                  <ProximityNavItem
                    index={0}
                    active={false}
                    icon={null}
                    label="Responsible Gambling"
                  />
                  <ProximityNavItem
                    index={1}
                    active={false}
                    icon={null}
                    label="Terms & Conditions"
                  />
                </ProximityNavSection>
              </div>
            </div>

            {/* Bottom: settings */}
            <div className="shrink-0 px-3 py-2">
              <SettingsNavButton onClick={() => setSettingsOpen(true)} />
            </div>
          </div>
          </div>
        )}
      </nav>
    </div>
  );
}
