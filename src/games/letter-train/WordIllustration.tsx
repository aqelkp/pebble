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

    /* ================= EXPANDED A–Z WORDS (78 MORE = 156 TOTAL) ================= */
    case 'alligator':
      return (
        <>
          <path d="M14 60 Q28 42 54 46 L86 50 Q88 64 72 66 L18 66 Z" fill="#3BA99C" />
          <polygon points="62,56 66,62 70,56 74,62 78,56" fill="#FFFFFF" />
          <circle cx="46" cy="44" r="7" fill="#3BA99C" />
          <circle cx="46" cy="43" r="3" fill="#FFFFFF" /><circle cx="47" cy="43" r="1.5" fill="#1E2433" />
          <polygon points="24,48 28,40 33,47 38,40 42,46" fill="#267F75" />
        </>
      );
    case 'anchor':
      return (
        <>
          <circle cx="50" cy="22" r="7" stroke="#5B5BD6" strokeWidth="5" fill="none" />
          <line x1="50" y1="29" x2="50" y2="78" stroke="#5B5BD6" strokeWidth="6" strokeLinecap="round" />
          <line x1="34" y1="40" x2="66" y2="40" stroke="#5B5BD6" strokeWidth="6" strokeLinecap="round" />
          <path d="M22 58 Q50 90 78 58" stroke="#5B5BD6" strokeWidth="6" strokeLinecap="round" fill="none" />
          <polygon points="18,54 28,56 22,65" fill="#5B5BD6" />
          <polygon points="82,54 72,56 78,65" fill="#5B5BD6" />
        </>
      );
    case 'acorn':
      return (
        <>
          <path d="M28 46 C28 72, 42 84, 50 86 C58 84, 72 72, 72 46 Z" fill="#D59252" />
          <path d="M22 48 C22 28, 78 28, 78 48 Z" fill="#7A4824" />
          <path d="M50 28 Q52 16 60 18" stroke="#5E3518" strokeWidth="5" strokeLinecap="round" fill="none" />
        </>
      );

    case 'banana':
      return (
        <>
          <path d="M24 68 C36 82, 74 70, 78 28 C70 26, 66 32, 64 42 C58 60, 40 66, 26 58 Z" fill="#F5C945" />
          <rect x="74" y="22" width="6" height="8" rx="2" fill="#7A4824" />
        </>
      );
    case 'boat':
      return (
        <>
          <polygon points="48,18 48,54 24,54" fill="#F27A5E" />
          <polygon points="52,26 52,54 74,54" fill="#F2B84B" />
          <path d="M16 58 L84 58 L72 76 L28 76 Z" fill="#5B5BD6" />
          <path d="M14 80 Q32 74 50 80 Q68 86 86 80" stroke="#4FA8D6" strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      );
    case 'bear':
      return (
        <>
          <circle cx="28" cy="30" r="11" fill="#8C583A" />
          <circle cx="72" cy="30" r="11" fill="#8C583A" />
          <circle cx="28" cy="30" r="6" fill="#D59B74" />
          <circle cx="72" cy="30" r="6" fill="#D59B74" />
          <circle cx="50" cy="54" r="27" fill="#9E6544" />
          <ellipse cx="50" cy="62" rx="12" ry="10" fill="#EBD0B9" />
          <circle cx="40" cy="48" r="3.2" fill="#1E2433" />
          <circle cx="60" cy="48" r="3.2" fill="#1E2433" />
          <ellipse cx="50" cy="58" rx="5" ry="3.5" fill="#1E2433" />
        </>
      );

    case 'carrot':
      return (
        <>
          <ellipse cx="44" cy="22" rx="5" ry="11" transform="rotate(-22 44 22)" fill="#3BA99C" />
          <ellipse cx="50" cy="20" rx="5" ry="12" fill="#2D8C80" />
          <ellipse cx="56" cy="22" rx="5" ry="11" transform="rotate(22 56 22)" fill="#3BA99C" />
          <polygon points="34,30 66,30 50,86" fill="#F58233" />
          <line x1="40" y1="44" x2="52" y2="44" stroke="#D96218" strokeWidth="3" strokeLinecap="round" />
          <line x1="45" y1="58" x2="56" y2="58" stroke="#D96218" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case 'cow':
      return (
        <>
          <ellipse cx="22" cy="40" rx="8" ry="5" fill="#1E2433" />
          <ellipse cx="78" cy="40" rx="8" ry="5" fill="#1E2433" />
          <circle cx="50" cy="50" r="24" fill="#FFFFFF" stroke="#D8D3C8" strokeWidth="2.5" />
          <circle cx="38" cy="38" r="7" fill="#1E2433" />
          <ellipse cx="50" cy="64" rx="18" ry="11" fill="#F9B4C4" />
          <circle cx="43" cy="64" r="2.5" fill="#9E475C" />
          <circle cx="57" cy="64" r="2.5" fill="#9E475C" />
          <circle cx="42" cy="48" r="3" fill="#1E2433" />
          <circle cx="58" cy="48" r="3" fill="#1E2433" />
        </>
      );
    case 'cup':
      return (
        <>
          <path d="M68 42 C82 42, 82 64, 68 64" stroke="#5B5BD6" strokeWidth="6" fill="none" />
          <path d="M24 32 L70 32 L64 76 C63 81, 31 81, 30 76 Z" fill="#5B5BD6" />
          <rect x="24" y="46" width="44" height="8" fill="#F2B84B" />
        </>
      );

    case 'donut':
      return (
        <>
          <circle cx="50" cy="50" r="30" fill="#E3A15C" />
          <circle cx="50" cy="50" r="25" fill="#F484A4" />
          <circle cx="50" cy="50" r="10" fill="#FEF5E1" />
          <rect x="34" y="30" width="6" height="3" rx="1.5" fill="#FFFFFF" transform="rotate(-25 34 30)" />
          <rect x="60" y="34" width="6" height="3" rx="1.5" fill="#F2B84B" transform="rotate(20 60 34)" />
          <rect x="62" y="58" width="6" height="3" rx="1.5" fill="#3BA99C" transform="rotate(-15 62 58)" />
          <rect x="32" y="60" width="6" height="3" rx="1.5" fill="#5B5BD6" transform="rotate(30 32 60)" />
        </>
      );
    case 'door':
      return (
        <>
          <rect x="28" y="16" width="44" height="70" rx="5" fill="#8C583A" />
          <rect x="34" y="22" width="32" height="24" rx="3" fill="#A86E4C" />
          <rect x="34" y="52" width="32" height="26" rx="3" fill="#A86E4C" />
          <circle cx="63" cy="52" r="4" fill="#F2B84B" />
        </>
      );
    case 'dolphin':
      return (
        <>
          <path d="M20 64 C24 34, 62 24, 78 48 C64 46, 46 54, 34 72 L22 78 L26 66 Z" fill="#4FA8D6" />
          <polygon points="48,32 56,18 60,34" fill="#398AB9" />
          <circle cx="66" cy="42" r="2.8" fill="#1E2433" />
        </>
      );

    case 'engine':
      return (
        <>
          <rect x="24" y="24" width="12" height="18" rx="3" fill="#1E2433" />
          <rect x="48" y="30" width="30" height="38" rx="6" fill="#E85349" />
          <rect x="20" y="40" width="34" height="28" rx="6" fill="#5B5BD6" />
          <rect x="55" y="36" width="16" height="14" rx="3" fill="#E4F6F3" />
          <circle cx="32" cy="72" r="9" fill="#1E2433" /><circle cx="32" cy="72" r="4" fill="#F2B84B" />
          <circle cx="64" cy="72" r="11" fill="#1E2433" /><circle cx="64" cy="72" r="4.5" fill="#F2B84B" />
        </>
      );
    case 'eagle':
      return (
        <>
          <circle cx="50" cy="56" r="24" fill="#6E472B" />
          <path d="M28 48 C28 24, 72 24, 72 48 Q60 54 50 48 Q40 54 28 48 Z" fill="#FFFFFF" />
          <path d="M42 52 Q50 46 58 52 L50 66 Z" fill="#F2B84B" />
          <circle cx="40" cy="42" r="3" fill="#1E2433" />
          <circle cx="60" cy="42" r="3" fill="#1E2433" />
        </>
      );
    case 'earth':
      return (
        <>
          <circle cx="50" cy="50" r="32" fill="#4A9EE0" />
          <path d="M32 28 Q46 32 44 46 Q36 56 26 48 Z" fill="#4BB56B" />
          <path d="M56 34 Q74 38 72 58 Q60 72 52 56 Z" fill="#4BB56B" />
          <path d="M36 64 Q46 62 48 76 Q36 78 36 64 Z" fill="#4BB56B" />
        </>
      );

    case 'firetruck':
      return (
        <>
          <rect x="18" y="24" width="44" height="7" rx="3" fill="#FFFFFF" stroke="#B8C0CC" strokeWidth="2" />
          <rect x="14" y="34" width="50" height="34" rx="6" fill="#E85349" />
          <rect x="58" y="40" width="26" height="28" rx="6" fill="#E85349" />
          <rect x="64" y="45" width="15" height="12" rx="3" fill="#E4F6F3" />
          <circle cx="66" cy="34" r="4" fill="#F2B84B" />
          <circle cx="30" cy="70" r="9" fill="#1E2433" /><circle cx="30" cy="70" r="4" fill="#FFFFFF" />
          <circle cx="70" cy="70" r="9" fill="#1E2433" /><circle cx="70" cy="70" r="4" fill="#FFFFFF" />
        </>
      );
    case 'fox':
      return (
        <>
          <polygon points="22,42 20,16 42,30" fill="#EA6A32" />
          <polygon points="78,42 80,16 58,30" fill="#EA6A32" />
          <polygon points="20,46 80,46 50,82" fill="#F27A3A" />
          <polygon points="20,46 42,56 50,82" fill="#FFFFFF" />
          <polygon points="80,46 58,56 50,82" fill="#FFFFFF" />
          <circle cx="41" cy="48" r="3" fill="#1E2433" />
          <circle cx="59" cy="48" r="3" fill="#1E2433" />
          <circle cx="50" cy="79" r="4.5" fill="#1E2433" />
        </>
      );
    case 'feather':
      return (
        <>
          <path d="M26 80 C28 42, 54 20, 78 18 C76 48, 58 72, 26 80 Z" fill="#5B5BD6" />
          <path d="M26 80 C34 54, 54 32, 78 18" stroke="#ECEBFF" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <line x1="20" y1="86" x2="32" y2="74" stroke="#ECEBFF" strokeWidth="4" strokeLinecap="round" />
        </>
      );

    case 'giraffe':
      return (
        <>
          <rect x="42" y="38" width="16" height="46" rx="6" fill="#F5C35B" />
          <line x1="44" y1="16" x2="44" y2="28" stroke="#8C583A" strokeWidth="3.5" />
          <circle cx="44" cy="15" r="3.5" fill="#8C583A" />
          <line x1="56" y1="16" x2="56" y2="28" stroke="#8C583A" strokeWidth="3.5" />
          <circle cx="56" cy="15" r="3.5" fill="#8C583A" />
          <ellipse cx="52" cy="34" rx="16" ry="12" fill="#F5C35B" />
          <circle cx="48" cy="54" r="4" fill="#A4583D" />
          <circle cx="53" cy="68" r="4.5" fill="#A4583D" />
          <circle cx="56" cy="32" r="2.8" fill="#1E2433" />
        </>
      );
    case 'goat':
      return (
        <>
          <path d="M36 28 Q28 14 22 22" stroke="#9E8B76" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M64 28 Q72 14 78 22" stroke="#9E8B76" strokeWidth="5" strokeLinecap="round" fill="none" />
          <ellipse cx="50" cy="52" rx="22" ry="24" fill="#EDE7DC" />
          <polygon points="46,74 54,74 50,86" fill="#C7BBAF" />
          <circle cx="42" cy="48" r="3" fill="#1E2433" />
          <circle cx="58" cy="48" r="3" fill="#1E2433" />
        </>
      );
    case 'glasses':
      return (
        <>
          <circle cx="32" cy="52" r="16" fill="#DDF3F8" stroke="#5B5BD6" strokeWidth="5" />
          <circle cx="68" cy="52" r="16" fill="#DDF3F8" stroke="#5B5BD6" strokeWidth="5" />
          <path d="M48 50 Q50 44 52 50" stroke="#5B5BD6" strokeWidth="5" fill="none" />
        </>
      );

    case 'horse':
      return (
        <>
          <path d="M30 24 L30 74" stroke="#5E3518" strokeWidth="10" strokeLinecap="round" />
          <polygon points="36,26 32,14 44,22" fill="#9E6238" />
          <path d="M34 22 L66 36 C74 40, 72 54, 62 54 L46 52 L46 80 L30 80 Z" fill="#A86B40" />
          <circle cx="50" cy="36" r="3" fill="#1E2433" />
        </>
      );
    case 'helicopter':
      return (
        <>
          <line x1="20" y1="22" x2="80" y2="22" stroke="#1E2433" strokeWidth="5" strokeLinecap="round" />
          <line x1="50" y1="22" x2="50" y2="34" stroke="#1E2433" strokeWidth="4" />
          <line x1="16" y1="52" x2="36" y2="52" stroke="#5B5BD6" strokeWidth="7" strokeLinecap="round" />
          <ellipse cx="54" cy="52" rx="24" ry="18" fill="#F27A5E" />
          <path d="M56 38 C70 38, 76 46, 76 54 L56 54 Z" fill="#E4F6F3" />
          <line x1="34" y1="76" x2="74" y2="76" stroke="#1E2433" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 'hammer':
      return (
        <>
          <rect x="45" y="34" width="10" height="50" rx="4" fill="#C98A5B" />
          <path d="M24 22 L70 22 Q78 22 78 34 L68 34 Q68 28 62 28 L24 36 Z" fill="#6E788C" />
          <rect x="22" y="20" width="16" height="18" rx="3" fill="#535C70" />
        </>
      );

    case 'iguana':
      return (
        <>
          <path d="M20 68 Q12 52 26 48" stroke="#3BA99C" strokeWidth="7" strokeLinecap="round" fill="none" />
          <ellipse cx="52" cy="56" rx="26" ry="14" fill="#4BB56B" />
          <circle cx="72" cy="46" r="12" fill="#58C478" />
          <polygon points="36,44 40,36 45,43 50,36 55,43" fill="#F2B84B" />
          <circle cx="75" cy="44" r="2.6" fill="#1E2433" />
        </>
      );
    case 'insect':
      return (
        <>
          <g stroke="#1E2433" strokeWidth="3" strokeLinecap="round">
            <line x1="28" y1="42" x2="18" y2="34" /><line x1="72" y1="42" x2="82" y2="34" />
            <line x1="26" y1="56" x2="16" y2="56" /><line x1="74" y1="56" x2="84" y2="56" />
            <line x1="28" y1="70" x2="18" y2="78" /><line x1="72" y1="70" x2="82" y2="78" />
          </g>
          <ellipse cx="50" cy="58" rx="22" ry="24" fill="#3BA99C" />
          <circle cx="50" cy="30" r="11" fill="#1E2433" />
          <line x1="50" y1="36" x2="50" y2="82" stroke="#1E6B62" strokeWidth="3" />
        </>
      );
    case 'iron':
      return (
        <>
          <path d="M30 42 L30 28 L64 28" stroke="#5B5BD6" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M18 68 L78 68 C78 46, 58 40, 26 40 Z" fill="#7070E5" />
          <rect x="16" y="68" width="66" height="7" rx="3" fill="#B8C0CC" />
        </>
      );

    case 'juice':
      return (
        <>
          <polyline points="54,32 60,16 70,16" stroke="#F27A5E" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <rect x="30" y="30" width="40" height="52" rx="7" fill="#F59B38" />
          <circle cx="50" cy="56" r="11" fill="#FFF4D9" />
          <circle cx="50" cy="56" r="7" fill="#F2B84B" />
        </>
      );
    case 'jacket':
      return (
        <>
          <polygon points="32,24 68,24 84,48 72,54 66,42 66,80 34,80 34,42 28,54 16,48" fill="#5B5BD6" />
          <line x1="50" y1="24" x2="50" y2="80" stroke="#F2B84B" strokeWidth="4" />
        </>
      );
    case 'jigsaw':
      return (
        <>
          <rect x="26" y="26" width="48" height="48" rx="7" fill="#3BA99C" />
          <circle cx="50" cy="24" r="9" fill="#3BA99C" />
          <circle cx="76" cy="50" r="9" fill="#3BA99C" />
        </>
      );

    case 'koala':
      return (
        <>
          <circle cx="24" cy="42" r="14" fill="#8D95A5" />
          <circle cx="76" cy="42" r="14" fill="#8D95A5" />
          <circle cx="24" cy="42" r="7" fill="#EDEFF5" />
          <circle cx="76" cy="42" r="7" fill="#EDEFF5" />
          <circle cx="50" cy="52" r="24" fill="#A4AEBF" />
          <ellipse cx="50" cy="56" rx="8" ry="12" fill="#2E3442" />
          <circle cx="38" cy="46" r="3" fill="#1E2433" />
          <circle cx="62" cy="46" r="3" fill="#1E2433" />
        </>
      );
    case 'kettle':
      return (
        <>
          <path d="M34 38 C34 18, 66 18, 66 38" stroke="#1E2433" strokeWidth="5" fill="none" />
          <path d="M66 52 L82 40" stroke="#E85349" strokeWidth="8" strokeLinecap="round" />
          <path d="M24 74 C24 40, 76 40, 76 74 Z" fill="#E85349" />
          <circle cx="50" cy="36" r="4.5" fill="#F2B84B" />
        </>
      );
    case 'kangaroo':
      return (
        <>
          <polygon points="40,28 36,12 48,24" fill="#C9834B" />
          <polygon points="56,28 60,12 48,24" fill="#C9834B" />
          <ellipse cx="50" cy="62" rx="18" ry="20" fill="#D58F56" />
          <circle cx="48" cy="34" r="12" fill="#D58F56" />
          <path d="M36 66 A14 12 0 0 0 64 66 Z" fill="#F2D7BC" />
          <path d="M34 74 Q16 74 18 58" stroke="#C9834B" strokeWidth="7" strokeLinecap="round" fill="none" />
          <circle cx="45" cy="32" r="2.5" fill="#1E2433" />
        </>
      );

    case 'lemon':
      return (
        <>
          <ellipse cx="50" cy="52" rx="30" ry="22" fill="#F7D53B" />
          <circle cx="20" cy="52" r="5" fill="#F7D53B" />
          <circle cx="80" cy="52" r="5" fill="#F7D53B" />
          <ellipse cx="56" cy="24" rx="9" ry="5" transform="rotate(-18 56 24)" fill="#3BA99C" />
        </>
      );
    case 'ladybug':
      return (
        <>
          <circle cx="50" cy="26" r="12" fill="#1E2433" />
          <circle cx="50" cy="56" r="26" fill="#E85349" />
          <line x1="50" y1="30" x2="50" y2="82" stroke="#1E2433" strokeWidth="3.5" />
          <circle cx="37" cy="48" r="4.5" fill="#1E2433" />
          <circle cx="63" cy="48" r="4.5" fill="#1E2433" />
          <circle cx="39" cy="65" r="4.5" fill="#1E2433" />
          <circle cx="61" cy="65" r="4.5" fill="#1E2433" />
        </>
      );
    case 'ladder':
      return (
        <>
          <line x1="34" y1="16" x2="34" y2="84" stroke="#C98A5B" strokeWidth="7" strokeLinecap="round" />
          <line x1="66" y1="16" x2="66" y2="84" stroke="#C98A5B" strokeWidth="7" strokeLinecap="round" />
          {[28, 43, 58, 73].map((y) => (
            <line key={y} x1="34" y1={y} x2="66" y2={y} stroke="#A86B40" strokeWidth="5" />
          ))}
        </>
      );

    case 'monkey':
      return (
        <>
          <circle cx="22" cy="50" r="10" fill="#8C583A" />
          <circle cx="78" cy="50" r="10" fill="#8C583A" />
          <circle cx="22" cy="50" r="5.5" fill="#F2CFAF" />
          <circle cx="78" cy="50" r="5.5" fill="#F2CFAF" />
          <circle cx="50" cy="50" r="24" fill="#8C583A" />
          <ellipse cx="50" cy="58" rx="16" ry="12" fill="#F2CFAF" />
          <circle cx="42" cy="44" r="6" fill="#F2CFAF" /><circle cx="42" cy="44" r="2.8" fill="#1E2433" />
          <circle cx="58" cy="44" r="6" fill="#F2CFAF" /><circle cx="58" cy="44" r="2.8" fill="#1E2433" />
          <path d="M43 61 Q50 67 57 61" stroke="#1E2433" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      );
    case 'mango':
      return (
        <>
          <ellipse cx="58" cy="18" rx="9" ry="4.5" transform="rotate(-20 58 18)" fill="#3BA99C" />
          <path d="M48 22 C28 22, 22 48, 30 68 C38 84, 58 86, 68 72 C76 60, 72 22, 48 22 Z" fill="#F5A623" />
          <ellipse cx="42" cy="42" rx="7" ry="13" fill="#F7CE5B" opacity="0.55" />
        </>
      );
    case 'magnet':
      return (
        <>
          <path d="M28 24 L28 54 A22 22 0 0 0 72 54 L72 24" stroke="#E85349" strokeWidth="14" fill="none" />
          <rect x="21" y="18" width="14" height="12" rx="2" fill="#B8C0CC" />
          <rect x="65" y="18" width="14" height="12" rx="2" fill="#B8C0CC" />
        </>
      );

    case 'noodles':
      return (
        <>
          <path d="M30 22 L76 30 M28 30 L74 36" stroke="#8C583A" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M26 48 Q38 38 50 48 Q62 58 74 48" stroke="#F5C945" strokeWidth="5" fill="none" />
          <path d="M24 54 Q38 44 52 54 Q64 62 76 54" stroke="#F5C945" strokeWidth="5" fill="none" />
          <path d="M18 54 A32 26 0 0 0 82 54 Z" fill="#E85349" />
        </>
      );
    case 'notebook':
      return (
        <>
          <rect x="28" y="18" width="46" height="64" rx="6" fill="#5B5BD6" />
          <rect x="38" y="32" width="26" height="14" rx="3" fill="#FFF7E6" />
          {[26, 38, 50, 62, 74].map((y) => (
            <rect key={y} x="23" y={y - 2} width="9" height="4" rx="2" fill="#F2B84B" />
          ))}
        </>
      );
    case 'necklace':
      return (
        <>
          <circle cx="50" cy="46" r="24" stroke="#D9A84E" strokeWidth="3" fill="none" />
          {[
            [26, 46], [30, 60], [40, 68], [60, 68], [70, 60], [74, 46],
          ].map(([cx, cy], idx) => (
            <circle key={idx} cx={cx} cy={cy} r="4.5" fill="#3BA99C" />
          ))}
          <circle cx="50" cy="72" r="7" fill="#F27A5E" />
        </>
      );

    case 'onion':
      return (
        <>
          <path d="M46 22 L50 12 L54 22" stroke="#4BB56B" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M50 22 C34 34, 24 46, 24 62 C24 76, 36 84, 50 84 C64 84, 76 76, 76 62 C76 46, 66 34, 50 22 Z" fill="#B565A7" />
          <path d="M50 26 C42 40, 38 52, 38 66 C38 74, 44 80, 50 82" stroke="#D597CA" strokeWidth="2.5" fill="none" />
        </>
      );
    case 'otter':
      return (
        <>
          <circle cx="28" cy="36" r="7" fill="#7A4E2D" />
          <circle cx="72" cy="36" r="7" fill="#7A4E2D" />
          <circle cx="50" cy="52" r="25" fill="#8C5B38" />
          <ellipse cx="50" cy="58" rx="15" ry="10" fill="#EBD3BC" />
          <ellipse cx="50" cy="54" rx="5" ry="3.5" fill="#1E2433" />
          <circle cx="40" cy="45" r="3" fill="#1E2433" />
          <circle cx="60" cy="45" r="3" fill="#1E2433" />
        </>
      );
    case 'ostrich':
      return (
        <>
          <ellipse cx="46" cy="68" rx="22" ry="14" fill="#2E3442" />
          <rect x="54" y="28" width="8" height="36" rx="4" fill="#F4B6A8" />
          <circle cx="58" cy="26" r="10" fill="#F4B6A8" />
          <polygon points="66,26 78,29 66,32" fill="#F2B84B" />
          <circle cx="60" cy="24" r="2.5" fill="#1E2433" />
        </>
      );

    case 'penguin':
      return (
        <>
          <ellipse cx="50" cy="54" rx="24" ry="30" fill="#1E2433" />
          <ellipse cx="50" cy="58" rx="15" ry="21" fill="#FFFFFF" />
          <circle cx="43" cy="36" r="3" fill="#FFFFFF" />
          <circle cx="57" cy="36" r="3" fill="#FFFFFF" />
          <polygon points="45,42 55,42 50,49" fill="#F59B38" />
          <ellipse cx="38" cy="83" rx="7" ry="4" fill="#F59B38" />
          <ellipse cx="62" cy="83" rx="7" ry="4" fill="#F59B38" />
        </>
      );
    case 'pear':
      return (
        <>
          <path d="M50 16 L52 24" stroke="#6B4C35" strokeWidth="4" strokeLinecap="round" />
          <path d="M50 24 C40 24, 38 38, 32 48 C24 60, 26 82, 50 82 C74 82, 76 60, 68 48 C62 38, 60 24, 50 24 Z" fill="#9ED35A" />
        </>
      );
    case 'pumpkin':
      return (
        <>
          <rect x="46" y="18" width="8" height="14" rx="3" fill="#3BA99C" />
          <ellipse cx="34" cy="56" rx="16" ry="24" fill="#EA7328" />
          <ellipse cx="66" cy="56" rx="16" ry="24" fill="#EA7328" />
          <ellipse cx="50" cy="56" rx="18" ry="25" fill="#F58D2E" />
        </>
      );

    case 'quarter':
      return (
        <>
          <circle cx="50" cy="50" r="30" fill="#C7CFD9" stroke="#8D97A6" strokeWidth="4" />
          <circle cx="50" cy="50" r="22" stroke="#9AA3B2" strokeWidth="2" strokeDasharray="4 3" fill="none" />
          <text x="50" y="57" textAnchor="middle" fontSize="20" fontWeight="700" fill="#4B5565">25¢</text>
        </>
      );
    case 'question':
      return (
        <>
          <path d="M36 34 C36 20, 64 20, 64 36 C64 46, 50 48, 50 58" stroke="#5B5BD6" strokeWidth="10" strokeLinecap="round" fill="none" />
          <circle cx="50" cy="76" r="6" fill="#F27A5E" />
        </>
      );
    case 'quill':
      return (
        <>
          <path d="M30 76 C34 40, 56 20, 78 16 C74 44, 58 66, 30 76 Z" fill="#F27A5E" />
          <line x1="22" y1="84" x2="72" y2="24" stroke="#1E2433" strokeWidth="3.5" strokeLinecap="round" />
        </>
      );

    case 'rabbit':
      return (
        <>
          <ellipse cx="38" cy="26" rx="7" ry="18" fill="#FFFFFF" stroke="#D8D3C8" strokeWidth="2" />
          <ellipse cx="62" cy="26" rx="7" ry="18" fill="#FFFFFF" stroke="#D8D3C8" strokeWidth="2" />
          <ellipse cx="38" cy="26" rx="3.5" ry="12" fill="#F9B4C4" />
          <ellipse cx="62" cy="26" rx="3.5" ry="12" fill="#F9B4C4" />
          <circle cx="50" cy="58" r="23" fill="#FFFFFF" stroke="#D8D3C8" strokeWidth="2" />
          <circle cx="42" cy="54" r="3" fill="#1E2433" />
          <circle cx="58" cy="54" r="3" fill="#1E2433" />
          <circle cx="50" cy="61" r="3.5" fill="#F484A4" />
        </>
      );
    case 'ring':
      return (
        <>
          <circle cx="50" cy="58" r="21" stroke="#F2B84B" strokeWidth="8" fill="none" />
          <polygon points="50,16 64,28 50,38 36,28" fill="#5BC8E8" />
        </>
      );
    case 'rose':
      return (
        <>
          <line x1="50" y1="48" x2="50" y2="84" stroke="#3BA99C" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="60" cy="66" rx="9" ry="5" transform="rotate(-22 60 66)" fill="#3BA99C" />
          <circle cx="50" cy="34" r="18" fill="#E85349" />
          <path d="M40 32 Q50 22 60 32 Q50 42 40 32 Z" fill="#FF8E85" />
        </>
      );

    case 'strawberry':
      return (
        <>
          <path d="M36 24 L50 30 L64 24 L56 18 L44 18 Z" fill="#3BA99C" />
          <path d="M26 36 C26 24, 74 24, 74 36 C74 58, 58 82, 50 84 C42 82, 26 58, 26 36 Z" fill="#E85349" />
          <circle cx="42" cy="46" r="2" fill="#FFF4D9" />
          <circle cx="58" cy="46" r="2" fill="#FFF4D9" />
          <circle cx="50" cy="58" r="2" fill="#FFF4D9" />
          <circle cx="44" cy="68" r="2" fill="#FFF4D9" />
          <circle cx="56" cy="68" r="2" fill="#FFF4D9" />
        </>
      );
    case 'sock':
      return (
        <>
          <path d="M42 18 L64 18 L64 58 C64 72, 54 78, 36 78 C24 78, 22 64, 34 58 L42 54 Z" fill="#5B5BD6" />
          <rect x="42" y="24" width="22" height="7" fill="#F2B84B" />
          <circle cx="30" cy="69" r="7" fill="#F27A5E" />
        </>
      );
    case 'submarine':
      return (
        <>
          <path d="M48 34 L48 20 L58 20" stroke="#E09F2D" strokeWidth="6" strokeLinecap="round" fill="none" />
          <ellipse cx="48" cy="56" rx="30" ry="17" fill="#F2B84B" />
          <polygon points="76,56 86,46 86,66" fill="#E09F2D" />
          <circle cx="36" cy="56" r="5" fill="#E4F6F3" stroke="#5B5BD6" strokeWidth="2.5" />
          <circle cx="52" cy="56" r="5" fill="#E4F6F3" stroke="#5B5BD6" strokeWidth="2.5" />
        </>
      );

    case 'tiger':
      return (
        <>
          <circle cx="28" cy="30" r="10" fill="#F58D2E" />
          <circle cx="72" cy="30" r="10" fill="#F58D2E" />
          <circle cx="50" cy="54" r="26" fill="#F59B38" />
          <path d="M26 48 L36 50 M74 48 L64 50 M26 58 L36 58 M74 58 L64 58 M50 28 L50 38" stroke="#1E2433" strokeWidth="4" strokeLinecap="round" />
          <circle cx="41" cy="50" r="3" fill="#1E2433" />
          <circle cx="59" cy="50" r="3" fill="#1E2433" />
          <polygon points="50,60 45,55 55,55" fill="#F27A5E" />
        </>
      );
    case 'tomato':
      return (
        <>
          <circle cx="50" cy="56" r="27" fill="#E8483D" />
          <path d="M38 28 L50 34 L62 28 M50 20 L50 34" stroke="#3BA99C" strokeWidth="5" strokeLinecap="round" fill="none" />
        </>
      );
    case 'truck':
      return (
        <>
          <rect x="14" y="30" width="44" height="36" rx="5" fill="#3BA99C" />
          <path d="M58 40 L76 40 L84 52 L84 66 L58 66 Z" fill="#F2B84B" />
          <rect x="63" y="45" width="13" height="10" rx="2" fill="#E4F6F3" />
          <circle cx="30" cy="70" r="9" fill="#1E2433" /><circle cx="30" cy="70" r="4" fill="#FFFFFF" />
          <circle cx="70" cy="70" r="9" fill="#1E2433" /><circle cx="70" cy="70" r="4" fill="#FFFFFF" />
        </>
      );

    case 'up-arrow':
      return (
        <>
          <polygon points="50,16 80,50 62,50 62,84 38,84 38,50 20,50" fill="#3BA99C" />
        </>
      );
    case 'urchin':
      return (
        <>
          {[0, 30, 60, 90, 120, 150].map((deg) => (
            <line
              key={deg}
              x1="50"
              y1="16"
              x2="50"
              y2="84"
              stroke="#6E56CF"
              strokeWidth="4.5"
              strokeLinecap="round"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="18" fill="#846CE0" />
          <circle cx="44" cy="48" r="2.8" fill="#FFFFFF" />
          <circle cx="56" cy="48" r="2.8" fill="#FFFFFF" />
        </>
      );
    case 'unicycle':
      return (
        <>
          <path d="M38 22 Q50 18 62 22 L58 28 L42 28 Z" fill="#F27A5E" />
          <line x1="50" y1="28" x2="50" y2="62" stroke="#5B5BD6" strokeWidth="5" />
          <circle cx="50" cy="66" r="18" stroke="#1E2433" strokeWidth="5" fill="none" />
          <circle cx="50" cy="66" r="4" fill="#F2B84B" />
        </>
      );

    case 'vase':
      return (
        <>
          <path d="M38 22 L62 22 L56 38 C72 48, 72 78, 50 82 C28 78, 28 48, 44 38 Z" fill="#5B5BD6" />
          <path d="M34 58 Q50 66 66 58" stroke="#F2B84B" strokeWidth="4" fill="none" />
        </>
      );
    case 'vest':
      return (
        <>
          <polygon points="28,20 42,20 50,38 58,20 72,20 76,80 24,80" fill="#F27A5E" />
          <circle cx="50" cy="50" r="3" fill="#FFF7E6" />
          <circle cx="50" cy="62" r="3" fill="#FFF7E6" />
          <circle cx="50" cy="74" r="3" fill="#FFF7E6" />
        </>
      );
    case 'vacuum':
      return (
        <>
          <path d="M62 64 C78 64, 72 24, 52 24 L52 74" stroke="#5C6478" strokeWidth="5" fill="none" />
          <rect x="42" y="72" width="22" height="7" rx="3" fill="#1E2433" />
          <rect x="20" y="52" width="34" height="24" rx="10" fill="#E85349" />
          <circle cx="28" cy="76" r="6" fill="#1E2433" />
        </>
      );

    case 'wagon':
      return (
        <>
          <line x1="68" y1="54" x2="86" y2="34" stroke="#1E2433" strokeWidth="4" strokeLinecap="round" />
          <rect x="20" y="42" width="52" height="24" rx="5" fill="#E85349" />
          <circle cx="32" cy="70" r="9" fill="#1E2433" /><circle cx="32" cy="70" r="4" fill="#F2B84B" />
          <circle cx="60" cy="70" r="9" fill="#1E2433" /><circle cx="60" cy="70" r="4" fill="#F2B84B" />
        </>
      );
    case 'waffle':
      return (
        <>
          <rect x="20" y="20" width="60" height="60" rx="12" fill="#E5A24B" />
          {[34, 50, 66].map((x) =>
            [34, 50, 66].map((y) => (
              <rect key={`${x}-${y}`} x={x - 5} y={y - 5} width="10" height="10" rx="2" fill="#C47E28" />
            )),
          )}
          <rect x="44" y="42" width="14" height="14" rx="3" fill="#FFF4B8" />
        </>
      );
    case 'worm':
      return (
        <>
          <path d="M20 70 Q32 42 50 58 Q68 74 78 36" stroke="#F48498" strokeWidth="13" strokeLinecap="round" fill="none" />
          <circle cx="79" cy="33" r="2.5" fill="#1E2433" />
        </>
      );

    case 'x-ray-dino':
      return (
        <>
          <rect x="18" y="18" width="64" height="64" rx="10" fill="#1E293B" />
          <circle cx="62" cy="34" r="10" stroke="#7CE8E0" strokeWidth="3.5" fill="none" />
          <circle cx="65" cy="32" r="2" fill="#7CE8E0" />
          <path d="M56 42 Q46 54 28 66 M44 48 L52 54 M38 54 L46 60 M46 56 L46 72 M56 52 L58 72" stroke="#7CE8E0" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </>
      );
    case 'x-ray-hand':
      return (
        <>
          <rect x="20" y="16" width="60" height="68" rx="10" fill="#1E293B" />
          <g stroke="#7CE8E0" strokeWidth="3.5" strokeLinecap="round">
            <line x1="36" y1="54" x2="34" y2="34" />
            <line x1="44" y1="52" x2="44" y2="28" />
            <line x1="53" y1="52" x2="54" y2="30" />
            <line x1="61" y1="55" x2="64" y2="38" />
            <line x1="34" y1="62" x2="28" y2="50" />
            <rect x="38" y="56" width="20" height="16" rx="4" fill="none" />
          </g>
        </>
      );
    case 'x-mark':
      return (
        <>
          <rect x="18" y="22" width="64" height="56" rx="10" fill="#F5DFB5" stroke="#C9A86A" strokeWidth="3" />
          <line x1="34" y1="34" x2="66" y2="66" stroke="#E85349" strokeWidth="10" strokeLinecap="round" />
          <line x1="66" y1="34" x2="34" y2="66" stroke="#E85349" strokeWidth="10" strokeLinecap="round" />
        </>
      );

    case 'yogurt':
      return (
        <>
          <path d="M28 42 L72 42 L66 80 L34 80 Z" fill="#FFFFFF" stroke="#D8D1EE" strokeWidth="3" />
          <path d="M30 42 C32 24, 68 24, 70 42 Z" fill="#F493AA" />
          <rect x="24" y="38" width="52" height="7" rx="3.5" fill="#5B5BD6" />
        </>
      );
    case 'yak':
      return (
        <>
          <path d="M28 36 Q16 22 24 18" stroke="#D9C3A9" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M72 36 Q84 22 76 18" stroke="#D9C3A9" strokeWidth="6" strokeLinecap="round" fill="none" />
          <ellipse cx="50" cy="56" rx="26" ry="22" fill="#5E402D" />
          <ellipse cx="50" cy="64" rx="13" ry="9" fill="#A67E65" />
          <circle cx="40" cy="48" r="3" fill="#FFFFFF" />
          <circle cx="60" cy="48" r="3" fill="#FFFFFF" />
        </>
      );
    case 'yolk':
      return (
        <>
          <path d="M20 52 C18 30, 42 20, 62 24 C82 28, 84 56, 74 70 C62 84, 22 76, 20 52 Z" fill="#FFFFFF" stroke="#E2D9C5" strokeWidth="2.5" />
          <circle cx="52" cy="52" r="15" fill="#F5A623" />
          <circle cx="47" cy="47" r="4" fill="#FFE082" />
        </>
      );

    case 'zero':
      return (
        <>
          <ellipse cx="50" cy="50" rx="22" ry="30" stroke="#5B5BD6" strokeWidth="11" fill="none" />
        </>
      );
    case 'zigzag':
      return (
        <>
          <polyline
            points="18,28 74,28 24,52 76,52 22,76 80,76"
            stroke="#F27A5E"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      );
    case 'zucchini':
      return (
        <>
          <g transform="rotate(-28 50 50)">
            <rect x="46" y="14" width="8" height="10" rx="3" fill="#6BA84F" />
            <rect x="36" y="22" width="28" height="62" rx="14" fill="#2E7D5B" />
            <line x1="45" y1="30" x2="45" y2="74" stroke="#58B388" strokeWidth="3" strokeLinecap="round" />
          </g>
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
