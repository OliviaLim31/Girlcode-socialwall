import { useEffect } from "react";
import AnimatedDialog from "./AnimatedDialog";

export default function Lightbox({ dialogRef, activeItem, onNext, onPrev, hasNext, hasPrev, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeItem) return;
      if (e.key === "ArrowRight" && hasNext && onNext) {
        e.preventDefault();
        onNext();
      } else if (e.key === "ArrowLeft" && hasPrev && onPrev) {
        e.preventDefault();
        onPrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeItem, hasNext, hasPrev, onNext, onPrev]);

  if (!activeItem) {
    return <AnimatedDialog ref={dialogRef} className="photo-dialog" />;
  }

  return (
    <AnimatedDialog
      ref={dialogRef}
      className="photo-dialog"
      aria-labelledby="photoCaption"
    >
      <div className="photo-lightbox">
        <button
          className="close photo-close"
          type="button"
          aria-label="Close photo"
          onClick={onClose}
        >
          ×
        </button>

        {hasPrev && (
          <button
            className="lightbox-nav lightbox-prev"
            type="button"
            aria-label="Previous photo"
            onClick={onPrev}
          >
            ‹
          </button>
        )}

        {hasNext && (
          <button
            className="lightbox-nav lightbox-next"
            type="button"
            aria-label="Next photo"
            onClick={onNext}
          >
            ›
          </button>
        )}

        <figure className="lightbox-figure">
          <div className="lightbox-image-wrap">
            <img src={activeItem.src} alt={activeItem.alt || activeItem.title || "Event photo"} />
          </div>
          <figcaption id="photoCaption" className="lightbox-caption">
            <div className="lightbox-caption-meta">
              {activeItem.tag && <span className="lightbox-tag">{activeItem.tag}</span>}
              {activeItem.date && <span className="lightbox-date">{activeItem.date}</span>}
              {activeItem.author && <span className="lightbox-author">by {activeItem.author}</span>}
            </div>
            {activeItem.title && <h3 className="lightbox-title">{activeItem.title}</h3>}
            <p className="lightbox-text">{activeItem.caption || activeItem.alt}</p>
          </figcaption>
        </figure>
      </div>
    </AnimatedDialog>
  );
}
