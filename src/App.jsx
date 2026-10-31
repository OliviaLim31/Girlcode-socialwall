import { useMemo, useRef, useState, useEffect, useLayoutEffect } from "react";
import { flushSync } from "react-dom";
import { createClient } from "@supabase/supabase-js";
import TextLoop from "./TextLoop";
import AnimatedDialog from "./AnimatedDialog";
import EventGallery, { defaultMemories } from "./EventGallery";
import AddMemoryModal from "./AddMemoryModal";
import Lightbox from "./Lightbox";
import Avatar, { AVATAR_STYLES, SKIN_TONES } from "./Avatar";

const seed = [
  {
    name: "Olivia",
    ig: "olivia.lim31",
    about: "creative tech · skating · random side quests",
    tone: "rose",
    linkedin: "https://www.linkedin.com/in/olivialimyunxuan/",
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
  avatarStyle: AVATAR_STYLES[index % AVATAR_STYLES.length].id,
  skinTone: SKIN_TONES[index % SKIN_TONES.length].id,
}));

const initialProfiles = [
  seedProfiles[2],
  ...seedProfiles.filter((profile) => profile.id !== "seed-2"),
];

const tones = ["rose", "olive", "lilac", "cream", "blue"];
const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").replace(
  /\/$/,
  "",
);
const publishableKey = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
);
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

function cleanIg(value = "") {
  return value
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/\/.*$/, "");
}

// the form starts with this prefilled, so a bare prefix means "no LinkedIn"
const LINKEDIN_PREFIX = "linkedin.com/in/";

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
      avatar_style: person.avatarStyle,
      skin_tone: person.skinTone,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      result.error || `Profile request failed (${response.status}).`,
    );
  return result.data;
}

function profileFromRow(row) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    ig: row.instagram,
    linkedin: row.linkedin || "",
    about: row.about || "",
    tone: row.tone || "rose",
    org: row.org || "",
    stickers: Array.isArray(row.stickers) ? row.stickers : [],
    avatarStyle: row.avatar_style || "star-bob",
    skinTone: row.skin_tone || "fair",
    photo: row.photo_url || "",
    song: row.song_title
      ? {
          title: row.song_title,
          artist: row.song_artist || "",
          raw: [row.song_title, row.song_artist].filter(Boolean).join(" "),
        }
      : null,
    deletedAt: row.deleted_at,
  };
}

