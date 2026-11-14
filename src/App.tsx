import { useState } from 'react';
import { FamilyProfilesProvider, useFamilyProfiles } from './context/FamilyProfilesContext';
import { MemoryBoard } from './games/memory-match/MemoryBoard';
import { MemorySetup, type MemoryGameConfig } from './games/memory-match/MemorySetup';
import type { GameRegistryEntry } from './games/registry';
import { FamilyProfilesPage } from './pages/FamilyProfilesPage';
import { GameHubPage } from './pages/GameHubPage';

type Screen =
  | { view: 'hub' }
  | { view: 'profiles'; returnTo: 'hub' | 'memory-setup' }
  | { view: 'memory-setup' }
  | { view: 'memory-play'; gameKey: number };

function PebbleRouter() {
  const { profiles, soundEnabled, toggleSound } = useFamilyProfiles();
  const [screen, setScreen] = useState<Screen>({ view: 'hub' });
  const [lastMemoryConfig, setLastMemoryConfig] = useState<MemoryGameConfig | null>(null);

  const handleOpenGame = (gameId: GameRegistryEntry['id']) => {
    if (gameId === 'memory-match') {
      setScreen({ view: 'memory-setup' });
    }
  };

  if (screen.view === 'profiles') {
    return (
      <FamilyProfilesPage
        onBack={() =>
          setScreen(screen.returnTo === 'memory-setup' ? { view: 'memory-setup' } : { view: 'hub' })
        }
      />
    );
  }

  if (screen.view === 'memory-setup') {
    return (
      <MemorySetup
        profiles={profiles}
        initialConfig={lastMemoryConfig}
        onBackToHub={() => setScreen({ view: 'hub' })}
        onEditProfiles={() => setScreen({ view: 'profiles', returnTo: 'memory-setup' })}
        onStartGame={(config) => {
          setLastMemoryConfig(config);
          setScreen({ view: 'memory-play', gameKey: Date.now() });
        }}
      />
    );
  }

  if (screen.view === 'memory-play' && lastMemoryConfig) {
    return (
      <MemoryBoard
        key={screen.gameKey}
        config={lastMemoryConfig}
        profiles={profiles}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onChangeSetup={() => setScreen({ view: 'memory-setup' })}
        onBackToHub={() => setScreen({ view: 'hub' })}
      />
    );
  }

  return (
    <GameHubPage
      profiles={profiles}
      onOpenGame={handleOpenGame}
      onOpenProfiles={() => setScreen({ view: 'profiles', returnTo: 'hub' })}
    />
  );
}

export function App() {
  return (
    <FamilyProfilesProvider>
      <PebbleRouter />
    </FamilyProfilesProvider>
  );
}

export default App;
