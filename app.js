const seed = [
  {name:"Olivia", ig:"olivia.lim31", about:"creative tech · skating · random side quests", tone:"rose"},
  {name:"Edwina", ig:"edwina.hon", about:"design, people, and pretty little details", tone:"olive"},
  {name:"Zhi Wei", ig:"zhiwei", about:"building weird ideas that somehow work", tone:"lilac"},
  {name:"Hana", ig:"hanatang", about:"soft visuals, fun concepts, good playlists", tone:"cream"},
  {name:"Taiba", ig:"taiba", about:"AI, making things, and iced drinks", tone:"blue"},
  {name:"Shin Ni", ig:"shinni", about:"quietly collecting cool internet things", tone:"olive"},
];

const wall = document.querySelector("#wall");
const tpl = document.querySelector("#cardTemplate");
const count = document.querySelector("#count");
const dialog = document.querySelector("#profileDialog");
const form = document.querySelector("#profileForm");
const search = document.querySelector("#search");
const toast = document.querySelector("#toast");
const openers = ["#openForm", "#openFormFooter", "#openFormNav"].map(sel => document.querySelector(sel)).filter(Boolean);
const closeDialogBtn = document.querySelector("#closeDialog");
const frontendConfig = window.GIRLCODE_SUPABASE || {};
const supabaseUrl = String(frontendConfig.url || "").replace(/\/$/, "");
const publishableKey = String(frontendConfig.publishableKey || "");
const profileFunctionUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/profiles` : "";
const backendEnabled = Boolean(supabaseUrl && publishableKey && window.supabase?.createClient);
const authClient = backendEnabled ? window.supabase.createClient(supabaseUrl, publishableKey) : null;

async function createProfileOnBackend(person){
  if(!backendEnabled) throw new Error("Supabase frontend config is missing. Copy config.example.js to config.js first.");
  const {data: {session}} = await authClient.auth.getSession();
  if(!session?.access_token) throw new Error("Please sign in before adding a profile.");

  const response = await fetch(profileFunctionUrl, {
    method: "POST",
    headers: {
      "apikey": publishableKey,
      "Authorization": `Bearer ${session.access_token}`,
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

  const result = await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(result.error || `Profile request failed (${response.status}).`);
  return result.data;
}
function readStoredArray(key){
  const data = JSON.parse(localStorage.getItem(key) || "[]");
  if(!Array.isArray(data)) throw new Error("Invalid stored data");
  return data;
}
let localPeople = [];
try { localPeople = readStoredArray("girlcode-socialwall-people"); }
catch { showToast("Saved profiles couldn't be loaded. Please try again later."); }
// Keep the original IDs so existing notes stay with the correct person.
const seedProfiles = seed.map((p, i)=>({...p, id:`seed-${i}`}));
const orderedSeedProfiles = [seedProfiles[2], ...seedProfiles.filter(p=>p.id !== "seed-2")];
let people = [...orderedSeedProfiles, ...localPeople
  .filter(p=>p && typeof p.name === "string" && typeof p.ig === "string")
  .map((p, i)=>({...p, id:p.id || `legacy-${i}`}))];
const detailDialog = document.querySelector("#detailDialog");
const messageForm = document.querySelector("#messageForm");
const messageKey = "girlcode-socialwall-messages";
let activePerson = null;

function safeLinkedIn(value){
  try {
    const url = new URL(cleanLinkedIn(value));
    if(url.protocol !== "https:" || !(url.hostname === "linkedin.com" || url.hostname.endsWith(".linkedin.com")) || url.username || url.password) return "";
    return url.href;
  } catch { return ""; }
}

function renderMessages(){
  const list = document.querySelector("#messageList");
  list.replaceChildren();
  const messages = readStoredArray(messageKey).filter(m=>m && m.personId === activePerson.id && typeof m.author === "string" && typeof m.message === "string");
  if(!messages.length){
    const empty = document.createElement("li");
    empty.className = "empty-notes";
    empty.textContent = "No notes yet. Be the first to say hi ♡";
    list.append(empty);
  }
  messages.forEach(m=>{
    const item = document.createElement("li");
    const author = document.createElement("strong");
    author.textContent = m.author;
    const body = document.createElement("p");
    body.textContent = m.message;
    item.append(author, body);
    list.append(item);
  });
}

function openProfile(person){
  activePerson = person;
  document.querySelector("#detailName").textContent = person.name;
  document.querySelector("#detailHandle").textContent = `@${person.ig}`;
  document.querySelector("#detailAbout").textContent = person.about || "say hi if you see me around ♡";
  const portrait = document.querySelector("#detailPortrait");
  portrait.style.backgroundImage = person.photo ? `url(${person.photo})` : "";
  portrait.textContent = person.photo ? "" : initials(person.name);
  document.querySelector("#detailInstagram").href = `https://instagram.com/${encodeURIComponent(person.ig)}`;
  const linkedin = safeLinkedIn(person.linkedin || "");
  const link = document.querySelector("#detailLinkedIn");
  link.hidden = !linkedin;
  if(linkedin) link.href = linkedin;
  else link.removeAttribute("href");
  document.querySelector("#missingLinkedIn").hidden = Boolean(linkedin);
  messageForm.reset();
  document.querySelector("#messageError").textContent = "";
  try { renderMessages(); }
  catch { document.querySelector("#messageError").textContent = "Couldn't load saved notes. Please try again later."; }
  detailDialog.showModal();
  detailDialog.scrollTop = 0;
}
document.querySelector("#closeDetail").addEventListener("click", ()=>detailDialog.close());
detailDialog.addEventListener("click", e=>{ if(e.target === detailDialog) detailDialog.close(); });
messageForm.addEventListener("submit", e=>{
  e.preventDefault();
  const error = document.querySelector("#messageError");
  const author = messageForm.elements.author.value.trim();
  const message = messageForm.elements.message.value.trim();
  if(!activePerson || !author || !message){
    error.textContent = "Please enter your name and a message.";
    return;
  }
  try {
    const messages = readStoredArray(messageKey);
    messages.push({id:crypto.randomUUID(), personId:activePerson.id, author, message, createdAt:new Date().toISOString()});
    localStorage.setItem(messageKey, JSON.stringify(messages));
    messageForm.reset();
    error.textContent = "";
    renderMessages();
    showToast("Your note is saved in this browser ♡");
  } catch { error.textContent = "Couldn't save your note. Your text is still here; please try again."; }
});

