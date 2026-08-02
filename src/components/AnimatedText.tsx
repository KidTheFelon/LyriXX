import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "../i18n";

type TextVariant = "wipe" | "slide" | "blur" | "glow" | "mask-glow";

const AnimatedTextContext = createContext<TextVariant>("wipe");

const PHASE_DURATION: Record<TextVariant, number> = {
  wipe: 220,
  slide: 240,
  blur: 250,
  glow: 350,
  "mask-glow": 320,
};

export function AnimatedTextProvider({
  variant = "wipe",
  children,
}: {
  variant?: TextVariant;
  children: React.ReactNode;
}) {
  return (
    <AnimatedTextContext.Provider value={variant}>{children}</AnimatedTextContext.Provider>
  );
}

interface AnimatedTextProps {
  translationKey: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  variant?: TextVariant;
}

export function AnimatedText({
  translationKey,
  className,
  as: Tag = "span",
  variant: variantProp,
}: AnimatedTextProps) {
  const ctxVariant = useContext(AnimatedTextContext);
  const variant = variantProp ?? ctxVariant;
  const { t, lang } = useTranslation();
  const [displayText, setDisplayText] = useState(() => t(translationKey));
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const prevLang = useRef(lang);

  useEffect(() => {
    if (prevLang.current === lang) return;
    prevLang.current = lang;
    setPhase("out");
  }, [lang]);

  useEffect(() => {
    if (phase === "out") {
      const timer = setTimeout(() => {
        setDisplayText(t(translationKey));
        setPhase("in");
      }, PHASE_DURATION[variant]);
      return () => clearTimeout(timer);
    }
    if (phase === "in") {
      const timer = setTimeout(() => setPhase("idle"), PHASE_DURATION[variant]);
      return () => clearTimeout(timer);
    }
  }, [phase, t, translationKey, variant]);

  const phaseClass =
    phase === "out"
      ? `animated-text--${variant}-out`
      : phase === "in"
        ? `animated-text--${variant}-in`
        : "";

  return (
    <Tag className={`animated-text ${phaseClass} ${className ?? ""}`}>
      {displayText}
    </Tag>
  );
}
