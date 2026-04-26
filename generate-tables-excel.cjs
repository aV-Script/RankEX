#!/usr/bin/env node
// generate-tables-excel.cjs
// Genera un Excel con tabelle percentili e formule di RankEX.
//
// Utilizzo:
//   npm install exceljs   (solo la prima volta)
//   node generate-tables-excel.cjs
//
// Output: rankex-tabelle-percentili.xlsx

'use strict'

let ExcelJS
try { ExcelJS = require('exceljs') } catch {
  console.error('❌  exceljs non trovato. Installa con: npm install exceljs')
  process.exit(1)
}
const path = require('path')

// ─── PALETTE ────────────────────────────────────────────────────────────────
const C = {
  accentDk: 'FF085C28',
  accent:   'FF0EC452',
  header:   'FF1A2638',
  subhead:  'FF0F1820',
  mColor:   'FF1A3550',
  fColor:   'FF501A36',
  rowBase:  'FF07090E',
  rowAlt:   'FF0C1219',
  row50:    'FF1A3020',
  textWh:   'FFFFFFFF',
  textGr:   'FFCFD8E3',
  directFg: 'FF4ADE80',
  inverseFg:'FFFBBF24',
  mHdr:     'FF93C5FD',
  fHdr:     'FFFDA4AF',
}

// ─── METADATI TEST ──────────────────────────────────────────────────────────
const TESTS_META = [
  { key:'sit_and_reach',         test:'Sit and Reach',         stat:'mobilita',    unit:'cm',      direction:'direct',  categories:['health'],                         formula:null, variables:null },
  { key:'flamingo_test',         test:'Flamingo Test',         stat:'equilibrio',  unit:'cadute',  direction:'inverse', categories:['health'],                         formula:null, variables:null },
  { key:'ymca_step_test',        test:'YMCA Step Test',        stat:'resistenza',  unit:'bpm',     direction:'inverse', categories:['health','active'],                formula:null, variables:null },
  { key:'dinamometro_hand_grip', test:'Dinamometro Hand Grip', stat:'forza',       unit:'kg',      direction:'direct',  categories:['health','active'],                formula:null, variables:null },
  { key:'sit_to_stand',          test:'5 Sit to Stand',        stat:'esplosivita', unit:'secondi', direction:'inverse', categories:['health'],                         formula:null, variables:null },
  { key:'y_balance',             test:'Y Balance Test',        stat:'stabilita',   unit:'%',       direction:'direct',  categories:['active','soccer','soccer_youth'],  formula:'y_balance_composite', variables:['ANT_dx','PM_dx','PL_dx','ANT_sx','PM_sx','PL_sx','lunghezzaArto'] },
  { key:'standing_long_jump',    test:'Standing Long Jump',    stat:'esplosivita', unit:'cm',      direction:'direct',  categories:['active','soccer','soccer_youth'],  formula:null, variables:null },
  { key:'sprint_10m',            test:'10m Sprint',            stat:'velocita',    unit:'secondi', direction:'inverse', categories:['active'],                         formula:null, variables:null },
  { key:'drop_jump_rsi',         test:'Drop Jump RSI',         stat:'reattivita',  unit:'RSI',     direction:'direct',  categories:['athlete'],                        formula:null, variables:null },
  { key:'t_test_agility',        test:'T-Test Agility',        stat:'agilita',     unit:'secondi', direction:'inverse', categories:['athlete'],                        formula:null, variables:null },
  { key:'yo_yo_ir1',             test:'Yo-Yo IR1',             stat:'resistenza',  unit:'metri',   direction:'direct',  categories:['athlete'],                        formula:null, variables:null },
  { key:'sprint_20m',            test:'Sprint 20m',            stat:'velocita',    unit:'secondi', direction:'inverse', categories:['athlete','soccer','soccer_youth'], formula:null, variables:null },
  { key:'cmj',                   test:'CMJ Avanzato',          stat:'esplosivita', unit:'cm',      direction:'direct',  categories:['athlete'],                        formula:null, variables:null },
  { key:'505_cod_agility',       test:'505 COD Agility',       stat:'agilita',     unit:'secondi', direction:'inverse', categories:['soccer','soccer_youth'],           formula:null, variables:null },
  { key:'beep_test',             test:'Beep Test (MSFT)',      stat:'resistenza',  unit:'livello', direction:'direct',  categories:['soccer','soccer_youth'],           formula:null, variables:null },
]

