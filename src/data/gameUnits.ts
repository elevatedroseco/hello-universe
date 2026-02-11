/**
 * Known original Tiberian Sun unit IDs.
 * Used to detect name collisions when minting or exporting custom units.
 */
export const ORIGINAL_GAME_UNITS = new Set([
  // Infantry
  'E1','E2','E3','MEDIC','ELCAD','CTECH','HUEY','ENGINEER','CYBORG','JUMPJET',
  'CHAMSPY','UMAGON','GHOST','CYC2','MHIJACK','CIV1','CIV2','CIV3','CIV4',
  'CIV5','CIV6','MUTANT','MWMN','MUTANT3','TRATOS','OXANNA','SLAV','DOGGIE',
  // Vehicles
  'HARV','HORV','APC','BIKE','MMCH','TTNK','REPAIR','SMECH','BGGY','FLMTNK',
  'HVR','ART2','LPST','JUGG','LIMPET','MOBILEMP','CMOBILEMP','MCV','SAPC',
  'STNK','SUBTANK','SONIC','REAPER','4TNK','HMEC',
  // Aircraft
  'ORCA','ORCAB','ORCAI','HARPY','VAMP','VAMP2','DROPSHIP','C17',
  // Buildings
  'GAWEAP','GAAIRC','GAPOWR','GACNST','GATECH','GAREF','GAWALL','GABARR',
  'NAHAND','NAWEAP','NAAIRCR','NAPOWR','NACNST','NATECH','NAREF','NAWALL',
]);
