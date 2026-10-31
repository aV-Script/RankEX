// Ora locale degli studi (ADR-009: performedAt è in ora locale Europe/Rome).
// Stesso valore di LOCAL_TIME_ZONE in src/utils/lipedema.js (test di parità).
// File senza dipendenze: il test di parità lo importa anche in CI, dove
// functions/node_modules non è installato.
export const LOCAL_TIME_ZONE = 'Europe/Rome'