const initials = (name="") => name.split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase();

function showToast(message){
  if(!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(()=>toast.classList.remove("show"), 1500);
}

function cleanIg(v=""){
  return v.trim().replace(/^@/,"").replace(/^https?:\/\/(www\.)?instagram\.com\//,"").replace(/\/.*$/,"");
}
function cleanLinkedIn(v=""){
  const s = v.trim();
  if(!s) return "";
  return /^https?:\/\//.test(s) ? s : `https://${s}`;
}
function render(list=people){
  wall.innerHTML="";
  list.forEach((p, i)=>{
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.classList.add(["rose","olive","lilac","cream","blue"].includes(p.tone) ? p.tone : "rose");
    node.querySelector("h3").textContent = p.name;
    const handle = node.querySelector(".handle");
    handle.textContent = `@${p.ig}`;
    node.querySelector(".about").textContent = p.about || "say hi if you see me around ♡";
    const portrait = node.querySelector(".portrait");
    if(p.photo){
      portrait.style.backgroundImage = `url(${p.photo})`;
      portrait.textContent = "";
    } else {
      portrait.textContent = initials(p.name);
    }
    node.querySelector(".social-summary").textContent = safeLinkedIn(p.linkedin || "") ? "instagram · linkedin" : "instagram";
    const open = node.querySelector(".card-open");
    open.setAttribute("aria-label", `View ${p.name}'s profile and leave a note`);
    open.setAttribute("aria-haspopup", "dialog");
    open.addEventListener("click", ()=>openProfile(p));
    wall.appendChild(node);
  });
  count.textContent = list.length;
}
render();

function openDialog(){
  if(!dialog.open) dialog.showModal();
  setTimeout(()=>form.elements.name?.focus(), 40);
}
openers.forEach(btn => btn.addEventListener("click", openDialog));
closeDialogBtn.addEventListener("click", ()=> dialog.close());

// Native Escape key closes <dialog>. Clicking the dimmed backdrop closes it too.
dialog.addEventListener("click", (e) => {
  if(e.target === dialog) dialog.close();
});

// Faux-browser controls are real controls.
document.querySelector("#browserBack").addEventListener("click", ()=> history.back());
document.querySelector("#browserForward").addEventListener("click", ()=> history.forward());
document.querySelector("#browserHome").addEventListener("click", ()=> window.scrollTo({top:0, behavior:"smooth"}));
document.querySelector("#browserRefresh").addEventListener("click", ()=> location.reload());

async function copyText(text){
  if(navigator.clipboard && window.isSecureContext){
    await navigator.clipboard.writeText(text);
    return true;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.focus();
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  return ok;
}

document.querySelector("#copyLink").addEventListener("click", async (e)=>{
  const b = e.currentTarget;
  const old = b.textContent;
  try{
    const ok = await copyText(location.href);
    if(!ok) throw new Error("copy failed");
    b.textContent = "copied ♡";
    showToast("page link copied ♡");
  }catch{
    b.textContent = "copy manually";
    showToast("couldn’t auto-copy — copy it from the address bar");
  }
  setTimeout(()=>b.textContent=old,1400);
});

search.addEventListener("input", e=>{
  const q = e.target.value.toLowerCase().trim();
  render(people.filter(p => `${p.name} ${p.ig} ${p.about||""}`.toLowerCase().includes(q)));
});

function compressImage(file, maxSize=720, quality=.82){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = ()=>{
      const img = new Image();
      img.onerror = reject;
      img.onload = ()=>{
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  if(!form.reportValidity()) return;

  const submitBtn = form.querySelector(".submit");
  const originalLabel = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "adding you...";

  try{
    const fd = new FormData(form);
    const file = fd.get("photo");
    const person = {
      id: crypto.randomUUID(),
      name: fd.get("name").trim(),
      ig: cleanIg(fd.get("instagram")),
      linkedin: cleanLinkedIn(fd.get("linkedin")),
      about: fd.get("about").trim(),
      tone: fd.get("tone") || "rose",
      photo:""
    };

    if(!person.name || !/^[a-zA-Z0-9._]{1,30}$/.test(person.ig)){
      showToast("Please enter a name and a valid Instagram username.");
      return;
    }
    if(person.linkedin && !safeLinkedIn(person.linkedin)){
      showToast("Please enter a valid HTTPS LinkedIn profile link.");
      return;
    }

    if(file && file.size){
      person.photo = await compressImage(file);
    }

    let saved = null;
    if(backendEnabled){
      saved = await createProfileOnBackend(person);
      person.id = saved.id;
      person.ig = saved.instagram;
      person.linkedin = saved.linkedin || "";
      person.about = saved.about || "";
      person.tone = saved.tone;
      // Avatar upload will be connected to Supabase Storage separately.
      person.photo = "";
    } else {
      const local = readStoredArray("girlcode-socialwall-people");
      local.push(person);
      localStorage.setItem("girlcode-socialwall-people", JSON.stringify(local));
    }
    people.push(person);
    search.value = "";
    render();
    form.reset();
    dialog.close();
    showToast(`${person.name} is on the wall ✦`);
    setTimeout(()=>window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"}), 80);
  } catch (err){
    console.error(err);
    showToast(err.message || "couldn’t add the profile — try again");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
});
