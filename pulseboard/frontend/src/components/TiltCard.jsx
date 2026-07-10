import { useEffect, useState } from "react";
import { use3DTilt } from "../hooks/use3DTilt.js";

// A card wrapper that applies a subtle mouse-tracking 3D tilt on hover.
// Tilt is automatically suppressed for touch devices and users who prefer
// reduced motion, and can be frozen via `disabled` (e.g. while expanded).
export default function TiltCard({
  intensity = 8,
  disabled = false,
  className = "",
  style,
  children,
  ...rest
}) {
  const { ref, handleMouseMove, handleMouseLeave } = use3DTilt(intensity);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia(
      "(prefers-reduced-motion: reduce), (pointer: coarse)"
    );
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const noTilt = disabled || reduce;

  // Whenever tilt turns off (card expands, reduced motion, touch), snap the
  // element back to neutral so it never stays visually skewed.
  useEffect(() => {
    if (noTilt && ref.current) {
      ref.current.style.transform =
        "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
      ref.current.style.transition = "transform 300ms cubic-bezier(0.4,0,0.2,1)";
    }
  }, [noTilt, ref]);

  return (
    <div
      ref={ref}
      onMouseMove={noTilt ? undefined : handleMouseMove}
      onMouseLeave={noTilt ? undefined : handleMouseLeave}
      className={className}
      style={{ transformStyle: "preserve-3d", ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