// ─── TABELLE PERCENTILI ──────────────────────────────────────────────────────
const TABLES = {
  sit_and_reach: {
    M: {
      '18-35': { 0:7,  5:10, 10:13, 20:16, 30:19, 40:22, 50:25, 60:28, 70:31, 80:34, 90:37, 95:40, 100:43 },
      '36-45': { 0:5,  5:8,  10:11, 20:14, 30:17, 40:20, 50:23, 60:26, 70:29, 80:32, 90:35, 95:38, 100:41 },
      '46-55': { 0:3,  5:6,  10:9,  20:12, 30:15, 40:18, 50:21, 60:24, 70:27, 80:30, 90:33, 95:35, 100:37 },
      '56-65': { 0:0,  5:3,  10:6,  20:9,  30:12, 40:15, 50:18, 60:21, 70:24, 80:27, 90:30, 95:32, 100:34 },
      '66+':   { 0:-3, 5:0,  10:3,  20:6,  30:9,  40:12, 50:15, 60:18, 70:21, 80:23, 90:26, 95:28, 100:30 },
    },
    F: {
      '18-35': { 0:12, 5:15, 10:18, 20:21, 30:24, 40:27, 50:30, 60:33, 70:36, 80:39, 90:42, 95:45, 100:48 },
      '36-45': { 0:9,  5:12, 10:15, 20:18, 30:21, 40:24, 50:27, 60:30, 70:33, 80:36, 90:39, 95:42, 100:45 },
      '46-55': { 0:6,  5:9,  10:12, 20:15, 30:18, 40:21, 50:24, 60:27, 70:30, 80:33, 90:36, 95:39, 100:42 },
      '56-65': { 0:3,  5:6,  10:9,  20:12, 30:15, 40:18, 50:21, 60:24, 70:27, 80:30, 90:33, 95:36, 100:39 },
      '66+':   { 0:-1, 5:2,  10:5,  20:8,  30:11, 40:14, 50:17, 60:20, 70:23, 80:26, 90:29, 95:32, 100:35 },
    },
  },
  flamingo_test: {
    M: {
      '18-35': { 100:0, 95:1, 90:2, 80:3, 70:4, 60:5, 50:6, 40:7, 30:9,  20:11, 10:14, 5:17, 0:20 },
      '36-45': { 100:1, 95:2, 90:3, 80:4, 70:5, 60:6, 50:7, 40:9, 30:11, 20:13, 10:16, 5:20, 0:24 },
      '46-55': { 100:2, 95:3, 90:4, 80:5, 70:6, 60:7, 50:9, 40:11,30:13, 20:16, 10:19, 5:23, 0:27 },
      '56-65': { 100:3, 95:4, 90:5, 80:6, 70:7, 60:9, 50:11,40:13,30:16, 20:19, 10:23, 5:27, 0:31 },
      '66+':   { 100:5, 95:6, 90:7, 80:9, 70:10,60:12,50:14,40:16,30:19, 20:23, 10:27, 5:32, 0:37 },
    },
    F: {
      '18-35': { 100:0, 95:1, 90:2, 80:3, 70:4, 60:5, 50:6, 40:7, 30:8,  20:10, 10:12, 5:15, 0:18 },
      '36-45': { 100:1, 95:2, 90:3, 80:4, 70:5, 60:6, 50:7, 40:8, 30:10, 20:12, 10:14, 5:17, 0:20 },
      '46-55': { 100:2, 95:3, 90:4, 80:5, 70:6, 60:7, 50:8, 40:10,30:12, 20:14, 10:17, 5:20, 0:23 },
      '56-65': { 100:3, 95:4, 90:5, 80:6, 70:7, 60:8, 50:10,40:12,30:14, 20:17, 10:20, 5:24, 0:28 },
      '66+':   { 100:4, 95:5, 90:6, 80:8, 70:9, 60:11,50:13,40:15,30:17, 20:20, 10:24, 5:29, 0:34 },
    },
  },
  ymca_step_test: {
    M: {
      '18-35': { 100:77,  95:81,  90:85,  75:103, 50:120, 30:123, 15:127, 5:136, 0:140 },
      '36-45': { 100:80,  95:84,  90:88,  75:102, 50:120, 30:125, 15:129, 5:138, 0:142 },
      '46+':   { 100:81,  95:90,  90:99,  75:111, 50:120, 30:124, 15:130, 5:138, 0:142 },
    },
    F: {
      '18-35': { 100:64,  95:79,  90:94,  75:109, 50:118, 30:122, 15:129, 5:137, 0:141 },
      '36-45': { 100:68,  95:79,  90:90,  75:106, 50:118, 30:125, 15:134, 5:145, 0:150 },
      '46+':   { 100:71,  95:84,  90:97,  75:108, 50:118, 30:124, 15:130, 5:145, 0:152 },
    },
  },
  dinamometro_hand_grip: {
    M: {
      '18-35': { 0:31, 5:34, 10:37, 20:40, 30:43, 40:46, 50:48, 60:50, 70:53, 80:56, 90:60, 95:64, 100:68 },
      '36-45': { 0:29, 5:32, 10:35, 20:38, 30:41, 40:43, 50:46, 60:48, 70:51, 80:54, 90:58, 95:62, 100:66 },
      '46-55': { 0:27, 5:30, 10:33, 20:35, 30:38, 40:40, 50:42, 60:45, 70:47, 80:50, 90:54, 95:58, 100:62 },
      '56-65': { 0:25, 5:27, 10:29, 20:31, 30:33, 40:35, 50:37, 60:39, 70:42, 80:45, 90:48, 95:52, 100:56 },
      '66+':   { 0:19, 5:21, 10:23, 20:25, 30:27, 40:29, 50:31, 60:33, 70:35, 80:38, 90:42, 95:46, 100:50 },
    },
    F: {
      '18-35': { 0:16, 5:18, 10:20, 20:22, 30:24, 40:26, 50:27, 60:28, 70:29, 80:31, 90:34, 95:36, 100:38 },
      '36-45': { 0:15, 5:17, 10:19, 20:21, 30:23, 40:24, 50:25, 60:26, 70:28, 80:30, 90:32, 95:34, 100:36 },
      '46-55': { 0:14, 5:16, 10:18, 20:20, 30:22, 40:23, 50:24, 60:25, 70:26, 80:28, 90:30, 95:32, 100:34 },
      '56-65': { 0:13, 5:15, 10:17, 20:19, 30:20, 40:21, 50:22, 60:23, 70:24, 80:25, 90:27, 95:29, 100:31 },
      '66+':   { 0:11, 5:13, 10:15, 20:16, 30:17, 40:18, 50:19, 60:20, 70:21, 80:22, 90:24, 95:25, 100:26 },
    },
  },
  sit_to_stand: {
    M: {
      '18-35': { 100:5.0,  95:5.5,  90:6.0,  80:6.5,  70:7.0,  60:7.4,  50:7.8,  40:8.3,  30:8.9,  20:9.6,  10:10.7, 5:11.7, 0:12.7 },
      '36-45': { 100:5.3,  95:5.8,  90:6.3,  80:6.9,  70:7.4,  60:7.8,  50:8.3,  40:8.9,  30:9.6,  20:10.5, 10:11.6, 5:12.8, 0:14.0 },
      '46-55': { 100:5.6,  95:6.2,  90:6.8,  80:7.5,  70:8.0,  60:8.5,  50:9.0,  40:9.7,  30:10.4, 20:11.3, 10:12.6, 5:14.0, 0:15.4 },
      '56-65': { 100:6.2,  95:6.8,  90:7.4,  80:8.0,  70:8.6,  60:9.2,  50:9.8,  40:10.5, 30:11.3, 20:12.2, 10:13.8, 5:15.4, 0:17.0 },
      '66+':   { 100:7.2,  95:7.8,  90:8.4,  80:9.0,  70:9.7,  60:10.4, 50:11.2, 40:12.0, 30:13.0, 20:14.1, 10:15.6, 5:17.2, 0:18.8 },
    },
    F: {
      '18-35': { 100:5.1,  95:5.6,  90:6.1,  80:6.6,  70:7.1,  60:7.6,  50:8.1,  40:8.6,  30:9.2,  20:10.0, 10:11.2, 5:12.5, 0:13.8 },
      '36-45': { 100:5.5,  95:6.0,  90:6.5,  80:7.1,  70:7.6,  60:8.1,  50:8.6,  40:9.2,  30:9.9,  20:10.8, 10:12.1, 5:13.5, 0:14.9 },
      '46-55': { 100:5.8,  95:6.4,  90:7.0,  80:7.6,  70:8.2,  60:8.8,  50:9.4,  40:10.0, 30:10.8, 20:11.7, 10:13.2, 5:14.7, 0:16.2 },
      '56-65': { 100:6.4,  95:7.0,  90:7.6,  80:8.3,  70:8.9,  60:9.5,  50:10.2, 40:10.9, 30:11.8, 20:12.9, 10:14.6, 5:16.3, 0:18.0 },
      '66+':   { 100:7.4,  95:8.0,  90:8.6,  80:9.3,  70:10.0, 60:10.8, 50:11.6, 40:12.5, 30:13.5, 20:14.8, 10:16.5, 5:18.5, 0:20.5 },
    },
  },
  y_balance: {
    M: {
      '10-11': { 0:68, 5:76, 10:79, 20:82, 30:85, 40:87, 50:89, 60:91, 70:93, 80:96, 90:99,  95:102, 100:110 },
      '12-13': { 0:71, 5:79, 10:82, 20:85, 30:88, 40:90, 50:92, 60:94, 70:96, 80:99, 90:102, 95:105, 100:113 },
      '14-15': { 0:75, 5:83, 10:86, 20:89, 30:92, 40:94, 50:96, 60:98, 70:100,80:103,90:106, 95:109, 100:117 },
      '16-17': { 0:78, 5:86, 10:89, 20:92, 30:95, 40:97, 50:99, 60:101,70:103,80:106,90:109, 95:112, 100:120 },
      '18-40': { 0:65, 5:72, 10:78, 20:83, 30:87, 40:91, 50:96, 60:100, 70:104, 80:108, 90:113, 95:117, 100:122 },
      '41-60': { 0:60, 5:67, 10:72, 20:78, 30:82, 40:86, 50:91, 60:95,  70:99,  80:103, 90:108, 95:112, 100:117 },
    },
    F: {
      '10-11': { 0:68, 5:76, 10:79, 20:82, 30:85, 40:87, 50:89, 60:91, 70:93, 80:96, 90:99,  95:102, 100:110 },
      '12-13': { 0:71, 5:79, 10:82, 20:85, 30:88, 40:90, 50:92, 60:94, 70:96, 80:99, 90:102, 95:105, 100:113 },
      '14-15': { 0:75, 5:83, 10:86, 20:89, 30:92, 40:94, 50:96, 60:98, 70:100,80:103,90:106, 95:109, 100:117 },
      '16-17': { 0:78, 5:86, 10:89, 20:92, 30:95, 40:97, 50:99, 60:101,70:103,80:106,90:109, 95:112, 100:120 },
      '18-40': { 0:62, 5:70, 10:75, 20:80, 30:85, 40:89, 50:95, 60:99,  70:103, 80:107, 90:112, 95:116, 100:120 },
      '41-60': { 0:57, 5:64, 10:70, 20:75, 30:80, 40:84, 50:89, 60:93,  70:97,  80:101, 90:106, 95:110, 100:115 },
    },
  },
  standing_long_jump: {
    M: {
      '6-7':  { 0:85,  5:97,  10:103, 20:115, 30:118, 40:121, 50:125, 60:126, 70:130, 80:134, 90:146, 95:152, 100:161 },
      '8-9':  { 0:90,  5:98,  10:103, 20:113, 30:120, 40:129, 50:133, 60:138, 70:146, 80:155, 90:169, 95:176, 100:190 },
      '10-11':{ 0:95,  5:106, 10:114, 20:131, 30:136, 40:142, 50:148, 60:152, 70:159, 80:164, 90:176, 95:182, 100:191 },
      '12-13':{ 0:120, 5:129, 10:136, 20:150, 30:156, 40:161, 50:166, 60:173, 70:179, 80:183, 90:191, 95:195, 100:200 },
      '14-15':{ 0:115, 5:125, 10:131, 20:143, 30:153, 40:163, 50:168, 60:177, 70:183, 80:192, 90:202, 95:207, 100:215 },
      '16-17':{ 0:125, 5:136, 10:143, 20:157, 30:170, 40:179, 50:188, 60:195, 70:205, 80:213, 90:226, 95:233, 100:243 },
      '18-35': { 0:120, 5:145, 10:160, 20:175, 30:188, 40:198, 50:208, 60:218, 70:228, 80:240, 90:255, 95:268, 100:290 },
      '36-50': { 0:100, 5:128, 10:145, 20:160, 30:172, 40:182, 50:192, 60:202, 70:212, 80:224, 90:238, 95:250, 100:270 },
    },
    F: {
      '6-7':  { 0:80,  5:90,  10:95,  20:106, 30:111, 40:117, 50:119, 60:121, 70:125, 80:131, 90:141, 95:146, 100:155 },
      '8-9':  { 0:80,  5:88,  10:94,  20:107, 30:113, 40:118, 50:123, 60:130, 70:135, 80:146, 90:159, 95:166, 100:176 },
      '10-11':{ 0:95,  5:103, 10:108, 20:119, 30:132, 40:137, 50:145, 60:152, 70:157, 80:164, 90:175, 95:181, 100:189 },
      '12-13':{ 0:110, 5:118, 10:122, 20:130, 30:135, 40:141, 50:147, 60:152, 70:157, 80:162, 90:177, 95:185, 100:195 },
      '14-15':{ 0:103, 5:109, 10:112, 20:119, 30:126, 40:132, 50:139, 60:145, 70:151, 80:161, 90:172, 95:178, 100:186 },
      '16-17':{ 0:85,  5:93,  10:99,  20:112, 30:116, 40:124, 50:129, 60:137, 70:144, 80:154, 90:167, 95:174, 100:184 },
      '18-35': { 0:90,  5:110, 10:125, 20:140, 30:152, 40:160, 50:170, 60:180, 70:190, 80:200, 90:215, 95:225, 100:245 },
      '36-50': { 0:75,  5:95,  10:110, 20:125, 30:138, 40:148, 50:158, 60:168, 70:178, 80:188, 90:200, 95:210, 100:230 },
    },
  },
  sprint_10m: {
    M: {
      '18-35': { 100:1.60, 95:1.75, 90:1.88, 80:2.00, 70:2.10, 60:2.20, 50:2.30, 40:2.45, 30:2.60, 20:2.80, 10:3.00, 5:3.20, 0:3.60 },
      '36-50': { 100:1.75, 95:1.90, 90:2.05, 80:2.18, 70:2.28, 60:2.38, 50:2.50, 40:2.65, 30:2.80, 20:3.00, 10:3.25, 5:3.45, 0:3.80 },
    },
    F: {
      '18-35': { 100:1.80, 95:1.95, 90:2.10, 80:2.25, 70:2.38, 60:2.50, 50:2.65, 40:2.80, 30:2.95, 20:3.15, 10:3.40, 5:3.60, 0:4.00 },
      '36-50': { 100:1.95, 95:2.10, 90:2.25, 80:2.40, 70:2.55, 60:2.68, 50:2.82, 40:2.98, 30:3.15, 20:3.35, 10:3.60, 5:3.80, 0:4.20 },
    },
  },
  drop_jump_rsi: {
    M: {
      '18-35': { 0:0.5, 5:0.8, 10:1.0, 20:1.3, 30:1.6, 40:1.9, 50:2.1, 60:2.3, 70:2.5, 80:2.8, 90:3.1, 95:3.4, 100:3.8 },
      '36-50': { 0:0.4, 5:0.7, 10:0.9, 20:1.1, 30:1.4, 40:1.6, 50:1.8, 60:2.0, 70:2.2, 80:2.5, 90:2.8, 95:3.0, 100:3.4 },
    },
    F: {
      '18-35': { 0:0.4, 5:0.6, 10:0.8, 20:1.0, 30:1.2, 40:1.4, 50:1.6, 60:1.8, 70:2.0, 80:2.2, 90:2.5, 95:2.7, 100:3.0 },
      '36-50': { 0:0.3, 5:0.5, 10:0.7, 20:0.9, 30:1.1, 40:1.3, 50:1.5, 60:1.7, 70:1.9, 80:2.1, 90:2.3, 95:2.5, 100:2.8 },
    },
  },
  t_test_agility: {
    M: {
      '18-40': { 100:8.5, 95:9.0, 90:9.5, 80:10.0, 70:10.3, 60:10.7, 50:11.0, 40:11.4, 30:11.8, 20:12.3, 10:13.0, 5:13.8, 0:15.0 },
    },
    F: {
      '18-40': { 100:9.5, 95:10.0, 90:10.5, 80:11.0, 70:11.3, 60:11.7, 50:12.0, 40:12.4, 30:12.8, 20:13.4, 10:14.2, 5:15.0, 0:16.5 },
    },
  },
  yo_yo_ir1: {
    M: {
      '18-35': { 0:160,  5:320,  10:480,  20:720,  30:960,  40:1200, 50:1520, 60:1840, 70:2120, 80:2400, 90:2880, 95:3200, 100:3600 },
      '36-50': { 0:120,  5:240,  10:360,  20:560,  30:760,  40:1000, 50:1240, 60:1520, 70:1800, 80:2080, 90:2480, 95:2800, 100:3200 },
    },
    F: {
      '18-35': { 0:80,   5:160,  10:280,  20:400,  30:560,  40:720,  50:920,  60:1120, 70:1360, 80:1600, 90:1920, 95:2240, 100:2640 },
      '36-50': { 0:60,   5:120,  10:200,  20:320,  30:440,  40:600,  50:760,  60:960,  70:1200, 80:1440, 90:1720, 95:2000, 100:2400 },
    },
  },
  sprint_20m: {
    M: {
      '8-9':  { 100:3.60, 95:3.75, 90:3.90, 80:4.05, 70:4.13, 60:4.20, 50:4.28, 40:4.36, 30:4.45, 20:4.58, 10:4.75, 5:4.90, 0:5.20 },
      '10-11':{ 100:3.20, 95:3.38, 90:3.53, 80:3.65, 70:3.75, 60:3.82, 50:3.90, 40:4.00, 30:4.10, 20:4.20, 10:4.38, 5:4.55, 0:4.85 },
      '12-13':{ 100:3.00, 95:3.15, 90:3.28, 80:3.40, 70:3.50, 60:3.58, 50:3.65, 40:3.72, 30:3.80, 20:3.90, 10:4.05, 5:4.18, 0:4.45 },
      '14-15':{ 100:2.85, 95:3.00, 90:3.14, 80:3.25, 70:3.35, 60:3.42, 50:3.48, 40:3.55, 30:3.62, 20:3.72, 10:3.86, 5:3.98, 0:4.25 },
      '16-17':{ 100:2.75, 95:2.88, 90:3.00, 80:3.12, 70:3.22, 60:3.30, 50:3.38, 40:3.46, 30:3.55, 20:3.65, 10:3.78, 5:3.90, 0:4.15 },
      '18-35': { 100:2.65, 95:2.80, 90:2.95, 80:3.10, 70:3.20, 60:3.30, 50:3.40, 40:3.55, 30:3.70, 20:3.90, 10:4.15, 5:4.40, 0:4.80 },
      '36-50': { 100:2.85, 95:3.00, 90:3.15, 80:3.30, 70:3.42, 60:3.55, 50:3.68, 40:3.85, 30:4.00, 20:4.20, 10:4.50, 5:4.75, 0:5.20 },
    },
    F: {
      '8-9':  { 100:3.60, 95:3.75, 90:3.90, 80:4.05, 70:4.13, 60:4.20, 50:4.28, 40:4.36, 30:4.45, 20:4.58, 10:4.75, 5:4.90, 0:5.20 },
      '10-11':{ 100:3.20, 95:3.38, 90:3.53, 80:3.65, 70:3.75, 60:3.82, 50:3.90, 40:4.00, 30:4.10, 20:4.20, 10:4.38, 5:4.55, 0:4.85 },
      '12-13':{ 100:3.00, 95:3.15, 90:3.28, 80:3.40, 70:3.50, 60:3.58, 50:3.65, 40:3.72, 30:3.80, 20:3.90, 10:4.05, 5:4.18, 0:4.45 },
      '14-15':{ 100:2.85, 95:3.00, 90:3.14, 80:3.25, 70:3.35, 60:3.42, 50:3.48, 40:3.55, 30:3.62, 20:3.72, 10:3.86, 5:3.98, 0:4.25 },
      '16-17':{ 100:2.75, 95:2.88, 90:3.00, 80:3.12, 70:3.22, 60:3.30, 50:3.38, 40:3.46, 30:3.55, 20:3.65, 10:3.78, 5:3.90, 0:4.15 },
      '18-35': { 100:3.00, 95:3.15, 90:3.30, 80:3.48, 70:3.60, 60:3.72, 50:3.85, 40:4.00, 30:4.18, 20:4.40, 10:4.70, 5:4.95, 0:5.40 },
      '36-50': { 100:3.20, 95:3.38, 90:3.55, 80:3.72, 70:3.85, 60:3.98, 50:4.12, 40:4.28, 30:4.45, 20:4.68, 10:5.00, 5:5.25, 0:5.70 },
    },
  },
  cmj: {
    M: {
      '18-35': { 0:12, 5:18, 10:22, 20:27, 30:32, 40:36, 50:40, 60:44, 70:48, 80:53, 90:58, 95:63, 100:70 },
      '36-50': { 0:10, 5:15, 10:18, 20:23, 30:27, 40:31, 50:35, 60:39, 70:43, 80:47, 90:52, 95:57, 100:63 },
    },
    F: {
      '18-35': { 0:8,  5:12, 10:15, 20:19, 30:23, 40:26, 50:29, 60:32, 70:36, 80:40, 90:45, 95:49, 100:55 },
      '36-50': { 0:6,  5:10, 10:13, 20:16, 30:20, 40:23, 50:26, 60:29, 70:33, 80:37, 90:41, 95:45, 100:50 },
    },
  },
  '505_cod_agility': {
    M: {
      '10-11':{ 100:2.10, 95:2.20, 90:2.32, 80:2.45, 70:2.54, 60:2.60, 50:2.65, 40:2.71, 30:2.77, 20:2.85, 10:2.97, 5:3.08, 0:3.35 },
      '12-13':{ 100:1.96, 95:2.04, 90:2.17, 80:2.28, 70:2.37, 60:2.44, 50:2.50, 40:2.56, 30:2.63, 20:2.72, 10:2.83, 5:2.93, 0:3.18 },
      '14-15':{ 100:1.85, 95:1.94, 90:2.04, 80:2.14, 70:2.23, 60:2.31, 50:2.38, 40:2.44, 30:2.50, 20:2.58, 10:2.70, 5:2.79, 0:3.03 },
      '16-17':{ 100:1.82, 95:1.90, 90:1.97, 80:2.05, 70:2.12, 60:2.20, 50:2.28, 40:2.35, 30:2.43, 20:2.50, 10:2.61, 5:2.73, 0:2.97 },
      '18-35': { 100:1.80, 95:1.88, 90:1.95, 80:2.04, 70:2.12, 60:2.18, 50:2.25, 40:2.33, 30:2.42, 20:2.53, 10:2.65, 5:2.76, 0:3.00 },
      '36-50': { 100:1.92, 95:2.00, 90:2.08, 80:2.18, 70:2.27, 60:2.35, 50:2.43, 40:2.52, 30:2.63, 20:2.77, 10:2.93, 5:3.08, 0:3.30 },
    },
    F: {
      '10-11':{ 100:2.10, 95:2.20, 90:2.32, 80:2.45, 70:2.54, 60:2.60, 50:2.65, 40:2.71, 30:2.77, 20:2.85, 10:2.97, 5:3.08, 0:3.35 },
      '12-13':{ 100:1.96, 95:2.04, 90:2.17, 80:2.28, 70:2.37, 60:2.44, 50:2.50, 40:2.56, 30:2.63, 20:2.72, 10:2.83, 5:2.93, 0:3.18 },
      '14-15':{ 100:1.85, 95:1.94, 90:2.04, 80:2.14, 70:2.23, 60:2.31, 50:2.38, 40:2.44, 30:2.50, 20:2.58, 10:2.70, 5:2.79, 0:3.03 },
      '16-17':{ 100:1.82, 95:1.90, 90:1.97, 80:2.05, 70:2.12, 60:2.20, 50:2.28, 40:2.35, 30:2.43, 20:2.50, 10:2.61, 5:2.73, 0:2.97 },
      '18-35': { 100:2.00, 95:2.10, 90:2.20, 80:2.30, 70:2.40, 60:2.50, 50:2.60, 40:2.72, 30:2.84, 20:3.00, 10:3.18, 5:3.35, 0:3.70 },
      '36-50': { 100:2.15, 95:2.27, 90:2.38, 80:2.50, 70:2.62, 60:2.74, 50:2.86, 40:3.00, 30:3.15, 20:3.32, 10:3.52, 5:3.70, 0:4.10 },
    },
  },
  beep_test: {
    M: {
      '8-9':  { 0:2.0, 5:2.2, 10:2.6, 20:3.5, 30:4.0, 40:4.5, 50:5.0, 60:5.5, 70:6.0, 80:6.5, 90:7.3, 95:7.7, 100:8.5 },
      '10-11':{ 0:2.0, 5:2.2, 10:2.7, 20:3.7, 30:4.2, 40:4.7, 50:5.3, 60:5.8, 70:6.4, 80:6.9, 90:7.9, 95:8.4, 100:9.2 },
      '12-13':{ 0:2.0, 5:2.3, 10:2.9, 20:4.2, 30:4.9, 40:5.5, 50:6.2, 60:6.8, 70:7.5, 80:8.1, 90:9.2, 95:9.7, 100:10.5 },
      '14-15':{ 0:2.2, 5:2.7, 10:3.4, 20:4.7, 30:5.5, 40:6.3, 50:7.0, 60:7.7, 70:8.5, 80:9.2, 90:10.5, 95:11.1, 100:12.0 },
      '16-17':{ 0:2.5, 5:3.0, 10:3.7, 20:5.2, 30:6.0, 40:6.8, 50:7.6, 60:8.3, 70:9.1, 80:9.9, 90:11.3, 95:12.0, 100:13.0 },
      '18-35': { 0:4.0, 5:5.5, 10:6.5, 20:7.5, 30:8.5, 40:9.5, 50:10.5, 60:11.5, 70:12.5, 80:13.5, 90:14.5, 95:15.5, 100:17.0 },
      '36-50': { 0:3.0, 5:4.5, 10:5.5, 20:6.5, 30:7.5, 40:8.5, 50:9.5,  60:10.5, 70:11.5, 80:12.5, 90:13.5, 95:14.5, 100:16.0 },
    },
    F: {
      '8-9':  { 0:1.8, 5:2.2, 10:2.6, 20:3.2, 30:3.7, 40:4.1, 50:4.4, 60:4.7, 70:5.1, 80:5.5, 90:6.1, 95:6.6, 100:7.2 },
      '10-11':{ 0:1.5, 5:1.7, 10:2.2, 20:3.2, 30:3.7, 40:4.1, 50:4.5, 60:4.9, 70:5.4, 80:5.8, 90:6.6, 95:7.0, 100:7.6 },
      '12-13':{ 0:1.3, 5:1.5, 10:2.1, 20:3.2, 30:3.7, 40:4.2, 50:4.7, 60:5.2, 70:5.7, 80:6.2, 90:7.0, 95:7.4, 100:8.0 },
      '14-15':{ 0:1.3, 5:1.5, 10:2.1, 20:3.2, 30:3.8, 40:4.3, 50:4.8, 60:5.3, 70:5.9, 80:6.4, 90:7.3, 95:7.7, 100:8.4 },
      '16-17':{ 0:1.3, 5:1.5, 10:2.1, 20:3.2, 30:3.8, 40:4.3, 50:4.9, 60:5.4, 70:6.0, 80:6.5, 90:7.4, 95:7.9, 100:8.6 },
      '18-35': { 0:3.0, 5:4.5, 10:5.5, 20:6.5, 30:7.5, 40:8.5, 50:9.5,  60:10.5, 70:11.5, 80:12.5, 90:13.5, 95:14.0, 100:15.5 },
      '36-50': { 0:2.0, 5:3.5, 10:4.5, 20:5.5, 30:6.5, 40:7.5, 50:8.5,  60:9.5,  70:10.5, 80:11.5, 90:12.5, 95:13.0, 100:14.5 },
    },
  },
}