async function insertProfileRow(person, ownerId) {
  const { data, error } = await authClient
    .from("profiles")
    .insert({
      owner_id: ownerId,
      name: person.name,
      instagram: person.ig,
      linkedin: person.linkedin || null,
      about: person.about || null,
      org: person.org || null,
      tone: person.tone,
      avatar_style: person.avatarStyle,
      skin_tone: person.skinTone,
      song_title: person.song?.title || null,
      song_artist: person.song?.artist || null,
      stickers: person.stickers || [],
    })
    .select(
      "id, owner_id, name, instagram, linkedin, about, org, tone, avatar_style, skin_tone, photo_url, song_title, song_artist, stickers, deleted_at, created_at",
    )
    .single();
  if (error) throw error;
  return profileFromRow(data);
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

// splits text into words of per-letter spans for the rolling title animation
function Letters({ text, start = 0 }) {
  let n = start;
  return text.split(" ").map((word, w) => (
    <span className="word" key={w}>
      {[...word].map((ch, i) => (
        <span className="letter" key={i} style={{ "--i": n++ }}>
          {ch}
        </span>
      ))}{" "}
    </span>
  ));
}

 // stickers beside the hero photos; drag to move, positions are kept in this browser
const STICKER_SET = [
  { id: "wand", src: "/stickers/wand.png", x: 0, y: -22, rot: -10 },
  { id: "laptop-girl", src: "/stickers/laptop-girl.png", x: 98, y: 4, rot: 6 },
  { id: "cat-heart", src: "/stickers/cat-heart.png", x: -1, y: 79, rot: 5 },
  { id: "headphones", src: "/stickers/headphones.png", x: 30, y: 112, rot: -6 },
  { id: "envelope", src: "/stickers/envelope.png", x: 98, y: 110, rot: 8 },
  { id: "sleepy-girl", src: "/stickers/sleepy-girl.png", x: 76, y: 59, rot: -4 },
];
const STICKER_KEY = "girlcode-sticker-positions";

// shared drag-and-drop board for stickers; editable boards commit their positions on drop
function StickerBoard({ items, editable = false, onCommit, className }) {
  const [pos, setPos] = useState(() => Object.fromEntries(items.map((s) => [s.id, { x: s.x, y: s.y }])));
  const [order, setOrder] = useState(() => items.map((s) => s.id));
  const [dragId, setDragId] = useState(null);
  const drag = useRef(null);
  const posRef = useRef(pos);
  const setAll = (next) => {
    posRef.current = next;
    setPos(next);
  };

  const onDown = (e, item) => {
    const box = e.currentTarget.parentElement.getBoundingClientRect();
    const start = posRef.current[item.id];
    drag.current = { id: item.id, sx: e.clientX, sy: e.clientY, x: start.x, y: start.y, w: box.width, h: box.height };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragId(item.id);
    setOrder((o) => [...o.filter((id) => id !== item.id), item.id]);
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const x = Math.min(100, Math.max(-2, d.x + ((e.clientX - d.sx) / d.w) * 100));
    const y = Math.min(100, Math.max(-2, d.y + ((e.clientY - d.sy) / d.h) * 100));
    setAll({ ...posRef.current, [d.id]: { x, y } });
  };
  const onUp = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragId(null);
    onCommit?.(items.map((s) => ({ id: s.id, x: posRef.current[s.id].x, y: posRef.current[s.id].y, rot: s.rot })));
  };

  return (
    <div className={className}>
      {items.map((item) => (
        <img
          key={item.id}
          src={item.src}
          alt=""
          draggable={false}
          className={`sticker${dragId === item.id ? " dragging" : ""}${editable ? "" : " static"}`}
          style={{
            left: `${pos[item.id].x}%`,
            top: `${pos[item.id].y}%`,
            zIndex: order.indexOf(item.id) + 3,
            "--rot": `${item.rot}deg`,
            pointerEvents: editable ? "auto" : "none",
          }}
          onPointerDown={editable ? (e) => onDown(e, item) : undefined}
          onPointerMove={editable ? onMove : undefined}
          onPointerUp={editable ? onUp : undefined}
          onPointerCancel={editable ? onUp : undefined}
        />
      ))}
    </div>
  );
}

// hero stickers beside the photos; positions are kept in this browser
function StickerLayer() {
  const [items] = useState(() => {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(STICKER_KEY)) || {};
    } catch {
      saved = {};
    }
    return STICKER_SET.map((s) => ({ ...s, ...saved[s.id] }));
  });
  const commit = (list) =>
    localStorage.setItem(
      STICKER_KEY,
      JSON.stringify(Object.fromEntries(list.map((s) => [s.id, { x: s.x, y: s.y }]))),
    );
  return <StickerBoard className="sticker-layer" items={items} editable onCommit={commit} />;
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
      <circle cx="12" cy="12" r="4.1" />
      <circle className="dot" cx="17.7" cy="6.6" r="1.1" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="li">
      <path d="M5.2 8.6H2.4V21h2.8V8.6ZM3.8 7.3a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4ZM21.6 13.9c0-3.7-2-5.5-4.7-5.5a4.1 4.1 0 0 0-3.7 2v-1.8H10.4V21h2.8v-6.1c0-1.6.3-3.2 2.4-3.2 2 0 2.1 1.9 2.1 3.3V21h2.8l1.1-7.1Z" />
    </svg>
  );
}

