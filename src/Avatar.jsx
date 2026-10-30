const palettes = {
  rose: ["#fff1f2", "#db91a8", "#a95773", "#c9879a"],
  olive: ["#f5f2df", "#b6b779", "#75764e", "#a2a577"],
  lilac: ["#f4effb", "#b69bd4", "#776090", "#a88fc1"],
  cream: ["#faf2e5", "#c9a979", "#806744", "#b89468"],
  blue: ["#edf6fa", "#8dbaca", "#537b8c", "#83aabb"],
};

export const AVATAR_STYLES = [
  { id: "star-bob", label: "Pink bow" },
  { id: "flower-bob", label: "Flower clip" },
  { id: "twin-buns", label: "Twin buns" },
  { id: "side-pony", label: "Side pony" },
  { id: "heart-clip", label: "Sparkles" },
];

export const SKIN_TONES = [
  { id: "very-fair", label: "Very fair" },
  { id: "fair", label: "Fair" },
  { id: "wheat", label: "Wheat" },
  { id: "chocolate", label: "Chocolate" },
];

const hairColors = ["#47343a", "#29272b", "#805844", "#b17a50", "#5a4653"];
const skinColors = {
  "very-fair": "#fff0e8",
  fair: "#f4cfbd",
  wheat: "#c98e65",
  chocolate: "#75452f",
};
const eyeColors = ["#66526b", "#567b83", "#755c55", "#66749a", "#806a50"];
const ink = "#382c31";
const avatarStyleDetails = {
  "star-bob": { hairstyle: 0, accessory: 0 },
  "flower-bob": { hairstyle: 2, accessory: 2 },
  "twin-buns": { hairstyle: 1, accessory: 2 },
  "side-pony": { hairstyle: 3, accessory: 0 },
  "heart-clip": { hairstyle: 0, accessory: 3 },
};

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
  avatarStyle = "star-bob",
  skinTone = "fair",
  photo = "",
  className = "",
}) {
  if (photo) {
    return <img className={`${className} portrait-photo`} src={photo} alt="" />;
  }

  const seed = hashSeed(`${name}-${tone}-${avatarStyle}-${skinTone}`);
  const [background, accent, deepAccent, outfit] =
    palettes[tone] || palettes.rose;
  const hair = hairColors[seed % hairColors.length];
  const skin = skinColors[skinTone] || skinColors.fair;
  const eyes = eyeColors[(seed >>> 5) % eyeColors.length];
  const style = avatarStyleDetails[avatarStyle] || avatarStyleDetails["star-bob"];
  const hairstyle = style.hairstyle;
  const accessory = style.accessory;
  const gradientId = `avatar-bg-${seed.toString(16)}`;

  const backHair = [
    "M29 151V77C29 34 49 15 81 15s52 23 52 62v74c-9-5-15-16-18-32l-7-42-53 4-9 49c-3 12-9 19-17 21Z",
    "M27 150V80c0-43 21-65 54-65s52 22 52 63v74l-17-20 1-51-70-1v52Z",
    "M25 151V79c0-43 22-64 56-64s54 23 54 65v71c-10-4-16-14-19-29l-7-43-56 4-10 45c-3 13-9 20-18 23Z",
    "M28 153V80c0-42 21-65 53-65s52 22 52 63v75l-17-18V81l-70-1v54c-5 10-11 16-18 19Z",
  ][hairstyle];
  const fringe = [
    "M40 69c5-27 21-43 45-43 16 0 29 8 37 25-11-3-18-9-23-15-9 13-25 21-48 24l-5 18Z",
    "M40 69c5-28 22-44 45-44 18 0 31 10 39 27-14-1-24-6-31-15-9 12-23 19-47 22l-5 13Z",
    "M39 70c7-28 23-44 47-44 18 0 31 10 39 27-12-3-22-9-30-18-10 13-26 21-50 24l-4 14Z",
    "M39 70c6-29 22-45 47-45 17 0 30 9 39 26-13-2-22-8-29-16-11 12-27 20-52 23l-4 14Z",
  ][hairstyle];
  const sideFringe = [
    "M42 59c3 27 14 43 31 49-18 2-31-7-39-26Z",
    "M42 57c2 30 12 47 28 56-18-1-31-13-37-32Z",
    "M41 59c3 27 12 43 28 52-17 0-29-10-36-28Z",
    "M41 58c2 29 13 47 29 56-18 0-31-12-37-31Z",
  ][hairstyle];
  const gradient = `url(#${gradientId})`;

  return (
    <div className={`${className} avatar-generated`} aria-hidden="true">
      <svg className="portrait-art" viewBox="0 0 160 200" role="presentation">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={background} />
            <stop offset="1" stopColor={accent} stopOpacity=".78" />
          </linearGradient>
        </defs>
        <rect width="160" height="200" fill={gradient} />
        <circle cx="80" cy="82" r="61" fill="#fff" opacity=".22" />
        <path d="m25 50 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#fff" opacity=".8" />
        <path d="m135 86 1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5Z" fill="#fff" opacity=".75" />

        <path d={backHair} fill={hair} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
        {hairstyle === 1 && (
          <g fill={hair} stroke={ink} strokeWidth="3" strokeLinejoin="round">
            <path d="M37 34c-16-13-15-28 1-33 11 7 15 17 10 31Z" />
            <path d="M123 34c16-13 15-28-1-33-11 7-15 17-10 31Z" />
          </g>
        )}
        {hairstyle === 3 && (
          <path
            d="M118 37c22-9 34 2 31 19-9 12-21 14-34 7Z"
            fill={hair}
            stroke={ink}
            strokeWidth="3"
          />
        )}

        <path
          d="M42 150c4-17 16-26 30-30h16c16 4 27 13 31 30l16 50H25Z"
          fill={outfit}
          stroke={ink}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M69 118h22v24H69z" fill={skin} />
        <path
          d="M66 130 80 143l14-13 13 7-15 19H68l-15-19Z"
          fill="#fff8f1"
          stroke={ink}
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path d={`m78 144 2 4 2-4`} fill="none" stroke={accent} strokeWidth="2" />
        <path d="M80 151v13" stroke={deepAccent} strokeWidth="2" />
        <path d="M40 163c9 5 18 8 27 9m53-9c-9 5-18 8-27 9" fill="none" stroke="#fff" strokeWidth="2" opacity=".65" />

        <ellipse cx="42" cy="86" rx="7" ry="10" fill={skin} stroke={ink} strokeWidth="2" />
        <ellipse cx="118" cy="86" rx="7" ry="10" fill={skin} stroke={ink} strokeWidth="2" />
        <path
          d="M43 73c0-17 15-28 37-28s37 11 37 28v25c0 17-15 27-37 27s-37-10-37-27Z"
          fill={skin}
          stroke={ink}
          strokeWidth="2.2"
        />

        <ellipse cx="61" cy="101" rx="9" ry="3.5" fill="#e99aa0" opacity=".3" />
        <ellipse cx="99" cy="101" rx="9" ry="3.5" fill="#e99aa0" opacity=".3" />
        <path d="M54 68q10-6 19 0m14 0q9-6 19 0" fill="none" stroke={hair} strokeWidth="2.4" strokeLinecap="round" />
        <ellipse cx="64" cy="88" rx="10" ry="12" fill={eyes} stroke={ink} strokeWidth="1.7" />
        <ellipse cx="96" cy="88" rx="10" ry="12" fill={eyes} stroke={ink} strokeWidth="1.7" />
        <path d="M53 84c2-7 6-10 11-10s9 3 11 9m8 1c2-7 6-10 11-10s9 3 11 9" fill="none" stroke={ink} strokeWidth="2.8" strokeLinecap="round" />
        <path d="m55 79-4-4m8 1-2-5m13 5 2-5m28 8 4-4m-8 0 2-5m-13 5-2-5" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="67" cy="84" rx="3.2" ry="4" fill="#fff" />
        <ellipse cx="99" cy="84" rx="3.2" ry="4" fill="#fff" />
        <circle cx="61" cy="92" r="1.8" fill="#fff" opacity=".9" />
        <circle cx="93" cy="92" r="1.8" fill="#fff" opacity=".9" />
        <circle cx="80" cy="99" r="1.2" fill="#b87870" />
        <path d="M76 107q4 4 8 0" fill="none" stroke="#9e5364" strokeWidth="1.8" strokeLinecap="round" />

        <path d={fringe} fill={hair} stroke={ink} strokeWidth="2.8" strokeLinejoin="round" />
        <path d={sideFringe} fill={hair} stroke={ink} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M119 64c-4 16-5 35-2 54 2 14 7 24 14 30" fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" opacity=".8" />
        <path d="M42 66c-4 19-4 37-1 52 2 12 6 22 12 29" fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" opacity=".8" />

        {accessory === 0 && (
          <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
            <path d="M106 52c-9-12-4-19 6-14l8 7 7-6c10-4 14 4 5 14l-11 9Z" fill="#f3b4c3" />
            <circle cx="121" cy="51" r="3" fill="#fff3e9" />
          </g>
        )}
        {accessory === 1 && (
          <g stroke={ink} strokeWidth="1.8">
            <rect x="104" y="51" width="22" height="7" rx="3.5" fill="#f2d89a" transform="rotate(-12 104 51)" />
            <path d="m111 49 3 7m5-9 3 7" stroke="#fff8eb" />
          </g>
        )}
        {accessory === 2 && (
          <g fill="#f4d0d5" stroke={ink} strokeWidth="1.8">
            <circle cx="50" cy="55" r="5" />
            <circle cx="58" cy="51" r="5" />
            <circle cx="58" cy="59" r="5" />
            <circle cx="66" cy="55" r="5" />
            <circle cx="58" cy="55" r="2" fill="#f4d58e" />
          </g>
        )}
        {accessory === 3 && (
          <g fill="none" stroke="#fff8e9" strokeWidth="2.5" strokeLinecap="round">
            <path d="M108 53h18M117 44v18" />
            <path d="m126 67 1.5 3.5L131 72l-3.5 1.5L126 77l-1.5-3.5L121 72l3.5-1.5Z" />
          </g>
        )}
      </svg>
    </div>
  );
}
