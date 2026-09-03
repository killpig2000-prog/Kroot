/* Event "skin" costumes: full-body characters that replace the growing tree
 * while worn (src/lib/costumes.tsx, slot "skin"). Drawn straight into the
 * 220x230 tree frame like garden items; TreeCard supplies sky/sun/hill.
 * Source mockup: _refs/mockups/tree-skins-v5.html (v11). */

/** Shared chibi face, centered on the head origin. */
export function SkinFace() {
  return (
    <g>

      {/* simple solid eyes, slightly narrowed for a firm look; one highlight each */}
      <ellipse cx="-7.5" cy="-0.5" rx="2.6" ry="3.3" fill="#2B2521"/>
      <ellipse cx="7.5" cy="-0.5" rx="2.6" ry="3.3" fill="#2B2521"/>
      <circle cx="-6.6" cy="-1.9" r="1" fill="#fff"/>
      <circle cx="8.4" cy="-1.9" r="1" fill="#fff"/>
      {/* small nose bridge */}
      <path d="M0.6 1.5 q1.3 3 -0.3 4.6" stroke="#C99A72" strokeWidth="1" fill="none" strokeLinecap="round" opacity=".8"/>
      <ellipse cx="-13" cy="6" rx="3.4" ry="1.9" fill="#FF9E7D" opacity=".22"/>
      <ellipse cx="13" cy="6" rx="3.4" ry="1.9" fill="#FF9E7D" opacity=".22"/>
    </g>
  );
}

/** Gradients/patterns/filters shared by the three skins. Identical ids on one
 *  page resolve to identical defs, so several skins can share a page. */
export function SkinDefs() {
  return (
    <defs>
        <radialGradient id="sk-skin" cx="40%" cy="32%" r="70%"><stop offset="0%" stopColor="#FFE9CF"/><stop offset="70%" stopColor="#F6D3AE"/><stop offset="100%" stopColor="#E5B98F"/></radialGradient>
    <radialGradient id="sk-iris" cx="40%" cy="35%" r="65%"><stop offset="0%" stopColor="#6B4A2E"/><stop offset="100%" stopColor="#2B1C12"/></radialGradient>
    <linearGradient id="sk-ink-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B3A46"/><stop offset="100%" stopColor="#15141C"/></linearGradient>
    <linearGradient id="sk-k-red" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E24B3F"/><stop offset="55%" stopColor="#B8262A"/><stop offset="100%" stopColor="#711418"/></linearGradient>
    <linearGradient id="sk-k-red-hi" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fff" stopOpacity=".22"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></linearGradient>
    <radialGradient id="sk-k-aura" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#FDE68A" stopOpacity=".75"/><stop offset="100%" stopColor="#FDE68A" stopOpacity="0"/></radialGradient>
    <linearGradient id="sk-k-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFF1B8"/><stop offset="50%" stopColor="#E9BE4E"/><stop offset="100%" stopColor="#B8862B"/></linearGradient>
    <linearGradient id="sk-k-page" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFFBF0"/><stop offset="100%" stopColor="#EFE3C4"/></linearGradient>
    <linearGradient id="sk-shoe" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B3A46"/><stop offset="100%" stopColor="#15141C"/></linearGradient>
    <linearGradient id="sk-gat-brim" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2B2A36" stopOpacity=".95"/><stop offset="100%" stopColor="#15141C" stopOpacity=".7"/></linearGradient>
    <linearGradient id="sk-a-plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6B7A8C"/><stop offset="50%" stopColor="#3E4B5C"/><stop offset="100%" stopColor="#222B37"/></linearGradient>
    <linearGradient id="sk-a-red" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EF5A5A"/><stop offset="100%" stopColor="#A71F2B"/></linearGradient>
    <linearGradient id="sk-a-shield" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#8C6A44"/><stop offset="100%" stopColor="#4F3820"/></linearGradient>
    <radialGradient id="sk-a-aura" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#7DD3FC" stopOpacity=".6"/><stop offset="100%" stopColor="#7DD3FC" stopOpacity="0"/></radialGradient>
    <pattern id="sk-a-hex" width="8" height="7" patternUnits="userSpaceOnUse"><path d="M4 0 L8 2 L8 5 L4 7 L0 5 L0 2Z" fill="none" stroke="#2B1D0F" strokeWidth=".8" opacity=".55"/></pattern>
    <linearGradient id="sk-s-robe" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFFDF7"/><stop offset="60%" stopColor="#F1EBDC"/><stop offset="100%" stopColor="#D8CEB6"/></linearGradient>
    <linearGradient id="sk-s-trim" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C8DA6"/><stop offset="100%" stopColor="#4A5A73"/></linearGradient>
    <radialGradient id="sk-s-aura" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#C7D2FE" stopOpacity=".6"/><stop offset="100%" stopColor="#C7D2FE" stopOpacity="0"/></radialGradient>
    <linearGradient id="sk-s-scroll" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#F7F1DE"/><stop offset="100%" stopColor="#E6DBBE"/></linearGradient>
    <filter id="sk-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="sk-soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
  );
}

