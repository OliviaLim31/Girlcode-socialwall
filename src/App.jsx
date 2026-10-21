import { useMemo, useRef, useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import TextLoop from "./TextLoop";
import AnimatedDialog from "./AnimatedDialog";
import EventGallery, { defaultMemories } from "./EventGallery";
import AddMemoryModal from "./AddMemoryModal";
import Lightbox from "./Lightbox";

const seed = [
  {
    name: "Olivia",
    ig: "olivia.lim31",
    about: "creative tech · skating · random side quests",
    tone: "rose",
    linkedin: "https://www.linkedin.com/in/olivialimyunxuan/",
    photo: "/images/GC%20Group.jpg",
  },
  {
    name: "Edwina",
    ig: "edeuwinaa",
    linkedin: "https://my.linkedin.com/in/edwina-hon-548189340",
    about: "design, people, and pretty little details",
    tone: "olive",
  },
  {
    name: "Zhi Wei",
    ig: "zwwavo",
    linkedin: "https://my.linkedin.com/in/tanzhiwei0328",
    about: "building weird ideas that somehow work",
    tone: "lilac",
  },
  {
    name: "Hana",
    ig: "yh_06s",
    linkedin: "https://my.linkedin.com/in/hana2006",
    about: "soft visuals, fun concepts, good playlists",
    tone: "cream",
  },
  {
    name: "Taiba",
    ig: "taiba",
    about: "AI, making things, and iced drinks",
    tone: "blue",
  },
  {
    name: "Shin Ni",
    ig: "shinni",
    about: "quietly collecting cool internet things",
    tone: "olive",
  },
];

const seedProfiles = seed.map((profile, index) => ({
  ...profile,
  id: `seed-${index}`,
}));

const initialProfiles = [
  seedProfiles[2],
  ...seedProfiles.filter((profile) => profile.id !== "seed-2"),
];

const tones = ["rose", "olive", "lilac", "cream", "blue"];
const frontendConfig = window.GIRLCODE_SUPABASE || {};
const supabaseUrl = String(frontendConfig.url || "").replace(/\/$/, "");
const publishableKey = String(frontendConfig.publishableKey || "");
const backendEnabled = Boolean(supabaseUrl && publishableKey);
const authClient = backendEnabled
  ? createClient(supabaseUrl, publishableKey)
  : null;

function readStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function initials(name = "") {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] || "")
    .join("")
    .toUpperCase();
}

function cleanIg(value = "") {
  return value
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/\/.*$/, "");
}

function cleanLinkedIn(value = "") {
  return (
    value.trim() &&
    (!/^https?:\/\//.test(value.trim())
      ? `https://${value.trim()}`
      : value.trim())
  );
}

