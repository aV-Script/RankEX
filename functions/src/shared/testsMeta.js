/**
 * Metadati minimi dei test atletici necessari per il calcolo server-side dei percentili.
 * Speculare a src/constants/tests.js — solo i campi usati dalla logica BE.
 * Omessi: label, unit, desc, guide, test (nome completo), asymmetryConfig.
 */
export const TESTS_META = [
  // ── HEALTH + ACTIVE ──────────────────────────────────────────────────────────
  {
    key:        'dinamometro_hand_grip',
    stat:       'forza',
    direction:  'direct',
    ageGroup:   (age) => age <= 35 ? '18-35' : age <= 45 ? '36-45' : age <= 55 ? '46-55' : age <= 65 ? '56-65' : '66+',
    categories: ['health', 'active'],
  },
  {
    key:        'ymca_step_test',
    stat:       'resistenza',
    direction:  'inverse',
    ageGroup:   (age) => age <= 35 ? '18-35' : age <= 45 ? '36-45' : '46+',
    categories: ['health', 'active'],
  },
  // ── HEALTH ───────────────────────────────────────────────────────────────────
  {
    key:        'sit_and_reach',
    stat:       'mobilita',
    direction:  'direct',
    ageGroup:   (age) => age <= 35 ? '18-35' : age <= 45 ? '36-45' : age <= 55 ? '46-55' : age <= 65 ? '56-65' : '66+',
    categories: ['health'],
  },
  {
    key:        'flamingo_test',
    stat:       'equilibrio',
    direction:  'inverse',
    ageGroup:   (age) => age <= 35 ? '18-35' : age <= 45 ? '36-45' : age <= 55 ? '46-55' : age <= 65 ? '56-65' : '66+',
    categories: ['health'],
  },
  {
    key:        'sit_to_stand',
    stat:       'esplosivita',
    direction:  'inverse',
    ageGroup:   (age) => age <= 35 ? '18-35' : age <= 45 ? '36-45' : age <= 55 ? '46-55' : age <= 65 ? '56-65' : '66+',
    categories: ['health'],
  },
  // ── ACTIVE ───────────────────────────────────────────────────────────────────
  {
    key:        'y_balance',
    stat:       'stabilita',
    direction:  'direct',
    ageGroup:   (age) => age < 10 ? null : age <= 11 ? '10-11' : age <= 13 ? '12-13' : age <= 15 ? '14-15' : age <= 17 ? '16-17' : age <= 40 ? '18-40' : '41-60',
    variables:  [
      { key: 'ANT_dx' }, { key: 'PM_dx' }, { key: 'PL_dx' },
      { key: 'ANT_sx' }, { key: 'PM_sx' }, { key: 'PL_sx' },
      { key: 'lunghezza_dx' }, { key: 'lunghezza_sx' },
    ],
    formulaType: 'y_balance_composite',
    categories:  ['active', 'soccer'],
  },
  {
    key:        'standing_long_jump',
    stat:       'esplosivita',
    direction:  'direct',
    ageGroup:   (age) => age < 7 ? null : age <= 7 ? '7' : age <= 8 ? '8' : age <= 9 ? '9' : age <= 10 ? '10' : age <= 11 ? '11' : age <= 12 ? '12' : age <= 13 ? '13' : age <= 14 ? '14' : age <= 15 ? '15' : age <= 16 ? '16' : age <= 17 ? '17' : age <= 35 ? '18-35' : '36-50',
    categories:  ['active', 'soccer', 'soccer_youth', 'soccer_junior'],
  },
  {
    key:        'sprint_10m',
    stat:       'velocita',
    direction:  'inverse',
    ageGroup:   (age) => age < 7 ? null : age <= 7 ? '7' : age <= 8 ? '8' : age <= 9 ? '9' : age <= 35 ? '18-35' : '36-50',
    categories:  ['active', 'soccer_youth'],
  },
  // ── ATHLETE ──────────────────────────────────────────────────────────────────
  {
    key:        'drop_jump_rsi',
    stat:       'reattivita',
    direction:  'direct',
    ageGroup:   (age) => age <= 35 ? '18-35' : '36-50',
    categories: ['athlete'],
  },
  {
    key:        't_test_agility',
    stat:       'agilita',
    direction:  'inverse',
    ageGroup:   () => '18-40',
    categories: ['athlete'],
  },
  {
    key:        'yo_yo_ir1',
    stat:       'resistenza',
    direction:  'direct',
    ageGroup:   (age) => age <= 35 ? '18-35' : '36-50',
    categories: ['athlete'],
  },
  {
    key:        'sprint_20m',
    stat:       'velocita',
    direction:  'inverse',
    ageGroup:   (age) => age < 7 ? null : age <= 7 ? '7' : age <= 8 ? '8' : age <= 9 ? '9' : age <= 10 ? '10' : age <= 11 ? '11' : age <= 12 ? '12' : age <= 13 ? '13' : age <= 15 ? '14-15' : age <= 17 ? '16-17' : age <= 35 ? '18-35' : '36-50',
    categories: ['athlete', 'soccer', 'soccer_junior'],
  },
  {
    key:        'cmj',
    stat:       'esplosivita',
    direction:  'direct',
    ageGroup:   (age) => age <= 35 ? '18-35' : '36-50',
    categories: ['athlete'],
  },
  // ── SOCCER ───────────────────────────────────────────────────────────────────
  {
    key:        '505_cod_agility',
    stat:       'agilita',
    direction:  'inverse',
    ageGroup:   (age) => age < 10 ? null : age <= 11 ? '10-11' : age <= 13 ? '12-13' : age <= 15 ? '14-15' : age <= 17 ? '16-17' : age <= 35 ? '18-35' : '36-50',
    categories: ['soccer'],
  },
  {
    key:        'beep_test',
    stat:       'resistenza',
    direction:  'direct',
    ageGroup:   (age) => age < 8 ? null : age <= 9 ? '8-9' : age <= 11 ? '10-11' : age <= 13 ? '12-13' : age <= 15 ? '14-15' : age <= 17 ? '16-17' : age <= 35 ? '18-35' : '36-50',
    categories: ['soccer'],
  },
  // ── SOCCER YOUTH (7-9) ───────────────────────────────────────────────────────
  {
    key:        'single_leg_stance',
    stat:       'equilibrio',
    direction:  'direct',
    ageGroup:   () => '7-9',
    categories: ['soccer_youth'],
  },
  {
    key:        'shuttle_run_30m',
    stat:       'resistenza',
    direction:  'inverse',
    ageGroup:   (age) => age < 7 ? null : age <= 7 ? '7' : age <= 8 ? '8' : age <= 9 ? '9' : null,
    categories: ['soccer_youth'],
  },
  {
    key:        't_test_mini',
    stat:       'agilita',
    direction:  'inverse',
    ageGroup:   (age) => age < 7 ? null : age <= 7 ? '7' : age <= 8 ? '8' : age <= 9 ? '9' : null,
    categories: ['soccer_youth'],
  },
  // ── SOCCER JUNIOR (10-13) ────────────────────────────────────────────────────
  {
    key:        'y_balance_anterior',
    stat:       'stabilita',
    direction:  'direct',
    ageGroup:   () => '10-13',
    variables:  [
      { key: 'ANT_dx' }, { key: 'ANT_sx' },
      { key: 'lunghezza_dx' }, { key: 'lunghezza_sx' },
    ],
    formulaType: 'y_balance_anterior',
    categories:  ['soccer_junior'],
  },
  {
    key:        't_test_soccer_junior',
    stat:       'agilita',
    direction:  'inverse',
    ageGroup:   (age) => age < 10 ? null : age <= 10 ? '10' : age <= 11 ? '11' : age <= 12 ? '12' : age <= 13 ? '13' : null,
    categories: ['soccer_junior'],
  },
  {
    key:        'six_minute_run',
    stat:       'resistenza',
    direction:  'direct',
    ageGroup:   (age) => age < 10 ? null : age <= 10 ? '10' : age <= 11 ? '11' : age <= 12 ? '12' : age <= 13 ? '13' : null,
    categories: ['soccer_junior'],
  },
]