export function KingSkin() {
  return (
    <g>
      <SkinDefs />
          {/* aura */}
          <ellipse cx="110" cy="128" rx="80" ry="92" fill="url(#sk-k-aura)"/>
          {/* floating jamo */}
          <g fontFamily="Noto Sans KR, sans-serif" fontWeight="700" fill="#D9A93A" filter="url(#sk-glow)">
            <text className="bob" x="34" y="110" fontSize="14">ㄱ</text>
            <text className="bob2" x="176" y="96" fontSize="12">ㅏ</text>
            <text className="bob" x="180" y="160" fontSize="13">ㄴ</text>
            <text className="bob2" x="30" y="170" fontSize="11">ㅁ</text>
          </g>
          <ellipse cx="110" cy="214" rx="44" ry="8" fill="#1F3A66" opacity=".16"/>
          <g className="bob">
            <g transform="translate(110 210) scale(1.07 1.22)">
              {/* shoes */}
              <ellipse cx="-9" cy="2" rx="8" ry="3.6" fill="url(#sk-shoe)"/><ellipse cx="9" cy="2" rx="8" ry="3.6" fill="url(#sk-shoe)"/>
              {/* robe */}
              <path d="M-25 0 C-29 -30 -25 -66 -15 -82 L15 -82 C25 -66 29 -30 25 0 Z" fill="url(#sk-k-red)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              <path d="M-15 -82 C-21 -62 -22 -36 -20 -2" stroke="#fff" strokeOpacity=".18" strokeWidth="6" fill="none" strokeLinecap="round"/>
              <path d="M-15 -50 C-18 -36 -17 -20 -14 -4 M15 -50 C18 -36 17 -20 14 -4" stroke="#5A0F12" strokeOpacity=".35" strokeWidth="1.2" fill="none"/>
              {/* sleeves */}
              <path d="M-15 -77 C-30 -71 -40 -52 -37 -28 C-35 -20 -25 -20 -23 -28 C-26 -46 -23 -62 -15 -77 Z" fill="url(#sk-k-red)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              <path d="M15 -77 C30 -71 40 -52 37 -28 C35 -20 25 -20 23 -28 C26 -46 23 -62 15 -77 Z" fill="url(#sk-k-red)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              <path d="M-37 -28 q7 4 14 0 M37 -28 q-7 4 -14 0" stroke="url(#sk-k-gold)" strokeWidth="3" strokeLinecap="round" fill="none"/>
              {/* shoulder emblems */}
              <circle cx="-22" cy="-66" r="5" fill="url(#sk-k-gold)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/><circle cx="22" cy="-66" r="5" fill="url(#sk-k-gold)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              <circle cx="-22" cy="-66" r="2.2" fill="#B8262A"/><circle cx="22" cy="-66" r="2.2" fill="#B8262A"/>
              {/* jade belt */}
              <rect x="-25" y="-50" width="50" height="8" rx="4" fill="url(#sk-k-gold)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              <g fill="#5BA37A"><rect x="-19" y="-48.5" width="6" height="5" rx="1"/><rect x="-8" y="-48.5" width="6" height="5" rx="1"/><rect x="3" y="-48.5" width="6" height="5" rx="1"/><rect x="14" y="-48.5" width="6" height="5" rx="1"/></g>
              <path d="M-25 -1 L25 -1" stroke="url(#sk-k-gold)" strokeWidth="4"/>
              {/* chest emblem: sun with rays (not a dragon) */}
              <circle cx="0" cy="-66" r="9" fill="url(#sk-k-gold)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              <circle cx="0" cy="-66" r="6" fill="#B8262A"/>
              <g stroke="#FFF1B8" strokeWidth="1.4" strokeLinecap="round"><path d="M0 -76 L0 -73 M0 -59 L0 -56 M-10 -66 L-7 -66 M7 -66 L10 -66 M-7 -73 L-5 -71 M7 -73 L5 -71 M-7 -59 L-5 -61 M7 -59 L5 -61"/></g>
              {/* hands + primer */}
              <ellipse cx="-20" cy="-36" rx="5.5" ry="4.6" fill="url(#sk-skin)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/><ellipse cx="20" cy="-36" rx="5.5" ry="4.6" fill="url(#sk-skin)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              <g transform="translate(0 -38)">
                <path d="M-19 -3 L0 -9 L19 -3 L19 14 L0 8 L-19 14 Z" fill="url(#sk-k-page)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <path d="M0 -9 L0 8" stroke="#C9B98C" strokeWidth="1"/>
                <path d="M-15 1 L-4 -2 M-15 6 L-4 3 M4 -2 L15 1 M4 3 L15 6" stroke="#C9B98C" strokeWidth=".8" opacity=".6"/>
                <text x="-14" y="10" fontSize="7.5" fontWeight="700" fill="#5B4A30" fontFamily="Noto Sans KR, sans-serif">ㄱㄴ</text>
                <text x="3" y="10" fontSize="8" fontWeight="700" fill="#5B4A30" fontFamily="Noto Sans KR, sans-serif">ㅏㅗ</text>
              </g>
              <g transform="translate(0 -100)">
                <circle cx="0" cy="0" r="25" fill="url(#sk-skin)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <g transform="translate(0 7.5)">
                <SkinFace />
                <path d="M-14 -8.5 C-11 -10.5 -6.5 -10 -3.5 -7.5 M14 -8.5 C11 -10.5 6.5 -10 3.5 -7.5" stroke="#2B2521" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
                <path d="M-4 8.5 q4 3 8 0" stroke="#8C4A3C" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
                <path d="M-3 7 C-6 5.5 -9 6 -11.5 8 M3 7 C6 5.5 9 6 11.5 8" stroke="#3B3A46" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                <path d="M-5 14.5 C-3 21 3 21 5 14.5 C3 16.5 -3 16.5 -5 14.5Z" fill="#3B3A46" opacity=".85"/>
</g>
                {/* ikseon-gwan: black cap, back rise, two upright wings */}
                <path d="M-25 -8 C-25 -30 25 -30 25 -8 C16 -15 -16 -15 -25 -8Z" fill="url(#sk-ink-hair)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <path d="M-13 -24 C-11 -36 11 -36 13 -24 Z" fill="url(#sk-ink-hair)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <rect x="-26" y="-11" width="52" height="6" rx="3" fill="#15141C" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <path d="M-8 -32 C-12 -46 -3 -52 3 -43 C1 -37 -3 -34 -8 -32Z" fill="url(#sk-ink-hair)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <path d="M8 -32 C12 -46 3 -52 -3 -43 C-1 -37 3 -34 8 -32Z" fill="url(#sk-ink-hair)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <path d="M-22 -10 q22 -8 44 0" stroke="#6B6A80" strokeWidth="1.2" opacity=".6" fill="none"/>
                <circle cx="0" cy="-14" r="2.8" fill="url(#sk-k-gold)"/>
              </g>
            </g>
          </g>
    </g>
  );
}

export function AdmiralSkin() {
  return (
    <g>
      <SkinDefs />
          <ellipse cx="110" cy="128" rx="80" ry="92" fill="url(#sk-a-aura)"/>
          {/* little waves */}
          <g stroke="#60A5FA" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7">
            <path className="bob" d="M40 170 q6 -5 12 0 q6 5 12 0"/>
            <path className="bob" d="M150 120 q6 -5 12 0 q6 5 12 0"/>
            <path className="bob2" d="M160 176 q6 -5 12 0 q6 5 12 0"/>
          </g>
          <ellipse cx="110" cy="214" rx="44" ry="8" fill="#1F3A66" opacity=".16"/>
          <g className="bob2">
            <g transform="translate(110 210) scale(1.07 1.22)">
              <ellipse cx="-9" cy="2" rx="8" ry="3.6" fill="url(#sk-shoe)"/><ellipse cx="9" cy="2" rx="8" ry="3.6" fill="url(#sk-shoe)"/>
              {/* cape */}
              <path d="M-20 -78 C-36 -54 -36 -12 -24 0 L24 0 C36 -12 36 -54 20 -78Z" fill="url(#sk-a-red)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              <path d="M-17 -78 C-28 -58 -28 -24 -20 -4" stroke="#fff" strokeOpacity=".18" strokeWidth="4" fill="none" strokeLinecap="round"/>
              {/* plated skirt */}
              <path d="M-22 0 C-26 -28 -22 -56 -14 -80 L14 -80 C22 -56 26 -28 22 0 Z" fill="url(#sk-a-plate)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              <g stroke="#9DB0C4" strokeWidth="1.4" opacity=".55" fill="none"><path d="M-22 -12 Q0 -7 22 -12"/><path d="M-24 -26 Q0 -21 24 -26"/><path d="M-24 -40 Q0 -35 24 -40"/><path d="M-22 -54 Q0 -49 22 -54"/></g>
              <g fill="#E9BE4E"><circle cx="-10" cy="-16" r="1.3"/><circle cx="0" cy="-15" r="1.3"/><circle cx="10" cy="-16" r="1.3"/><circle cx="-10" cy="-30" r="1.3"/><circle cx="0" cy="-29" r="1.3"/><circle cx="10" cy="-30" r="1.3"/></g>
              {/* cuirass */}
              <path d="M-14 -80 L14 -80 L17 -58 L0 -52 L-17 -58Z" fill="#4E5D70" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              <path d="M-14 -80 L14 -80 L17 -58 L0 -52 L-17 -58Z" fill="none" stroke="#E9BE4E" strokeWidth="1.8"/>
              <path d="M-9 -78 L-11 -62 M9 -78 L11 -62" stroke="#2B3441" strokeWidth="1" opacity=".5"/>
              <circle cx="0" cy="-68" r="5" fill="#E9BE4E" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/><circle cx="0" cy="-68" r="2" fill="#A71F2B"/>
              {/* belt */}
              <rect x="-22" y="-58" width="44" height="7" rx="3.5" fill="#2B1D0F" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/><rect x="-5" y="-59.5" width="10" height="10" rx="2" fill="#E9BE4E" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              {/* pauldrons */}
              <path d="M-14 -80 C-28 -82 -36 -70 -32 -58 C-26 -62 -20 -68 -14 -72Z" fill="url(#sk-a-plate)" stroke="#E9BE4E" strokeWidth="1.6"/>
              <path d="M14 -80 C28 -82 36 -70 32 -58 C26 -62 20 -68 14 -72Z" fill="url(#sk-a-plate)" stroke="#E9BE4E" strokeWidth="1.6"/>
              {/* sword arm */}
              <path d="M20 -62 C32 -56 38 -46 34 -34" stroke="#3E4B5C" strokeWidth="8" fill="none" strokeLinecap="round"/>
              <path d="M20 -62 C32 -56 38 -46 34 -34" stroke="#2B2521" strokeOpacity=".3" strokeWidth="10" fill="none" strokeLinecap="round" style={{ mixBlendMode: "multiply" }}/>
              <ellipse cx="34" cy="-32" rx="5.5" ry="4.6" fill="url(#sk-skin)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              <g transform="translate(36 -32) rotate(28)">
                <rect x="-2" y="-58" width="4" height="56" rx="1.6" fill="#D7DEE8" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <path d="M-2 -58 L0 -66 L2 -58Z" fill="#D7DEE8" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <path d="M0 -56 L0 -6" stroke="#fff" strokeWidth="1" opacity=".7"/>
                <rect x="-8" y="-3" width="16" height="3.6" rx="1.8" fill="#E9BE4E" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <rect x="-2.2" y="0" width="4.4" height="12" rx="1.8" fill="#4F3820" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/><circle cx="0" cy="13" r="2" fill="#E9BE4E"/>
              </g>
              {/* shield arm */}
              <path d="M-20 -62 C-32 -58 -38 -48 -36 -36" stroke="#3E4B5C" strokeWidth="8" fill="none" strokeLinecap="round"/>
              <g transform="translate(-38 -42)">
                <ellipse cx="0" cy="0" rx="17" ry="21" fill="url(#sk-a-shield)" stroke="#2B1D0F" strokeWidth="1.8"/>
                <ellipse cx="0" cy="0" rx="17" ry="21" fill="url(#sk-a-hex)"/>
                <ellipse cx="0" cy="0" rx="11" ry="14" fill="none" stroke="#E9BE4E" strokeWidth="1.4" opacity=".9"/>
                <circle cx="0" cy="0" r="3" fill="#E9BE4E" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <g fill="#E9BE4E"><circle cx="0" cy="-17" r="1.3"/><circle cx="0" cy="17" r="1.3"/><circle cx="-13" cy="0" r="1.3"/><circle cx="13" cy="0" r="1.3"/></g>
                <path d="M-10 -15 q10 -5 20 0" stroke="#fff" strokeWidth="1.6" opacity=".3" fill="none"/>
              </g>
              <g transform="translate(0 -98)">
                <circle cx="0" cy="0" r="25" fill="url(#sk-skin)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <g transform="translate(0 7.5)">
                <SkinFace />
                <path d="M-14.5 -10 L-3.5 -6.5 M14.5 -10 L3.5 -6.5" stroke="#2B2521" strokeWidth="2.6" strokeLinecap="round"/>
                <path d="M-3 7 C-6.5 5.2 -10 6 -13 8.5 M3 7 C6.5 5.2 10 6 13 8.5" stroke="#3B3A46" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
                <path d="M-4.5 9 q4.5 1.6 9 0" stroke="#8C4A3C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <path d="M-6 14.5 C-4 22 4 22 6 14.5 C4 17.5 -4 17.5 -6 14.5Z" fill="#3B3A46" opacity=".85"/>
</g>
                {/* helmet */}
                <path d="M-26 -8 C-26 -36 26 -36 26 -8 Z" fill="url(#sk-a-plate)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <path d="M-14 -22 q14 -8 28 0" stroke="#A9B6C6" strokeWidth="1.6" opacity=".6" fill="none"/>
                <path d="M-4 -35 L4 -35 L2 -13 L-2 -13Z" fill="#5C6B7E" opacity=".8"/>
                <rect x="-27" y="-11" width="54" height="6" rx="3" fill="#E9BE4E" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <path d="M-27 -8 L-32 4 L-20 -6Z M27 -8 L32 4 L20 -6Z" fill="url(#sk-a-plate)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <rect x="-1.8" y="-50" width="3.6" height="16" fill="#E9BE4E" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <g className="sway"><path d="M0 -48 C-10 -60 -6 -72 2 -74 C4 -64 10 -60 5 -50Z" fill="url(#sk-a-red)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/><path d="M0 -50 C-4 -58 -2 -64 2 -68" stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" fill="none"/></g>
              </g>
            </g>
          </g>
    </g>
  );
}

export function ScholarSkin() {
  return (
    <g>
      <SkinDefs />
          <ellipse cx="110" cy="128" rx="80" ry="92" fill="url(#sk-s-aura)"/>
          {/* ink wisps */}
          <g stroke="#4A5A73" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".55">
            <path className="bob2" d="M48 150 c-4 -6 2 -10 6 -6 c4 4 -2 10 -6 6"/>
            <path className="bob" d="M164 122 c-4 -6 2 -10 6 -6 c4 4 -2 10 -6 6"/>
            <path className="bob" d="M158 172 c-4 -6 2 -10 6 -6 c4 4 -2 10 -6 6"/>
          </g>
          <ellipse cx="110" cy="214" rx="44" ry="8" fill="#1F3A66" opacity=".16"/>
          <g className="bob">
            <g transform="translate(110 210) scale(1.07 1.22)">
              <ellipse cx="-9" cy="2" rx="8" ry="3.6" fill="#F1EBDC" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/><ellipse cx="9" cy="2" rx="8" ry="3.6" fill="#F1EBDC" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              <path d="M-25 0 C-29 -30 -25 -66 -15 -82 L15 -82 C25 -66 29 -30 25 0 Z" fill="url(#sk-s-robe)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              <path d="M-15 -82 L0 -52 L15 -82" fill="none" stroke="url(#sk-s-trim)" strokeWidth="3"/>
              <path d="M0 -52 L0 -2" stroke="#B9AD8F" strokeWidth="1.2" opacity=".7"/>
              <path d="M-16 -50 C-19 -36 -18 -20 -15 -4 M16 -50 C19 -36 18 -20 15 -4 M-7 -36 C-12 -28 -11 -16 -10 -6" stroke="#A89B7C" strokeOpacity=".45" strokeWidth="1.2" fill="none"/>
              <path d="M-15 -77 C-30 -71 -40 -52 -37 -28 C-35 -20 -25 -20 -23 -28 C-26 -46 -23 -62 -15 -77 Z" fill="url(#sk-s-robe)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              <path d="M15 -77 C30 -71 40 -52 37 -28 C35 -20 25 -20 23 -28 C26 -46 23 -62 15 -77 Z" fill="url(#sk-s-robe)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              <path d="M-37 -28 q7 4 14 0 M37 -28 q-7 4 -14 0" stroke="url(#sk-s-trim)" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <rect x="-21" y="-52" width="42" height="6" rx="3" fill="url(#sk-s-trim)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              <path d="M8 -48 C13 -36 11 -24 6 -14" stroke="#4A5A73" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
              <path d="M6 -14 l-3 5 M6 -14 l3 5" stroke="#4A5A73" strokeWidth="2.4" strokeLinecap="round"/>
              {/* scroll */}
              <ellipse cx="-21" cy="-36" rx="5.5" ry="4.6" fill="url(#sk-skin)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              <g transform="translate(-29 -40)">
                <rect x="-16" y="-12" width="34" height="24" rx="2" fill="url(#sk-s-scroll)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <rect x="-19" y="-14" width="4" height="28" rx="2" fill="#4F3820" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/><rect x="17" y="-14" width="4" height="28" rx="2" fill="#4F3820" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <path d="M-12 7 L-5 -5 L-1 2 L5 -8 L11 1 L14 7Z" fill="#4A5A73" opacity=".85"/>
                <path d="M-12 8 L14 8" stroke="#7C8DA6" strokeWidth="1.4"/>
                <circle cx="9" cy="-6" r="1.6" fill="#B8262A" opacity=".8"/>
              </g>
              {/* brush */}
              <ellipse cx="21" cy="-36" rx="5.5" ry="4.6" fill="url(#sk-skin)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              <g transform="translate(23 -38) rotate(22)">
                <rect x="-2.2" y="-38" width="4.4" height="38" rx="2.2" fill="#7A5640" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <rect x="-3" y="-4" width="6" height="7" rx="1.6" fill="#2B2521"/>
                <path d="M-2.8 3 C-2 10 2 10 2.8 3Z" fill="#2B2521"/>
                <circle cx="0" cy="-39" r="2" fill="#E9BE4E" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
              </g>
              <g transform="translate(0 -100)">
                <circle cx="0" cy="0" r="25" fill="url(#sk-skin)" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <g transform="translate(0 7.5)">
                <SkinFace />
                <path d="M-14 -9.5 C-11 -11.5 -6.5 -11 -3.5 -8.5 M14 -9.5 C11 -11.5 6.5 -11 3.5 -8.5" stroke="#2B2521" strokeWidth="2.3" strokeLinecap="round" fill="none"/>
                <g fill="none" stroke="#4F3820" strokeWidth="1.5"><circle cx="-7.5" cy="-0.5" r="5.4"/><circle cx="7.5" cy="-0.5" r="5.4"/><path d="M-2.1 -0.5 L2.1 -0.5 M-12.9 -1.5 l-6 -2.5 M12.9 -1.5 l6 -2.5"/></g>
                <path d="M-3.5 8.5 q3.5 2.8 7 0" stroke="#8C4A3C" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
                <path d="M-4 14.5 C-2 20 2 20 4 14.5 C2 16.5 -2 16.5 -4 14.5Z" fill="#3B3A46" opacity=".8"/>
</g>
                {/* hair under the gat so no scalp shows */}
                <path d="M-25 -5 C-25 -30 25 -30 25 -5 C16 -11 -16 -11 -25 -5Z" fill="url(#sk-ink-hair)"/>
                {/* gat: wider, taller crown; opaque brim */}
                <path d="M-19 -10 C-19 -46 19 -46 19 -10 Z" fill="#15141C" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <path d="M-13 -36 q13 -3 26 0" stroke="#5A5870" strokeWidth="1.2" opacity=".6" fill="none"/>
                <ellipse cx="0" cy="-10" rx="41" ry="7" fill="#1C1B26" stroke="#2B2521" strokeOpacity=".38" strokeWidth="1.1" strokeLinejoin="round"/>
                <ellipse cx="0" cy="-11.5" rx="34" ry="3.2" fill="#3A3948" opacity=".5"/>
                {/* gat strings: hang straight down beside the jaw, never crossing under the chin */}
                <path d="M-23 -8 L-25 20 M23 -8 L25 20" stroke="#8A6D3A" strokeWidth="1.1" fill="none" opacity=".85"/>
                <g fill="#E9BE4E"><circle cx="-24.2" cy="4" r="1.5"/><circle cx="24.2" cy="4" r="1.5"/><circle cx="-24.7" cy="12" r="1.5"/><circle cx="24.7" cy="12" r="1.5"/><circle cx="-25.1" cy="20" r="1.5"/><circle cx="25.1" cy="20" r="1.5"/></g>
              </g>
            </g>
          </g>
    </g>
  );
}
