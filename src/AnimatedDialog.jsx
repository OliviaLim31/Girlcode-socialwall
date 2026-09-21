import { forwardRef, useImperativeHandle, useRef } from "react";

// Keep native dialog focus trapping and restoration while animating both directions.
const AnimatedDialog = forwardRef(function AnimatedDialog({ children, ...props }, ref) {
  const element = useRef(null);
  const motion = useRef(null);
  const closing = useRef(false);
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const close = async () => {
    const dialog = element.current;
    if (!dialog?.open || closing.current) return;
    closing.current = true;
    motion.current?.cancel();
    dialog.dataset.closing = "true";
    if (!reducedMotion()) {
      const animation = dialog.animate(
        [{ opacity: 1, transform: "translateY(0) scale(1)" }, { opacity: 0, transform: "translateY(14px) scale(.97)" }],
        { duration: 180, easing: "ease-in", fill: "forwards" },
      );
      motion.current = animation;
      try { await animation.finished; } catch { return; }
    }
    dialog.close();
    motion.current?.cancel();
    delete dialog.dataset.closing;
    closing.current = false;
  };
  useImperativeHandle(ref, () => ({
    showModal() {
      const dialog = element.current;
      if (dialog.open) return;
      closing.current = false;
      delete dialog.dataset.closing;
      dialog.showModal();
      motion.current?.cancel();
      if (!reducedMotion()) {
        motion.current = dialog.animate(
          [{ opacity: 0, transform: "translateY(24px) scale(.95)" }, { opacity: 1, transform: "translateY(0) scale(1)" }],
          { duration: 340, easing: "cubic-bezier(.2,.8,.2,1)" },
        );
      }
    },
    close,
  }));
  return (
    <dialog {...props} ref={element}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
      }}>
      {children}
    </dialog>
  );
});
export default AnimatedDialog;
