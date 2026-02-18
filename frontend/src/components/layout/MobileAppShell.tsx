import React from "react";
import clsx from "clsx";

/**
 * MobileAppShell
 * - Provides a mobile-first page wrapper with safe-area support (iOS notch)
 * - Centers content with a sensible max width
 * - Adds bottom padding so fixed bottom navs don’t overlap content
 *
 * You typically compose it like:
 *   <MobileAppShell hasBottomNav>
 *     <Navbar />
 *     <OneColumnLayout content={...} padding={2} />
 *     <StaffBottomNav />
 *   </MobileAppShell>
 */
type Props = {
  children: React.ReactNode;

  /** Extra class names on the outer shell */
  className?: string;

  /** If you have a fixed bottom nav (e.g., StaffBottomNav), keep true to add extra bottom space */
  hasBottomNav?: boolean;

  /** Height of your fixed bottom nav in px (used when hasBottomNav = true) */
  bottomNavHeightPx?: number;

  /** Apply safe-area padding at the top (useful if you put a fixed top bar) */
  safeTop?: boolean;

  /** Apply safe-area padding at the bottom (in addition to bottom nav space, if any) */
  safeBottom?: boolean;

  /** Max width constraint for content (Tailwind max-w-* class). Default: max-w-screen-sm */
  maxWidthClass?: string;

  /** Horizontal page padding (Tailwind spacing scale). Default: px-3 on mobile, px-4 on >=sm */
  horizontalPaddingClass?: string;
};

const MobileAppShell: React.FC<Props> = ({
  children,
  className,
  hasBottomNav = true,
  bottomNavHeightPx = 64, // match your StaffBottomNav height
  safeTop = true,
  safeBottom = true,
  maxWidthClass = "max-w-screen-sm",
  horizontalPaddingClass = "px-3 sm:px-4",
}) => {
  // Build dynamic bottom padding that accounts for:
  // - safe-area inset bottom on iOS
  // - fixed bottom nav height
  const bottomPadClass = hasBottomNav
    ? // e.g., pb-[calc(env(safe-area-inset-bottom)+64px)]
      `pb-[calc(${safeBottom ? "env(safe-area-inset-bottom)+" : ""}${bottomNavHeightPx}px)]`
    : safeBottom
    ? "pb-[env(safe-area-inset-bottom)]"
    : "pb-0";

  const topPadClass = safeTop ? "pt-[env(safe-area-inset-top)]" : "pt-0";

  return (
    <div
      className={clsx(
        "min-h-screen w-full bg-white text-gray-900 dark:bg-neutral-950 dark:text-neutral-100",
        topPadClass,
        bottomPadClass,
        className
      )}
    >
      <main
        className={clsx(
          "mx-auto w-full",
          maxWidthClass,
          horizontalPaddingClass,
          // keep vertical rhythm light; pages add their own spacing
          "relative"
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default MobileAppShell;
