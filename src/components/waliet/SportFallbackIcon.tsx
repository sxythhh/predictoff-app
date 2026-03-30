import { sportIcons } from "./sport-icons";

/** Uses the actual sidebar sport icon as fallback when team logo fails to load */
export function SportFallbackIcon({ sportSlug, className = "size-4 text-text-muted" }: { sportSlug?: string; className?: string }) {
  const Icon = sportSlug ? sportIcons[sportSlug] : null;
  if (Icon) return <Icon className={className} />;
  // Generic fallback for unknown sports
  const TopIcon = sportIcons["top"];
  if (TopIcon) return <TopIcon className={className} />;
  return null;
}
