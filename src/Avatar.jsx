const palettes = {
  rose: ["#f5dfe6", "#d788a5", "#a75d78"],
  olive: ["#eff0d9", "#aeb96d", "#73804b"],
  lilac: ["#eee4f5", "#b79bd0", "#80629d"],
  cream: ["#f4eedf", "#c5a977", "#927650"],
  blue: ["#e3eff5", "#91b8cb", "#5e8194"],
};

const hairColors = ["#47343a", "#29272b", "#805844", "#b17a50"];
const skinColors = ["#f2cdbd", "#d9a98e", "#f5d9c8", "#bd846c", "#eac0a4"];

function hashSeed(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export default function Avatar({
  name = "Your name",
  tone = "rose",
  photo = "",
  className = "",
}) {
  if (photo) {
    return (
      <img className={`${className} portrait-photo`} src={photo} alt="" />
    );
  }

  const seed = hashSeed(`${name}-${tone}`);
  const [background, accent, deepAccent] = palettes[tone] || palettes.rose;
  const hair = hairColors[seed % hairColors.length];
  const skin = skinColors[(seed >>> 3) % skinColors.length];
  const hairstyle = (seed >>> 6) % 3;
  const accessory = (seed >>> 9) % 3;
  const gradientId = `avatar-bg-${seed.toString(16)}`;
  const hairShape = [
    "M42 101V77c0-27 16-44 39-44s39 17 39 44v25c-7-8-13-19-15-31-11 11-27 17-49 17-3 5-7 9-14 13Z",
    "M40 107V74c0-27 16-43 41-43s41 16 41 43v59c-8-7-12-17-12-29V83c-15 13-38 18-56 12v37c-8-6-14-14-14-25Z",
    "M39 98V76c0-28 16-45 42-45s42 17 42 45v27c-8-7-14-18-17-32-14 12-32 17-54 15-3 5-7 9-13 12Z",
  ][hairstyle];
  const fringeShape = [
    "M44 76c10-20 26-28 47-27 8 0 17 3 25 9-11 3-17 1-24-1-12 11-28 17-48 19Z",
    "M43 75c10-23 27-32 48-30 10 1 17 5 24 11-14-2-24 0-33 8-11 8-24 11-39 11Z",
    "M43 78c11-24 27-33 48-31 10 1 18 5 25 12-14-2-25 1-34 9-10 7-23 10-39 10Z",
  ][hairstyle];

  return (
    <div className={`${className} avatar-generated`} aria-hidden="true">
      <svg className="portrait-art" viewBox="0 0 160 200" role="presentation">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={background} />
            <stop offset="1" stopColor={accent} stopOpacity=".7" />
          </linearGradient>
        </defs>
        <rect width="160" height="200" fill={`url(#${gradientId})`} />
        <circle cx="80" cy="82" r="58" fill="#fff" opacity=".18" />
        <path
          d="M12 169c18-25 40-37 68-37s50 12 68 37v31H12Z"
          fill="#fff"
          opacity=".22"
        />
        <path
          d="M27 200c4-26 19-44 43-51h20c24 7 39 25 43 51Z"
          fill={deepAccent}
        />
        <path d="M67 124h26v27H67z" fill={skin} />
        <path d={hairShape} fill={hair} />
        <path
          d="M49 73c0-20 12-32 31-32s31 12 31 32v30c0 20-13 34-31 34s-31-14-31-34Z"
          fill={skin}
        />
        <path d={fringeShape} fill={hair} />
        <path
          d="M62 91c3-2 7-2 10 0M89 91c3-2 7-2 10 0"
          fill="none"
          stroke={hair}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M67 99v1m26-1v1"
          stroke="#49373a"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M78 102c-1 5-3 8-2 9 2 2 5 2 7 0"
          fill="none"
          stroke="#bd846c"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M73 117c4 4 10 4 14 0"
          fill="none"
          stroke="#a9586c"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <ellipse cx="60" cy="106" rx="6" ry="3" fill="#e78f9e" opacity=".38" />
        <ellipse cx="100" cy="106" rx="6" ry="3" fill="#e78f9e" opacity=".38" />
        <path
          d="M56 133c5 7 14 11 24 11s19-4 24-11l16 8-17 14H57l-17-14Z"
          fill={background}
        />
        <circle cx="49" cy="112" r="2.5" fill="#fff4d9" />
        <circle cx="111" cy="112" r="2.5" fill="#fff4d9" />
        {accessory === 0 && (
          <g fill="#fff7eb">
            <circle cx="51" cy="65" r="5" />
            <circle cx="59" cy="60" r="5" />
            <circle cx="59" cy="69" r="5" />
            <circle cx="67" cy="64" r="5" />
            <circle cx="59" cy="65" r="2.5" fill={accent} />
          </g>
        )}
        {accessory === 1 && (
          <path
            d="M43 70c5-18 17-28 37-30-10 11-18 20-24 33Z"
            fill={accent}
          />
        )}
        {accessory === 2 && (
          <g fill="none" stroke="#fff4d9" strokeWidth="2">
            <path d="m31 48 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
            <path d="m127 67 1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5Z" />
          </g>
        )}
        <circle cx="24" cy="117" r="2" fill="#fff" opacity=".8" />
        <circle cx="135" cy="99" r="2.5" fill="#fff" opacity=".75" />
      </svg>
    </div>
  );
}
