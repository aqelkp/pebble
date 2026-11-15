import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_CLASS_LEVEL, isValidClassLevelId } from '../curriculum/curriculumRegistry';
import type { ClassLevelId } from '../curriculum/curriculumTypes';
import { assetUrl } from '../utils/assets';

// TODO(security): Pebble runs 100% locally in the browser with no backend server, authentication,
// or database. All profile names and settings stored in localStorage are validated against strict
// allow-lists and bounded lengths before rendering; add server auth/CSRF protection if cloud sync is ever added.

export type AvatarId = 'boy' | 'girl' | 'dad' | 'mom' | 'uncle' | 'grandparent';

export const AVATAR_OPTIONS: ReadonlyArray<{ id: AvatarId; label: string; src: string }> = [
  { id: 'boy', label: 'Boy', src: 'avatars/boy.png' },
  { id: 'girl', label: 'Girl', src: 'avatars/girl.png' },
  { id: 'dad', label: 'Dad', src: 'avatars/dad.png' },
  { id: 'mom', label: 'Mom', src: 'avatars/mom.png' },
  { id: 'uncle', label: 'Uncle', src: 'avatars/uncle.png' },
  { id: 'grandparent', label: 'Grandparent', src: 'avatars/grandparent.png' },
];

export const ACCENT_COLORS = [
  '#3BA99C',
  '#5B5BD6',
  '#F27A5E',
  '#F2B84B',
  '#4F87D8',
  '#9C6ADE',
] as const;

export type AccentColor = (typeof ACCENT_COLORS)[number];

export interface FamilyProfile {
  id: string;
  name: string;
  roleLabel: string;
  avatar: AvatarId;
  accentColor: AccentColor;
  classLevel?: ClassLevelId;
}

interface StoredState {
  version: 1;
  profiles: FamilyProfile[];
  soundEnabled: boolean;
}

const STORAGE_KEY = 'pebble.family.v1';
const MAX_NAME_LENGTH = 24;
const MAX_PROFILES = 6;

const DEFAULT_PROFILES: FamilyProfile[] = [
  {
    id: 'child',
    name: 'Child',
    roleLabel: 'Player 1',
    avatar: 'boy',
    accentColor: '#3BA99C',
    classLevel: DEFAULT_CLASS_LEVEL,
  },
  {
    id: 'dad',
    name: 'Dad',
    roleLabel: 'Family',
    avatar: 'dad',
    accentColor: '#5B5BD6',
  },
  {
    id: 'mom',
    name: 'Mom',
    roleLabel: 'Family',
    avatar: 'mom',
    accentColor: '#F27A5E',
  },
  {
    id: 'uncle',
    name: 'Uncle',
    roleLabel: 'Family',
    avatar: 'uncle',
    accentColor: '#F2B84B',
  },
];

const VALID_AVATAR_IDS = new Set<AvatarId>(AVATAR_OPTIONS.map((a) => a.id));
const VALID_COLORS = new Set<string>(ACCENT_COLORS);

export function sanitizeDisplayName(raw: string, fallback = 'Player'): string {
  // Strip ASCII control characters and collapse whitespace without HTML injection risk
  const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
  const bounded = cleaned.slice(0, MAX_NAME_LENGTH).trim();
  return bounded.length > 0 ? bounded : fallback;
}

function isValidProfileCandidate(item: unknown): item is Partial<FamilyProfile> {
  return typeof item === 'object' && item !== null;
}

function loadInitialState(): StoredState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { version: 1, profiles: DEFAULT_PROFILES, soundEnabled: true };
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return { version: 1, profiles: DEFAULT_PROFILES, soundEnabled: true };
    }
    const record = parsed as Record<string, unknown>;
    const rawProfiles = Array.isArray(record.profiles) ? record.profiles : [];
    const sanitizedProfiles: FamilyProfile[] = [];
    const seenIds = new Set<string>();

    for (let i = 0; i < Math.min(rawProfiles.length, MAX_PROFILES); i += 1) {
      const candidate = rawProfiles[i];
      if (!isValidProfileCandidate(candidate)) continue;
      const fallback = DEFAULT_PROFILES[i] ?? {
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        roleLabel: 'Family',
        avatar: 'girl' as AvatarId,
        accentColor: '#4F87D8' as AccentColor,
      };
      const rawId =
        typeof candidate.id === 'string' && /^[a-z0-9-]{1,24}$/i.test(candidate.id)
          ? candidate.id
          : fallback.id;
      if (seenIds.has(rawId)) continue;
      seenIds.add(rawId);

      const avatar: AvatarId =
        typeof candidate.avatar === 'string' && VALID_AVATAR_IDS.has(candidate.avatar as AvatarId)
          ? (candidate.avatar as AvatarId)
          : fallback.avatar;
      const accentColor: AccentColor =
        typeof candidate.accentColor === 'string' && VALID_COLORS.has(candidate.accentColor)
          ? (candidate.accentColor as AccentColor)
          : fallback.accentColor;
      const roleLabel =
        typeof candidate.roleLabel === 'string'
          ? sanitizeDisplayName(candidate.roleLabel, fallback.roleLabel)
          : fallback.roleLabel;
      const name =
        typeof candidate.name === 'string'
          ? sanitizeDisplayName(candidate.name, fallback.name)
          : fallback.name;

      const classLevel: ClassLevelId | undefined = isValidClassLevelId(candidate.classLevel)
        ? candidate.classLevel
        : i === 0
          ? DEFAULT_CLASS_LEVEL
          : undefined;

      sanitizedProfiles.push({
        id: rawId,
        name,
        roleLabel,
        avatar,
        accentColor,
        ...(classLevel ? { classLevel } : {}),
      });
    }

    const profiles = sanitizedProfiles.length >= 2 ? sanitizedProfiles : DEFAULT_PROFILES;
    const soundEnabled = typeof record.soundEnabled === 'boolean' ? record.soundEnabled : true;
    return { version: 1, profiles, soundEnabled };
  } catch {
    return { version: 1, profiles: DEFAULT_PROFILES, soundEnabled: true };
  }
}

