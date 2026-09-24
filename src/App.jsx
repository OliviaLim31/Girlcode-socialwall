import { useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import TextLoop from "./TextLoop";
import AnimatedDialog from "./AnimatedDialog";

const seed = [
  {
    name: "Olivia",
    ig: "olivia.lim31",
    about: "creative tech · skating · random side quests",
    tone: "rose",
    linkedin: "https://www.linkedin.com/in/olivialimyunxuan/"
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
  const value = JSON.parse(localStorage.getItem(key) || "[]");
  if (!Array.isArray(value)) throw new Error("Invalid stored data");
  return value;
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

function App() {
  const formDialog = useRef(null),
    detailDialog = useRef(null),
    photoDialog = useRef(null),
    addForm = useRef(null);
  const [people, setPeople] = useState(() => {
    try {
      return [
        ...initialProfiles,
        ...readStoredArray("girlcode-socialwall-people")
          .filter((p) => p?.name && p?.ig)
          .map((p, i) => ({ ...p, id: p.id || `legacy-${i}` })),
      ];
    } catch {
      return initialProfiles;
    }
  });
  const [activePhoto, setActivePhoto] = useState(null);
  const openPhoto = (event) => {
    const figure = event.currentTarget.closest("figure");
    const image = figure.querySelector("img");
    setActivePhoto({ src: image.getAttribute("src"), alt: image.alt, caption: figure.querySelector("figcaption").textContent });
    photoDialog.current.showModal();
  };
  const [activePerson, setActivePerson] = useState(null),
    [query, setQuery] = useState(""),
    [toast, setToast] = useState(""),
    [messages, setMessages] = useState([]),
    [messageError, setMessageError] = useState(""),
    [formError, setFormError] = useState(""),
    [formErrorKey, setFormErrorKey] = useState(0);
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
    formDialog.current.showModal();
  };
  const notify = (message) => {
    setToast(message);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(""), 1500);
  };
  const shownPeople = useMemo(
    () =>
      people.filter((p) =>
        `${p.name} ${p.ig} ${p.about || ""}`
          .toLowerCase()
          .includes(query.toLowerCase().trim()),
      ),
    [people, query],
  );
  const musicRecommendations = useMemo(
    () => people.filter((person) => person.song?.title),
    [people],
  );
  const openProfile = (person) => {
    setActivePerson(person);
    setMessageError("");
    try {
      setMessages(
        readStoredArray("girlcode-socialwall-messages").filter(
          (m) => m?.personId === person.id,
        ),
      );
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
      return showFormError("Your Instagram username can use letters, numbers, dots, and underscores only.");
    if (person.linkedin && !safeLinkedIn(person.linkedin))
      return showFormError("Please enter a valid LinkedIn profile link starting with https://.");
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
      dismissFormError();
      form.reset();
      formDialog.current.close();
      notify(`${person.name} is on the wall ✦`);
      setTimeout(
        () =>
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
          }),
        80,
      );
    } catch (error) {
      showFormError(error.message || "We couldn't save your profile. Please try again.");
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
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      notify("page link copied ♡");
    } catch {
      notify("couldn't auto-copy — copy it from the address bar");
    }
  };
  return (
    <>
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <main className="shell">
        <header className="browser site-nav">
          <a
            className="site-brand"
            href="#top"
            onClick={(event) => {
              event.preventDefault();
              scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <span className="site-brand-mark">✦</span>
            <span>girlcode social wall</span>
          </a>
          <label className="site-search">
            <span aria-hidden="true">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="find someone..."
              autoComplete="off"
              aria-label="Find someone"
            />
          </label>
          <button
            className="nav-add"
            onClick={openAddForm}
          >
            + add me
          </button>
        </header>
        <section className="hero">
          <div className="hero-intro">
            <figure className="hero-polaroid hero-polaroid-left">
              <button type="button" className="polaroid-open" aria-label="Enlarge group photo" aria-haspopup="dialog" onClick={openPhoto}>
                <img src="/images/polaroid-together.jpg" alt="Group photo at the girls' vibe coding session" width="2560" height="1919" />
                <span className="photo-zoom-hint" aria-hidden="true">view photo ↗</span>
              </button>
              <figcaption>better together ♡</figcaption>
            </figure>
            <div className="hero-copy">
              <div className="eyebrow">girls' vibe coding · kl · 12.09.26</div>
              <h1>
                we met <em>irl.</em>
                <br />
                stay{" "}
                <span className="highlight-wrap">
                  <span className="highlight">connected</span>
                </span>{" "}
                <em>online.</em>
              </h1>
              <p className="sub">a tiny people wall for the girls in the room ♡</p>
            </div>
            <figure className="hero-polaroid hero-polaroid-right">
              <button type="button" className="polaroid-open" aria-label="Enlarge event photo" aria-haspopup="dialog" onClick={openPhoto}>
                <img src="/images/polaroid-create.jpg" alt="Laptop displaying the Girls Only Vibe Code Session poster and event schedule" width="1920" height="2560" />
                <span className="photo-zoom-hint" aria-hidden="true">view photo ↗</span>
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
            <button
              className="primary"
              onClick={openAddForm}
            >
              + add me
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
        </section>
        <section className="wall" aria-live="polite">
          {shownPeople.map((person, index) => (
            <article
              className={`person-card ${tones.includes(person.tone) ? person.tone : "rose"}`}
              key={person.id}
              style={{ "--enter-delay": `${Math.min(index, 7) * 65}ms` }}
            >
              <div className="sticker star">✦</div>
              <div className="portrait-wrap">
                <div
                  className="portrait"
                  style={
                    person.photo
                      ? { backgroundImage: `url(${person.photo})` }
                      : {}
                  }
                >
                  {person.photo ? "" : initials(person.name)}
                </div>
              </div>
              <div className="person-copy">
                <div className="name-row">
                  <h3>{person.name}</h3>
                  <span className="dot">●</span>
                </div>
                <span className="handle">@{person.ig}</span>
                <p className="about">
                  {person.about || "say hi if you see me around ♡"}
                </p>
                {person.song && (
                  <a className="song-chip" href={spotifySearchUrl(person.song)} target="_blank" rel="noreferrer">
                    <span aria-hidden="true">♫</span>
                    <span><strong>{person.song.title}</strong>{person.song.artist && <small>{person.song.artist}</small>}</span>
                  </a>
                )}
                <div className="links">
                  <span className="social-summary">
                    {safeLinkedIn(person.linkedin)
                      ? "instagram · linkedin"
                      : "instagram"}
                  </span>
                </div>
                <button
                  className="card-open"
                  onClick={() => openProfile(person)}
                >
                  view profile & leave a note ↗
                </button>
              </div>
            </article>
          ))}
        </section>
        <section className="music-gallery" aria-labelledby="musicGalleryTitle">
          <div className="music-gallery-head">
            <div><div className="tiny">our soundtrack</div><h2 id="musicGalleryTitle">on repeat ♫</h2></div>
            <p>little songs, recommended by the room</p>
          </div>
          {musicRecommendations.length ? (
            <div className="music-grid">
              {musicRecommendations.map((person) => (
                <a className="music-card" href={spotifySearchUrl(person.song)} target="_blank" rel="noreferrer" key={`${person.id}-song`}>
                  <span className="vinyl" aria-hidden="true"><i /></span>
                  <span className="music-copy"><strong>{person.song.title}</strong>{person.song.artist && <span>{person.song.artist}</span>}<small>recommended by {person.name}</small></span>
                  <span className="listen-label">listen on Spotify ↗</span>
                </a>
              ))}
            </div>
          ) : <p className="music-empty">The first song recommendation will appear here ♫</p>}
        </section>
        <footer>
          <span>
            made for one room, one afternoon, and a lot of new mutuals ✦
          </span>
          <button onClick={openAddForm}>
            add yourself ↗
          </button>
        </footer>
      </main>
      <AnimatedDialog
        ref={formDialog}
        aria-labelledby="formTitle"
      >
        <form ref={addForm} className="sheet" onSubmit={addProfile} noValidate>
          {formError && (
            <div className="form-alert" role="alert" key={formErrorKey}>
              <span className="form-alert-star" aria-hidden="true">✦</span>
              <span>{formError}</span>
              <button type="button" onClick={dismissFormError} aria-label="Dismiss alert">×</button>
            </div>
          )}
          <div className="sheet-head">
            <div>
              <div className="tiny">join the wall</div>
              <h2 id="formTitle">add your little corner ♡</h2>
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
          <label>
            <span>
              profile photo <i>optional</i>
            </span>
            <input name="photo" type="file" accept="image/*" />
          </label>
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
          <button className="submit" type="submit">
            add me to the wall ✦
          </button>
          <p className="micro">
            This demo stores new cards only in this browser. Connect Supabase
            later for a shared live wall.
          </p>
        </form>
      </AnimatedDialog>
      <AnimatedDialog
        ref={detailDialog}
        aria-labelledby="detailName"
      >
        {activePerson && (
          <div className="sheet detail-sheet">
            <div className="sheet-head">
              <div>
                <div className="tiny">a little more about me</div>
                <h2 id="detailName">{activePerson.name}</h2>
              </div>
              <button
                className="close"
                type="button"
                onClick={closeDetail}
                aria-label="Close profile"
              >
                ×
              </button>
            </div>
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
            <p className="handle">@{activePerson.ig}</p>
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
            <section className="guestbook">
              <h3>leave a little note ♡</h3>
              <p className="note-help">
                A kind thought, an idea, or just a hello. Notes here are saved
                only in this browser and aren't sent to this person.
              </p>
              <ul className="message-list" aria-live="polite">
                {messages.length ? (
                  messages.map((note) => (
                    <li key={note.id}>
                      <strong>{note.author}</strong>
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
      <AnimatedDialog ref={photoDialog} className="photo-dialog" aria-labelledby="photoCaption">
        <div className="photo-lightbox">
          <button className="close photo-close" type="button" aria-label="Close photo" onClick={() => photoDialog.current.close()}>×</button>
          {activePhoto && <figure>
            <img src={activePhoto.src} alt={activePhoto.alt} />
            <figcaption id="photoCaption">{activePhoto.caption}</figcaption>
          </figure>}
        </div>
      </AnimatedDialog>
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