function SocialLinks({ className }) {
  return (
    <nav className={`social-links ${className}`} aria-label="Our socials">
      <a
        href="https://www.linkedin.com/company/girlcode-kl"
        target="_blank"
        rel="noreferrer"
        aria-label="GirlCode on LinkedIn"
        title="LinkedIn"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5.2 8.6H2.4V21h2.8V8.6ZM3.8 7.3a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4ZM21.6 13.9c0-3.7-2-5.5-4.7-5.5a4.1 4.1 0 0 0-3.7 2v-1.8H10.4V21h2.8v-6.1c0-1.6.3-3.2 2.4-3.2 2 0 2.1 1.9 2.1 3.3V21h2.8l1.1-7.1Z" />
        </svg>
      </a>
      <a
        href="https://www.instagram.com/girlcode.my/"
        target="_blank"
        rel="noreferrer"
        aria-label="GirlCode on Instagram"
        title="Instagram"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
          <circle cx="12" cy="12" r="4.1" />
          <circle className="social-icon-fill" cx="17.7" cy="6.6" r="1.1" />
        </svg>
      </a>
      <a
        href="https://chat.whatsapp.com/FAGxBm4MvDYHg3xnuwvptv"
        target="_blank"
        rel="noreferrer"
        aria-label="Join GirlCode on WhatsApp"
        title="WhatsApp"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.2 11.7a8.1 8.1 0 0 1-12 7.1L3 20l1.3-5A8.1 8.1 0 1 1 20.2 11.7Z" />
          <path d="M8.2 7.7c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.8 1.9c.1.3.1.5-.1.7l-.6.7c-.2.2-.2.4 0 .7.6 1 1.4 1.8 2.5 2.4.3.2.5.2.7-.1l.8-.9c.2-.2.4-.3.7-.2l1.8.9c.3.1.4.3.4.5 0 .3-.2 1.4-.9 1.9-.5.5-1.2.7-2 .6-1.1-.1-2.5-.7-4.1-2.1-1.8-1.6-2.8-3.5-2.9-4.7-.1-1 .4-1.8 1.1-2.2Z" />
        </svg>
      </a>
    </nav>
  );
}

