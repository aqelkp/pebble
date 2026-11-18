import type { CSSProperties } from 'react';
import type { WordArtId } from './wordBank';

interface WordFunArtProps {
  id: WordArtId;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Custom warm storybook SVG illustrations for Word Fun.
 * Uses rounded geometry and Pebble's calm palette; strictly zero 4-point sparkle stars.
 */
export function WordFunArt({ id, size = 148, className, style }: WordFunArtProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {renderArtwork(id)}
    </svg>
  );
}

function renderArtwork(id: WordArtId) {
  switch (id) {
    case 'cat':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#FEF5E1" />
          <path d="M38 68L32 28L66 48Z" fill="#F29A4B" stroke="#8C4A19" strokeWidth="4" strokeLinejoin="round" />
          <path d="M122 68L128 28L94 48Z" fill="#F29A4B" stroke="#8C4A19" strokeWidth="4" strokeLinejoin="round" />
          <path d="M41 58L38 38L58 50Z" fill="#F7B7A3" />
          <path d="M119 58L122 38L102 50Z" fill="#F7B7A3" />
          <ellipse cx="80" cy="88" rx="48" ry="42" fill="#F5A855" stroke="#8C4A19" strokeWidth="4" />
          <path d="M72 48V60M80 46V62M88 48V60" stroke="#C86D25" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="80" cy="99" rx="22" ry="16" fill="#FFF7EB" />
          <circle cx="62" cy="82" r="6" fill="#2D221B" />
          <circle cx="98" cy="82" r="6" fill="#2D221B" />
          <circle cx="60" cy="80" r="2" fill="#FFFFFF" />
          <circle cx="96" cy="80" r="2" fill="#FFFFFF" />
          <ellipse cx="50" cy="95" rx="7" ry="4.5" fill="#F27A5E" fillOpacity="0.45" />
          <ellipse cx="110" cy="95" rx="7" ry="4.5" fill="#F27A5E" fillOpacity="0.45" />
          <path d="M75 93H85L80 99Z" fill="#E06D53" />
          <path d="M80 99C80 105 72 106 69 102M80 99C80 105 88 106 91 102" stroke="#8C4A19" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M24 88H44M26 98H45M116 88H136M115 98H134" stroke="#8C4A19" strokeWidth="3.2" strokeLinecap="round" />
        </>
      );

    case 'dog':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#ECEBFF" />
          <ellipse cx="36" cy="84" rx="16" ry="30" transform="rotate(14 36 84)" fill="#8E5B3A" stroke="#4D2E1A" strokeWidth="4" />
          <ellipse cx="124" cy="84" rx="16" ry="30" transform="rotate(-14 124 84)" fill="#8E5B3A" stroke="#4D2E1A" strokeWidth="4" />
          <ellipse cx="80" cy="84" rx="44" ry="41" fill="#D89F70" stroke="#4D2E1A" strokeWidth="4" />
          <ellipse cx="65" cy="74" rx="14" ry="17" fill="#FFF6EC" />
          <ellipse cx="80" cy="98" rx="24" ry="18" fill="#FFF6EC" />
          <circle cx="63" cy="78" r="6" fill="#2A1E17" />
          <circle cx="97" cy="78" r="6" fill="#2A1E17" />
          <circle cx="61" cy="76" r="2" fill="#FFFFFF" />
          <circle cx="95" cy="76" r="2" fill="#FFFFFF" />
          <ellipse cx="80" cy="91" rx="8.5" ry="6" fill="#3B281E" />
          <path d="M72 103C76 109 84 109 88 103" stroke="#4D2E1A" strokeWidth="3.5" strokeLinecap="round" />
          <rect x="52" y="121" width="56" height="12" rx="6" fill="#5B5BD6" stroke="#373799" strokeWidth="3" />
          <circle cx="80" cy="133" r="6" fill="#F2B84B" stroke="#A67214" strokeWidth="2.5" />
        </>
      );

    case 'pig':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#FDECE7" />
          <path d="M40 58L34 32L62 44Z" fill="#F7A1B0" stroke="#9B4455" strokeWidth="4" strokeLinejoin="round" />
          <path d="M120 58L126 32L98 44Z" fill="#F7A1B0" stroke="#9B4455" strokeWidth="4" strokeLinejoin="round" />
          <ellipse cx="80" cy="86" rx="47" ry="43" fill="#FBC0CB" stroke="#9B4455" strokeWidth="4" />
          <circle cx="61" cy="76" r="5.8" fill="#331B22" />
          <circle cx="99" cy="76" r="5.8" fill="#331B22" />
          <ellipse cx="80" cy="94" rx="20" ry="14" fill="#F58FA2" stroke="#9B4455" strokeWidth="3.5" />
          <ellipse cx="73" cy="94" rx="3.5" ry="5" fill="#7D2E3E" />
          <ellipse cx="87" cy="94" rx="3.5" ry="5" fill="#7D2E3E" />
          <path d="M68 113C74 118 86 118 92 113" stroke="#9B4455" strokeWidth="3.5" strokeLinecap="round" />
        </>
      );

    case 'fox':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#FEF5E1" />
          <path d="M36 68L28 24L66 46Z" fill="#EC6E45" stroke="#7E3118" strokeWidth="4" strokeLinejoin="round" />
          <path d="M124 68L132 24L94 46Z" fill="#EC6E45" stroke="#7E3118" strokeWidth="4" strokeLinejoin="round" />
          <path d="M40 56L36 34L58 48Z" fill="#FFF7EE" />
          <path d="M120 56L124 34L102 48Z" fill="#FFF7EE" />
          <path d="M32 84C32 56 54 44 80 44C106 44 128 56 128 84C128 106 102 126 80 128C58 126 32 106 32 84Z" fill="#F27A5E" stroke="#7E3118" strokeWidth="4" />
          <path d="M35 88C52 86 68 98 80 126C92 98 108 86 125 88C120 110 98 126 80 128C62 126 40 110 35 88Z" fill="#FFF8F0" />
          <circle cx="62" cy="80" r="5.5" fill="#2A1B17" />
          <circle cx="98" cy="80" r="5.5" fill="#2A1B17" />
          <circle cx="80" cy="108" r="6.5" fill="#2A1B17" />
        </>
      );

    case 'owl':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#ECEBFF" />
          <ellipse cx="80" cy="88" rx="42" ry="46" fill="#9E7656" stroke="#4E3522" strokeWidth="4" />
          <ellipse cx="80" cy="104" rx="28" ry="24" fill="#F3E3CE" />
          <path d="M68 98C71 102 75 102 78 98M82 98C85 102 89 102 92 98M73 110C76 114 80 114 83 110" stroke="#9E7656" strokeWidth="3" strokeLinecap="round" />
          <circle cx="63" cy="68" r="16" fill="#FFFDF9" stroke="#4E3522" strokeWidth="3.5" />
          <circle cx="97" cy="68" r="16" fill="#FFFDF9" stroke="#4E3522" strokeWidth="3.5" />
          <circle cx="63" cy="68" r="7" fill="#2B2118" />
          <circle cx="97" cy="68" r="7" fill="#2B2118" />
          <circle cx="61" cy="65" r="2.2" fill="#FFFFFF" />
          <circle cx="95" cy="65" r="2.2" fill="#FFFFFF" />
          <path d="M74 78H86L80 88Z" fill="#F2B84B" stroke="#9A6A10" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M46 46L60 54M114 46L100 54" stroke="#4E3522" strokeWidth="5" strokeLinecap="round" />
        </>
      );

    case 'bee':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#E4F6F3" />
          <ellipse cx="64" cy="52" rx="18" ry="24" transform="rotate(-22 64 52)" fill="#FFFFFF" stroke="#5B8C85" strokeWidth="3.5" />
          <ellipse cx="96" cy="52" rx="18" ry="24" transform="rotate(22 96 52)" fill="#FFFFFF" stroke="#5B8C85" strokeWidth="3.5" />
          <ellipse cx="80" cy="90" rx="44" ry="32" fill="#F2B84B" stroke="#3D2B10" strokeWidth="4" />
          <path d="M68 60V120M92 60V120" stroke="#3D2B10" strokeWidth="9" strokeLinecap="round" />
          <circle cx="52" cy="84" r="5" fill="#2B2118" />
          <path d="M47 96C51 101 57 101 60 96" stroke="#3D2B10" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M124 90L136 90" stroke="#3D2B10" strokeWidth="5" strokeLinecap="round" />
          <path d="M52 62C46 48 38 46 34 50" stroke="#3D2B10" strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="34" cy="50" r="4" fill="#3D2B10" />
        </>
      );

    case 'hen':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#FEF5E1" />
          <circle cx="70" cy="36" r="8" fill="#E14D43" />
          <circle cx="82" cy="33" r="9" fill="#E14D43" />
          <circle cx="93" cy="38" r="7" fill="#E14D43" />
          <path d="M40 94C40 60 58 44 82 44C106 44 122 64 122 92C122 114 104 128 80 128C56 128 40 114 40 94Z" fill="#FFFDF8" stroke="#6E5038" strokeWidth="4" />
          <ellipse cx="88" cy="96" rx="20" ry="15" fill="#F5E6D3" stroke="#6E5038" strokeWidth="3" />
          <circle cx="64" cy="72" r="5.5" fill="#2A1E17" />
          <path d="M40 76L24 82L40 88Z" fill="#F2B84B" stroke="#9E6A08" strokeWidth="3" strokeLinejoin="round" />
          <ellipse cx="44" cy="94" rx="5" ry="8" fill="#E14D43" />
        </>
      );

    case 'cow':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#E4F6F3" />
          <path d="M48 46C42 34 48 26 56 32" stroke="#D9A76A" strokeWidth="7" strokeLinecap="round" />
          <path d="M112 46C118 34 112 26 104 32" stroke="#D9A76A" strokeWidth="7" strokeLinecap="round" />
          <ellipse cx="34" cy="64" rx="13" ry="8" transform="rotate(-18 34 64)" fill="#FFFFFF" stroke="#363842" strokeWidth="3.5" />
          <ellipse cx="126" cy="64" rx="13" ry="8" transform="rotate(18 126 64)" fill="#FFFFFF" stroke="#363842" strokeWidth="3.5" />
          <ellipse cx="80" cy="82" rx="44" ry="40" fill="#FFFFFF" stroke="#363842" strokeWidth="4" />
          <path d="M52 50C66 54 68 68 54 74C42 70 42 56 52 50Z" fill="#363842" />
          <circle cx="102" cy="66" r="10" fill="#363842" />
          <circle cx="62" cy="76" r="5.5" fill="#1E2433" />
          <circle cx="98" cy="76" r="5.5" fill="#1E2433" />
          <ellipse cx="80" cy="102" rx="28" ry="18" fill="#F9B8C4" stroke="#9B4E5E" strokeWidth="3.5" />
          <circle cx="70" cy="100" r="3.5" fill="#7A3443" />
          <circle cx="90" cy="100" r="3.5" fill="#7A3443" />
        </>
      );

    case 'cup':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#FEF5E1" />
          <path d="M64 44C60 36 68 30 64 22M82 42C78 34 86 28 82 20M98 44C94 36 102 30 98 22" stroke="#C59B6D" strokeWidth="4" strokeLinecap="round" />
          <path d="M108 72H122C131 72 136 79 136 88C136 97 130 104 121 104H108" stroke="#3BA99C" strokeWidth="8" strokeLinecap="round" />
          <path d="M40 58H114V96C114 114 99 126 77 126C55 126 40 114 40 96V58Z" fill="#3BA99C" stroke="#20685F" strokeWidth="4" strokeLinejoin="round" />
          <ellipse cx="77" cy="58" rx="37" ry="8" fill="#7B4A2B" stroke="#20685F" strokeWidth="3.5" />
          <circle cx="62" cy="88" r="6" fill="#E4F6F3" />
          <circle cx="80" cy="98" r="6" fill="#E4F6F3" />
          <circle cx="94" cy="84" r="6" fill="#E4F6F3" />
        </>
      );

    case 'hat':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#ECEBFF" />
          <circle cx="80" cy="34" r="14" fill="#F2B84B" stroke="#9E6A08" strokeWidth="3.5" />
          <path d="M36 102C36 68 54 46 80 46C106 46 124 68 124 102Z" fill="#5B5BD6" stroke="#33338F" strokeWidth="4" strokeLinejoin="round" />
          <path d="M54 64C68 58 92 58 106 64" stroke="#8E8EE8" strokeWidth="5" strokeLinecap="round" />
          <rect x="28" y="98" width="104" height="24" rx="12" fill="#F27A5E" stroke="#9B3D26" strokeWidth="4" />
          <path d="M48 104V116M68 104V116M88 104V116M108 104V116" stroke="#9B3D26" strokeWidth="3" strokeLinecap="round" />
        </>
      );

    case 'bed':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#E4F6F3" />
          <rect x="26" y="54" width="14" height="68" rx="6" fill="#B57B4C" stroke="#694122" strokeWidth="3.5" />
          <rect x="122" y="72" width="12" height="50" rx="6" fill="#B57B4C" stroke="#694122" strokeWidth="3.5" />
          <rect x="42" y="68" width="32" height="20" rx="9" fill="#FFFFFF" stroke="#5B6478" strokeWidth="3.2" />
          <path d="M38 84H124V108H38Z" fill="#3BA99C" stroke="#20685F" strokeWidth="3.5" />
          <path d="M72 84H124V108H72Z" fill="#72C9BE" stroke="#20685F" strokeWidth="3.5" />
          <rect x="26" y="104" width="108" height="12" rx="4" fill="#D49A6A" stroke="#694122" strokeWidth="3.5" />
        </>
      );

    case 'box':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#FEF5E1" />
          <path d="M80 48C66 30 50 38 58 50C64 56 76 52 80 48ZM80 48C94 30 110 38 102 50C96 56 84 52 80 48Z" fill="#F27A5E" stroke="#9B3D26" strokeWidth="3.5" strokeLinejoin="round" />
          <rect x="38" y="64" width="84" height="60" rx="10" fill="#F2B84B" stroke="#9A6A10" strokeWidth="4" />
          <rect x="32" y="50" width="96" height="18" rx="7" fill="#FAD27A" stroke="#9A6A10" strokeWidth="4" />
          <rect x="72" y="50" width="16" height="74" fill="#F27A5E" stroke="#9B3D26" strokeWidth="3.2" />
        </>
      );

    case 'key':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#ECEBFF" />
          <circle cx="54" cy="80" r="24" fill="#F2B84B" stroke="#9A6A10" strokeWidth="4" />
          <circle cx="54" cy="80" r="10" fill="#ECEBFF" stroke="#9A6A10" strokeWidth="3.5" />
          <rect x="76" y="74" width="56" height="12" rx="6" fill="#F2B84B" stroke="#9A6A10" strokeWidth="4" />
          <rect x="104" y="84" width="10" height="16" rx="3" fill="#F2B84B" stroke="#9A6A10" strokeWidth="3.5" />
          <rect x="118" y="84" width="10" height="22" rx="3" fill="#F2B84B" stroke="#9A6A10" strokeWidth="3.5" />
        </>
      );

    case 'pot':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#FDECE7" />
          <path d="M24 80H38M122 80H136" stroke="#8F3822" strokeWidth="7" strokeLinecap="round" />
          <circle cx="80" cy="44" r="8" fill="#F2B84B" stroke="#8F3822" strokeWidth="3.5" />
          <path d="M40 62C46 48 114 48 120 62Z" fill="#F27A5E" stroke="#8F3822" strokeWidth="4" strokeLinejoin="round" />
          <path d="M38 64H122V100C122 116 106 126 80 126C54 126 38 116 38 100V64Z" fill="#F27A5E" stroke="#8F3822" strokeWidth="4" strokeLinejoin="round" />
          <ellipse cx="60" cy="92" rx="6" ry="14" fill="#FFFFFF" fillOpacity="0.28" />
        </>
      );

    case 'jar':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#FEF5E1" />
          <rect x="46" y="50" width="68" height="76" rx="18" fill="#E6677B" stroke="#852B3B" strokeWidth="4" />
          <rect x="52" y="36" width="56" height="16" rx="6" fill="#3BA99C" stroke="#1E665D" strokeWidth="3.5" />
          <rect x="58" y="76" width="44" height="28" rx="8" fill="#FFFDF8" stroke="#852B3B" strokeWidth="3" />
          <circle cx="80" cy="90" r="7" fill="#E6677B" />
        </>
      );

    case 'pan':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#E4F6F3" />
          <rect x="108" y="74" width="36" height="12" rx="6" fill="#F27A5E" stroke="#7A2E1D" strokeWidth="3.5" />
          <circle cx="68" cy="80" r="42" fill="#475066" stroke="#222736" strokeWidth="4" />
          <circle cx="68" cy="80" r="33" fill="#5D6780" />
          <path d="M46 78C46 64 58 56 72 58C86 60 92 70 90 84C88 96 76 102 62 100C50 98 46 90 46 78Z" fill="#FFFDF9" />
          <circle cx="69" cy="79" r="11" fill="#F2B84B" stroke="#C88719" strokeWidth="2.5" />
        </>
      );

    case 'bus':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#FEF5E1" />
          <rect x="24" y="50" width="112" height="60" rx="16" fill="#F2B84B" stroke="#8F620B" strokeWidth="4" />
          <rect x="34" y="60" width="22" height="20" rx="5" fill="#E4F6F3" stroke="#8F620B" strokeWidth="3" />
          <rect x="62" y="60" width="22" height="20" rx="5" fill="#E4F6F3" stroke="#8F620B" strokeWidth="3" />
          <rect x="90" y="60" width="34" height="22" rx="6" fill="#E4F6F3" stroke="#8F620B" strokeWidth="3" />
          <line x1="26" y1="90" x2="134" y2="90" stroke="#8F620B" strokeWidth="3.5" />
          <circle cx="50" cy="112" r="13" fill="#323846" stroke="#1B1F28" strokeWidth="3.5" />
          <circle cx="50" cy="112" r="5" fill="#DCE1EC" />
          <circle cx="110" cy="112" r="13" fill="#323846" stroke="#1B1F28" strokeWidth="3.5" />
          <circle cx="110" cy="112" r="5" fill="#DCE1EC" />
        </>
      );

    case 'car':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#ECEBFF" />
          <path d="M44 76L56 52H104L118 76Z" fill="#F27A5E" stroke="#8F3822" strokeWidth="4" strokeLinejoin="round" />
          <path d="M58 58H98L108 74H50Z" fill="#E4F6F3" />
          <rect x="26" y="74" width="108" height="34" rx="14" fill="#F27A5E" stroke="#8F3822" strokeWidth="4" />
          <circle cx="50" cy="110" r="13" fill="#323846" stroke="#1B1F28" strokeWidth="3.5" />
          <circle cx="50" cy="110" r="5" fill="#DCE1EC" />
          <circle cx="110" cy="110" r="13" fill="#323846" stroke="#1B1F28" strokeWidth="3.5" />
          <circle cx="110" cy="110" r="5" fill="#DCE1EC" />
          <circle cx="126" cy="88" r="4.5" fill="#FEF5E1" />
        </>
      );

    case 'jet':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#E4F6F3" />
          <path d="M68 82L52 40H68L92 74Z" fill="#5B5BD6" stroke="#2F2F8F" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M30 82C30 70 46 66 86 66C116 66 134 74 134 82C134 90 116 98 86 98C46 98 30 94 30 82Z" fill="#FFFFFF" stroke="#2F2F8F" strokeWidth="4" />
          <path d="M32 76L22 56H36L48 72Z" fill="#F27A5E" stroke="#8F3822" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M68 88L52 124H68L94 92Z" fill="#5B5BD6" stroke="#2F2F8F" strokeWidth="3.5" strokeLinejoin="round" />
          <circle cx="72" cy="82" r="4.5" fill="#72C9BE" />
          <circle cx="88" cy="82" r="4.5" fill="#72C9BE" />
          <circle cx="104" cy="82" r="4.5" fill="#72C9BE" />
        </>
      );

    case 'sub':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#E4F6F3" />
          <path d="M78 52V34H94" stroke="#8F620B" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="64" y="48" width="28" height="18" rx="7" fill="#F2B84B" stroke="#8F620B" strokeWidth="3.5" />
          <rect x="24" y="64" width="20" height="28" rx="6" fill="#F27A5E" stroke="#8F3822" strokeWidth="3.5" />
          <rect x="34" y="62" width="98" height="50" rx="25" fill="#F2B84B" stroke="#8F620B" strokeWidth="4" />
          <circle cx="62" cy="87" r="9" fill="#E4F6F3" stroke="#8F620B" strokeWidth="3.5" />
          <circle cx="86" cy="87" r="9" fill="#E4F6F3" stroke="#8F620B" strokeWidth="3.5" />
          <circle cx="110" cy="87" r="9" fill="#E4F6F3" stroke="#8F620B" strokeWidth="3.5" />
        </>
      );

    case 'top':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#FEF5E1" />
          <rect x="74" y="28" width="12" height="22" rx="6" fill="#8C5832" stroke="#4D2E1A" strokeWidth="3.5" />
          <path d="M34 68C34 54 54 48 80 48C106 48 126 54 126 68L86 124C83 129 77 129 74 124L34 68Z" fill="#5B5BD6" stroke="#2F2F8F" strokeWidth="4" strokeLinejoin="round" />
          <path d="M40 76H120L110 90H50Z" fill="#F27A5E" />
          <path d="M56 98H104L96 109H64Z" fill="#3BA99C" />
          <circle cx="80" cy="131" r="4.5" fill="#F2B84B" stroke="#8F620B" strokeWidth="2.5" />
        </>
      );

    case 'bag':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#ECEBFF" />
          <path d="M64 48C64 34 96 34 96 48" stroke="#20685F" strokeWidth="6" strokeLinecap="round" />
          <rect x="42" y="46" width="76" height="80" rx="22" fill="#3BA99C" stroke="#20685F" strokeWidth="4" />
          <rect x="54" y="82" width="52" height="32" rx="12" fill="#F2B84B" stroke="#9A6A10" strokeWidth="3.5" />
          <rect x="74" y="76" width="12" height="14" rx="4" fill="#FFFFFF" stroke="#9A6A10" strokeWidth="3" />
        </>
      );

    case 'van':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#E4F6F3" />
          <path d="M28 66C28 54 38 48 52 48H108C122 48 132 62 134 78V102C134 107 130 110 124 110H36C31 110 28 106 28 100V66Z" fill="#3BA99C" stroke="#1E665D" strokeWidth="4" />
          <path d="M28 82H134V102C134 107 130 110 124 110H36C31 110 28 106 28 100V82Z" fill="#FFFDF8" stroke="#1E665D" strokeWidth="3.5" />
          <rect x="40" y="56" width="28" height="18" rx="5" fill="#E4F6F3" stroke="#1E665D" strokeWidth="3" />
          <rect x="74" y="56" width="44" height="18" rx="5" fill="#E4F6F3" stroke="#1E665D" strokeWidth="3" />
          <circle cx="52" cy="112" r="13" fill="#323846" stroke="#1B1F28" strokeWidth="3.5" />
          <circle cx="52" cy="112" r="5" fill="#DCE1EC" />
          <circle cx="108" cy="112" r="13" fill="#323846" stroke="#1B1F28" strokeWidth="3.5" />
          <circle cx="108" cy="112" r="5" fill="#DCE1EC" />
        </>
      );

    case 'map':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#FEF5E1" />
          <path d="M28 48L62 38L98 48L132 38V114L98 124L62 114L28 124V48Z" fill="#FAF2DC" stroke="#8C6B37" strokeWidth="4" strokeLinejoin="round" />
          <line x1="62" y1="40" x2="62" y2="112" stroke="#D2B887" strokeWidth="3" />
          <line x1="98" y1="50" x2="98" y2="122" stroke="#D2B887" strokeWidth="3" />
          <path d="M42 98C54 78 72 96 86 74C94 62 106 64 114 68" stroke="#3BA99C" strokeWidth="4.5" strokeLinecap="round" strokeDasharray="7 7" />
          <circle cx="114" cy="64" r="9" fill="#F27A5E" stroke="#8F3822" strokeWidth="3" />
          <circle cx="114" cy="64" r="3" fill="#FFFFFF" />
        </>
      );

    case 'sun':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#FEF5E1" />
          <g stroke="#E59819" strokeWidth="7" strokeLinecap="round">
            <line x1="80" y1="22" x2="80" y2="34" />
            <line x1="80" y1="130" x2="80" y2="142" />
            <line x1="20" y1="82" x2="32" y2="82" />
            <line x1="128" y1="82" x2="140" y2="82" />
            <line x1="38" y1="40" x2="47" y2="49" />
            <line x1="113" y1="115" x2="122" y2="124" />
            <line x1="122" y1="40" x2="113" y2="49" />
            <line x1="47" y1="115" x2="38" y2="124" />
          </g>
          <circle cx="80" cy="82" r="36" fill="#F2B84B" stroke="#C8800E" strokeWidth="4" />
          <circle cx="67" cy="76" r="4.5" fill="#5A3905" />
          <circle cx="93" cy="76" r="4.5" fill="#5A3905" />
          <path d="M68 91C73 98 87 98 92 91" stroke="#5A3905" strokeWidth="3.8" strokeLinecap="round" />
        </>
      );

    case 'log':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#E4F6F3" />
          <path d="M84 58C84 42 98 34 108 42C108 54 96 60 84 58Z" fill="#56A35B" stroke="#2D6130" strokeWidth="3.5" strokeLinejoin="round" />
          <rect x="28" y="64" width="96" height="44" rx="20" fill="#9C653B" stroke="#4D2E1A" strokeWidth="4" />
          <ellipse cx="116" cy="86" rx="14" ry="22" fill="#E5BA8C" stroke="#4D2E1A" strokeWidth="4" />
          <ellipse cx="116" cy="86" rx="7" ry="11" stroke="#9C653B" strokeWidth="2.8" />
          <path d="M46 78H88M54 94H92" stroke="#6E4323" strokeWidth="3.5" strokeLinecap="round" />
        </>
      );

    case 'web':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#ECEBFF" />
          <g stroke="#5B5BD6" strokeWidth="3.2" strokeLinecap="round">
            <line x1="80" y1="28" x2="80" y2="136" />
            <line x1="26" y1="82" x2="134" y2="82" />
            <line x1="42" y1="44" x2="118" y2="120" />
            <line x1="118" y1="44" x2="42" y2="120" />
            <circle cx="80" cy="82" r="18" fill="none" />
            <circle cx="80" cy="82" r="35" fill="none" />
          </g>
          <circle cx="104" cy="60" r="6" fill="#3BA99C" />
        </>
      );

    case 'pod':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#FEF5E1" />
          <path d="M32 108C28 68 68 34 126 42C130 82 90 116 32 108Z" fill="#56A35B" stroke="#2A5E2E" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="58" cy="86" r="13" fill="#95DC7E" stroke="#2A5E2E" strokeWidth="3.2" />
          <circle cx="82" cy="74" r="13" fill="#95DC7E" stroke="#2A5E2E" strokeWidth="3.2" />
          <circle cx="104" cy="62" r="12" fill="#95DC7E" stroke="#2A5E2E" strokeWidth="3.2" />
        </>
      );

    case 'bug':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#E4F6F3" />
          <circle cx="80" cy="50" r="18" fill="#2A2E3B" />
          <path d="M70 36C64 26 56 26 52 30M90 36C96 26 104 26 108 30" stroke="#2A2E3B" strokeWidth="3.5" strokeLinecap="round" />
          <ellipse cx="80" cy="92" rx="36" ry="38" fill="#E65347" stroke="#7D1F18" strokeWidth="4" />
          <line x1="80" y1="54" x2="80" y2="130" stroke="#2A2E3B" strokeWidth="4" />
          <circle cx="62" cy="78" r="6.5" fill="#2A2E3B" />
          <circle cx="98" cy="78" r="6.5" fill="#2A2E3B" />
          <circle cx="64" cy="104" r="6.5" fill="#2A2E3B" />
          <circle cx="96" cy="104" r="6.5" fill="#2A2E3B" />
        </>
      );

    case 'gem':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#ECEBFF" />
          <polygon points="54,40 106,40 130,68 80,130 30,68" fill="#3BA99C" stroke="#1E665D" strokeWidth="4" strokeLinejoin="round" />
          <polygon points="54,40 106,40 96,68 64,68" fill="#8FE3D8" />
          <polygon points="64,68 96,68 80,130" fill="#52C0B2" />
          <line x1="30" y1="68" x2="130" y2="68" stroke="#1E665D" strokeWidth="3.2" />
          <line x1="54" y1="40" x2="64" y2="68" stroke="#1E665D" strokeWidth="3.2" />
          <line x1="106" y1="40" x2="96" y2="68" stroke="#1E665D" strokeWidth="3.2" />
        </>
      );

    case 'sky':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#E4F6F3" />
          <path d="M36 100C36 74 56 54 80 54C104 54 124 74 124 100" stroke="#F27A5E" strokeWidth="9" strokeLinecap="round" />
          <path d="M46 100C46 80 61 64 80 64C99 64 114 80 114 100" stroke="#F2B84B" strokeWidth="9" strokeLinecap="round" />
          <path d="M56 100C56 86 67 74 80 74C93 74 104 86 104 100" stroke="#5B5BD6" strokeWidth="9" strokeLinecap="round" />
          <rect x="24" y="92" width="46" height="24" rx="12" fill="#FFFFFF" stroke="#6B7A90" strokeWidth="3.2" />
          <circle cx="46" cy="90" r="13" fill="#FFFFFF" stroke="#6B7A90" strokeWidth="3.2" />
          <rect x="90" y="92" width="46" height="24" rx="12" fill="#FFFFFF" stroke="#6B7A90" strokeWidth="3.2" />
          <circle cx="112" cy="90" r="13" fill="#FFFFFF" stroke="#6B7A90" strokeWidth="3.2" />
        </>
      );

    case 'sea':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#FEF5E1" />
          <circle cx="104" cy="52" r="16" fill="#F2B84B" />
          <path d="M24 84C38 74 50 94 64 84C78 74 90 94 104 84C118 74 128 90 136 84V112C136 120 128 126 118 126H42C32 126 24 120 24 112V84Z" fill="#3BA99C" stroke="#1E665D" strokeWidth="4" strokeLinejoin="round" />
          <path d="M32 104C44 96 56 112 68 104C80 96 92 112 104 104C114 98 122 106 128 104" stroke="#E4F6F3" strokeWidth="4" strokeLinecap="round" />
        </>
      );

    case 'the':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#ECEBFF" />
          <path d="M30 52Q55 44 80 54Q105 44 130 52V114Q105 106 80 116Q55 106 30 114Z" fill="#FFFFFF" stroke="#5B5BD6" strokeWidth="4" strokeLinejoin="round" />
          <line x1="80" y1="54" x2="80" y2="116" stroke="#5B5BD6" strokeWidth="3.5" />
          <line x1="42" y1="70" x2="68" y2="70" stroke="#9AA3B8" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="42" y1="84" x2="68" y2="84" stroke="#9AA3B8" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="105" cy="82" r="14" fill="#F2B84B" />
        </>
      );

    case 'see':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#E4F6F3" />
          <ellipse cx="56" cy="82" rx="20" ry="24" fill="#FFFFFF" stroke="#1E2433" strokeWidth="4" />
          <ellipse cx="104" cy="82" rx="20" ry="24" fill="#FFFFFF" stroke="#1E2433" strokeWidth="4" />
          <circle cx="58" cy="82" r="9" fill="#3BA99C" />
          <circle cx="106" cy="82" r="9" fill="#3BA99C" />
          <circle cx="60" cy="80" r="3.5" fill="#FFFFFF" />
          <circle cx="108" cy="80" r="3.5" fill="#FFFFFF" />
        </>
      );

    case 'can':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#FEF5E1" />
          <circle cx="80" cy="56" r="18" fill="#F2C6A0" stroke="#5C3D28" strokeWidth="3.5" />
          <path d="M52 108Q80 78 108 108" fill="#3BA99C" stroke="#1E665D" strokeWidth="4" strokeLinecap="round" />
          <path d="M46 84L32 58M114 84L128 58" stroke="#F27A5E" strokeWidth="6" strokeLinecap="round" />
          <circle cx="74" cy="54" r="2.5" fill="#1E2433" />
          <circle cx="86" cy="54" r="2.5" fill="#1E2433" />
          <path d="M74 62Q80 68 86 62" stroke="#5C3D28" strokeWidth="2.8" strokeLinecap="round" />
        </>
      );

    case 'you':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#ECEBFF" />
          <rect x="40" y="42" width="80" height="82" rx="40" fill="#FFFFFF" stroke="#5B5BD6" strokeWidth="5" />
          <circle cx="80" cy="74" r="18" fill="#F2C6A0" />
          <path d="M56 116Q80 94 104 116" fill="#F27A5E" />
          <circle cx="74" cy="72" r="2.5" fill="#1E2433" />
          <circle cx="86" cy="72" r="2.5" fill="#1E2433" />
          <path d="M74 80Q80 85 86 80" stroke="#5C3D28" strokeWidth="2.5" strokeLinecap="round" />
        </>
      );

    case 'are':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#E4F6F3" />
          <circle cx="56" cy="76" r="20" fill="#F2C6A0" stroke="#5C3D28" strokeWidth="3.5" />
          <circle cx="104" cy="76" r="20" fill="#D89F70" stroke="#5C3D28" strokeWidth="3.5" />
          <path d="M50 80Q56 86 62 80M98 80Q104 86 110 80" stroke="#5C3D28" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M36 116Q56 96 76 116" fill="#5B5BD6" />
          <path d="M84 116Q104 96 124 116" fill="#F2B84B" />
        </>
      );

    case 'she':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#FDECE7" />
          <path d="M48 78Q48 42 80 42Q112 42 112 78" fill="#4A3525" />
          <circle cx="80" cy="76" r="22" fill="#F2C6A0" stroke="#5C3D28" strokeWidth="3.5" />
          <circle cx="96" cy="52" r="8" fill="#F27A5E" />
          <circle cx="73" cy="74" r="2.5" fill="#1E2433" />
          <circle cx="87" cy="74" r="2.5" fill="#1E2433" />
          <path d="M73 83Q80 89 87 83" stroke="#5C3D28" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M54 120Q80 96 106 120" fill="#F27A5E" />
        </>
      );

    case 'all':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#FEF5E1" />
          <ellipse cx="80" cy="56" rx="26" ry="15" fill="#3BA99C" stroke="#1E665D" strokeWidth="3.5" />
          <ellipse cx="58" cy="88" rx="24" ry="15" fill="#F27A5E" stroke="#9E3F29" strokeWidth="3.5" />
          <ellipse cx="102" cy="88" rx="24" ry="15" fill="#5B5BD6" stroke="#373799" strokeWidth="3.5" />
          <ellipse cx="80" cy="112" rx="28" ry="14" fill="#F2B84B" stroke="#9A6B10" strokeWidth="3.5" />
        </>
      );

    case 'for':
      return (
        <>
          <circle cx="80" cy="82" r="64" fill="#ECEBFF" />
          <rect x="44" y="68" width="72" height="54" rx="10" fill="#F27A5E" stroke="#9E3F29" strokeWidth="4" />
          <rect x="38" y="56" width="84" height="16" rx="6" fill="#F2B84B" stroke="#9A6B10" strokeWidth="3.5" />
          <rect x="74" y="56" width="12" height="66" fill="#FFF8EC" />
          <circle cx="68" cy="48" r="10" fill="none" stroke="#3BA99C" strokeWidth="5" />
          <circle cx="92" cy="48" r="10" fill="none" stroke="#3BA99C" strokeWidth="5" />
        </>
      );
  }
}
