import type { ReactNode } from 'react';
import type { WordArtId } from './letterData';

interface WordIllustrationProps {
  id: WordArtId;
  size?: number;
}

function renderArt(id: WordArtId): ReactNode {
  switch (id) {
    /* ================= A ================= */
    case 'apple':
      return (
        <>
          <path d="M50 26 C48 16, 54 12, 58 14" stroke="#6B4C35" strokeWidth="5" strokeLinecap="round" fill="none" />
          <ellipse cx="62" cy="20" rx="10" ry="5.5" transform="rotate(-22 62 20)" fill="#3BA99C" />
          <path d="M50 28 C32 24, 18 38, 20 58 C22 78, 36 88, 50 84 C64 88, 78 78, 80 58 C82 38, 68 24, 50 28 Z" fill="#E85349" />
          <ellipse cx="34" cy="46" rx="5" ry="11" transform="rotate(18 34 46)" fill="#FF8E85" opacity="0.7" />
        </>
      );
    case 'ant':
      return (
        <>
          <g stroke="#4A3528" strokeWidth="3.5" strokeLinecap="round" fill="none">
            <path d="M36 58 L26 74" /><path d="M50 58 L50 76" /><path d="M64 58 L74 74" />
            <path d="M36 56 L22 64" /><path d="M64 56 L78 64" />
            <path d="M27 38 C22 26, 16 24, 14 26" /><path d="M33 36 C32 24, 28 20, 24 20" />
          </g>
          <ellipse cx="72" cy="54" rx="15" ry="12" fill="#8C4A32" />
          <circle cx="51" cy="54" r="10" fill="#A4583D" />
          <circle cx="32" cy="48" r="12" fill="#8C4A32" />
          <circle cx="28" cy="45" r="3" fill="#FFFFFF" /><circle cx="27" cy="45" r="1.6" fill="#1E2433" />
          <path d="M25 52 Q29 56 33 52" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </>
      );
    case 'airplane':
      return (
        <>
          <path d="M46 50 L32 20 L44 20 L60 46 Z" fill="#5B5BD6" />
          <path d="M46 54 L32 82 L44 82 L60 56 Z" fill="#4949C0" />
          <path d="M18 52 L26 36 L34 36 L30 50 Z" fill="#F27A5E" />
          <rect x="18" y="43" width="66" height="18" rx="9" fill="#FFFFFF" stroke="#5B5BD6" strokeWidth="3" />
          <circle cx="42" cy="52" r="3" fill="#5B5BD6" />
          <circle cx="52" cy="52" r="3" fill="#5B5BD6" />
          <circle cx="62" cy="52" r="3" fill="#5B5BD6" />
          <path d="M72 47 Q80 48 81 52 Q74 52 72 47 Z" fill="#3BA99C" />
        </>
      );

    /* ================= B ================= */
    case 'ball':
      return (
        <>
          <circle cx="50" cy="50" r="33" fill="#F2B84B" />
          <path d="M22 34 Q50 48 78 34" stroke="#5B5BD6" strokeWidth="6" fill="none" />
          <path d="M22 66 Q50 52 78 66" stroke="#E85349" strokeWidth="6" fill="none" />
          <circle cx="50" cy="50" r="33" stroke="#1E2433" strokeWidth="2.5" fill="none" opacity="0.18" />
          <circle cx="37" cy="32" r="5" fill="#FFFFFF" opacity="0.55" />
        </>
      );
    case 'bus':
      return (
        <>
          <rect x="14" y="28" width="72" height="42" rx="10" fill="#F2B84B" />
          <rect x="14" y="54" width="72" height="8" fill="#E09B24" />
          <rect x="20" y="34" width="15" height="14" rx="3" fill="#E4F6F3" />
          <rect x="39" y="34" width="15" height="14" rx="3" fill="#E4F6F3" />
          <rect x="58" y="34" width="20" height="16" rx="4" fill="#E4F6F3" />
          <circle cx="30" cy="72" r="9" fill="#1E2433" /><circle cx="30" cy="72" r="4" fill="#FFFFFF" />
          <circle cx="70" cy="72" r="9" fill="#1E2433" /><circle cx="70" cy="72" r="4" fill="#FFFFFF" />
        </>
      );
    case 'bee':
      return (
        <>
          <ellipse cx="44" cy="32" rx="11" ry="15" transform="rotate(-20 44 32)" fill="#D9F3F0" stroke="#3BA99C" strokeWidth="2" />
          <ellipse cx="58" cy="32" rx="11" ry="15" transform="rotate(20 58 32)" fill="#D9F3F0" stroke="#3BA99C" strokeWidth="2" />
          <path d="M76 54 L86 54 L76 59 Z" fill="#1E2433" />
          <ellipse cx="50" cy="56" rx="26" ry="18" fill="#F2B84B" />
          <rect x="42" y="39" width="7" height="34" rx="3" fill="#1E2433" />
          <rect x="56" y="40" width="7" height="32" rx="3" fill="#1E2433" />
          <circle cx="32" cy="52" r="3" fill="#1E2433" />
          <path d="M29 60 Q33 64 37 60" stroke="#1E2433" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      );

    /* ================= C ================= */
    case 'cat':
      return (
        <>
          <polygon points="24,42 20,18 42,30" fill="#F29F58" />
          <polygon points="76,42 80,18 58,30" fill="#F29F58" />
          <polygon points="26,38 24,23 38,31" fill="#FDECE7" />
          <polygon points="74,38 76,23 62,31" fill="#FDECE7" />
          <circle cx="50" cy="55" r="26" fill="#F5AC6B" />
          <circle cx="40" cy="50" r="3.5" fill="#1E2433" />
          <circle cx="60" cy="50" r="3.5" fill="#1E2433" />
          <polygon points="50,58 46,54 54,54" fill="#F27A5E" />
          <path d="M44 63 Q50 67 56 63" stroke="#1E2433" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <g stroke="#7A4E2D" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="54" x2="32" y2="56" /><line x1="18" y1="61" x2="32" y2="60" />
            <line x1="82" y1="54" x2="68" y2="56" /><line x1="82" y1="61" x2="68" y2="60" />
          </g>
        </>
      );
    case 'cake':
      return (
        <>
          <rect x="47" y="18" width="6" height="16" rx="2" fill="#5B5BD6" />
          <ellipse cx="50" cy="14" rx="4" ry="6" fill="#F2B84B" />
          <rect x="20" y="48" width="60" height="32" rx="8" fill="#F29F58" />
          <path d="M20 48 Q20 34 32 34 L68 34 Q80 34 80 48 L80 54 Q72 60 65 53 Q58 60 50 53 Q42 60 35 53 Q28 60 20 54 Z" fill="#F9839E" />
          <circle cx="35" cy="68" r="3.5" fill="#FFF5E1" />
          <circle cx="50" cy="68" r="3.5" fill="#FFF5E1" />
          <circle cx="65" cy="68" r="3.5" fill="#FFF5E1" />
        </>
      );
    case 'car':
      return (
        <>
          <path d="M24 52 L34 32 L66 32 L76 52 Z" fill="#E85349" />
          <path d="M36 36 L48 36 L48 50 L29 50 Z" fill="#E4F6F3" />
          <path d="M52 36 L64 36 L71 50 L52 50 Z" fill="#E4F6F3" />
          <rect x="14" y="48" width="72" height="22" rx="9" fill="#F27A5E" />
          <circle cx="30" cy="72" r="9.5" fill="#1E2433" /><circle cx="30" cy="72" r="4" fill="#FFFFFF" />
          <circle cx="70" cy="72" r="9.5" fill="#1E2433" /><circle cx="70" cy="72" r="4" fill="#FFFFFF" />
        </>
      );

    /* ================= D ================= */
    case 'dog':
      return (
        <>
          <ellipse cx="24" cy="52" rx="9" ry="18" transform="rotate(14 24 52)" fill="#8C583A" />
          <ellipse cx="76" cy="52" rx="9" ry="18" transform="rotate(-14 76 52)" fill="#8C583A" />
          <circle cx="50" cy="52" r="25" fill="#C98A5B" />
          <ellipse cx="50" cy="60" rx="13" ry="10" fill="#F7E5D2" />
          <circle cx="41" cy="46" r="3.5" fill="#1E2433" />
          <circle cx="59" cy="46" r="3.5" fill="#1E2433" />
          <ellipse cx="50" cy="56" rx="5.5" ry="4" fill="#1E2433" />
          <path d="M46 64 Q50 70 54 64" fill="#F27A5E" />
        </>
      );
    case 'duck':
      return (
        <>
          <ellipse cx="54" cy="64" rx="25" ry="16" fill="#F2B84B" />
          <path d="M68 56 L82 48 L76 66 Z" fill="#F2B84B" />
          <circle cx="36" cy="38" r="15" fill="#F7C95C" />
          <path d="M14 38 Q22 33 24 42 Q18 45 14 38 Z" fill="#F27A5E" />
          <circle cx="33" cy="35" r="3" fill="#1E2433" />
          <ellipse cx="54" cy="64" rx="12" ry="7" fill="#E09F2D" />
        </>
      );
    case 'drum':
      return (
        <>
          <line x1="28" y1="18" x2="46" y2="36" stroke="#A46B3E" strokeWidth="4" strokeLinecap="round" />
          <circle cx="47" cy="37" r="4" fill="#A46B3E" />
          <line x1="72" y1="18" x2="54" y2="36" stroke="#A46B3E" strokeWidth="4" strokeLinecap="round" />
          <circle cx="53" cy="37" r="4" fill="#A46B3E" />
          <rect x="22" y="38" width="56" height="40" rx="6" fill="#E85349" />
          <polyline points="22,46 36,72 50,46 64,72 78,46" stroke="#F2B84B" strokeWidth="4" fill="none" />
          <ellipse cx="50" cy="38" rx="28" ry="8" fill="#FAF0DC" stroke="#5B5BD6" strokeWidth="3" />
          <rect x="22" y="72" width="56" height="7" rx="3.5" fill="#5B5BD6" />
        </>
      );

    /* ================= E ================= */
    case 'egg':
      return (
        <>
          <path d="M50 16 C32 16, 23 44, 23 62 C23 78, 35 86, 50 86 C65 86, 77 78, 77 62 C77 44, 68 16, 50 16 Z" fill="#FFF7E6" stroke="#E2C799" strokeWidth="3" />
          <circle cx="50" cy="58" r="13" fill="#F2B84B" />
          <circle cx="45" cy="54" r="3.5" fill="#FFFFFF" opacity="0.6" />
        </>
      );
    case 'elephant':
      return (
        <>
          <circle cx="24" cy="50" r="16" fill="#8C96B2" />
          <circle cx="76" cy="50" r="16" fill="#8C96B2" />
          <circle cx="24" cy="50" r="10" fill="#F7C6CE" />
          <circle cx="76" cy="50" r="10" fill="#F7C6CE" />
          <circle cx="50" cy="48" r="23" fill="#A2ACC7" />
          <circle cx="41" cy="43" r="3.2" fill="#1E2433" />
          <circle cx="59" cy="43" r="3.2" fill="#1E2433" />
          <path d="M50 52 C50 68, 42 78, 34 74" stroke="#A2ACC7" strokeWidth="11" strokeLinecap="round" fill="none" />
        </>
      );
    case 'envelope':
      return (
        <>
          <rect x="16" y="28" width="68" height="46" rx="6" fill="#FFFFFF" stroke="#5B5BD6" strokeWidth="3" />
          <polyline points="17,30 50,56 83,30" fill="#ECEBFF" stroke="#5B5BD6" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="50" cy="55" r="7" fill="#F27A5E" />
        </>
      );

    /* ================= F ================= */
    case 'fish':
      return (
        <>
          <polygon points="70,50 88,32 88,68" fill="#F27A5E" />
          <polygon points="44,30 56,18 58,34" fill="#F2B84B" />
          <ellipse cx="46" cy="50" rx="28" ry="20" fill="#3BA99C" />
          <path d="M38 34 Q46 50 38 66" stroke="#E4F6F3" strokeWidth="3" fill="none" />
          <circle cx="30" cy="46" r="4" fill="#FFFFFF" /><circle cx="29" cy="46" r="2" fill="#1E2433" />
        </>
      );
    case 'frog':
      return (
        <>
          <circle cx="34" cy="30" r="10" fill="#4BB56B" />
          <circle cx="66" cy="30" r="10" fill="#4BB56B" />
          <circle cx="34" cy="29" r="5" fill="#FFFFFF" /><circle cx="34" cy="29" r="2.5" fill="#1E2433" />
          <circle cx="66" cy="29" r="5" fill="#FFFFFF" /><circle cx="66" cy="29" r="2.5" fill="#1E2433" />
          <ellipse cx="50" cy="56" rx="30" ry="22" fill="#58C478" />
          <ellipse cx="50" cy="64" rx="18" ry="10" fill="#D5F5DC" />
          <path d="M34 54 Q50 66 66 54" stroke="#1E2433" strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      );
    case 'flower':
      return (
        <>
          <rect x="47" y="52" width="6" height="34" rx="3" fill="#3BA99C" />
          <ellipse cx="60" cy="70" rx="10" ry="5" transform="rotate(-25 60 70)" fill="#3BA99C" />
          <circle cx="50" cy="24" r="12" fill="#F27A5E" />
          <circle cx="68" cy="37" r="12" fill="#F27A5E" />
          <circle cx="61" cy="56" r="12" fill="#F27A5E" />
          <circle cx="39" cy="56" r="12" fill="#F27A5E" />
          <circle cx="32" cy="37" r="12" fill="#F27A5E" />
          <circle cx="50" cy="41" r="11" fill="#F2B84B" />
        </>
      );

    /* ================= G ================= */
    case 'grapes':
      return (
        <>
          <path d="M50 24 L50 14" stroke="#6B4C35" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="60" cy="20" rx="9" ry="5" transform="rotate(-20 60 20)" fill="#3BA99C" />
          {[
            [36, 36], [50, 36], [64, 36],
            [43, 50], [57, 50],
            [50, 64], [50, 77],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="10.5" fill={i % 2 === 0 ? '#6E56CF' : '#846CE0'} />
          ))}
        </>
      );
    case 'gift':
      return (
        <>
          <ellipse cx="42" cy="26" rx="10" ry="6" transform="rotate(-22 42 26)" fill="#F27A5E" />
          <ellipse cx="58" cy="26" rx="10" ry="6" transform="rotate(22 58 26)" fill="#F27A5E" />
          <rect x="22" y="40" width="56" height="42" rx="6" fill="#5B5BD6" />
          <rect x="18" y="30" width="64" height="14" rx="5" fill="#7070E5" />
          <rect x="45" y="30" width="10" height="52" fill="#F2B84B" />
          <rect x="22" y="55" width="56" height="9" fill="#F2B84B" />
        </>
      );
    case 'guitar':
      return (
        <>
          <rect x="46" y="12" width="8" height="42" rx="3" fill="#8C583A" />
          <circle cx="50" cy="54" r="14" fill="#DF914C" />
          <circle cx="50" cy="70" r="18" fill="#DF914C" />
          <circle cx="50" cy="60" r="7" fill="#5A3722" />
          <rect x="43" y="75" width="14" height="4" rx="2" fill="#5A3722" />
        </>
      );

    /* ================= H ================= */
    case 'hat':
      return (
        <>
          <path d="M28 60 C28 34, 36 26, 50 26 C64 26, 72 34, 72 60 Z" fill="#5B5BD6" />
          <rect x="28" y="50" width="44" height="8" fill="#F2B84B" />
          <ellipse cx="50" cy="62" rx="36" ry="9" fill="#4949C0" />
        </>
      );
    case 'house':
      return (
        <>
          <rect x="62" y="22" width="9" height="18" rx="2" fill="#C9644C" />
          <polygon points="50,18 16,48 84,48" fill="#F27A5E" />
          <rect x="24" y="46" width="52" height="38" rx="4" fill="#FFF7E6" stroke="#E2D6C1" strokeWidth="2" />
          <rect x="44" y="58" width="13" height="26" rx="3" fill="#5B5BD6" />
          <rect x="29" y="54" width="10" height="10" rx="2" fill="#3BA99C" />
          <rect x="62" y="54" width="10" height="10" rx="2" fill="#3BA99C" />
        </>
      );
    case 'heart':
      return (
        <>
          <path d="M50 82 C20 62, 16 38, 30 26 C40 18, 50 26, 50 34 C50 26, 60 18, 70 26 C84 38, 80 62, 50 82 Z" fill="#E85349" />
          <circle cx="34" cy="36" r="5" fill="#FF968E" opacity="0.7" />
        </>
      );

    /* ================= I ================= */
    case 'igloo':
      return (
        <>
          <path d="M16 74 C16 38, 32 24, 50 24 C68 24, 84 38, 84 74 Z" fill="#DDF3F8" stroke="#6BB5C9" strokeWidth="3" />
          <line x1="21" y1="46" x2="79" y2="46" stroke="#8AC7D8" strokeWidth="2.5" />
          <line x1="17" y1="60" x2="83" y2="60" stroke="#8AC7D8" strokeWidth="2.5" />
          <path d="M38 74 C38 56, 62 56, 62 74 Z" fill="#497D96" />
        </>
      );
    case 'ice-cream':
      return (
        <>
          <polygon points="34,52 66,52 50,86" fill="#DF9E5B" />
          <circle cx="40" cy="44" r="13" fill="#F996AC" />
          <circle cx="60" cy="44" r="13" fill="#8CD7C6" />
          <circle cx="50" cy="30" r="14" fill="#FFF4D9" />
          <circle cx="50" cy="17" r="5" fill="#E85349" />
        </>
      );
    case 'island':
      return (
        <>
          <ellipse cx="50" cy="76" rx="36" ry="8" fill="#4FA8D6" />
          <path d="M24 74 C28 58, 72 58, 76 74 Z" fill="#F2C879" />
          <path d="M48 62 Q46 42 54 30" stroke="#8C583A" strokeWidth="6" strokeLinecap="round" fill="none" />
          <ellipse cx="42" cy="28" rx="13" ry="5" transform="rotate(-22 42 28)" fill="#3BA99C" />
          <ellipse cx="64" cy="28" rx="13" ry="5" transform="rotate(22 64 28)" fill="#3BA99C" />
          <ellipse cx="54" cy="22" rx="11" ry="4.5" fill="#2D8C80" />
        </>
      );

    /* ================= J ================= */
    case 'jam':
      return (
        <>
          <rect x="28" y="28" width="44" height="54" rx="10" fill="#D9455F" />
          <rect x="25" y="20" width="50" height="11" rx="5" fill="#3BA99C" />
          <rect x="34" y="44" width="32" height="22" rx="5" fill="#FFF7E6" />
          <circle cx="50" cy="55" r="6" fill="#E85349" />
        </>
      );
    case 'jellyfish':
      return (
        <>
          <g stroke="#9D7FEA" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M34 54 Q30 68 35 82" />
            <path d="M45 54 Q49 68 44 84" />
            <path d="M56 54 Q52 68 57 84" />
            <path d="M66 54 Q70 68 65 82" />
          </g>
          <path d="M22 54 C22 26, 78 26, 78 54 Z" fill="#8B6CE8" />
          <circle cx="42" cy="42" r="3" fill="#FFFFFF" />
          <circle cx="58" cy="42" r="3" fill="#FFFFFF" />
          <path d="M46 48 Q50 52 54 48" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </>
      );
    case 'jet':
      return (
        <>
          <polygon points="50,14 38,54 62,54" fill="#5B5BD6" />
          <polygon points="50,30 16,62 50,56 84,62" fill="#F27A5E" />
          <polygon points="50,54 34,76 66,76" fill="#4949C0" />
          <ellipse cx="50" cy="36" rx="5" ry="9" fill="#E4F6F3" />
          <ellipse cx="50" cy="82" rx="5" ry="7" fill="#F2B84B" />
        </>
      );

    /* ================= K ================= */
    case 'kite':
      return (
        <>
          <path d="M50 68 Q62 78 52 88" stroke="#5C6478" strokeWidth="2.5" fill="none" />
          <polygon points="50,14 76,42 50,70 24,42" fill="#3BA99C" />
          <polygon points="50,14 76,42 50,42" fill="#F2B84B" />
          <polygon points="50,42 24,42 50,70" fill="#F27A5E" />
          <circle cx="56" cy="78" r="4" fill="#5B5BD6" />
        </>
      );
    case 'key':
      return (
        <>
          <circle cx="34" cy="50" r="18" fill="#F2B84B" />
          <circle cx="34" cy="50" r="7" fill="#FEF5E1" />
          <rect x="48" y="45" width="36" height="10" rx="4" fill="#F2B84B" />
          <rect x="66" y="53" width="6" height="11" rx="2" fill="#E09F2D" />
          <rect x="76" y="53" width="6" height="14" rx="2" fill="#E09F2D" />
        </>
      );
    case 'king':
      return (
        <>
          <circle cx="50" cy="60" r="21" fill="#F7C9A6" />
          <path d="M32 68 Q50 84 68 68" fill="#FFFFFF" />
          <circle cx="43" cy="56" r="3" fill="#1E2433" />
          <circle cx="57" cy="56" r="3" fill="#1E2433" />
          <polygon points="28,42 28,20 42,32 50,18 58,32 72,20 72,42" fill="#F2B84B" stroke="#D99B26" strokeWidth="2" />
          <circle cx="50" cy="34" r="3.5" fill="#E85349" />
        </>
      );

    /* ================= L ================= */
    case 'lion':
      return (
        <>
          <circle cx="50" cy="52" r="31" fill="#D97B29" />
          <circle cx="34" cy="34" r="7" fill="#F2B84B" />
          <circle cx="66" cy="34" r="7" fill="#F2B84B" />
          <circle cx="50" cy="52" r="21" fill="#F5C35B" />
          <circle cx="42" cy="48" r="3" fill="#1E2433" />
          <circle cx="58" cy="48" r="3" fill="#1E2433" />
          <polygon points="50,57 45,52 55,52" fill="#8C4A32" />
          <path d="M44 62 Q50 66 56 62" stroke="#8C4A32" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      );
    case 'leaf':
      return (
        <>
          <path d="M24 78 C22 40, 48 18, 78 20 C76 52, 58 76, 24 78 Z" fill="#3BA99C" />
          <path d="M20 82 L70 30" stroke="#1E6B62" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M42 60 L40 44 M54 48 L68 48" stroke="#1E6B62" strokeWidth="2.5" strokeLinecap="round" />
        </>
      );
    case 'lamp':
      return (
        <>
          <ellipse cx="50" cy="56" rx="14" ry="8" fill="#FFF3B0" />
          <rect x="46" y="52" width="8" height="26" fill="#5B5BD6" />
          <rect x="34" y="76" width="32" height="7" rx="3.5" fill="#5B5BD6" />
          <polygon points="32,22 68,22 78,52 22,52" fill="#F2B84B" />
        </>
      );

    /* ================= M ================= */
    case 'moon':
      return (
        <>
          <path d="M62 18 C38 20, 22 40, 26 62 C30 80, 50 88, 70 78 C52 76, 42 60, 44 42 C46 28, 54 21, 62 18 Z" fill="#F2B84B" />
          <circle cx="38" cy="54" r="4" fill="#E09F2D" opacity="0.5" />
          <circle cx="48" cy="70" r="3" fill="#E09F2D" opacity="0.5" />
        </>
      );
    case 'milk':
      return (
        <>
          <polygon points="30,34 50,20 70,34" fill="#5B5BD6" />
          <rect x="30" y="34" width="40" height="48" rx="5" fill="#FFFFFF" stroke="#5B5BD6" strokeWidth="3" />
          <rect x="30" y="50" width="40" height="16" fill="#7CC6EE" />
        </>
      );
    case 'mushroom':
      return (
        <>
          <rect x="39" y="50" width="22" height="32" rx="8" fill="#FFF4E0" stroke="#E0CFAE" strokeWidth="2" />
          <path d="M16 54 C16 24, 84 24, 84 54 Z" fill="#E85349" />
          <circle cx="36" cy="40" r="5.5" fill="#FFFFFF" />
          <circle cx="55" cy="34" r="6.5" fill="#FFFFFF" />
          <circle cx="67" cy="45" r="4.5" fill="#FFFFFF" />
        </>
      );

    /* ================= N ================= */
    case 'nest':
      return (
        <>
          <ellipse cx="40" cy="48" rx="9" ry="12" fill="#8CD7E8" />
          <ellipse cx="55" cy="46" rx="9" ry="12" fill="#A5E1EE" />
          <ellipse cx="64" cy="50" rx="8" ry="11" fill="#8CD7E8" />
          <path d="M16 52 C18 78, 82 78, 84 52 Z" fill="#9E6B43" />
          <path d="M22 58 Q50 68 78 58" stroke="#734A2B" strokeWidth="3" fill="none" />
        </>
      );
    case 'nut':
      return (
        <>
          <path d="M28 46 C28 68, 42 82, 50 84 C58 82, 72 68, 72 46 Z" fill="#C6834B" />
          <path d="M22 46 C22 28, 78 28, 78 46 Z" fill="#7A4824" />
          <rect x="47" y="18" width="6" height="12" rx="3" fill="#5E3518" />
        </>
      );
    case 'net':
      return (
        <>
          <line x1="22" y1="82" x2="54" y2="50" stroke="#8C583A" strokeWidth="6" strokeLinecap="round" />
          <circle cx="62" cy="38" r="20" fill="#E4F6F3" stroke="#3BA99C" strokeWidth="4" />
          <path d="M48 32 L76 32 M46 42 L78 42 M55 22 L55 54 M68 22 L68 54" stroke="#3BA99C" strokeWidth="2" />
        </>
      );

    /* ================= O ================= */
    case 'octopus':
      return (
        <>
          <g stroke="#E86B8B" strokeWidth="6" strokeLinecap="round" fill="none">
            <path d="M32 56 Q20 68 24 78" />
            <path d="M42 58 Q36 74 42 82" />
            <path d="M58 58 Q64 74 58 82" />
            <path d="M68 56 Q80 68 76 78" />
          </g>
          <circle cx="50" cy="40" r="22" fill="#F27999" />
          <circle cx="42" cy="38" r="3.5" fill="#1E2433" />
          <circle cx="58" cy="38" r="3.5" fill="#1E2433" />
          <path d="M45 47 Q50 51 55 47" stroke="#1E2433" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      );
    case 'orange':
      return (
        <>
          <ellipse cx="58" cy="18" rx="9" ry="5" transform="rotate(-20 58 18)" fill="#3BA99C" />
          <circle cx="50" cy="54" r="30" fill="#F58D2E" />
          <circle cx="38" cy="42" r="3" fill="#FFB870" />
          <circle cx="44" cy="36" r="2.5" fill="#FFB870" />
        </>
      );
    case 'owl':
      return (
        <>
          <polygon points="30,32 24,18 40,26" fill="#8C583A" />
          <polygon points="70,32 76,18 60,26" fill="#8C583A" />
          <ellipse cx="50" cy="54" rx="25" ry="28" fill="#9E6847" />
          <ellipse cx="50" cy="64" rx="15" ry="14" fill="#F2DFCE" />
          <circle cx="40" cy="42" r="9" fill="#FFFFFF" /><circle cx="40" cy="42" r="4" fill="#1E2433" />
          <circle cx="60" cy="42" r="9" fill="#FFFFFF" /><circle cx="60" cy="42" r="4" fill="#1E2433" />
          <polygon points="50,52 46,45 54,45" fill="#F2B84B" />
        </>
      );

    /* ================= P ================= */
    case 'pig':
      return (
        <>
          <polygon points="25,38 22,18 40,28" fill="#F493AA" />
          <polygon points="75,38 78,18 60,28" fill="#F493AA" />
          <circle cx="50" cy="54" r="26" fill="#F9A8BC" />
          <circle cx="40" cy="46" r="3.2" fill="#1E2433" />
          <circle cx="60" cy="46" r="3.2" fill="#1E2433" />
          <ellipse cx="50" cy="58" rx="11" ry="8" fill="#EE7895" />
          <circle cx="46" cy="58" r="2.2" fill="#8F344C" />
          <circle cx="54" cy="58" r="2.2" fill="#8F344C" />
        </>
      );
    case 'pizza':
      return (
        <>
          <path d="M22 24 Q50 14 78 24 L50 84 Z" fill="#DF9A4F" />
          <path d="M27 30 Q50 22 73 30 L50 80 Z" fill="#F7CE5B" />
          <circle cx="45" cy="42" r="5" fill="#D9453B" />
          <circle cx="57" cy="48" r="5" fill="#D9453B" />
          <circle cx="49" cy="61" r="4.5" fill="#D9453B" />
        </>
      );
    case 'pencil':
      return (
        <>
          <g transform="rotate(35 50 50)">
            <rect x="42" y="16" width="16" height="10" rx="3" fill="#F493AA" />
            <rect x="42" y="26" width="16" height="44" fill="#F2B84B" />
            <polygon points="42,70 58,70 50,86" fill="#F2DFCE" />
            <polygon points="47,80 53,80 50,86" fill="#1E2433" />
          </g>
        </>
      );

    /* ================= Q ================= */
    case 'queen':
      return (
        <>
          <circle cx="50" cy="58" r="21" fill="#F7C9A6" />
          <circle cx="43" cy="55" r="3" fill="#1E2433" />
          <circle cx="57" cy="55" r="3" fill="#1E2433" />
          <path d="M45 64 Q50 68 55 64" stroke="#E85349" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <polygon points="30,40 33,20 44,32 50,18 56,32 67,20 70,40" fill="#F2B84B" />
          <circle cx="50" cy="33" r="3.5" fill="#5B5BD6" />
        </>
      );
    case 'quilt':
      return (
        <>
          <rect x="20" y="20" width="60" height="60" rx="8" fill="#FFFFFF" stroke="#5B5BD6" strokeWidth="3" />
          <rect x="23" y="23" width="27" height="27" rx="3" fill="#F27A5E" />
          <rect x="50" y="23" width="27" height="27" rx="3" fill="#3BA99C" />
          <rect x="23" y="50" width="27" height="27" rx="3" fill="#F2B84B" />
          <rect x="50" y="50" width="27" height="27" rx="3" fill="#5B5BD6" />
        </>
      );
    case 'quail':
      return (
        <>
          <path d="M36 28 Q32 14 40 16" stroke="#1E2433" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <circle cx="40" cy="16" r="3.5" fill="#1E2433" />
          <ellipse cx="54" cy="60" rx="22" ry="16" fill="#8C7B70" />
          <circle cx="38" cy="40" r="12" fill="#A69488" />
          <polygon points="26,40 18,43 26,46" fill="#F2B84B" />
          <circle cx="35" cy="38" r="2.6" fill="#1E2433" />
        </>
      );

    /* ================= R ================= */
    case 'rocket':
      return (
        <>
          <polygon points="34,58 20,74 36,72" fill="#F27A5E" />
          <polygon points="66,58 80,74 64,72" fill="#F27A5E" />
          <path d="M50 14 C36 28, 34 48, 36 72 L64 72 C66 48, 64 28, 50 14 Z" fill="#FFFFFF" stroke="#5B5BD6" strokeWidth="3" />
          <path d="M50 14 C43 22, 40 28, 39 32 L61 32 C60 28, 57 22, 50 14 Z" fill="#E85349" />
          <circle cx="50" cy="48" r="8" fill="#7CC6EE" stroke="#5B5BD6" strokeWidth="2.5" />
          <ellipse cx="50" cy="80" rx="7" ry="9" fill="#F2B84B" />
        </>
      );
    case 'robot':
      return (
        <>
          <line x1="50" y1="16" x2="50" y2="28" stroke="#5B5BD6" strokeWidth="4" />
          <circle cx="50" cy="14" r="5" fill="#F27A5E" />
          <rect x="24" y="28" width="52" height="46" rx="10" fill="#8BA4C7" />
          <circle cx="39" cy="46" r="6" fill="#FFF7E6" /><circle cx="39" cy="46" r="2.8" fill="#1E2433" />
          <circle cx="61" cy="46" r="6" fill="#FFF7E6" /><circle cx="61" cy="46" r="2.8" fill="#1E2433" />
          <rect x="36" y="60" width="28" height="6" rx="3" fill="#3BA99C" />
        </>
      );
    case 'rainbow':
      return (
        <>
          <path d="M16 70 A34 34 0 0 1 84 70" stroke="#E85349" strokeWidth="7" fill="none" />
          <path d="M23 70 A27 27 0 0 1 77 70" stroke="#F2B84B" strokeWidth="7" fill="none" />
          <path d="M30 70 A20 20 0 0 1 70 70" stroke="#3BA99C" strokeWidth="7" fill="none" />
          <path d="M37 70 A13 13 0 0 1 63 70" stroke="#5B5BD6" strokeWidth="7" fill="none" />
          <circle cx="22" cy="70" r="9" fill="#FFFFFF" />
          <circle cx="78" cy="70" r="9" fill="#FFFFFF" />
        </>
      );

    /* ================= S ================= */
    case 'sun':
      return (
        <>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <rect
              key={deg}
              x="47"
              y="11"
              width="6"
              height="12"
              rx="3"
              fill="#F59B38"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="22" fill="#F2B84B" />
          <circle cx="43" cy="46" r="2.8" fill="#1E2433" />
          <circle cx="57" cy="46" r="2.8" fill="#1E2433" />
          <path d="M44 55 Q50 60 56 55" stroke="#1E2433" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      );
    case 'snowman':
      return (
        <>
          <circle cx="50" cy="66" r="20" fill="#FFFFFF" stroke="#B7D4E3" strokeWidth="2.5" />
          <circle cx="50" cy="38" r="14" fill="#FFFFFF" stroke="#B7D4E3" strokeWidth="2.5" />
          <rect x="38" y="48" width="24" height="6" rx="3" fill="#E85349" />
          <polygon points="50,38 64,41 50,43" fill="#F58D2E" />
          <rect x="38" y="16" width="24" height="10" rx="2" fill="#1E2433" />
          <circle cx="50" cy="62" r="2.5" fill="#1E2433" />
          <circle cx="50" cy="72" r="2.5" fill="#1E2433" />
        </>
      );
    case 'snail':
      return (
        <>
          <path d="M18 72 L78 72 C82 72, 84 62, 74 60 L24 62 Z" fill="#8CD0A4" />
          <circle cx="74" cy="48" r="3" fill="#3BA99C" />
          <line x1="70" y1="62" x2="74" y2="50" stroke="#3BA99C" strokeWidth="3" />
          <circle cx="46" cy="48" r="20" fill="#DF914C" />
          <path d="M46 48 m-10 0 a10 10 0 1 0 20 0 a7 7 0 1 0 -14 0" stroke="#8C4A32" strokeWidth="3" fill="none" />
        </>
      );

    /* ================= T ================= */
    case 'tree':
      return (
        <>
          <rect x="43" y="56" width="14" height="28" rx="3" fill="#8C583A" />
          <circle cx="36" cy="46" r="16" fill="#3BA99C" />
          <circle cx="64" cy="46" r="16" fill="#3BA99C" />
          <circle cx="50" cy="30" r="18" fill="#4BB56B" />
        </>
      );
    case 'turtle':
      return (
        <>
          <ellipse cx="32" cy="70" rx="6" ry="5" fill="#4BB56B" />
          <ellipse cx="64" cy="70" rx="6" ry="5" fill="#4BB56B" />
          <circle cx="76" cy="54" r="10" fill="#58C478" />
          <circle cx="79" cy="52" r="2.4" fill="#1E2433" />
          <path d="M22 64 C22 34, 68 34, 68 64 Z" fill="#2D8C80" />
          <path d="M36 44 L54 44 L60 60 L30 60 Z" stroke="#A6E3D8" strokeWidth="2.5" fill="none" />
        </>
      );
    case 'tent':
      return (
        <>
          <polygon points="50,20 16,78 84,78" fill="#F2B84B" />
          <polygon points="50,20 38,78 62,78" fill="#5B5BD6" />
          <polygon points="50,48 42,78 58,78" fill="#1E2433" />
        </>
      );

    /* ================= U ================= */
    case 'umbrella':
      return (
        <>
          <path d="M50 48 L50 76 C50 84, 38 84, 38 76" stroke="#8C583A" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M16 52 C18 22, 82 22, 84 52 Z" fill="#5B5BD6" />
          <path d="M36 52 C38 26, 62 26, 64 52 Z" fill="#F27A5E" />
        </>
      );
    case 'unicorn':
      return (
        <>
          <polygon points="62,32 76,12 52,26" fill="#F2B84B" />
          <circle cx="34" cy="40" r="10" fill="#F493AA" />
          <circle cx="30" cy="56" r="10" fill="#8B6CE8" />
          <ellipse cx="52" cy="54" rx="22" ry="18" fill="#FFFFFF" stroke="#D8D1EE" strokeWidth="2.5" />
          <circle cx="58" cy="50" r="3" fill="#1E2433" />
        </>
      );
    case 'ukulele':
      return (
        <>
          <rect x="46" y="14" width="8" height="36" rx="3" fill="#7A4824" />
          <circle cx="50" cy="52" r="12" fill="#E5A25D" />
          <circle cx="50" cy="68" r="16" fill="#E5A25D" />
          <circle cx="50" cy="58" r="5.5" fill="#5E3518" />
        </>
      );

    /* ================= V ================= */
    case 'van':
      return (
        <>
          <rect x="16" y="30" width="68" height="38" rx="10" fill="#3BA99C" />
          <rect x="22" y="36" width="22" height="14" rx="3" fill="#E4F6F3" />
          <rect x="50" y="36" width="28" height="14" rx="3" fill="#E4F6F3" />
          <circle cx="32" cy="70" r="9" fill="#1E2433" /><circle cx="32" cy="70" r="4" fill="#FFFFFF" />
          <circle cx="68" cy="70" r="9" fill="#1E2433" /><circle cx="68" cy="70" r="4" fill="#FFFFFF" />
        </>
      );
    case 'volcano':
      return (
        <>
          <circle cx="46" cy="20" r="7" fill="#9AA2B2" />
          <circle cx="56" cy="18" r="8" fill="#B2B9C7" />
          <polygon points="36,34 64,34 82,80 18,80" fill="#7A5B47" />
          <path d="M36 34 Q42 52 46 44 Q50 56 55 44 Q60 52 64 34 Z" fill="#F25C3B" />
        </>
      );
    case 'violin':
      return (
        <>
          <rect x="47" y="12" width="6" height="40" rx="2" fill="#5E3518" />
          <circle cx="50" cy="52" r="13" fill="#C6723B" />
          <circle cx="50" cy="70" r="17" fill="#C6723B" />
          <line x1="28" y1="68" x2="76" y2="38" stroke="#8C583A" strokeWidth="3" strokeLinecap="round" />
        </>
      );

    /* ================= W ================= */
    case 'whale':
      return (
        <>
          <path d="M44 26 Q40 16 32 18 M46 26 Q50 16 58 18" stroke="#6EC1E4" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M18 58 C18 34, 58 32, 68 54 L84 44 L80 62 L86 70 L66 64 C56 72, 18 72, 18 58 Z" fill="#4A8FE0" />
          <circle cx="32" cy="52" r="3" fill="#FFFFFF" />
        </>
      );
    case 'watermelon':
      return (
        <>
          <path d="M16 38 A34 34 0 0 0 84 38 Z" fill="#3BA99C" />
          <path d="M22 38 A28 28 0 0 0 78 38 Z" fill="#E85349" />
          <circle cx="40" cy="48" r="2.5" fill="#1E2433" />
          <circle cx="50" cy="54" r="2.5" fill="#1E2433" />
          <circle cx="60" cy="48" r="2.5" fill="#1E2433" />
        </>
      );
    case 'watch':
      return (
        <>
          <rect x="40" y="14" width="20" height="72" rx="6" fill="#5B5BD6" />
          <circle cx="50" cy="50" r="20" fill="#FFFFFF" stroke="#F2B84B" strokeWidth="4" />
          <polyline points="50,38 50,50 59,54" stroke="#1E2433" strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      );

    /* ================= X ================= */
    case 'xylophone':
      return (
        <>
          <rect x="18" y="28" width="12" height="46" rx="4" fill="#E85349" />
          <rect x="34" y="32" width="12" height="38" rx="4" fill="#F2B84B" />
          <rect x="50" y="36" width="12" height="30" rx="4" fill="#3BA99C" />
          <rect x="66" y="40" width="12" height="22" rx="4" fill="#5B5BD6" />
        </>
      );
    case 'x-ray':
      return (
        <>
          <rect x="22" y="16" width="56" height="68" rx="8" fill="#1E293B" />
          <line x1="50" y1="28" x2="50" y2="70" stroke="#7CE8E0" strokeWidth="4" strokeLinecap="round" />
          <path d="M36 36 Q50 32 64 36 M34 48 Q50 44 66 48 M38 60 Q50 56 62 60" stroke="#7CE8E0" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </>
      );
    case 'x-ray-fish':
      return (
        <>
          <polygon points="70,50 86,34 86,66" fill="#5BC8BF" />
          <ellipse cx="46" cy="50" rx="28" ry="19" fill="#8BE0D8" stroke="#2D8C80" strokeWidth="2.5" />
          <line x1="36" y1="50" x2="64" y2="50" stroke="#FFFFFF" strokeWidth="3" />
          <line x1="44" y1="42" x2="44" y2="58" stroke="#FFFFFF" strokeWidth="2.5" />
          <line x1="52" y1="42" x2="52" y2="58" stroke="#FFFFFF" strokeWidth="2.5" />
          <line x1="60" y1="44" x2="60" y2="56" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="28" cy="46" r="3" fill="#1E2433" />
        </>
      );

    /* ================= Y ================= */
    case 'yo-yo':
      return (
        <>
          <path d="M50 32 Q64 18 46 12" stroke="#5C6478" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="50" cy="56" r="24" fill="#F27A5E" />
          <circle cx="50" cy="56" r="12" fill="#F2B84B" />
          <circle cx="50" cy="56" r="4" fill="#FFFFFF" />
        </>
      );
    case 'yacht':
      return (
        <>
          <polygon points="48,16 48,58 22,58" fill="#FFFFFF" stroke="#5B5BD6" strokeWidth="2.5" />
          <polygon points="52,24 52,58 76,58" fill="#F27A5E" />
          <path d="M18 62 L82 62 L72 78 L28 78 Z" fill="#5B5BD6" />
        </>
      );
    case 'yarn':
      return (
        <>
          <circle cx="48" cy="52" r="25" fill="#9D7FEA" />
          <path d="M28 42 Q48 56 68 40 M26 56 Q48 68 70 54 M36 30 Q54 48 60 72" stroke="#6E56CF" strokeWidth="3" fill="none" />
          <path d="M68 66 Q80 76 84 68" stroke="#9D7FEA" strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      );

    /* ================= Z ================= */
    case 'zebra':
      return (
        <>
          <circle cx="50" cy="52" r="25" fill="#FFFFFF" stroke="#1E2433" strokeWidth="2.5" />
          <path d="M30 40 L42 44 M70 40 L58 44 M28 52 L40 52 M72 52 L60 52" stroke="#1E2433" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="50" cy="64" rx="12" ry="9" fill="#1E2433" />
          <circle cx="42" cy="46" r="3" fill="#1E2433" />
          <circle cx="58" cy="46" r="3" fill="#1E2433" />
        </>
      );
    case 'zipper':
      return (
        <>
          <rect x="26" y="16" width="20" height="68" rx="4" fill="#5B5BD6" />
          <rect x="54" y="16" width="20" height="68" rx="4" fill="#5B5BD6" />
          {[24, 34, 44, 54, 64, 74].map((y, idx) => (
            <rect key={y} x={idx % 2 === 0 ? 45 : 49} y={y} width="6" height="5" rx="1" fill="#F2B84B" />
          ))}
          <rect x="43" y="36" width="14" height="18" rx="4" fill="#F2B84B" stroke="#1E2433" strokeWidth="2" />
        </>
      );
    case 'zoo':
      return (
        <>
          <path d="M20 40 Q50 18 80 40" stroke="#F27A5E" strokeWidth="8" strokeLinecap="round" fill="none" />
          <rect x="22" y="38" width="8" height="42" rx="3" fill="#8C583A" />
          <rect x="70" y="38" width="8" height="42" rx="3" fill="#8C583A" />
          <circle cx="50" cy="60" r="14" fill="#F2B84B" />
          <circle cx="45" cy="57" r="2.2" fill="#1E2433" />
          <circle cx="55" cy="57" r="2.2" fill="#1E2433" />
        </>
      );
  }
}

export function WordIllustration({ id, size = 76 }: WordIllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {renderArt(id)}
    </svg>
  );
}
