import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";

import { useState } from "react";

type DefaultItem = { title: string; description: string; link: string };

export function HoverEffect<T = DefaultItem>({
  items,
  className,
  spotlightClassName,
  renderItem,
}: {
  items: T[];
  className?: string;
  /** Spotlight background (e.g. "bg-[#C9A96E]/10" for gold 10% opacity). Default: neutral/slate. */
  spotlightClassName?: string;
  /** When provided, render custom content per item; otherwise items must have title, description, link. */
  renderItem?: (item: T, index: number) => React.ReactNode;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const defaultItems = items as DefaultItem[];
  const hasCustomRender = typeof renderItem === "function";

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 py-10",
        className
      )}
    >
      {items.map((item, idx) => {
        const Wrapper = hasCustomRender ? "div" : "a";
        const wrapperProps = hasCustomRender
          ? { className: "relative group block p-2 h-full w-full" as const }
          : {
              href: (item as DefaultItem).link,
              className: "relative group block p-2 h-full w-full" as const,
            };

        return (
          <Wrapper
            key={hasCustomRender ? idx : (item as DefaultItem).link}
            {...wrapperProps}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <AnimatePresence>
              {hoveredIndex === idx && (
                <motion.span
                  className={cn(
                    "absolute inset-0 h-full w-full block rounded-3xl",
                    spotlightClassName ??
                      "bg-neutral-200 dark:bg-slate-800/[0.8]"
                  )}
                  layoutId="hoverBackground"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: 0.15 },
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.15, delay: 0.2 },
                  }}
                />
              )}
            </AnimatePresence>
            {hasCustomRender ? (
              renderItem!(item, idx)
            ) : (
              <Card>
                <CardTitle>{defaultItems[idx].title}</CardTitle>
                <CardDescription>{defaultItems[idx].description}</CardDescription>
              </Card>
            )}
          </Wrapper>
        );
      })}
    </div>
  );
}

export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl h-full w-full p-4 overflow-hidden bg-black border border-transparent dark:border-white/[0.2] group-hover:border-slate-700 relative z-20",
        className
      )}
    >
      <div className="relative z-50">
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};
export const CardTitle = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <h4 className={cn("text-zinc-100 font-bold tracking-wide mt-4", className)}>
      {children}
    </h4>
  );
};
export const CardDescription = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <p
      className={cn(
        "mt-8 text-zinc-400 tracking-wide leading-relaxed text-sm",
        className
      )}
    >
      {children}
    </p>
  );
};
