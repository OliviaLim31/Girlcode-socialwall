import { useMemo, useState } from "react";

export const defaultMemories = [
  {
    id: "mem-group-1",
    src: "/events/12.09.2026/hero-group.jpg",
    title: "Girls Only Vibe Coding KL ♡",
    caption: "The full room together! Countless laughs, shared code, stickers, and new mutuals.",
    tag: "Group Love",
    eventDate: "12.09.2026",
    date: "12.09.2026",
    author: "Girls in KL",
    baseLikes: 58,
    tilt: "1.2deg",
    tapeColor: "rgba(247, 201, 215, 0.85)",
  },
  {
    id: "mem-poster",
    src: "/events/12.09.2026/event-poster.jpg",
    title: "Girls Only Vibe Code Session",
    caption: "The schedule poster that brought all of us together into the same room on Saturday afternoon.",
    tag: "Coding & Vibe",
    eventDate: "12.09.2026",
    date: "12.09.2026",
    author: "Olivia",
    baseLikes: 35,
    tilt: "-1.8deg",
    tapeColor: "rgba(224, 235, 200, 0.85)",
  },
  {
    id: "mem-demo",
    src: "/events/12.09.2026/event-demo-real.jpg",
    title: "Project Show & Tell",
    caption: "Gathering around the laptop screens to cheer on each other's live web experiments and side quests.",
    tag: "Show & Tell",
    eventDate: "12.09.2026",
    date: "12.09.2026",
    author: "Zhi Wei",
    baseLikes: 42,
    tilt: "2.1deg",
    tapeColor: "rgba(230, 223, 180, 0.85)",
  },
  {
    id: "mem-sharing",
    src: "/events/12.09.2026/event-sharing.jpg",
    title: "Live Walkthrough & Ideas",
    caption: "Hands-on debugging and walkthroughs together. Learning made so much warmer in person.",
    tag: "Show & Tell",
    eventDate: "12.09.2026",
    date: "12.09.2026",
    author: "Girls in KL",
    baseLikes: 27,
    tilt: "-2.4deg",
    tapeColor: "rgba(209, 226, 239, 0.85)",
  },
  {
    id: "mem-collab",
    src: "/events/12.09.2026/event-collab.jpg",
    title: "Pair Coding Flow State",
    caption: "Two heads are better than one! Tackling CSS, logic, and animations side-by-side.",
    tag: "Coding & Vibe",
    eventDate: "12.09.2026",
    date: "12.09.2026",
    author: "Edwina",
    baseLikes: 39,
    tilt: "1.6deg",
    tapeColor: "rgba(228, 211, 232, 0.85)",
  },
  {
    id: "mem-table",
    src: "/events/12.09.2026/event-table.jpg",
    title: "Matcha, Laptops & Warmth",
    caption: "Iced matcha, French fries, laptops, and good company under the warm cafe lighting.",
    tag: "Coffee & Hangout",
    eventDate: "12.09.2026",
    date: "12.09.2026",
    author: "Taiba",
    baseLikes: 33,
    tilt: "-1.5deg",
    tapeColor: "rgba(238, 215, 235, 0.85)",
  },
  {
    id: "mem-atmosphere",
    src: "/events/12.09.2026/event-atmosphere.jpg",
    title: "The Vibe in the Room",
    caption: "A bird's eye glimpse of everyone building their ideas in the loft space.",
    tag: "Coffee & Hangout",
    eventDate: "12.09.2026",
    date: "12.09.2026",
    author: "Hana",
    baseLikes: 31,
    tilt: "2.5deg",
    tapeColor: "rgba(224, 235, 200, 0.85)",
  },
];

export const memoryTags = [
  "All Moments",
  "Group Love",
  "Coding & Vibe",
  "Show & Tell",
  "Coffee & Hangout",
];

export const eventDates = [
  { id: "all", label: "✦ All Events" },
  { id: "12.09.2026", label: "🗓 12.09.2026 (KL Meetup)" },
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
  const [selectedEventDate, setSelectedEventDate] = useState("all");

  const filteredMemories = useMemo(() => {
    return memories.filter((item) => {
      const matchesEvent =
        selectedEventDate === "all" ||
        item.eventDate === selectedEventDate ||
        item.date === selectedEventDate ||
        (item.date && item.date.includes("12 Sept 2026") && selectedEventDate === "12.09.2026");
      const matchesTag =
        activeTag === "All Moments" || item.tag === activeTag;
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        `${item.title} ${item.caption} ${item.tag} ${item.author || ""} ${item.eventDate || ""} ${item.date || ""}`
          .toLowerCase()
          .includes(q);
      return matchesEvent && matchesTag && matchesQuery;
    });
  }, [memories, selectedEventDate, activeTag, query]);

  return (
    <div className="event-gallery-section" aria-label="Event Gallery">
      <header className="gallery-header">
        <div className="gallery-header-content">
          <div className="gallery-mascot-badge">
            <img src="/logo.png" alt="Girl Code mascot" className="gallery-mascot-img" />
            <div className="eyebrow">girls' vibe coding · kl · 12.09.2026</div>
          </div>
          <h1 className="gallery-title">
            our real <em>moments</em>{" "}
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

        {/* Monthly Event Date Tabs */}
        <div className="gallery-event-tabs" role="tablist" aria-label="Filter by meetup event">
          {eventDates.map((evt) => (
            <button
              key={evt.id}
              type="button"
              className={`event-date-tab ${selectedEventDate === evt.id ? "active" : ""}`}
              onClick={() => setSelectedEventDate(evt.id)}
            >
              {evt.label}
            </button>
          ))}
        </div>

        {/* Category Vibe Filter Chips */}
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
          <img src="/logo.png" alt="Girl Code mascot" className="empty-mascot-img" />
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
