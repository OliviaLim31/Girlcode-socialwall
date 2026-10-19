import { useState, useRef } from "react";
import AnimatedDialog from "./AnimatedDialog";

const PRESET_TAPES = [
  "rgba(228, 211, 232, 0.85)",
  "rgba(230, 223, 180, 0.85)",
  "rgba(209, 226, 239, 0.85)",
  "rgba(247, 201, 215, 0.85)",
  "rgba(224, 235, 200, 0.85)",
];

export default function AddMemoryModal({
  dialogRef,
  onAddMemory,
  compressImage,
  notify,
}) {
  const formRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, 900, 0.85);
      setPhotoPreview(base64);
      setError("");
    } catch {
      setError("Failed to process photo. Please choose another image.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const data = new FormData(e.currentTarget);
    const title = String(data.get("title") || "").trim();
    const caption = String(data.get("caption") || "").trim();
    const author = String(data.get("author") || "").trim();
    const tag = String(data.get("tag") || "Coding & Vibe");

    if (!photoPreview) {
      setError("Please select a photo to share!");
      return;
    }
    if (!title) {
      setError("Please give your memory a short title.");
      return;
    }
    if (!author) {
      setError("Please enter your name so we know who captured this.");
      return;
    }

    setSubmitting(true);
    try {
      const randomTape =
        PRESET_TAPES[Math.floor(Math.random() * PRESET_TAPES.length)];
      const randomTilt = `${(Math.random() * 4 - 2).toFixed(1)}deg`;

      const newMemory = {
        id: `mem-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`,
        src: photoPreview,
        title,
        caption: caption || "a sweet moment captured at girlcode ♡",
        tag,
        date: "12 Sept 2026",
        author,
        baseLikes: 1,
        tilt: randomTilt,
        tapeColor: randomTape,
      };

      onAddMemory(newMemory);
      formRef.current?.reset();
      setPhotoPreview("");
      setError("");
      dialogRef.current?.close();
      notify("memory pinned to the scrapbook 📸✦");
    } catch {
      setError("Couldn't save memory. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setError("");
    dialogRef.current?.close();
  };

  return (
    <AnimatedDialog ref={dialogRef} aria-labelledby="memoryModalTitle">
      <form
        ref={formRef}
        className="sheet memory-sheet"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="sheet-head">
          <div>
            <div className="tiny">share an irl memory</div>
            <h2 id="memoryModalTitle">pin a polaroid 📸</h2>
          </div>
          <button
            className="close"
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="form-alert" role="alert">
            <span className="form-alert-star" aria-hidden="true">
              ✦
            </span>
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <label>
          <span>
            event photo <i>(required)</i>
          </span>
          <div className="memory-upload-zone">
            {photoPreview ? (
              <div className="memory-preview-box">
                <img src={photoPreview} alt="Preview" />
                <button
                  type="button"
                  className="ghost memory-reselect-btn"
                  onClick={() => setPhotoPreview("")}
                >
                  choose another photo
                </button>
              </div>
            ) : (
              <div className="memory-file-input-wrapper">
                <input
                  name="photo"
                  type="file"
                  accept="image/*"
                  required
                  onChange={handlePhotoChange}
                />
                <div className="upload-prompt">
                  <span className="upload-icon">📷</span>
                  <strong>upload an event snapshot</strong>
                  <small>candid photos, laptop screens, smiles, iced drinks</small>
                </div>
              </div>
            )}
          </div>
        </label>

        <label>
          <span>
            memory title <i>(e.g. Matcha & Bugs)</i>
          </span>
          <input
            name="title"
            required
            maxLength="60"
            placeholder="Give this photo a cute title..."
          />
        </label>

        <label>
          <span>category vibe</span>
          <select name="tag" className="memory-select" defaultValue="Coding & Vibe">
            <option value="Coding & Vibe">✦ Coding & Vibe</option>
            <option value="Coffee & Hangout">🧋 Coffee & Hangout</option>
            <option value="Show & Tell">✨ Show & Tell</option>
            <option value="Group Love">♡ Group Love</option>
          </select>
        </label>

        <label>
          <span>a little story or caption</span>
          <textarea
            name="caption"
            maxLength="240"
            rows="2"
            placeholder="What happened in this moment? (optional)"
          />
        </label>

        <label>
          <span>
            captured / shared by <i>(your name)</i>
          </span>
          <input
            name="author"
            required
            maxLength="40"
            placeholder="e.g. Olivia or @olivia.lim31"
          />
        </label>

        <button className="submit" type="submit" disabled={submitting}>
          {submitting ? "pinning memory..." : "pin to gallery ✦"}
        </button>

        <p className="micro">
          Photos are saved locally in your browser so you can view them anytime.
        </p>
      </form>
    </AnimatedDialog>
  );
}