// ─── SHEET: PANORAMICA ───────────────────────────────────────────────────────
function buildPanoramica(wb) {
  const ws = wb.addWorksheet('Panoramica')
  ws.columns = [
    { width: 24 }, // key
    { width: 26 }, // nome
    { width: 14 }, // stat
    { width: 10 }, // unità
    { width: 12 }, // direzione
    { width: 36 }, // lettura
    { width: 38 }, // categorie
    { width: 22 }, // formula
    { width: 18 }, // fasce M
    { width: 18 }, // fasce F
  ]

  ws.mergeCells('A1:J1')
  const title = ws.getCell('A1')
  title.value = 'RankEX — Panoramica Test Atletici'
  title.font  = { bold: true, size: 15, color: { argb: C.textWh }, name: 'Calibri' }
  title.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.accentDk } }
  title.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 30

  const headers = ['Chiave', 'Nome Test', 'Stat', 'Unità', 'Direzione', 'Lettura', 'Categorie', 'Formula', 'Fasce M', 'Fasce F']
  const hRow = ws.getRow(2)
  hRow.height = 20
  headers.forEach((h, i) => {
    const cell = hRow.getCell(i + 1)
    cell.value = h
    cell.font  = { bold: true, color: { argb: C.textWh }, size: 10, name: 'Calibri' }
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.header } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = { bottom: { style: 'medium', color: { argb: C.accent } } }
  })

  TESTS_META.forEach((t, idx) => {
    const td = TABLES[t.key]
    const fasceMArr = td?.M ? Object.keys(td.M) : []
    const fasceFArr = td?.F ? Object.keys(td.F) : []
    const rowNum = idx + 3
    const row = ws.getRow(rowNum)
    row.height = 17
    const bg = idx % 2 === 0 ? C.rowBase : C.rowAlt
    const dirLabel = t.direction === 'direct'
      ? '↑ Valore più alto = percentile più alto'
      : '↓ Valore più basso = percentile più alto'
    const dirColor = t.direction === 'direct' ? C.directFg : C.inverseFg

    const values = [
      t.key, t.test, t.stat, t.unit, t.direction,
      dirLabel, t.categories.join(', '),
      t.formula || '—', fasceMArr.join(', '), fasceFArr.join(', '),
    ]
    values.forEach((v, i) => {
      const cell = row.getCell(i + 1)
      cell.value = v
      cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
      cell.font  = { color: { argb: i === 5 ? dirColor : C.textGr }, size: 10, name: 'Calibri' }
      cell.alignment = { horizontal: 'left', vertical: 'middle' }
    })
  })
}