function safeLinkedIn(value = "") {
  try {
    const url = new URL(cleanLinkedIn(value));
    return url.protocol === "https:" &&
      (url.hostname === "linkedin.com" ||
        url.hostname.endsWith(".linkedin.com")) &&
      !url.username &&
      !url.password
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function parseSong(value = "") {
  const raw = String(value).trim();
  if (!raw) return null;
  const [title, artist = ""] = raw.split(/\s*(?:—|–|-|\||,|\bby\b)\s*/i, 2);
  return { title: title.trim(), artist: artist.trim(), raw };
}

function spotifySearchUrl(song) {
  return `https://open.spotify.com/search/${encodeURIComponent(song.raw || `${song.title} ${song.artist}`)}`;
}

function compressImage(file, maxSize = 720, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const scale = Math.min(
          1,
          maxSize / Math.max(image.width, image.height),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas
          .getContext("2d")
          .drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function createProfileOnBackend(person) {
  const {
    data: { session },
  } = await authClient.auth.getSession();
  if (!session?.access_token)
    throw new Error("Please sign in before adding a profile.");
  const response = await fetch(`${supabaseUrl}/functions/v1/profiles`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: person.name,
      instagram: person.ig,
      linkedin: person.linkedin || null,
      about: person.about || null,
      tone: person.tone,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      result.error || `Profile request failed (${response.status}).`,
    );
  return result.data;
}

const heroPolaroids = [
  {
    id: "hero-1",
    src: "/events/12.09.2026/hero-group.jpg",
    alt: "Group photo of all girls at the Girls Only Vibe Code Session in KL",
    title: "Better Together ♡",
    caption: "The full crew! All the wonderful girls at the KL Vibe Coding Session.",
    tag: "Group Love",
    date: "12.09.2026",
    author: "Girls in KL",
  },
  {
    id: "hero-2",
    src: "/events/12.09.2026/event-poster.jpg",
    alt: "Laptop displaying the Girls Only Vibe Code Session poster and event schedule",
    title: "Little Ideas, Big Energy ✦",
    caption: "Laptop displaying the Girls Only Vibe Code Session poster and event schedule.",
    tag: "Coding & Vibe",
    date: "12.09.2026",
    author: "KL Meetup",
  },
];

function App() {
  const formDialog = useRef(null);
  const detailDialog = useRef(null);
  const photoDialog = useRef(null);
  const memoryDialog = useRef(null);
  const addForm = useRef(null);

  // Tab State: 'wall' | 'gallery'
  const [activeTab, setActiveTab] = useState("wall");

  // People State
  const [people, setPeople] = useState(() => {
    try {
      const stored = readStoredArray("girlcode-socialwall-people");
      return [
        ...initialProfiles,
        ...stored
          .filter((p) => p?.name && p?.ig)
          .map((p, i) => ({ ...p, id: p.id || `legacy-${i}` })),
      ];
    } catch {
      return initialProfiles;
    }
  });

  // Memories State
  const [memories, setMemories] = useState(() => {
    try {
      const stored = readStoredArray("girlcode-socialwall-memories");
      return [...defaultMemories, ...stored];
    } catch {
      return defaultMemories;
    }
  });

  const [memoryLikes, setMemoryLikes] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("girlcode-memory-reactions") || "{}",
      );
    } catch {
      return {};
    }
  });

  // Lightbox State
  const [lightboxData, setLightboxData] = useState({
    items: [],
    currentIndex: 0,
  });

  const [activePerson, setActivePerson] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedTone, setSelectedTone] = useState("all");
  const [toast, setToast] = useState("");
  const [messages, setMessages] = useState(() =>
    readStoredArray("girlcode-socialwall-messages"),
  );
  const [messageError, setMessageError] = useState("");
  const [formError, setFormError] = useState("");
  const [formErrorKey, setFormErrorKey] = useState(0);
  const [avatarPreview, setAvatarPreview] = useState("");

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const preview = await compressImage(file, 400, 0.85);
      setAvatarPreview(preview);
    } catch {
      // ignore
    }
  };

  const showFormError = (message) => {
    window.clearTimeout(showFormError.timer);
    setFormError(message);
    setFormErrorKey((key) => key + 1);
    showFormError.timer = window.setTimeout(() => setFormError(""), 5000);
  };

  const dismissFormError = () => {
    window.clearTimeout(showFormError.timer);
    setFormError("");
  };

  const openAddForm = () => {
    dismissFormError();
    setAvatarPreview("");
    formDialog.current.showModal();
  };

  const openAddMemory = () => {
    memoryDialog.current.showModal();
  };

  const notify = (message) => {
    setToast(message);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(""), 1800);
  };

  // Open Lightbox
  const openLightbox = (items, index = 0) => {
    setLightboxData({ items, currentIndex: index });
    photoDialog.current.showModal();
  };

  const nextLightboxPhoto = () => {
    setLightboxData((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.items.length,
    }));
  };

  const prevLightboxPhoto = () => {
    setLightboxData((prev) => ({
      ...prev,
      currentIndex:
        (prev.currentIndex - 1 + prev.items.length) % prev.items.length,
    }));
  };

  const closeLightbox = () => {
    photoDialog.current.close();
  };

  // Handle Memory Like
  const handleMemoryLike = (e, memId) => {
    e.stopPropagation();
    setMemoryLikes((prev) => {
      const next = { ...prev, [memId]: (prev[memId] || 0) + 1 };
      localStorage.setItem(
        "girlcode-memory-reactions",
        JSON.stringify(next),
      );
      return next;
    });
    notify("loved this memory ♡");
  };

  // Filtered people
  const shownPeople = useMemo(
    () =>
      people.filter((p) => {
        const matchesTone = selectedTone === "all" || p.tone === selectedTone;
        const q = query.toLowerCase().trim();
        const matchesQuery =
          !q ||
          `${p.name} ${p.ig} ${p.about || ""}`
            .toLowerCase()
            .includes(q);
        return matchesTone && matchesQuery;
      }),
    [people, query, selectedTone],
  );

  const musicRecommendations = useMemo(
    () => people.filter((person) => person.song?.title),
    [people],
  );

  const openProfile = (person) => {
    setActivePerson(person);
    setMessageError("");
    try {
      const allMsgs = readStoredArray("girlcode-socialwall-messages");
      setMessages(allMsgs);
    } catch {
      setMessages([]);
      setMessageError("Couldn't load saved notes. Please try again later.");
    }
    detailDialog.current.showModal();
  };

  const closeDetail = () => detailDialog.current.close();

  const addProfile = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    dismissFormError();
    const data = new FormData(form),
      file = data.get("photo"),
      song = parseSong(data.get("song")),
      person = {
        id: crypto.randomUUID(),
        name: data.get("name").trim(),
        ig: cleanIg(data.get("instagram")),
        linkedin: cleanLinkedIn(data.get("linkedin")),
        about: data.get("about").trim(),
        tone: data.get("tone") || "rose",
        song,
        photo: "",
      };
    if (!person.name) return showFormError("Please add your name before saving.");
    if (!/^[a-zA-Z0-9._]{1,30}$/.test(person.ig))
      return showFormError(
        "Your Instagram username can use letters, numbers, dots, and underscores only.",
      );
    if (person.linkedin && !safeLinkedIn(person.linkedin))
      return showFormError(
        "Please enter a valid LinkedIn profile link starting with https://.",
      );
    try {
      if (file?.size) person.photo = await compressImage(file);
      if (backendEnabled) {
        const saved = await createProfileOnBackend(person);
        Object.assign(person, {
          id: saved.id,
          ig: saved.instagram,
          linkedin: saved.linkedin || "",
          about: saved.about || "",
          tone: saved.tone,
          photo: "",
        });
      } else {
        const saved = readStoredArray("girlcode-socialwall-people");
        saved.push(person);
        localStorage.setItem(
          "girlcode-socialwall-people",
          JSON.stringify(saved),
        );
      }
      setPeople((current) => [...current, person]);
      setQuery("");
      setAvatarPreview("");
      dismissFormError();
      form.reset();
      formDialog.current.close();
      notify(`${person.name} is on the wall ✦`);
    } catch (error) {
      showFormError(
        error.message || "We couldn't save your profile. Please try again.",
      );
    }
  };

  const addMessage = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget),
      author = data.get("author").trim(),
      message = data.get("message").trim();
    if (!author || !message || !activePerson)
      return setMessageError("Please enter your name and a message.");
    try {
      const saved = readStoredArray("girlcode-socialwall-messages"),
        note = {
          id: crypto.randomUUID(),
          personId: activePerson.id,
          author,
          message,
          createdAt: new Date().toISOString(),
        };
      saved.push(note);
      localStorage.setItem(
        "girlcode-socialwall-messages",
        JSON.stringify(saved),
      );
      setMessages((current) => [...current, note]);
      setMessageError("");
      event.currentTarget.reset();
      notify("Your note is saved in this browser ♡");
    } catch {
      setMessageError(
        "Couldn't save your note. Your text is still here; please try again.",
      );
    }
  };

  const handleAddMemory = (newMemory) => {
    const stored = readStoredArray("girlcode-socialwall-memories");
    const updated = [newMemory, ...stored];
    localStorage.setItem(
      "girlcode-socialwall-memories",
      JSON.stringify(updated),
    );
    setMemories((current) => [newMemory, ...current]);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      notify("page link copied ♡");
    } catch {
      notify("couldn't auto-copy — copy it from the address bar");
    }
  };

  const handleGoHome = (event) => {
    event?.preventDefault();
    setActiveTab("wall");
    setQuery("");
    setSelectedTone("all");
    if (formDialog.current?.open) formDialog.current.close();
    if (detailDialog.current?.open) detailDialog.current.close();
    if (photoDialog.current?.open) photoDialog.current.close();
    if (memoryDialog.current?.open) memoryDialog.current.close();
    if (lightboxData.isOpen) {
      setLightboxData((prev) => ({ ...prev, isOpen: false }));
    }
    scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeLightboxItem =
    lightboxData.items[lightboxData.currentIndex] || null;

  return (
    <>
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <main className="shell">
        <header className="browser site-nav">
          <a
            className="site-brand"
            href="#top"
            onClick={handleGoHome}
          >
            <img
              src="/girl-mascot.png"
              alt="GirlCode mascot"
              className="site-brand-mascot"
            />
            <img
              src="/logo-text.png"
              alt="girl code"
              className="site-brand-wordmark"
            />
          </a>

          {/* Tab Switcher */}
          <nav className="nav-tabs" aria-label="Page navigation">
            <button
              type="button"
              className={`nav-tab-pill ${activeTab === "wall" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("wall");
                setQuery("");
              }}
            >
              ✦ Social Wall
            </button>
            <button
              type="button"
              className={`nav-tab-pill ${activeTab === "gallery" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("gallery");
                setQuery("");
              }}
            >
              📸 Event Gallery
            </button>
          </nav>

          <div className="site-search">
            <span aria-hidden="true">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder={
                activeTab === "wall"
                  ? "find someone or vibe..."
                  : "search memories or tags..."
              }
              autoComplete="off"
              aria-label="Search"
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <button
            className="nav-add"
            onClick={activeTab === "wall" ? openAddForm : openAddMemory}
          >
            {activeTab === "wall" ? "+ add me" : "+ share memory"}
          </button>
        </header>

        {activeTab === "wall" ? (
          <div className="view-container view-fade-in">
            <section className="hero">
              <div className="hero-intro">
                <figure className="hero-polaroid hero-polaroid-left">
                  <button
                    type="button"
                    className="polaroid-open"
                    aria-label="Enlarge group photo"
                    aria-haspopup="dialog"
                    onClick={() => openLightbox(heroPolaroids, 0)}
                  >
                    <img
                      src="/events/12.09.2026/hero-group.jpg"
                      alt="Group photo of all girls at the Girls Only Vibe Code Session"
                      width="5712"
                      height="4284"
                    />
                    <span className="photo-zoom-hint" aria-hidden="true">
                      view photo ↗
                    </span>
                  </button>
                  <figcaption>better together ♡</figcaption>
                </figure>
                <div className="hero-copy">
                  <div className="hero-mascot-badge">
                    <img src="/logo.png" alt="Girl Code mascot" className="hero-mascot-img" />
                    <div className="eyebrow">
                      girls' vibe coding · kl
                    </div>
                  </div>
                  <h1>
                    we met <em>irl.</em>
                    <br />
                    stay{" "}
                    <span className="highlight-wrap">
                      <span className="highlight">connected</span>
                    </span>{" "}
                    <em>online.</em>
                  </h1>
                  <p className="sub">
                    a tiny people wall for the girls in the room ♡
                  </p>
                </div>
                <figure className="hero-polaroid hero-polaroid-right">
                  <button
                    type="button"
                    className="polaroid-open"
                    aria-label="Enlarge event photo"
                    aria-haspopup="dialog"
                    onClick={() => openLightbox(heroPolaroids, 1)}
                  >
                    <img
                      src="/events/12.09.2026/event-poster.jpg"
                      alt="Laptop displaying the Girls Only Vibe Code Session poster and event schedule"
                      width="3024"
                      height="4032"
                    />
                    <span className="photo-zoom-hint" aria-hidden="true">
                      view photo ↗
                    </span>
                  </button>
                  <figcaption>little ideas, big energy ✦</figcaption>
                </figure>
              </div>
              <TextLoop
                text="Create ✦ Learn ✦ Build ✦ Support"
                shape="wave"
                speed={90}
                direction="forward"
                separator="✦"
                curviness={62}
                fontSize={50}
                fontWeight={800}
                letterSpacing={2}
                uppercase
                color="#ffffff"
                ribbon
                ribbonColor="#c15bb8ff"
                ribbonWidth={66}
              />
              <div className="hero-actions">
                <button className="primary" onClick={openAddForm}>
                  + add me
                </button>
                <button
                  className="ghost"
                  onClick={() => {
                    setActiveTab("gallery");
                    scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  view event gallery 📸
                </button>
                <button className="ghost" onClick={copyLink}>
                  copy page link
                </button>
              </div>
            </section>

            <section className="toolbar">
              <div>
                <div className="tiny">who's here?</div>
                <div className="count">
                  <span>{shownPeople.length}</span> girls on the wall
                </div>
              </div>

              {/* Tone filters */}
              <div className="tone-filters" role="group" aria-label="Filter by vibe color">
                <button
                  type="button"
                  className={`tone-chip ${selectedTone === "all" ? "active" : ""}`}
                  onClick={() => setSelectedTone("all")}
                >
                  ✦ all vibes
                </button>
                {tones.map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    className={`tone-chip tone-chip-${tone} ${selectedTone === tone ? "active" : ""}`}
                    onClick={() => setSelectedTone(tone)}
                  >
                    <span className={`swatch-dot ${tone}`} />
                    {tone}
                  </button>
                ))}
              </div>
            </section>

            {shownPeople.length === 0 ? (
              <div className="empty-state">
                <img src="/logo.png" alt="Girl Code mascot" className="empty-mascot-img" />
                <h3>no profiles found</h3>
                <p>
                  No cards matched your current search or vibe filter.
                </p>
                <div className="empty-actions">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setQuery("");
                      setSelectedTone("all");
                    }}
                  >
                    clear filters
                  </button>
                  <button
                    type="button"
                    className="primary"
                    onClick={openAddForm}
                  >
                    + add yourself
                  </button>
                </div>
              </div>
            ) : (
              <section className="wall" aria-live="polite">
                {shownPeople.map((person, index) => {
                  const personNotes = messages.filter(
                    (m) => m?.personId === person.id,
                  );
                  return (
                    <article
                      className={`person-card ${tones.includes(person.tone) ? person.tone : "rose"}`}
                      key={person.id}
                      style={{
                        "--enter-delay": `${Math.min(index, 7) * 65}ms`,
                      }}
                    >
                      <div className="id-card-copy">
                        <div className="id-card-top">
                          <span className="id-card-label">ID-CARD</span>
                          <span className="id-card-markers" aria-hidden="true">
                            <i />
                            <i />
                            <i />
                          </span>
                        </div>
                        <div className="id-card-name">
                          <span className="id-card-field-label">NAME</span>
                          <h3>{person.name}</h3>
                        </div>
                        <div className="id-card-handle">
                          <span className="id-card-field-label">HANDLE</span>
                          <span>@{person.ig}</span>
                        </div>
                        <div className="id-card-skill">
                          <span className="id-card-field-label">SKILL / VIBE</span>
                          <p className="about">
                            {person.about || "say hi if you see me around ♡"}
                          </p>
                        </div>
                        {person.song && (
                          <a
                            className="song-chip"
                            href={spotifySearchUrl(person.song)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span aria-hidden="true">♫</span>
                            <span>
                              <strong>{person.song.title}</strong>
                              {person.song.artist && (
                                <small>{person.song.artist}</small>
                              )}
                            </span>
                          </a>
                        )}
                        <button
                          className="card-open"
                          onClick={() => openProfile(person)}
                        >
                          view profile ↗
                        </button>
                      </div>
                      <div className="portrait-wrap">
                        <div
                          className={`portrait ${person.photo ? "has-photo" : "initials-placeholder"}`}
                          style={
                            person.photo
                              ? { backgroundImage: `url(${person.photo})` }
                              : {}
                          }
                        >
                          {person.photo ? "" : initials(person.name)}
                        </div>
                      </div>
                      <div className="id-card-footer">
                        <span className="id-card-barcode" aria-hidden="true" />
                        {personNotes.length > 0 && (
                          <span className="note-count-pill">
                            {personNotes.length} notes
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </section>
            )}

            <section
              className="music-gallery"
              aria-labelledby="musicGalleryTitle"
            >
              <div className="music-gallery-head">
                <div>
                  <div className="tiny">our soundtrack</div>
                  <h2 id="musicGalleryTitle">on repeat ♫</h2>
                </div>
                <p>little songs, recommended by the room</p>
              </div>
              {musicRecommendations.length ? (
                <div className="music-grid">
                  {musicRecommendations.map((person) => (
                    <a
                      className="music-card"
                      href={spotifySearchUrl(person.song)}
                      target="_blank"
                      rel="noreferrer"
                      key={`${person.id}-song`}
                    >
                      <span className="vinyl" aria-hidden="true">
                        <i />
                      </span>
                      <span className="music-copy">
                        <strong>{person.song.title}</strong>
                        {person.song.artist && (
                          <span>{person.song.artist}</span>
                        )}
                        <small>recommended by {person.name}</small>
                      </span>
                      <span className="listen-label">listen on Spotify ↗</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="music-empty">
                  The first song recommendation will appear here ♫
                </p>
              )}
            </section>
          </div>
        ) : (
          <div className="view-container view-fade-in">
            <EventGallery
              memories={memories}
              onOpenPhoto={openLightbox}
              onOpenAddMemory={openAddMemory}
              query={query}
              setQuery={setQuery}
              likesMap={memoryLikes}
              onLikeMemory={handleMemoryLike}
            />
          </div>
        )}

        <footer>
          <div className="footer-brand">
            <img src="/logo.png" alt="Girl Code logo" className="footer-logo-img" />
            <span>
              {activeTab === "wall"
                ? "made for one room, one afternoon, and a lot of new mutuals ✦"
                : "girls' vibe coding moments captured with love ♡"}
            </span>
          </div>
          <button
            onClick={activeTab === "wall" ? openAddForm : openAddMemory}
          >
            {activeTab === "wall" ? "add yourself ↗" : "share memory ↗"}
          </button>
        </footer>
      </main>

      {/* Add Profile Modal */}
      <AnimatedDialog ref={formDialog} aria-labelledby="formTitle">
        <form ref={addForm} className="sheet" onSubmit={addProfile} noValidate>
          {formError && (
            <div className="form-alert" role="alert" key={formErrorKey}>
              <span className="form-alert-star" aria-hidden="true">
                ✦
              </span>
              <span>{formError}</span>
              <button
                type="button"
                onClick={dismissFormError}
                aria-label="Dismiss alert"
              >
                ×
              </button>
            </div>
          )}
          <div className="sheet-head">
            <div className="sheet-head-left">
              <img src="/logo.png" alt="Girl Code logo" className="sheet-dialog-logo" />
              <div>
                <div className="tiny">join the wall</div>
                <h2 id="formTitle">add your little corner ♡</h2>
              </div>
            </div>
            <button
              className="close"
              type="button"
              onClick={() => formDialog.current.close()}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <label>
            <span>name</span>
            <input name="name" required maxLength="40" placeholder="Olivia" />
          </label>
          <label>
            <span>instagram username</span>
            <div className="input-prefix">
              <b>@</b>
              <input
                name="instagram"
                required
                maxLength="60"
                placeholder="olivia.lim31"
              />
            </div>
          </label>
          <label>
            <span>
              linkedin <i>optional</i>
            </span>
            <input name="linkedin" placeholder="linkedin.com/in/yourname" />
          </label>
          <label>
            <span>come talk to me about...</span>
            <input
              name="about"
              maxLength="90"
              placeholder="creative tech, skating, random side quests"
            />
          </label>
          <label>
            <span>
              What song do you recommend? <i>optional</i>
            </span>
            <input
              name="song"
              maxLength="200"
              placeholder=" e.g. Espresso — Sabrina Carpenter"
            />
          </label>
          <div className="avatar-upload-field">
            <span className="avatar-label">
              profile photo <i>optional</i>
            </span>
            <div className="avatar-upload-row">
              <div
                className="avatar-live-preview"
                style={
                  avatarPreview
                    ? { backgroundImage: `url(${avatarPreview})` }
                    : {}
                }
              >
                {!avatarPreview && <span className="avatar-placeholder-star">✦</span>}
              </div>
              <div className="avatar-upload-actions">
                <input
                  name="photo"
                  type="file"
                  id="profile-avatar-input"
                  accept="image/*"
                  className="visually-hidden-file"
                  onChange={handleAvatarChange}
                />
                <div className="avatar-btns-group">
                  <label htmlFor="profile-avatar-input" className="avatar-pick-btn">
                    {avatarPreview ? "change photo" : "choose photo"}
                  </label>
                  {avatarPreview && (
                    <button
                      type="button"
                      className="avatar-clear-btn"
                      onClick={() => {
                        setAvatarPreview("");
                        const el = document.getElementById("profile-avatar-input");
                        if (el) el.value = "";
                      }}
                    >
                      remove
                    </button>
                  )}
                </div>
                <small className="avatar-note">looks best in square crop ♡</small>
              </div>
            </div>
          </div>
          <fieldset>
            <legend>pick a card vibe</legend>
            <div className="swatches">
              {tones.map((tone, index) => (
                <label key={tone}>
                  <input
                    type="radio"
                    name="tone"
                    value={tone}
                    defaultChecked={index === 0}
                  />
                  <span className={`swatch ${tone}`} />
                </label>
              ))}
            </div>
          </fieldset>
          <p className="privacy-note">
            Your profile may be visible to people who visit this wall. Without
            a shared backend, it is saved only in this browser; with one, it is
            saved to the shared wall.
          </p>
          <button className="submit" type="submit">
            add me to the wall ✦
          </button>
        </form>
      </AnimatedDialog>

      {/* Profile Detail & Guestbook Modal */}
      <AnimatedDialog
        ref={detailDialog}
        className="detail-dialog"
        aria-labelledby="detailName"
      >
        {activePerson && (
          <div className="sheet detail-sheet">
            <div className="detail-sheet-head">
              <span className="detail-card-label">GIRLCODE · MEMBER PROFILE</span>
              <button
                className="close"
                type="button"
                onClick={closeDetail}
                aria-label="Close profile"
              >
                ×
              </button>
            </div>
            <div className={`detail-profile ${activePerson.tone || "rose"}`}>
              <div
                className="detail-portrait portrait"
                style={
                  activePerson.photo
                    ? { backgroundImage: `url(${activePerson.photo})` }
                    : {}
                }
              >
                {activePerson.photo ? "" : initials(activePerson.name)}
              </div>
              <div className="detail-copy">
                <span className="detail-field-label">NAME</span>
                <h2 id="detailName">{activePerson.name}</h2>
                <p className="detail-handle">@{activePerson.ig}</p>
                <p className="detail-about">
                  {activePerson.about || "say hi if you see me around ♡"}
                </p>
                <div className="links">
                  <a
                    className="pill"
                    href={`https://instagram.com/${encodeURIComponent(activePerson.ig)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    instagram ↗
                  </a>
                  {safeLinkedIn(activePerson.linkedin) ? (
                    <a
                      className="pill"
                      href={safeLinkedIn(activePerson.linkedin)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      linkedin ↗
                    </a>
                  ) : (
                    <span className="pill unavailable">
                      linkedin · not provided
                    </span>
                  )}
                </div>
              </div>
            </div>
            <section className="guestbook">
              <h3>leave a little note ♡</h3>
              <p className="note-help privacy-note">
                Notes are saved in this browser only; they are not sent to the
                person. Anyone using this browser may be able to see them, so
                please do not include private information.
              </p>
              <ul className="message-list" aria-live="polite">
                {messages.filter((m) => m?.personId === activePerson.id)
                  .length ? (
                  messages
                    .filter((m) => m?.personId === activePerson.id)
                    .map((note) => (
                      <li key={note.id}>
                        <div className="note-head">
                          <strong>{note.author}</strong>
                          {note.createdAt && (
                            <span className="note-date">
                              {new Date(note.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                        <p>{note.message}</p>
                      </li>
                    ))
                ) : (
                  <li className="empty-notes">
                    No notes yet. Be the first to say hi ♡
                  </li>
                )}
              </ul>
              <form onSubmit={addMessage}>
                <label>
                  <span>your name</span>
                  <input
                    name="author"
                    required
                    maxLength="40"
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </label>
                <label>
                  <span>your message</span>
                  <textarea
                    name="message"
                    required
                    maxLength="1000"
                    rows="3"
                    placeholder="So lovely meeting you…"
                  />
                </label>
                <p className="form-error" role="alert">
                  {messageError}
                </p>
                <button className="submit" type="submit">
                  leave a note ✦
                </button>
              </form>
            </section>
          </div>
        )}
      </AnimatedDialog>

      {/* Add Memory Modal */}
      <AddMemoryModal
        dialogRef={memoryDialog}
        onAddMemory={handleAddMemory}
        compressImage={compressImage}
        notify={notify}
      />

      {/* Interactive Lightbox */}
      <Lightbox
        dialogRef={photoDialog}
        activeItem={activeLightboxItem}
        onNext={nextLightboxPhoto}
        onPrev={prevLightboxPhoto}
        hasNext={lightboxData.items.length > 1}
        hasPrev={lightboxData.items.length > 1}
        onClose={closeLightbox}
      />

      {/* Toast */}
      <div
        className={`toast ${toast ? "show" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </>
  );
}

export default App;
