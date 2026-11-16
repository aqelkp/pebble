import type { CSSProperties, ReactNode } from 'react';
import { assetUrl } from '../../utils/assets';
import { WordIllustration } from '../letter-train/WordIllustration';
import {
  getCircleSortItemSpec,
  type CircleSortItemId,
  type CustomCircleSortArtId,
} from './circleSortData';

interface CustomArtProps {
  id: CustomCircleSortArtId;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Cohesive warm storybook vector illustrations for new K1 Circle & Sort items.
 * Strictly zero 4-point sparkle stars or forbidden marks.
 */
export function CircleSortCustomArt({ id, size = 100, className, style }: CustomArtProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {renderCustomArt(id)}
    </svg>
  );
}

function renderCustomArt(id: CustomCircleSortArtId): ReactNode {
  switch (id) {
    case 'burger':
      return (
        <>
          <circle cx="60" cy="60" r="50" fill="#FEF5E1" />
          {/* Top sesame bun */}
          <path
            d="M24 54 C24 31, 42 24, 60 24 C78 24, 96 31, 96 54 Z"
            fill="#E59A46"
            stroke="#8B4F1C"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Sesame seeds */}
          <ellipse cx="46" cy="36" rx="3.2" ry="1.8" transform="rotate(-18 46 36)" fill="#FFF8E8" />
          <ellipse cx="60" cy="33" rx="3.2" ry="1.8" fill="#FFF8E8" />
          <ellipse cx="74" cy="37" rx="3.2" ry="1.8" transform="rotate(18 74 37)" fill="#FFF8E8" />
          <ellipse cx="53" cy="43" rx="3" ry="1.6" transform="rotate(10 53 43)" fill="#FFF8E8" />
          <ellipse cx="68" cy="44" rx="3" ry="1.6" transform="rotate(-12 68 44)" fill="#FFF8E8" />
          {/* Lettuce ruffle */}
          <path
            d="M20 56 Q29 63 38 56 Q47 63 56 56 Q65 63 74 56 Q83 63 92 56 Q98 60 100 55 L20 55 Z"
            fill="#4BB571"
            stroke="#2B7A48"
            strokeWidth="2.5"
          />
          {/* Tomato slice */}
          <rect x="26" y="59" width="68" height="7" rx="3.5" fill="#E85349" />
          {/* Melted cheese */}
          <path d="M24 65 L96 65 L92 71 L64 76 L54 70 L28 71 Z" fill="#F6C344" />
          {/* Patty */}
          <rect
            x="23"
            y="69"
            width="74"
            height="13"
            rx="6.5"
            fill="#7B4326"
            stroke="#4E2714"
            strokeWidth="2.5"
          />
          {/* Bottom bun */}
          <path
            d="M26 82 L94 82 C94 92, 84 96, 60 96 C36 96, 26 92, 26 82 Z"
            fill="#E59A46"
            stroke="#8B4F1C"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </>
      );

    case 'fries':
      return (
        <>
          <circle cx="60" cy="60" r="50" fill="#FDECE7" />
          {/* Golden French fry sticks */}
          <g stroke="#B87A14" strokeWidth="2.4">
            <rect x="34" y="24" width="10" height="44" rx="3" transform="rotate(-8 34 24)" fill="#F7C948" />
            <rect x="45" y="18" width="10" height="48" rx="3" transform="rotate(-3 45 18)" fill="#FFD85E" />
            <rect x="56" y="16" width="10" height="50" rx="3" fill="#F7C948" />
            <rect x="67" y="19" width="10" height="48" rx="3" transform="rotate(4 67 19)" fill="#FFD85E" />
            <rect x="77" y="25" width="10" height="44" rx="3" transform="rotate(9 77 25)" fill="#F7C948" />
          </g>
          {/* Warm coral carton */}
          <path
            d="M30 52 Q60 62 90 52 L83 96 C82 99, 77 101, 60 101 C43 101, 38 99, 37 96 Z"
            fill="#E85349"
            stroke="#9E2B23"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M44 74 Q60 82 76 74" stroke="#F6C344" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </>
      );

    case 'soda':
      return (
        <>
          <circle cx="60" cy="60" r="50" fill="#ECEBFF" />
          {/* Striped straw */}
          <path
            d="M62 40 L68 18 L80 20"
            stroke="#F27A5E"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Dome lid */}
          <path
            d="M36 44 C36 30, 84 30, 84 44 Z"
            fill="#E8F4FA"
            stroke="#5C7A94"
            strokeWidth="2.6"
          />
          {/* Cup body */}
          <path
            d="M35 46 L85 46 L79 98 C78 101, 42 101, 41 98 Z"
            fill="#5B5BD6"
            stroke="#363696"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Fizzy stripe & bubbles */}
          <path d="M38 68 Q60 75 82 68 L80 80 Q60 87 40 80 Z" fill="#FFFFFF" opacity="0.92" />
          <rect x="32" y="43" width="56" height="6" rx="3" fill="#FFFFFF" stroke="#5C7A94" strokeWidth="2.4" />
          <circle cx="52" cy="57" r="3" fill="#ECEBFF" />
          <circle cx="66" cy="59" r="2.3" fill="#ECEBFF" />
          <circle cx="59" cy="53" r="2" fill="#ECEBFF" />
        </>
      );

    case 'candy':
      return (
        <>
          <circle cx="60" cy="60" r="50" fill="#FDECE7" />
          {/* Left wrapper twist */}
          <path
            d="M16 48 L34 57 L34 65 L16 74 L21 61 Z"
            fill="#F27A5E"
            stroke="#A53A24"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          {/* Right wrapper twist */}
          <path
            d="M104 48 L86 57 L86 65 L104 74 L99 61 Z"
            fill="#F27A5E"
            stroke="#A53A24"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          {/* Candy center */}
          <ellipse
            cx="60"
            cy="61"
            rx="28"
            ry="21"
            fill="#FF8BA7"
            stroke="#A53A54"
            strokeWidth="3"
          />
          <path d="M46 43 C52 55, 52 67, 46 79" stroke="#FFF6F8" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M60 40 C66 54, 66 68, 60 82" stroke="#F6C344" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M74 43 C80 55, 80 67, 74 79" stroke="#FFF6F8" strokeWidth="5" strokeLinecap="round" fill="none" />
        </>
      );

    case 'chips':
      return (
        <>
          <circle cx="60" cy="60" r="50" fill="#FEF5E1" />
          {/* Packet */}
          <path
            d="M32 28 Q60 32 88 28 L84 94 Q60 90 36 94 Z"
            fill="#F27A5E"
            stroke="#9E3922"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <rect x="30" y="23" width="60" height="7" rx="3" fill="#F6C344" stroke="#9E3922" strokeWidth="2.4" />
          <rect x="34" y="91" width="52" height="7" rx="3" fill="#F6C344" stroke="#9E3922" strokeWidth="2.4" />
          {/* Golden potato chips */}
          <ellipse
            cx="55"
            cy="60"
            rx="15"
            ry="11"
            transform="rotate(-16 55 60)"
            fill="#FFD966"
            stroke="#B67C14"
            strokeWidth="2.4"
          />
          <ellipse
            cx="68"
            cy="68"
            rx="13"
            ry="9.5"
            transform="rotate(18 68 68)"
            fill="#F6C344"
            stroke="#B67C14"
            strokeWidth="2.4"
          />
        </>
      );

    case 'shark':
      return (
        <>
          <circle cx="60" cy="60" r="50" fill="#E4F6F3" />
          {/* Dorsal fin */}
          <path
            d="M52 38 L62 18 L72 40 Z"
            fill="#5C82A6"
            stroke="#2B4865"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Tail fin */}
          <path
            d="M90 58 L106 42 L101 58 L106 74 Z"
            fill="#5C82A6"
            stroke="#2B4865"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Body */}
          <path
            d="M18 60 C22 40, 48 36, 74 42 C86 45, 94 52, 95 58 C94 65, 84 74, 70 77 C46 82, 22 75, 18 60 Z"
            fill="#6D95BA"
            stroke="#2B4865"
            strokeWidth="3"
          />
          {/* White belly */}
          <path
            d="M23 64 C36 62, 62 63, 84 68 C72 77, 42 80, 23 64 Z"
            fill="#F8FBFF"
          />
          {/* Pectoral fin */}
          <path
            d="M52 67 L44 86 L64 74 Z"
            fill="#5C82A6"
            stroke="#2B4865"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          {/* Eye & toothy grin */}
          <circle cx="36" cy="52" r="4" fill="#1E2433" />
          <circle cx="35" cy="50.8" r="1.4" fill="#FFFFFF" />
          <path
            d="M27 63 Q38 69 49 63"
            stroke="#2B4865"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
          <polygon points="32,65 35,69 38,65" fill="#FFFFFF" />
          <polygon points="39,65 42,69 45,65" fill="#FFFFFF" />
          {/* Gills */}
          <path d="M56 52 V60 M61 52 V60 M66 53 V60" stroke="#2B4865" strokeWidth="2.2" strokeLinecap="round" />
        </>
      );

    case 'donkey':
      return (
        <>
          <circle cx="60" cy="60" r="50" fill="#ECEBFF" />
          {/* Long donkey ears */}
          <ellipse
            cx="43"
            cy="29"
            rx="8.5"
            ry="21"
            transform="rotate(-16 43 29)"
            fill="#8F96A6"
            stroke="#474E5E"
            strokeWidth="3"
          />
          <ellipse
            cx="77"
            cy="29"
            rx="8.5"
            ry="21"
            transform="rotate(16 77 29)"
            fill="#8F96A6"
            stroke="#474E5E"
            strokeWidth="3"
          />
          <ellipse cx="43" cy="30" rx="4" ry="13" transform="rotate(-16 43 30)" fill="#F3B8B8" />
          <ellipse cx="77" cy="30" rx="4" ry="13" transform="rotate(16 77 30)" fill="#F3B8B8" />
          {/* Tuft mane */}
          <path d="M52 40 L56 30 L60 39 L64 30 L68 40" stroke="#3E4452" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Head */}
          <ellipse cx="60" cy="63" rx="26" ry="28" fill="#9DA4B4" stroke="#474E5E" strokeWidth="3" />
          {/* Light muzzle */}
          <ellipse cx="60" cy="77" rx="19" ry="14" fill="#ECEFF5" stroke="#474E5E" strokeWidth="2.6" />
          <circle cx="50" cy="57" r="4" fill="#1E2433" />
          <circle cx="70" cy="57" r="4" fill="#1E2433" />
          <circle cx="53" cy="74" r="2.8" fill="#474E5E" />
          <circle cx="67" cy="74" r="2.8" fill="#474E5E" />
          <path d="M53 83 Q60 88 67 83" stroke="#474E5E" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </>
      );

    case 'camel':
      return (
        <>
          <circle cx="60" cy="60" r="50" fill="#FEF5E1" />
          {/* Legs */}
          <g stroke="#7A4F25" strokeWidth="3" strokeLinecap="round">
            <line x1="48" y1="74" x2="48" y2="96" />
            <line x1="58" y1="76" x2="58" y2="96" />
            <line x1="74" y1="76" x2="74" y2="96" />
            <line x1="84" y1="74" x2="84" y2="96" />
          </g>
          {/* Tail */}
          <path d="M92 62 Q100 68 98 78" stroke="#7A4F25" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Body + Hump + Curved Neck */}
          <path
            d="M38 66 C34 66, 30 58, 30 46 L30 38 C24 38, 20 34, 20 30 C20 25, 26 23, 33 24 C38 25, 40 30, 40 38 L40 54 C44 55, 48 52, 52 44 C56 34, 68 34, 73 45 C77 53, 84 54, 90 58 C94 62, 94 74, 86 76 L44 76 C40 76, 38 72, 38 66 Z"
            fill="#DFA15A"
            stroke="#7A4F25"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="29" cy="29" r="2.6" fill="#1E2433" />
          <circle cx="37" cy="24" r="3.5" fill="#DFA15A" stroke="#7A4F25" strokeWidth="2.4" />
        </>
      );

    case 'deer':
      return (
        <>
          <circle cx="60" cy="60" r="50" fill="#E4F6F3" />
          {/* Rounded antlers */}
          <g stroke="#7C5132" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M47 40 C42 28, 36 22, 34 18 M41 29 L31 28 M44 24 L47 17" />
            <path d="M73 40 C78 28, 84 22, 86 18 M79 29 L89 28 M76 24 L73 17" />
          </g>
          {/* Ears */}
          <ellipse cx="34" cy="48" rx="11" ry="6" transform="rotate(-22 34 48)" fill="#C98349" stroke="#6E3F1D" strokeWidth="2.8" />
          <ellipse cx="86" cy="48" rx="11" ry="6" transform="rotate(22 86 48)" fill="#C98349" stroke="#6E3F1D" strokeWidth="2.8" />
          {/* Face */}
          <path
            d="M36 62 C36 44, 47 38, 60 38 C73 38, 84 44, 84 62 C84 79, 72 92, 60 92 C48 92, 36 79, 36 62 Z"
            fill="#D99156"
            stroke="#6E3F1D"
            strokeWidth="3"
          />
          {/* Fawn spots */}
          <circle cx="49" cy="47" r="2.5" fill="#FFF5E6" />
          <circle cx="60" cy="45" r="2.8" fill="#FFF5E6" />
          <circle cx="71" cy="47" r="2.5" fill="#FFF5E6" />
          {/* Muzzle */}
          <ellipse cx="60" cy="77" rx="14" ry="11" fill="#FFF5E6" />
          <circle cx="48" cy="61" r="4" fill="#1E2433" />
          <circle cx="72" cy="61" r="4" fill="#1E2433" />
          <ellipse cx="60" cy="73" rx="5.5" ry="4" fill="#3B2314" />
          <path d="M54 82 Q60 86 66 82" stroke="#6E3F1D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      );

    case 'hen':
      return (
        <>
          <circle cx="60" cy="60" r="50" fill="#FEF5E1" />
          {/* Red comb */}
          <path
            d="M46 34 C46 25, 53 25, 55 31 C57 23, 65 23, 66 31 C69 26, 75 28, 73 36 Z"
            fill="#E85349"
            stroke="#9B2820"
            strokeWidth="2.5"
          />
          {/* Body */}
          <path
            d="M32 66 C32 45, 45 34, 62 34 C76 34, 88 46, 90 62 C94 60, 99 63, 97 70 C94 83, 79 92, 60 92 C43 92, 32 81, 32 66 Z"
            fill="#FFF7EB"
            stroke="#8B5A2B"
            strokeWidth="3"
          />
          {/* Wing */}
          <ellipse cx="66" cy="68" rx="15" ry="11" fill="#F2C88B" stroke="#8B5A2B" strokeWidth="2.5" />
          {/* Beak & wattle */}
          <polygon points="32,54 20,59 32,64" fill="#F6B93B" stroke="#9C6514" strokeWidth="2.4" strokeLinejoin="round" />
          <ellipse cx="33" cy="68" rx="4" ry="5.5" fill="#E85349" />
          <circle cx="44" cy="52" r="3.8" fill="#1E2433" />
          {/* Feet */}
          <path d="M54 92 V100 M68 92 V100" stroke="#E08E26" strokeWidth="3" strokeLinecap="round" />
        </>
      );

    case 'ship':
      return (
        <>
          <circle cx="60" cy="60" r="50" fill="#E4F6F3" />
          {/* Smokestack */}
          <rect x="53" y="24" width="14" height="18" rx="3" fill="#F27A5E" stroke="#8C3623" strokeWidth="2.6" />
          <rect x="53" y="28" width="14" height="5" fill="#FFFFFF" />
          {/* Cabin */}
          <rect x="36" y="40" width="48" height="20" rx="5" fill="#FFFFFF" stroke="#364B63" strokeWidth="2.8" />
          <circle cx="48" cy="50" r="3.5" fill="#5B5BD6" />
          <circle cx="60" cy="50" r="3.5" fill="#5B5BD6" />
          <circle cx="72" cy="50" r="3.5" fill="#5B5BD6" />
          {/* Hull */}
          <path
            d="M20 58 L100 58 L88 84 L32 84 Z"
            fill="#3B5B8C"
            stroke="#223759"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Waves */}
          <path
            d="M18 86 Q30 80 42 86 T66 86 T90 86 T104 86"
            stroke="#3BA99C"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
        </>
      );

    case 'sailboat':
      return (
        <>
          <circle cx="60" cy="60" r="50" fill="#E4F6F3" />
          {/* Mast */}
          <line x1="58" y1="20" x2="58" y2="72" stroke="#6E4726" strokeWidth="3.5" strokeLinecap="round" />
          {/* Sails */}
          <path
            d="M55 24 L28 66 L55 66 Z"
            fill="#F27A5E"
            stroke="#9B3922"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <path
            d="M61 28 L90 66 L61 66 Z"
            fill="#F6C344"
            stroke="#9E6E12"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          {/* Boat hull */}
          <path
            d="M24 71 L96 71 L84 86 L36 86 Z"
            fill="#5B5BD6"
            stroke="#32328A"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          {/* Waves */}
          <path
            d="M20 90 Q34 84 48 90 T76 90 T100 90"
            stroke="#3BA99C"
            strokeWidth="4.2"
            strokeLinecap="round"
            fill="none"
          />
        </>
      );

    case 'tractor':
      return (
        <>
          <circle cx="60" cy="60" r="50" fill="#FEF5E1" />
          {/* Exhaust pipe */}
          <rect x="34" y="34" width="6" height="18" rx="2" fill="#474E5E" />
          {/* Cab */}
          <rect x="54" y="30" width="32" height="28" rx="5" fill="#3BA99C" stroke="#21685F" strokeWidth="2.8" />
          <rect x="59" y="35" width="22" height="16" rx="3" fill="#E4F6F3" />
          {/* Engine hood */}
          <rect x="26" y="48" width="62" height="22" rx="6" fill="#4BB571" stroke="#21685F" strokeWidth="2.8" />
          {/* Big rear wheel */}
          <circle cx="74" cy="74" r="18" fill="#2A303D" stroke="#181C24" strokeWidth="2.5" />
          <circle cx="74" cy="74" r="9" fill="#F6C344" />
          {/* Front wheel */}
          <circle cx="36" cy="79" r="12" fill="#2A303D" stroke="#181C24" strokeWidth="2.5" />
          <circle cx="36" cy="79" r="5.5" fill="#F6C344" />
        </>
      );
  }
}

interface ItemIllustrationProps {
  itemId: CircleSortItemId;
  size: number;
}

export function CircleSortItemIllustration({ itemId, size }: ItemIllustrationProps) {
  const spec = getCircleSortItemSpec(itemId);
  if (spec.art.kind === 'png') {
    return (
      <img
        src={assetUrl(spec.art.path)}
        alt=""
        className="cs-item-img"
        style={{ width: size, height: size }}
        draggable={false}
      />
    );
  }
  if (spec.art.kind === 'word-art') {
    return <WordIllustration id={spec.art.id} size={size} />;
  }
  return <CircleSortCustomArt id={spec.art.id} size={size} />;
}