// ─── SHEET: PER TEST ─────────────────────────────────────────────────────────
function buildTestSheet(wb, meta, tableData) {
  const sheetName = meta.test.replace(/[\/\\*\[\]:\?]/g, '').substring(0, 31)
  const ws = wb.addWorksheet(sheetName)

  // Build column list: [M group, M group, ..., F group, ...]
  const cols = []
  for (const sex of ['M', 'F']) {
    if (!tableData[sex]) continue
    for (const ag of Object.keys(tableData[sex])) {
      cols.push({ sex, ag, label: `${sex}  ${ag}` })
    }
  }

  // All percentile keys sorted 0→100
  const allP = new Set()
  cols.forEach(c => Object.keys(tableData[c.sex][c.ag]).forEach(p => allP.add(parseFloat(p))))
  const sortedP = [...allP].sort((a, b) => a - b)

  ws.columns = [
    { width: 13 },
    ...cols.map(() => ({ width: 13 })),
  ]

  const totalCols = 1 + cols.length

  // Row 1: title
  ws.mergeCells(1, 1, 1, totalCols)
  const titleCell = ws.getCell(1, 1)
  titleCell.value = meta.test
  titleCell.font  = { bold: true, size: 13, color: { argb: C.textWh }, name: 'Calibri' }
  titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.accentDk } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 26

  // Row 2: meta info
  ws.mergeCells(2, 1, 2, totalCols)
  const metaCell = ws.getCell(2, 1)
  const dirLabel = meta.direction === 'direct'
    ? '↑ Valore più alto = percentile più alto'
    : '↓ Valore più basso = percentile più alto'
  metaCell.value = `Unità: ${meta.unit}   |   Direzione: ${meta.direction}   |   ${dirLabel}   |   Categorie: ${meta.categories.join(', ')}`
  metaCell.font  = { size: 10, color: { argb: meta.direction === 'direct' ? C.directFg : C.inverseFg }, name: 'Calibri' }
  metaCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.header } }
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(2).height = 17

  let dataStartRow = 4

  // Row 3 (optional): formula info
  if (meta.formula) {
    ws.mergeCells(3, 1, 3, totalCols)
    const fCell = ws.getCell(3, 1)
    fCell.value = `Formula: ${meta.formula}   |   Variabili: ${meta.variables.join(', ')}   →   Il valore nella tabella è il Composite Score % già calcolato dalla formula`
    fCell.font  = { size: 9, italic: true, color: { argb: 'FF93C5FD' }, name: 'Calibri' }
    fCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.subhead } }
    fCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(3).height = 15
    dataStartRow = 5
  }

  // Header row
  const hRow = ws.getRow(dataStartRow)
  hRow.height = 19

  const phCell = hRow.getCell(1)
  phCell.value = 'Percentile'
  phCell.font  = { bold: true, color: { argb: C.textWh }, size: 10, name: 'Calibri' }
  phCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.header } }
  phCell.alignment = { horizontal: 'center', vertical: 'middle' }
  phCell.border = { bottom: { style: 'medium', color: { argb: C.accent } } }

  cols.forEach((c, i) => {
    const cell = hRow.getCell(i + 2)
    cell.value = c.label
    cell.font  = { bold: true, color: { argb: c.sex === 'M' ? C.mHdr : C.fHdr }, size: 10, name: 'Calibri' }
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.sex === 'M' ? C.mColor : C.fColor } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = { bottom: { style: 'medium', color: { argb: C.accent } } }
  })

  // Data rows
  sortedP.forEach((p, idx) => {
    const rowIdx = dataStartRow + 1 + idx
    const row = ws.getRow(rowIdx)
    row.height = 15
    const is50 = p === 50
    const bg = is50 ? C.row50 : (idx % 2 === 0 ? C.rowBase : C.rowAlt)

    const pCell = row.getCell(1)
    pCell.value = p
    pCell.font  = { bold: is50, color: { argb: is50 ? C.accent : C.textGr }, size: 10, name: 'Calibri' }
    pCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    pCell.alignment = { horizontal: 'center', vertical: 'middle' }

    cols.forEach((c, ci) => {
      const cell = row.getCell(ci + 2)
      const val  = tableData[c.sex][c.ag][p]
      cell.value = val !== undefined ? val : ''
      cell.font  = { bold: is50, color: { argb: is50 ? C.accent : C.textGr }, size: 10, name: 'Calibri' }
      cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })
  })
}

