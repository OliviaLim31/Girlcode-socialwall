import { useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const seed = [
  { name: "Olivia", ig: "olivia.lim31", about: "creative tech · skating · random side quests", tone: "rose" },
  { name: "Edwina", ig: "edwina.hon", about: "design, people, and pretty little details", tone: "olive" },
  { name: "Zhi Wei", ig: "zhiwei", about: "building weird ideas that somehow work", tone: "lilac" },
  { name: "Hana", ig: "hanatang", about: "soft visuals, fun concepts, good playlists", tone: "cream" },
  { name: "Taiba", ig: "taiba", about: "AI, making things, and iced drinks", tone: "blue" },
  { name: "Shin Ni", ig: "shinni", about: "quietly collecting cool internet things", tone: "olive" },
];
const seedProfiles = seed.map((profile, index) => ({ ...profile, id: `seed-${index}` }));
const initialProfiles = [seedProfiles[2], ...seedProfiles.filter((profile) => profile.id !== "seed-2")];
const tones = ["rose", "olive", "lilac", "cream", "blue"];
const frontendConfig = window.GIRLCODE_SUPABASE || {};
const supabaseUrl = String(frontendConfig.url || "").replace(/\/$/, "");
const publishableKey = String(frontendConfig.publishableKey || "");
const backendEnabled = Boolean(supabaseUrl && publishableKey);
const authClient = backendEnabled ? createClient(supabaseUrl, publishableKey) : null;

function readStoredArray(key) {
  const value = JSON.parse(localStorage.getItem(key) || "[]");
  if (!Array.isArray(value)) throw new Error("Invalid stored data");
  return value;
}
function initials(name = "") { return name.split(/\s+/).slice(0, 2).map((word) => word[0] || "").join("").toUpperCase(); }
function cleanIg(value = "") { return value.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, ""); }
function cleanLinkedIn(value = "") { return value.trim() && (!/^https?:\/\//.test(value.trim()) ? `https://${value.trim()}` : value.trim()); }
function safeLinkedIn(value = "") {
  try { const url = new URL(cleanLinkedIn(value)); return url.protocol === "https:" && (url.hostname === "linkedin.com" || url.hostname.endsWith(".linkedin.com")) && !url.username && !url.password ? url.href : ""; }
  catch { return ""; }
}
function compressImage(file, maxSize = 720, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onerror = reject;
    reader.onload = () => { const image = new Image(); image.onerror = reject; image.onload = () => { const scale = Math.min(1, maxSize / Math.max(image.width, image.height)); const canvas = document.createElement("canvas"); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale); canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL("image/jpeg", quality)); }; image.src = reader.result; };
    reader.readAsDataURL(file);
  });
}
async function createProfileOnBackend(person) {
  const { data: { session } } = await authClient.auth.getSession();
  if (!session?.access_token) throw new Error("Please sign in before adding a profile.");
  const response = await fetch(`${supabaseUrl}/functions/v1/profiles`, { method: "POST", headers: { apikey: publishableKey, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ name: person.name, instagram: person.ig, linkedin: person.linkedin || null, about: person.about || null, tone: person.tone }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Profile request failed (${response.status}).`);
  return result.data;
}

function App() {
  const formDialog = useRef(null), detailDialog = useRef(null), addForm = useRef(null);
  const [people, setPeople] = useState(() => { try { return [...initialProfiles, ...readStoredArray("girlcode-socialwall-people").filter((p) => p?.name && p?.ig).map((p, i) => ({ ...p, id: p.id || `legacy-${i}` }))]; } catch { return initialProfiles; } });
  const [activePerson, setActivePerson] = useState(null), [query, setQuery] = useState(""), [toast, setToast] = useState(""), [messages, setMessages] = useState([]), [messageError, setMessageError] = useState("");
  const notify = (message) => { setToast(message); window.clearTimeout(notify.timer); notify.timer = window.setTimeout(() => setToast(""), 1500); };
  const shownPeople = useMemo(() => people.filter((p) => `${p.name} ${p.ig} ${p.about || ""}`.toLowerCase().includes(query.toLowerCase().trim())), [people, query]);
  const openProfile = (person) => { setActivePerson(person); setMessageError(""); try { setMessages(readStoredArray("girlcode-socialwall-messages").filter((m) => m?.personId === person.id)); } catch { setMessages([]); setMessageError("Couldn't load saved notes. Please try again later."); } detailDialog.current.showModal(); };
  const closeDetail = () => detailDialog.current.close();
  const addProfile = async (event) => {
    event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return;
    const data = new FormData(form), file = data.get("photo"), person = { id: crypto.randomUUID(), name: data.get("name").trim(), ig: cleanIg(data.get("instagram")), linkedin: cleanLinkedIn(data.get("linkedin")), about: data.get("about").trim(), tone: data.get("tone") || "rose", photo: "" };
    if (!person.name || !/^[a-zA-Z0-9._]{1,30}$/.test(person.ig)) return notify("Please enter a name and a valid Instagram username.");
    if (person.linkedin && !safeLinkedIn(person.linkedin)) return notify("Please enter a valid HTTPS LinkedIn profile link.");
    try { if (file?.size) person.photo = await compressImage(file); if (backendEnabled) { const saved = await createProfileOnBackend(person); Object.assign(person, { id: saved.id, ig: saved.instagram, linkedin: saved.linkedin || "", about: saved.about || "", tone: saved.tone, photo: "" }); } else { const saved = readStoredArray("girlcode-socialwall-people"); saved.push(person); localStorage.setItem("girlcode-socialwall-people", JSON.stringify(saved)); } setPeople((current) => [...current, person]); setQuery(""); form.reset(); formDialog.current.close(); notify(`${person.name} is on the wall ✦`); setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 80); } catch (error) { notify(error.message || "Couldn't add the profile — try again"); }
  };
  const addMessage = (event) => { event.preventDefault(); const data = new FormData(event.currentTarget), author = data.get("author").trim(), message = data.get("message").trim(); if (!author || !message || !activePerson) return setMessageError("Please enter your name and a message."); try { const saved = readStoredArray("girlcode-socialwall-messages"), note = { id: crypto.randomUUID(), personId: activePerson.id, author, message, createdAt: new Date().toISOString() }; saved.push(note); localStorage.setItem("girlcode-socialwall-messages", JSON.stringify(saved)); setMessages((current) => [...current, note]); setMessageError(""); event.currentTarget.reset(); notify("Your note is saved in this browser ♡"); } catch { setMessageError("Couldn't save your note. Your text is still here; please try again."); } };
  const copyLink = async () => { try { await navigator.clipboard.writeText(location.href); notify("page link copied ♡"); } catch { notify("couldn't auto-copy — copy it from the address bar"); } };
  return <><div className="ambient ambient-a" /><div className="ambient ambient-b" /><main className="shell">
    <header className="browser"><div className="browser-left"><button className="chrome-btn" onClick={() => history.back()} aria-label="Back">‹</button><button className="chrome-btn" onClick={() => history.forward()} aria-label="Forward">›</button></div><div className="address"><button className="address-icon home" onClick={() => scrollTo({ top: 0, behavior: "smooth" })} aria-label="Home">⌂</button><span className="address-text">girlcode-socialwall</span><button className="address-icon refresh" onClick={() => location.reload()} aria-label="Refresh">↻</button></div><button className="plus" onClick={() => formDialog.current.showModal()} aria-label="Add yourself">＋</button></header>
    <section className="hero"><div className="eyebrow">girls' vibe coding · kl · 12.09.26</div><h1>we met <em>irl.</em><br />stay <span className="highlight-wrap"><span className="highlight">connected</span></span> <em>online.</em></h1><p className="sub">a tiny people wall for the girls in the room ♡</p><div className="hero-actions"><button className="primary" onClick={() => formDialog.current.showModal()}>+ add me</button><button className="ghost" onClick={copyLink}>copy page link</button></div></section>
    <section className="toolbar"><div><div className="tiny">who's here?</div><div className="count"><span>{shownPeople.length}</span> girls on the wall</div></div><div className="filter-wrap"><input id="search" value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="find someone..." autoComplete="off" /></div></section>
    <section className="wall" aria-live="polite">{shownPeople.map((person) => <article className={`person-card ${tones.includes(person.tone) ? person.tone : "rose"}`} key={person.id}><div className="sticker star">✦</div><div className="portrait-wrap"><div className="portrait" style={person.photo ? { backgroundImage: `url(${person.photo})` } : {}}>{person.photo ? "" : initials(person.name)}</div></div><div className="person-copy"><div className="name-row"><h3>{person.name}</h3><span className="dot">●</span></div><span className="handle">@{person.ig}</span><p className="about">{person.about || "say hi if you see me around ♡"}</p><div className="links"><span className="social-summary">{safeLinkedIn(person.linkedin) ? "instagram · linkedin" : "instagram"}</span></div><button className="card-open" onClick={() => openProfile(person)}>view profile & leave a note ↗</button></div></article>)}</section>
    <footer><span>made for one room, one afternoon, and a lot of new mutuals ✦</span><button onClick={() => formDialog.current.showModal()}>add yourself ↗</button></footer>
  </main>
  <dialog ref={formDialog} onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}><form ref={addForm} className="sheet" onSubmit={addProfile}><div className="sheet-head"><div><div className="tiny">join the wall</div><h2>add your little corner ♡</h2></div><button className="close" type="button" onClick={() => formDialog.current.close()} aria-label="Close">×</button></div><label><span>name</span><input name="name" required maxLength="40" placeholder="Olivia" /></label><label><span>instagram username</span><div className="input-prefix"><b>@</b><input name="instagram" required maxLength="60" placeholder="olivia.lim31" /></div></label><label><span>linkedin <i>optional</i></span><input name="linkedin" placeholder="linkedin.com/in/yourname" /></label><label><span>come talk to me about...</span><input name="about" maxLength="90" placeholder="creative tech, skating, random side quests" /></label><label><span>profile photo <i>optional</i></span><input name="photo" type="file" accept="image/*" /></label><fieldset><legend>pick a card vibe</legend><div className="swatches">{tones.map((tone, index) => <label key={tone}><input type="radio" name="tone" value={tone} defaultChecked={index === 0} /><span className={`swatch ${tone}`} /></label>)}</div></fieldset><button className="submit" type="submit">add me to the wall ✦</button><p className="micro">This demo stores new cards only in this browser. Connect Supabase later for a shared live wall.</p></form></dialog>
  <dialog ref={detailDialog} onClick={(e) => e.target === e.currentTarget && closeDetail()} aria-labelledby="detailName">{activePerson && <div className="sheet detail-sheet"><div className="sheet-head"><div><div className="tiny">a little more about me</div><h2 id="detailName">{activePerson.name}</h2></div><button className="close" type="button" onClick={closeDetail} aria-label="Close profile">×</button></div><div className="detail-portrait portrait" style={activePerson.photo ? { backgroundImage: `url(${activePerson.photo})` } : {}}>{activePerson.photo ? "" : initials(activePerson.name)}</div><p className="handle">@{activePerson.ig}</p><p className="detail-about">{activePerson.about || "say hi if you see me around ♡"}</p><div className="links"><a className="pill" href={`https://instagram.com/${encodeURIComponent(activePerson.ig)}`} target="_blank" rel="noreferrer">instagram ↗</a>{safeLinkedIn(activePerson.linkedin) ? <a className="pill" href={safeLinkedIn(activePerson.linkedin)} target="_blank" rel="noreferrer">linkedin ↗</a> : <span className="pill unavailable">linkedin · not provided</span>}</div><section className="guestbook"><h3>leave a little note ♡</h3><p className="note-help">A kind thought, an idea, or just a hello. Notes here are saved only in this browser and aren't sent to this person.</p><ul className="message-list" aria-live="polite">{messages.length ? messages.map((note) => <li key={note.id}><strong>{note.author}</strong><p>{note.message}</p></li>) : <li className="empty-notes">No notes yet. Be the first to say hi ♡</li>}</ul><form onSubmit={addMessage}><label><span>your name</span><input name="author" required maxLength="40" placeholder="Your name" autoComplete="name" /></label><label><span>your message</span><textarea name="message" required maxLength="1000" rows="3" placeholder="So lovely meeting you…" /></label><p className="form-error" role="alert">{messageError}</p><button className="submit" type="submit">leave a note ✦</button></form></section></div>}</dialog>
  <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>
  </>;
}
export default App;
