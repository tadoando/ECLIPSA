/** Carga los JSON de /data desde disco (solo Node: pruebas, scripts, servidor). */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGameData } from './data.js';
import type { GameData } from './types.js';

const here = dirname(fileURLToPath(import.meta.url));
/** Carpeta /data en la raíz del proyecto (desde dist/src o src). */
export const DATA_DIR = resolve(here, '../../../../data');

export function loadData(dir = DATA_DIR): GameData {
  const read = (f: string) => JSON.parse(readFileSync(resolve(dir, f), 'utf8'));
  return buildGameData(read('cards.json'), read('heroes.json'), read('rules.json'));
}