// ─── SHEET: FORMULE ──────────────────────────────────────────────────────────
function buildFormuleSheet(wb) {
  const ws = wb.addWorksheet('Formule e Calcoli')
  ws.columns = [{ width: 30 }, { width: 72 }]

  const sections = [
    {
      title: '1. Y Balance Composite Score  (formulaType: y_balance_composite)',
      rows: [
        ['Variabili input DX', 'ANT_dx, PM_dx, PL_dx (cm) — allungamento arto destro nelle 3 direzioni'],
        ['Variabili input SX', 'ANT_sx, PM_sx, PL_sx (cm) — allungamento arto sinistro nelle 3 direzioni'],
        ['Misura condivisa',   'lunghezzaArto (cm) — da ASIS al malleolo mediale, arto dominante'],
        ['Calcolo arto DX',   'DX = (ANT_dx + PM_dx + PL_dx) / (3 × lunghezzaArto) × 100'],
        ['Calcolo arto SX',   'SX = (ANT_sx + PM_sx + PL_sx) / (3 × lunghezzaArto) × 100'],
        ['Risultato',         'Composite Score = (DX + SX) / 2   →   espresso in %'],
        ['Soglie injury risk', 'Maschi: Composite Score < 89%   |   Femmine: Composite Score < 94%'],
        ['Fonti',             'Plisky 2009 · Gribble 2013 · Alnahdi 2015'],
      ],
    },
    {
      title: '2. Interpolazione lineare percentile  (calcPercentileEx / calcPercentile in utils/percentile.js)',
      rows: [
        ['Logica generale',   'Il valore misurato viene cercato nei nodi della tabella per sesso e fascia età.'],
        ['Match esatto',      'Se il valore corrisponde a un nodo → restituisce direttamente quel percentile.'],
        ['Interpolazione',    'Se il valore cade tra due nodi adiacenti v1 e v2 (con percentili p1, p2):'],
        ['Formula',           'percentile = p1 + (valore − v1) / (v2 − v1) × (p2 − p1)'],
        ['Arrotondamento',    'Math.round() → intero più vicino'],
        ['Clamping basso',    'valore < minimo in tabella → restituisce percentile 0'],
        ['Clamping alto',     'valore > massimo in tabella → restituisce percentile 100'],
        ['calcPercentileEx',  'Funzione principale: restituisce { value: number|null, outOfRange: boolean }.'],
        ['',                  'outOfRange = true se l\'età era fuori range e si è usata la fascia più vicina.'],
        ['calcPercentile',    'Wrapper backward-compat: restituisce solo .value (number|null).'],
        ['',                  'null solo se test o tabella inesistente — mai per età fuori range (usa clamping).'],
        ['5° argomento',      'calcPercentileEx(stat, value, sex, age, testKey?) — testKey disambigua test'],
        ['',                  'con stesso campo "stat" (es. ymca_step_test e yo_yo_ir1 condividono stat:"resistenza")'],
      ],
    },
    {
      title: '3. Direzione del test  (direction: "direct" | "inverse")',
      rows: [
        ['direct',  'Valore maggiore = prestazione migliore = percentile più alto.'],
        ['',        'Esempi: cm (salto), kg (forza), metri (Yo-Yo), livello (Beep Test), RSI (Drop Jump).'],
        ['',        'Tabella ordinata crescente per il sort: v1 < v2, p1 < p2.'],
        ['inverse', 'Valore minore = prestazione migliore = percentile più alto.'],
        ['',        'Esempi: secondi (sprint), bpm (YMCA), n° cadute (Flamingo).'],
        ['',        'Tabella ordinata decrescente — le chiavi nel file sono già {100: val_migliore, ..., 0: val_peggiore}.'],
        ['',        'Il codice riordina correttamente i nodi prima dell\'interpolazione.'],
      ],
    },
    {
      title: '4. Selezione fascia età  (getAgeGroup / getAgeGroupClamped in utils/tables.js)',
      rows: [
        ['getAgeGroup',          'Restituisce la fascia esatta o null se l\'età è fuori da ogni range definito.'],
        ['getAgeGroupClamped',   'Restituisce { group, outOfRange }. Se età fuori range: clamp alla fascia più vicina + outOfRange: true.'],
        ['',                     'null solo se non esiste nessuna tabella per quel test/sesso.'],
        ['Clamping logica',      'parseFloat("10-11") = 10  →  lower bound di ogni fascia. Se age < minLo → prima fascia. Se age > maxLo → ultima fascia.'],
        ['Generale PT (default)', 'age ≤ 35 → 18-35   |   age ≤ 45 → 36-45   |   age ≤ 55 → 46-55   |   age ≤ 65 → 56-65   |   else → 66+'],
        ['Y Balance',            'age < 10 → clamp 10-11*   |   ≤11 → 10-11   |   ≤13 → 12-13   |   ≤15 → 14-15   |   ≤17 → 16-17   |   ≤40 → 18-40   |   else → 41-60'],
        ['',                     'Fasce giovani: Zwicker et al. 2020 (LQ Composite Score). F = M per <18.'],
        ['YMCA Step Test',        'age ≤ 35 → 18-35   |   age ≤ 45 → 36-45   |   else → 46+'],
        ['T-Test Agility',        'sempre → 18-40  (unica fascia disponibile)'],
        ['Standing Long Jump',   'age < 6 → clamp 6-7*   |   ≤7 → 6-7   |   ≤9 → 8-9   |   ≤11 → 10-11   |   ≤13 → 12-13   |   ≤15 → 14-15   |   ≤17 → 16-17   |   ≤35 → 18-35   |   else → 36-50'],
        ['',                     'Fasce giovani: Thomas et al. 2020 (dati reali M e F separati).'],
        ['Sprint 10m',           'age ≤ 35 → 18-35   |   else → 36-50'],
        ['Sprint 20m',           'age < 8 → clamp 8-9*   |   ≤9 → 8-9   |   ≤11 → 10-11   |   ≤13 → 12-13   |   ≤15 → 14-15   |   ≤17 → 16-17   |   ≤35 → 18-35   |   else → 36-50'],
        ['',                     'Fasce giovani: Nikolaidis et al. 2016 (soccer U10-U35). F = M per <18.'],
        ['Drop Jump / CMJ',       'age ≤ 35 → 18-35   |   else → 36-50'],
        ['Yo-Yo IR1',             'age ≤ 35 → 18-35   |   else → 36-50'],
        ['505 COD Agility',      'age < 10 → clamp 10-11*   |   ≤11 → 10-11   |   ≤13 → 12-13   |   ≤15 → 14-15   |   ≤17 → 16-17   |   ≤35 → 18-35   |   else → 36-50'],
        ['',                     'Fasce giovani: Haff & Triplett 2015 + soccer U11-U17. F = M per <18.'],
        ['Beep Test (MSFT)',     'age < 8 → clamp 8-9*   |   ≤9 → 8-9   |   ≤11 → 10-11   |   ≤13 → 12-13   |   ≤15 → 14-15   |   ≤17 → 16-17   |   ≤35 → 18-35   |   else → 36-50'],
        ['',                     'Fasce giovani: LeBlanc & Tomkinson 2016. Dati F reali per <18 (separati da M).'],
        ['* clamp = outOfRange', 'L\'operatore vede un banner ambra "Età fuori fascia normativa" nel campionamento.'],
        ['',                     'Il percentile viene comunque calcolato e salvato dalla fascia più vicina disponibile.'],
      ],
    },
    {
      title: '5. Media statistica e rank  (calcStatMedia + RANKS in constants/index.js)',
      rows: [
        ['Funzione',         'calcStatMedia(stats) — media aritmetica dei percentili completati'],
        ['Input',            'Oggetto { stat_key: numero_percentile } — solo valori numerici validi'],
        ['Formula',          'media = Σ(valori) / n    →   Math.round(result)'],
        ['Rank da media',    'E: 0–19   |   D: 20–39   |   C: 40–59   |   B: 60–79   |   A: 80–89   |   S: 90–100'],
        ['Nota',             'Il rank dipende SOLO dai test atletici. La BIA non contribuisce al rank.'],
        ['XP per sessione',  'calcSessionConfig(sessionsPerWeek) in utils/gamification.js'],
        ['Target mensile',   '500 XP/mese   |   Bonus mese completo: +200 XP   |   XP campionamento: 50'],
      ],
    },
  ]

  let rowIdx = 1
  for (const section of sections) {
    ws.mergeCells(rowIdx, 1, rowIdx, 2)
    const sCell = ws.getCell(rowIdx, 1)
    sCell.value = section.title
    sCell.font  = { bold: true, size: 11, color: { argb: C.textWh }, name: 'Calibri' }
    sCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.accentDk } }
    sCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    ws.getRow(rowIdx).height = 22
    rowIdx++

    section.rows.forEach(([label, value], i) => {
      const row = ws.getRow(rowIdx)
      row.height = 16
      const bg = i % 2 === 0 ? C.rowBase : C.rowAlt

      const lCell = row.getCell(1)
      lCell.value = label
      lCell.font  = { bold: !!label, size: 10, color: { argb: label ? C.accent : C.textGr }, name: 'Calibri' }
      lCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
      lCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }

      const vCell = row.getCell(2)
      vCell.value = value
      vCell.font  = { size: 10, color: { argb: C.textGr }, name: 'Calibri' }
      vCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
      vCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
      rowIdx++
    })

    // spacer
    ws.getRow(rowIdx).height = 8
    rowIdx++
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'RankEX'
  wb.created = new Date()
  wb.modified = new Date()

  console.log('Sheet: Panoramica...')
  buildPanoramica(wb)

  console.log('Sheets: tabelle percentili...')
  for (const meta of TESTS_META) {
    const td = TABLES[meta.key]
    if (!td) { console.warn(`  ⚠ tabella mancante: ${meta.key}`); continue }
    buildTestSheet(wb, meta, td)
    console.log(`  ✓ ${meta.test}`)
  }

  console.log('Sheet: Formule e Calcoli...')
  buildFormuleSheet(wb)

  const out = path.join(__dirname, 'rankex-tabelle-percentili.xlsx')
  await wb.xlsx.writeFile(out)
  console.log(`\n✅  File generato: ${out}`)
}

main().catch(err => { console.error('Errore:', err.message); process.exit(1) })
