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
let people = [...seed, ...JSON.parse(localStorage.getItem("girlcode-socialwall-people") || "[]")];

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
    node.classList.add(p.tone || ["rose","olive","lilac","cream","blue"][i%5]);
    node.querySelector("h3").textContent = p.name;
    const handle = node.querySelector(".handle");
    handle.textContent = `@${p.ig}`;
    handle.href = `https://instagram.com/${encodeURIComponent(p.ig)}`;
    node.querySelector(".about").textContent = p.about || "say hi if you see me around ♡";
    const portrait = node.querySelector(".portrait");
    if(p.photo){
      portrait.style.backgroundImage = `url(${p.photo})`;
      portrait.textContent = "";
    } else {
      portrait.textContent = initials(p.name);
    }
    const ig = node.querySelector(".ig");
    ig.href = `https://instagram.com/${encodeURIComponent(p.ig)}`;
    const li = node.querySelector(".li");
    if(p.linkedin){
      li.href = p.linkedin;
    } else {
      li.remove();
    }
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
      name: fd.get("name").trim(),
      ig: cleanIg(fd.get("instagram")),
      linkedin: cleanLinkedIn(fd.get("linkedin")),
      about: fd.get("about").trim(),
      tone: fd.get("tone") || "rose",
      photo:""
    };

    if(file && file.size){
      person.photo = await compressImage(file);
    }

    const local = JSON.parse(localStorage.getItem("girlcode-socialwall-people") || "[]");
    local.push(person);
    localStorage.setItem("girlcode-socialwall-people", JSON.stringify(local));
    people.push(person);
    search.value = "";
    render();
    form.reset();
    dialog.close();
    showToast(`${person.name} is on the wall ✦`);
    setTimeout(()=>window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"}), 80);
  } catch (err){
    console.error(err);
    showToast("couldn’t add the profile — try a smaller photo");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
});