function App() {
  const authDialog = useRef(null);
  const formDialog = useRef(null);
  const detailDialog = useRef(null);
  const photoDialog = useRef(null);
  const memoryDialog = useRef(null);
  const addForm = useRef(null);

  // Tab State: 'wall' | 'gallery'
  const [activeTab, setActiveTab] = useState("wall");
  // the sliding highlight behind the active tab pill
  const tabRefs = { wall: useRef(null), gallery: useRef(null) };
  const [pill, setPill] = useState({ x: 0, w: 0 });
  useLayoutEffect(() => {
    const measure = () => {
      const el = tabRefs[activeTab].current;
      if (el) setPill({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    // re-measure once the font has loaded or a tab changes size, the pill would otherwise keep a stale width
    const observer = new ResizeObserver(measure);
    Object.values(tabRefs).forEach((ref) => ref.current && observer.observe(ref.current));
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [activeTab]);

  // cross-fades the whole page when switching tabs, falls back to an instant swap
  const switchTab = (tab) => {
    if (tab === activeTab) return;
    const swap = () => {
      flushSync(() => setActiveTab(tab));
      setQuery("");
    };
    if (document.startViewTransition) document.startViewTransition(swap);
    else swap();
  };

  // People State
  const [people, setPeople] = useState(() => {
    try {
      const stored = backendEnabled
        ? []
        : readStoredArray("girlcode-socialwall-people");
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
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!backendEnabled);
  const [profilesLoading, setProfilesLoading] = useState(backendEnabled);
  const [profileLoadError, setProfileLoadError] = useState("");
  const [ownedProfile, setOwnedProfile] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authSuccessEmail, setAuthSuccessEmail] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [messages, setMessages] = useState(() =>
    readStoredArray("girlcode-socialwall-messages"),
  );
  const [messageError, setMessageError] = useState("");
  const [formError, setFormError] = useState("");
  const [formErrorKey, setFormErrorKey] = useState(0);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarName, setAvatarName] = useState("");
  const [avatarTone, setAvatarTone] = useState("rose");
  const [avatarStyle, setAvatarStyle] = useState("star-bob");
  const [avatarSkinTone, setAvatarSkinTone] = useState("fair");
  const [cardStickers, setCardStickers] = useState([]);

  const toggleCardSticker = (id) =>
    setCardStickers((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : current.length < 2
          ? [...current, id]
          : current,
    );

  // saves a dragged card sticker; only the owner can change their own card when the backend is on
  const saveCardStickers = async (personId, list) => {
    const apply = (p) => (p.id === personId ? { ...p, stickers: list } : p);
    setPeople((current) => current.map(apply));
    setOwnedProfile((current) => (current ? apply(current) : current));
    if (!backendEnabled) {
      const key = "girlcode-socialwall-people";
      localStorage.setItem(key, JSON.stringify(readStoredArray(key).map(apply)));
      return;
    }
    const { error } = await authClient
      .from("profiles")
      .update({ stickers: list })
      .eq("id", personId)
      .eq("owner_id", session?.user?.id);
    if (error) notify("couldn't save your sticker spot, try again");
  };

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

  const openSignIn = (notice = "") => {
    setAuthError("");
    setAuthNotice(notice);
    setAuthSuccessEmail("");
    authDialog.current?.showModal();
  };

  const openAddForm = () => {
    if (backendEnabled && !authReady) {
      notify("checking your sign-in status…");
      return;
    }
    if (backendEnabled && !session) {
      openSignIn("Sign in with your email before adding a profile.");
      return;
    }
    if (backendEnabled && profilesLoading) {
      notify("loading profiles…");
      return;
    }
    if (backendEnabled && ownedProfile) {
      if (ownedProfile.deletedAt) {
        notify("your profile is archived; please contact the wall admin.");
        return;
      }
      setActivePerson(ownedProfile);
      detailDialog.current.showModal();
      notify("you already have a profile card ♡");
      return;
    }
    dismissFormError();
    setAvatarPreview("");
    setAvatarName("");
    setAvatarTone("rose");
    setAvatarStyle("star-bob");
    setAvatarSkinTone("fair");
    setCardStickers([]);
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

  useEffect(() => {
    if (!authClient) {
      setAuthReady(true);
      return undefined;
    }

    let active = true;
    const {
      data: { subscription },
    } = authClient.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
      if (event === "SIGNED_IN") {
        setAuthError("");
        setAuthNotice("");
        authDialog.current?.close();
      }
    });

    authClient.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setAuthError(error.message);
        setSession(data.session);
        setAuthReady(true);
      })
      .catch((error) => {
        if (!active) return;
        setAuthError(
          error instanceof Error
            ? error.message
            : "We couldn't check your sign-in status.",
        );
        setAuthReady(true);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!backendEnabled || !authReady) return undefined;

    let active = true;
    const loadProfiles = async () => {
      setProfilesLoading(true);
      setProfileLoadError("");
      try {
        const { data, error } = await authClient
          .from("profiles")
          .select(
            "id, owner_id, name, instagram, linkedin, about, org, tone, avatar_style, skin_tone, photo_url, song_title, song_artist, stickers, deleted_at, created_at",
          )
          .order("created_at", { ascending: true });
        if (error) throw error;
        if (!active) return;

        const rows = data || [];
        const ownRow = rows.find(
          (row) => row.owner_id === session?.user?.id,
        );
        setOwnedProfile(ownRow ? profileFromRow(ownRow) : null);
        setPeople([
          ...initialProfiles,
          ...rows
            .filter((row) => !row.deleted_at)
            .map(profileFromRow),
        ]);
      } catch (error) {
        if (!active) return;
        const detail =
          error instanceof Error
            ? error.message
            : typeof error?.message === "string"
              ? error.message
              : "";
        setProfileLoadError(
          detail
            ? `Could not load shared profiles: ${detail}`
            : "Could not load shared profiles. Please check the Supabase API settings.",
        );
      } finally {
        if (active) setProfilesLoading(false);
      }
    };

    loadProfiles();
    return () => {
      active = false;
    };
  }, [authReady, session?.user?.id]);

  const sendSignInLink = async (event) => {
    event.preventDefault();
    if (!authClient) {
      setAuthError("Email sign-in isn't configured for this site yet.");
      return;
    }

    const email = authEmail.trim();
    if (!email) {
      setAuthError("Please enter your email address.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    setAuthNotice("");
    try {
      const { error } = await authClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      setAuthSuccessEmail(email);
      setAuthNotice("");
      notify("Sign-in link sent to your email ♡");
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "We couldn't send the sign-in link. Please try again.",
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    if (!authClient) return;
    try {
      const { error } = await authClient.auth.signOut();
      if (error) throw error;
      notify("you've signed out ♡");
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "We couldn't sign you out. Please try again.",
      );
      authDialog.current?.showModal();
    }
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
        linkedin:
          String(data.get("linkedin")).trim() === LINKEDIN_PREFIX
            ? ""
            : cleanLinkedIn(data.get("linkedin")),
        about: data.get("about").trim(),
        org: data.get("org").trim(),
        tone: data.get("tone") || "rose",
        avatarStyle: data.get("avatarStyle") || "star-bob",
        skinTone: data.get("skinTone") || "fair",
        song,
        stickers: cardStickers.map((id, i) => ({ id, x: i ? 14 : 82, y: i ? 66 : 12, rot: i ? -8 : 8 })),
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
    if (backendEnabled && file?.size)
      return showFormError(
        "Shared photo uploads aren't ready yet. Please add your photo after that feature is connected.",
      );
    try {
      let savedPerson = person;
      if (backendEnabled) {
        if (!session?.user?.id)
          throw new Error("Please sign in before adding a profile.");
        savedPerson = await insertProfileRow(person, session.user.id);
        setOwnedProfile(savedPerson);
      } else {
        if (file?.size) person.photo = await compressImage(file);
        const saved = readStoredArray("girlcode-socialwall-people");
        saved.push(person);
        localStorage.setItem(
          "girlcode-socialwall-people",
          JSON.stringify(saved),
        );
      }
      setPeople((current) => [...current, savedPerson]);
      setQuery("");
      setAvatarPreview("");
      setAvatarName("");
      setAvatarTone("rose");
      setAvatarStyle("star-bob");
      setAvatarSkinTone("fair");
      setCardStickers([]);
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
            <span
              className="nav-tab-indicator"
              aria-hidden="true"
              style={{ transform: `translateX(${pill.x}px)`, width: pill.w }}
            />
            <button
              type="button"
              ref={tabRefs.wall}
              className={`nav-tab-pill ${activeTab === "wall" ? "active" : ""}`}
              onClick={() => switchTab("wall")}
            >
              ✦ Social Wall
            </button>
            <button
              type="button"
              ref={tabRefs.gallery}
              className={`nav-tab-pill ${activeTab === "gallery" ? "active" : ""}`}
              onClick={() => switchTab("gallery")}
            >
              Event Gallery
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
          {backendEnabled && (
            <button
              className={`nav-add nav-auth${session ? " is-signed-in" : ""}`}
              type="button"
              onClick={session ? signOut : () => openSignIn()}
              disabled={!authReady}
              aria-label={
                session
                  ? "Signed in. Click to sign out."
                  : "Sign in"
              }
              title={session ? "Click to sign out" : undefined}
            >
              {!authReady ? "checking…" : session ? "signed in" : "sign in"}
            </button>
          )}
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
                  <h1 aria-label="we met irl. stay connected online.">
                    <span aria-hidden="true">
                      <Letters text="we met" />
                      <em><Letters text="irl." start={6} /></em>
                    <br />
                      <Letters text="stay" start={10} />
                    <span className="highlight-wrap">
                        <span className="highlight"><Letters text="connected" start={14} /></span>
                        <span className="sparkle sparkle-1" aria-hidden="true">✦</span>
                        <span className="sparkle sparkle-2" aria-hidden="true">✦</span>
                        <span className="sparkle sparkle-3" aria-hidden="true">✦</span>
                    </span>{" "}
                      <em><Letters text="online." start={23} /></em>
                    </span>
                  </h1>
                  <p className="sub">
                    a tiny people wall for the girls in the room ♡
                  </p>
                  <div className="hero-social-follow">
                    <span>Follow us!</span>
                    <SocialLinks className="hero-socials" />
                  </div>
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
                <StickerLayer />
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
                ribbonColor="#A83AC2ff"
                ribbonWidth={66}
              />
              <div className="hero-actions">
                <button
                  className="ghost"
                  onClick={() => {
                    setActiveTab("gallery");
                    scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Event Gallery
                </button>
              </div>
            </section>

            <section className="about-us" aria-labelledby="aboutUsTitle">
              <div className="about-us-copy">
                <div className="tiny">who are we?</div>
                <h2 id="aboutUsTitle">
                  <Letters text="a girls-only tech community" />
                </h2>
                <p>
                  a <span className="hl">comfortable space</span> to learn tech with
                  other girls. meet girls who are building too, make{" "}
                  <span className="hl">new friends</span>, find{" "}
                  <span className="hl">teammates</span> and learn together. we keep our
                  meetups <span className="hl">small</span> so everyone gets heard, with
                  guidance from <span className="hl">malaysian women in tech</span>.
                </p>
              </div>
              <img
                className="about-us-art"
                src="/stickers/about-laptop-girl.png"
                alt="hand-drawn girl coding on her laptop with a coffee"
              />
            </section>

            <section className="toolbar">
              <div className="wall-heading">
                <div>
                  <div className="tiny">who's here?</div>
                  <div className="count">
                    <span>{shownPeople.length}</span> girls on the wall
                  </div>
                </div>
                <button className="primary wall-add-button" onClick={openAddForm}>
                  + Add Me
                </button>
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
                      <div className="portrait-wrap">
                        <Avatar
                          className="portrait"
                          name={person.name}
                          tone={person.tone}
                          avatarStyle={person.avatarStyle}
                          skinTone={person.skinTone}
                          photo={person.photo}
                        />
                      </div>
                      <div className="id-card-copy">
                        <span className="id-card-org">{person.org || "girlcode member"}</span>
                        <h3 className="id-card-name-title">{person.name}</h3>
                        <span className="id-card-rule" aria-hidden="true" />
                        <div className="id-card-actions">
                          <button
                            className="card-open"
                            onClick={() => openProfile(person)}
                          >
                            view profile ↗
                          </button>
                          {personNotes.length > 0 && (
                            <span className="note-count-pill">
                              {personNotes.length} notes
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="id-card-socials">
                        <a
                          href={`https://instagram.com/${encodeURIComponent(person.ig)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <InstagramIcon />
                          <span>@{person.ig}</span>
                        </a>
                        {safeLinkedIn(person.linkedin) && (
                          <a
                            href={safeLinkedIn(person.linkedin)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <LinkedInIcon />
                            <span>linkedin</span>
                          </a>
                        )}
                      </div>
                      {person.stickers?.length > 0 && (
                        <StickerBoard
                          key={JSON.stringify(person.stickers)}
                          className="card-sticker-layer"
                          items={person.stickers
                            .map((st) => ({ ...st, src: STICKER_SET.find((t) => t.id === st.id)?.src }))
                            .filter((st) => st.src)}
                          editable={!backendEnabled || ownedProfile?.id === person.id}
                          onCommit={(list) => saveCardStickers(person.id, list)}
                        />
                      )}
                    </article>
                  );
                })}
              </section>
            )}

            {profileLoadError && (
              <p className="profile-load-error" role="alert">
                {profileLoadError} The sample cards are still shown; shared
                profiles may be missing until the API is enabled.
              </p>
            )}

            <section
              className="music-gallery"
              aria-labelledby="musicGalleryTitle"
            >
              <div className="music-gallery-head">
                <div>
                  <div className="tiny">our soundtrack</div>
                  <h2 id="musicGalleryTitle"><Letters text="on repeat" /></h2>
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
                <div className="music-empty">
                  <span className="vinyl" aria-hidden="true">
                    <i />
                  </span>
                  <p>The first song recommendation will appear here</p>
                </div>
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
          <SocialLinks className="footer-socials" />
          <button
            onClick={activeTab === "wall" ? openAddForm : openAddMemory}
          >
            {activeTab === "wall" ? "add yourself ↗" : "share memory ↗"}
          </button>
        </footer>
      </main>

      {/* Email Sign-In Modal */}
      <AnimatedDialog
        ref={authDialog}
        aria-labelledby="authTitle"
        onClose={() => setAuthSuccessEmail("")}
      >
        {authSuccessEmail ? (
          <div className="sheet auth-success-sheet">
            <div className="sheet-head">
              <div className="sheet-head-left">
                <img
                  src="/logo.png"
                  alt="Girl Code logo"
                  className="sheet-dialog-logo"
                />
                <div>
                  <div className="tiny">check your inbox</div>
                  <h2 id="authTitle">magic link sent ♡</h2>
                </div>
              </div>
              <button
                className="close"
                type="button"
                onClick={() => {
                  authDialog.current?.close();
                  setAuthSuccessEmail("");
                }}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            <div className="auth-success-body">
              <div className="auth-success-badge" aria-hidden="true">
                <span className="auth-success-badge-icon"></span>
              </div>
              <p className="auth-success-desc">
                We sent a one-time sign-in link to:
              </p>
              <div className="auth-success-email">
                <span>{authSuccessEmail}</span>
              </div>
              <p className="auth-success-tip">
                Click the link in your email to sign in directly on this device. If you don’t see it in a moment, remember to check your spam folder!
              </p>
              <div className="auth-success-actions">
                <button
                  type="button"
                  className="submit auth-success-done"
                  onClick={() => {
                    authDialog.current?.close();
                    setAuthSuccessEmail("");
                  }}
                >
                  got it ✦
                </button>
                <button
                  type="button"
                  className="auth-retry-btn"
                  onClick={() => setAuthSuccessEmail("")}
                >
                  ← use another email
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form className="sheet" onSubmit={sendSignInLink}>
            <div className="sheet-head">
              <div className="sheet-head-left">
                <img
                  src="/logo.png"
                  alt="Girl Code logo"
                  className="sheet-dialog-logo"
                />
                <div>
                  <div className="tiny">welcome to the wall</div>
                  <h2 id="authTitle">sign in ♡</h2>
                </div>
              </div>
              <button
                className="close"
                type="button"
                onClick={() => authDialog.current?.close()}
                aria-label="Close sign-in dialog"
              >
                ×
              </button>
            </div>
            <p className="auth-help">
              Enter your email and we’ll send you a one-time sign-in link. No
              password needed.
            </p>
            <label>
              <span>email address</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
            {authNotice && (
              <p className="auth-notice" role="status">
                {authNotice}
              </p>
            )}
            {authError && (
              <p className="form-error" role="alert">
                {authError}
              </p>
            )}
            <button className="submit" type="submit" disabled={authLoading}>
              {authLoading ? "sending link…" : "email me a sign-in link"}
            </button>
          </form>
        )}
      </AnimatedDialog>

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
            <input
              name="name"
              required
              maxLength="40"
              placeholder="Olivia"
              value={avatarName}
              onChange={(event) => setAvatarName(event.target.value)}
            />
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
            <input
              name="linkedin"
              defaultValue={LINKEDIN_PREFIX}
              onFocus={(e) => {
                const input = e.target;
                if (input.value === LINKEDIN_PREFIX)
                  requestAnimationFrame(() =>
                    input.setSelectionRange(input.value.length, input.value.length),
                  );
              }}
            />
          </label>
          <label>
            <span>
              education / company <i>optional</i>
            </span>
            <input
              name="org"
              maxLength="60"
              placeholder="e.g. Sunway University or Grab"
            />
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
          <fieldset>
            <legend>pick a card vibe</legend>
            <div className="swatches">
              {tones.map((tone) => (
                <label key={tone}>
                  <input
                    type="radio"
                    name="tone"
                    value={tone}
                    checked={avatarTone === tone}
                    onChange={() => setAvatarTone(tone)}
                  />
                  <span className={`swatch ${tone}`} />
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="avatar-picker">
            <legend>choose your Girl Code avatar</legend>
            <div className="avatar-picker-grid">
              {AVATAR_STYLES.map((style) => (
                <label
                  className={`avatar-option${avatarStyle === style.id ? " selected" : ""}`}
                  key={style.id}
                >
                  <input
                    type="radio"
                    name="avatarStyle"
                    value={style.id}
                    checked={avatarStyle === style.id}
                    onChange={() => setAvatarStyle(style.id)}
                  />
                  <Avatar
                    className="avatar-option-image"
                    tone={avatarTone}
                    avatarStyle={style.id}
                    skinTone={avatarSkinTone}
                  />
                  <span>{style.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="skin-tone-picker">
            <legend>choose your skin tone</legend>
            <div className="skin-tone-options">
              {SKIN_TONES.map((skin) => (
                <label
                  className={`skin-tone-option${avatarSkinTone === skin.id ? " selected" : ""}`}
                  key={skin.id}
                >
                  <input
                    type="radio"
                    name="skinTone"
                    value={skin.id}
                    checked={avatarSkinTone === skin.id}
                    onChange={() => setAvatarSkinTone(skin.id)}
                  />
                  <Avatar
                    className="skin-tone-preview"
                    tone={avatarTone}
                    avatarStyle={avatarStyle}
                    skinTone={skin.id}
                  />
                  <span>{skin.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="card-sticker-picker">
            <legend>pick up to 2 stickers for your card</legend>
            <div className="card-sticker-options">
              {STICKER_SET.map((sticker) => {
                const picked = cardStickers.includes(sticker.id);
                return (
                  <button
                    type="button"
                    key={sticker.id}
                    className={`card-sticker-option${picked ? " selected" : ""}`}
                    aria-pressed={picked}
                    disabled={!picked && cardStickers.length >= 2}
                    onClick={() => toggleCardSticker(sticker.id)}
                  >
                    <img src={sticker.src} alt={sticker.id.replace(/-/g, " ")} draggable={false} />
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="avatar-upload-field">
            <span className="avatar-label">
              use your own photo <i>optional</i>
            </span>
            <div className="avatar-upload-row">
              <Avatar
                className="avatar-live-preview"
                name={avatarName || "Your name"}
                tone={avatarTone}
                avatarStyle={avatarStyle}
                skinTone={avatarSkinTone}
                photo={avatarPreview}
              />
              <div className="avatar-upload-actions">
                <input
                  name="photo"
                  type="file"
                  id="profile-avatar-input"
                  accept="image/*"
                  className="visually-hidden-file"
                  onChange={handleAvatarChange}
                  disabled={backendEnabled}
                />
                <div className="avatar-btns-group">
                  <label
                    htmlFor="profile-avatar-input"
                    className={`avatar-pick-btn${backendEnabled ? " is-disabled" : ""}`}
                  >
                    {backendEnabled
                      ? "shared photo upload coming soon"
                      : avatarPreview
                        ? "change photo"
                        : "choose photo"}
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
                <small className="avatar-note">
                  {backendEnabled
                    ? "You can add a shared profile photo in a later step."
                    : "looks best in square crop ♡"}
                </small>
              </div>
            </div>
          </div>
          <p className="privacy-note">
            Your profile details and song will be visible to people who visit
            this wall. Please do not include private information.
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
              <Avatar
                className="detail-portrait portrait"
                name={activePerson.name}
                tone={activePerson.tone}
                avatarStyle={activePerson.avatarStyle}
                skinTone={activePerson.skinTone}
                photo={activePerson.photo}
              />
              <div className="detail-copy">
                <span className="detail-field-label">NAME</span>
                <h2 id="detailName">{activePerson.name}</h2>
                <p className="detail-handle">@{activePerson.ig}</p>
                <p className="detail-about">
                  {activePerson.about || "say hi if you see me around ♡"}
                </p>
                {activePerson.song?.title && (
                  <a
                    className="detail-song"
                    href={spotifySearchUrl(activePerson.song)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Search Spotify for ${activePerson.song.title}${activePerson.song.artist ? ` by ${activePerson.song.artist}` : ""}`}
                  >
                    <span className="detail-song-icon" aria-hidden="true"></span>
                    <span className="detail-song-copy">
                      <span className="detail-song-label">ON REPEAT</span>
                      <strong>{activePerson.song.title}</strong>
                      {activePerson.song.artist && (
                        <small>{activePerson.song.artist}</small>
                      )}
                    </span>
                    <span className="detail-song-link" aria-hidden="true">↗</span>
                  </a>
                )}
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