export function getAvatarSrc(avatar: AvatarId): string {
  const found = AVATAR_OPTIONS.find((item) => item.id === avatar) ?? AVATAR_OPTIONS[0];
  return assetUrl(found.src);
}

interface FamilyProfilesContextValue {
  profiles: FamilyProfile[];
  soundEnabled: boolean;
  updateProfile: (
    id: string,
    patch: Partial<Pick<FamilyProfile, 'name' | 'avatar' | 'accentColor' | 'classLevel'>>,
  ) => void;
  replaceProfiles: (nextProfiles: FamilyProfile[]) => void;
  addProfile: (name: string, avatar?: AvatarId) => boolean;
  removeProfile: (id: string) => boolean;
  resetProfiles: () => void;
  toggleSound: () => void;
}

const FamilyProfilesContext = createContext<FamilyProfilesContextValue | null>(null);

export function FamilyProfilesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(() => loadInitialState());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota/storage errors in private browsing modes
    }
  }, [state]);

  const updateProfile = (
    id: string,
    patch: Partial<Pick<FamilyProfile, 'name' | 'avatar' | 'accentColor' | 'classLevel'>>,
  ) => {
    setState((prev) => ({
      ...prev,
      profiles: prev.profiles.map((profile) => {
        if (profile.id !== id) return profile;
        return {
          ...profile,
          name: patch.name !== undefined ? sanitizeDisplayName(patch.name, profile.name) : profile.name,
          avatar:
            patch.avatar !== undefined && VALID_AVATAR_IDS.has(patch.avatar)
              ? patch.avatar
              : profile.avatar,
          accentColor:
            patch.accentColor !== undefined && VALID_COLORS.has(patch.accentColor)
              ? patch.accentColor
              : profile.accentColor,
          classLevel:
            patch.classLevel !== undefined && isValidClassLevelId(patch.classLevel)
              ? patch.classLevel
              : profile.classLevel,
        };
      }),
    }));
  };

  const replaceProfiles = (nextProfiles: FamilyProfile[]) => {
    const cleaned = nextProfiles.slice(0, MAX_PROFILES).map((p, idx) => ({
      ...p,
      name: sanitizeDisplayName(p.name, DEFAULT_PROFILES[idx]?.name ?? `Player ${idx + 1}`),
      avatar: VALID_AVATAR_IDS.has(p.avatar) ? p.avatar : 'boy',
      accentColor: VALID_COLORS.has(p.accentColor) ? p.accentColor : '#5B5BD6',
    }));
    if (cleaned.length < 2) return;
    setState((prev) => ({ ...prev, profiles: cleaned }));
  };

  const addProfile = (name: string, avatar: AvatarId = 'girl'): boolean => {
    if (state.profiles.length >= MAX_PROFILES) return false;
    const cleanName = sanitizeDisplayName(name, `Player ${state.profiles.length + 1}`);
    const newProfile: FamilyProfile = {
      id: `member-${Date.now().toString(36)}`,
      name: cleanName,
      roleLabel: 'Family',
      avatar: VALID_AVATAR_IDS.has(avatar) ? avatar : 'girl',
      accentColor: ACCENT_COLORS[state.profiles.length % ACCENT_COLORS.length],
    };
    setState((prev) => ({
      ...prev,
      profiles: [...prev.profiles, newProfile],
    }));
    return true;
  };

  const removeProfile = (id: string): boolean => {
    if (state.profiles.length <= 2) return false;
    setState((prev) => ({
      ...prev,
      profiles: prev.profiles.filter((p) => p.id !== id),
    }));
    return true;
  };

  const resetProfiles = () => {
    setState((prev) => ({
      ...prev,
      profiles: DEFAULT_PROFILES,
    }));
  };

  const toggleSound = () => {
    setState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  return (
    <FamilyProfilesContext.Provider
      value={{
        profiles: state.profiles,
        soundEnabled: state.soundEnabled,
        updateProfile,
        replaceProfiles,
        addProfile,
        removeProfile,
        resetProfiles,
        toggleSound,
      }}
    >
      {children}
    </FamilyProfilesContext.Provider>
  );
}

export function useFamilyProfiles(): FamilyProfilesContextValue {
  const ctx = useContext(FamilyProfilesContext);
  if (!ctx) {
    throw new Error('useFamilyProfiles must be used within a FamilyProfilesProvider');
  }
  return ctx;
}
