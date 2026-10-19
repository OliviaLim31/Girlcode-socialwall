import { useMemo, useState } from "react";

export const defaultMemories = [
  {
    id: "mem-1",
    src: "/images/event-coding.jpg",
    title: "Matcha & Vibe Coding",
    caption: "Laptops covered in stickers, iced matcha lattes, and everyone in the flow state building side quests.",
    tag: "Coding & Vibe",
    date: "12 Sept 2026",
    author: "Olivia",
    baseLikes: 18,
    tilt: "-2deg",
    tapeColor: "rgba(228, 211, 232, 0.85)",
  },
  {
    id: "mem-2",
    src: "/images/event-demo.jpg",
    title: "Show & Tell Magic",
    caption: "Sharing little screen experiments and quirky code projects that somehow worked!",
    tag: "Show & Tell",
    date: "12 Sept 2026",
    author: "Zhi Wei",
    baseLikes: 24,
    tilt: "2.5deg",
    tapeColor: "rgba(230, 223, 180, 0.85)",
  },
  {
    id: "mem-3",
    src: "/images/event-cheers.jpg",
    title: "Cheers to New Mutuals",
    caption: "Sweet sips, colorful friendship bracelets, and clinking iced glasses in the afternoon light.",
    tag: "Coffee & Hangout",
    date: "12 Sept 2026",
    author: "Edwina",
    baseLikes: 31,
    tilt: "-2.8deg",
    tapeColor: "rgba(209, 226, 239, 0.85)",
  },
  {
    id: "mem-4",
    src: "/images/polaroid-together.jpg",
    title: "Better Together ♡",
    caption: "Our official group polaroid. 1 room, 1 afternoon, and countless new connections.",
    tag: "Group Love",
    date: "12 Sept 2026",
    author: "Girls in KL",
    baseLikes: 42,
    tilt: "1.8deg",
    tapeColor: "rgba(247, 201, 215, 0.85)",
  },
  {
    id: "mem-5",
    src: "/images/polaroid-create.jpg",
    title: "Girls Only Vibe Code",
    caption: "The screen schedule poster that brought all of us together into the same room.",
    tag: "Coding & Vibe",
    date: "12 Sept 2026",
    author: "Hana",
    baseLikes: 15,
    tilt: "-1.5deg",
    tapeColor: "rgba(224, 235, 200, 0.85)",
  },
  {
    id: "mem-6",
    src: "/images/GC Group.jpg",
    title: "The Warmest Vibe",
    caption: "Huge smiles and high energy right before packing up our laptops.",
    tag: "Group Love",
    date: "12 Sept 2026",
    author: "Taiba",
    baseLikes: 29,
    tilt: "2.2deg",
    tapeColor: "rgba(238, 215, 235, 0.85)",
  },
];

export const memoryTags = [
  "All Moments",
  "Coding & Vibe",
  "Coffee & Hangout",
  "Show & Tell",
  "Group Love",
];

export default function EventGallery({
  memories,
  onOpenPhoto,
  onOpenAddMemory,
  query,
  setQuery,
  likesMap,
  onLikeMemory,
}) {
  const [activeTag, setActiveTag] = useState("All Moments");

  const filteredMemories = useMemo(() => {
    return memories.filter((item) => {
      const matchesTag =
        activeTag === "All Moments" || item.tag === activeTag;
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        `${item.title} ${item.caption} ${item.tag} ${item.author || ""}`
          .toLowerCase()
          .includes(q);
      return matchesTag && matchesQuery;
    });
  }, [memories, activeTag, query]);

  return (
    <div className="event-gallery-section" aria-label="Event Gallery">
      <header className="gallery-header">
        <div className="gallery-header-content">
          <div className="eyebrow">girls' vibe coding · kl · 12.09.26</div>
          <h1 className="gallery-title">
            our little <em>moments</em>{" "}
            <span className="highlight-wrap">
              <span className="highlight">irl.</span>
            </span>
          </h1>
          <p className="sub gallery-sub">
            a scrapbook of candid laughs, iced matcha, stickers, and screens glowing with code ♡
          </p>
        </div>

        <div className="gallery-action-bar">
          <div className="gallery-count-pill">
            <span className="count-number">{filteredMemories.length}</span>
            <span>memories captured</span>
          </div>
          <button
            type="button"
            className="primary gallery-add-btn"
            onClick={onOpenAddMemory}
          >
            + share a memory
          </button>
        </div>

        <div className="gallery-filter-chips" role="tablist" aria-label="Memory categories">
          {memoryTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag-chip ${activeTag === tag ? "active" : ""}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag === "All Moments" ? "✦ All Moments" : tag}
            </button>
          ))}
        </div>
      </header>

      {filteredMemories.length === 0 ? (
        <div className="empty-gallery-state">
          <span className="empty-icon">📸</span>
          <h3>no photos found</h3>
          <p>
            {query
              ? `No memories matched "${query}". Try searching with different keywords.`
              : "No moments under this category yet."}
          </p>
          <div className="empty-actions">
            {query && (
              <button
                type="button"
                className="ghost"
                onClick={() => setQuery("")}
              >
                clear search
              </button>
            )}
            <button
              type="button"
              className="primary"
              onClick={onOpenAddMemory}
            >
              + upload the first one
            </button>
          </div>
        </div>
      ) : (
        <div className="gallery-polaroid-grid" aria-live="polite">
          {filteredMemories.map((item, index) => {
            const totalLikes = (item.baseLikes || 0) + (likesMap[item.id] || 0);
            return (
              <article
                key={item.id}
                className="polaroid-card"
                style={{
                  "--tilt": item.tilt || `${((index % 5) - 2) * 1.5}deg`,
                  "--tape-bg": item.tapeColor || "rgba(228, 211, 232, 0.85)",
                  "--enter-delay": `${Math.min(index, 8) * 60}ms`,
                }}
              >
                <div className="washi-tape" aria-hidden="true" />
                <button
                  type="button"
                  className="polaroid-image-button"
                  onClick={() => onOpenPhoto(filteredMemories, index)}
                  aria-label={`Enlarge photo: ${item.title}`}
                >
                  <div className="polaroid-image-frame">
                    <img
                      src={item.src}
                      alt={item.title}
                      loading="lazy"
                    />
                    <span className="photo-zoom-hint" aria-hidden="true">
                      view photo ↗
                    </span>
                  </div>
                </button>

                <div className="polaroid-content">
                  <div className="polaroid-meta-row">
                    <span className="polaroid-tag-badge">{item.tag}</span>
                    <span className="polaroid-date-text">{item.date}</span>
                  </div>

                  <h3 className="polaroid-title">{item.title}</h3>
                  <p className="polaroid-caption">{item.caption}</p>

                  <div className="polaroid-footer-row">
                    <span className="polaroid-author">
                      ✦ {item.author || "Guest"}
                    </span>
                    <button
                      type="button"
                      className="polaroid-like-btn"
                      onClick={(e) => onLikeMemory(e, item.id)}
                      aria-label={`Like memory: ${totalLikes} hearts`}
                    >
                      <span className="heart-icon">♡</span>
                      <span className="like-count">{totalLikes}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
