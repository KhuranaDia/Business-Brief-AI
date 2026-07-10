import { useRef, useCallback } from "react";

// Applies a mouse-tracking 3D tilt to the referenced element. Returns a ref to
// attach plus mouse-move / mouse-leave handlers.
export function use3DTilt(intensity = 8) {
  const ref = useRef(null);

  const handleMouseMove = useCallback(
    (e) => {
      const card = ref.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -intensity;
      const rotateY = ((x - centerX) / centerX) * intensity;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px)`;
      card.style.transition = "transform 100ms ease";
    },
    [intensity]
  );

  const handleMouseLeave = useCallback(() => {
    if (ref.current) {
      ref.current.style.transform =
        "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
      ref.current.style.transition = "transform 400ms cubic-bezier(0.4,0,0.2,1)";
    }
  }, []);

  return { ref, handleMouseMove, handleMouseLeave };
}
