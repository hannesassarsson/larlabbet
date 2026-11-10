import type { ComponentType } from 'react';
import BokstavsjaktenGame from './bokstavsjakten/BokstavsjaktenGame';
import MalarladanGame from './malarladan/MalarladanGame';
import MatteGame from './matte/MatteGame';
import MemoryGame from './memory/MemoryGame';
import MonsterGame from './monster/MonsterGame';
import type { GameMeta } from './registry';
import SantFalsktGame from './santfalskt/SantFalsktGame';
import StavningGame from './stavning/StavningGame';

/** Alla spel i en egen del av appen, som laddas första gången ett spel öppnas. */
export const GAMES: Record<string, ComponentType<{ meta: GameMeta }>> = {
  memory: MemoryGame,
  bokstavsjakten: BokstavsjaktenGame,
  stavning: StavningGame,
  matte: MatteGame,
  monster: MonsterGame,
  santfalskt: SantFalsktGame,
  malarladan: MalarladanGame,
};
