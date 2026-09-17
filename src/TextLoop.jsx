import { useId, useLayoutEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import "./TextLoop.css";

export default function TextLoop({
  text,
  shape = "wave",
  speed = 90,
  direction = "forward",
  separator = "✦",
  curviness = 62,
  fontSize = 50,
  fontWeight = 800,
  letterSpacing = 2,
  uppercase = false,
  color = "#ffffff",
  ribbon = false,
  ribbonColor = "#d027ff",
  ribbonWidth = 66,
  pauseOnHover = false,
}) {
  const root = useRef(null);
  const pathId = useId().replace(/:/g, "");
  const words = useMemo(() => text.split(separator).map((item) => item.trim()).filter(Boolean), [text, separator]);
  const repeatedText = useMemo(() => Array.from({ length: 7 }, () => `${words.join(` ${separator} `)} ${separator}`).join("   "), [words, separator]);
  const renderedText = uppercase ? repeatedText.toUpperCase() : repeatedText;
  const waveHeight = Math.max(42, Math.min(70, curviness));
  const animationDuration = Math.max(28, 3000 / speed);
  const path = shape === "wave"
    ? `M -180 90 C 0 ${90 - waveHeight} 180 ${90 - waveHeight} 360 90 S 720 ${90 + waveHeight} 900 90 S 1260 ${90 - waveHeight} 1440 90 S 1800 ${90 + waveHeight} 1980 90`
    : "M -180 90 H 1980";

  useLayoutEffect(() => {
    const textPath = root.current.querySelector("textPath");
    const start = direction === "forward" ? "0%" : "-50%";
    const end = direction === "forward" ? "-50%" : "0%";
    const tween = gsap.fromTo(textPath, { attr: { startOffset: start } }, { attr: { startOffset: end }, duration: animationDuration, ease: "none", repeat: -1 });
    const onEnter = () => pauseOnHover && tween.pause();
    const onLeave = () => pauseOnHover && tween.resume();
    root.current.addEventListener("mouseenter", onEnter);
    root.current.addEventListener("mouseleave", onLeave);
    return () => { root.current?.removeEventListener("mouseenter", onEnter); root.current?.removeEventListener("mouseleave", onLeave); tween.kill(); };
  }, [animationDuration, direction, pauseOnHover, repeatedText]);

  return <div ref={root} className="text-loop text-loop--wave" style={{ "--loop-color": color, "--ribbon-color": ribbonColor, "--ribbon-width": ribbonWidth, "--loop-size": `${fontSize}px`, "--loop-weight": fontWeight, "--loop-spacing": `${letterSpacing}px` }} aria-label={text}>
    <svg className="text-loop__svg" viewBox="0 0 1440 180" preserveAspectRatio="none" role="img" aria-label={text}>
      <defs><path id={pathId} d={path} /></defs>
      {ribbon && <use className="text-loop__ribbon" href={`#${pathId}`} />}
      <text className="text-loop__text"><textPath href={`#${pathId}`} startOffset="0%">{renderedText}</textPath></text>
    </svg>
  </div>;
}
