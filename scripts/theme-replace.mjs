// Bulk replace hardcoded green colors with CSS theme variables
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

function globSync(pattern) {
  const results = []
  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        walk(full)
      } else if (/\.(jsx|js)$/.test(entry)) {
        results.push(full.replace(/\\/g, '/'))
      }
    }
  }
  walk('src')
  return results
}

const replacements = [
  ['rgba(15,214,90,0.45)', 'color-mix(in srgb, var(--rx-green) 45%, transparent)'],
  ['rgba(15,214,90,0.28)', 'color-mix(in srgb, var(--rx-green) 28%, transparent)'],
  ['rgba(15,214,90,0.35)', 'color-mix(in srgb, var(--rx-green) 35%, transparent)'],
  ['rgba(15,214,90,0.25)', 'color-mix(in srgb, var(--rx-green) 25%, transparent)'],
  ['rgba(15,214,90,0.20)', 'color-mix(in srgb, var(--rx-green) 20%, transparent)'],
  ['rgba(15,214,90,0.15)', 'color-mix(in srgb, var(--rx-green) 15%, transparent)'],
  ['rgba(15,214,90,0.12)', 'color-mix(in srgb, var(--rx-green) 12%, transparent)'],
  ['rgba(15,214,90,0.10)', 'color-mix(in srgb, var(--rx-green) 10%, transparent)'],
  ['rgba(15,214,90,0.08)', 'color-mix(in srgb, var(--rx-green) 8%, transparent)'],
  ['rgba(15,214,90,0.07)', 'color-mix(in srgb, var(--rx-green) 7%, transparent)'],
  ['rgba(15,214,90,0.06)', 'color-mix(in srgb, var(--rx-green) 6%, transparent)'],
  ['rgba(15,214,90,0.05)', 'color-mix(in srgb, var(--rx-green) 5%, transparent)'],
  ['rgba(15,214,90,0.04)', 'color-mix(in srgb, var(--rx-green) 4%, transparent)'],
  ['rgba(15,214,90,0.03)', 'color-mix(in srgb, var(--rx-green) 3%, transparent)'],
  ['rgba(15,214,90,0.3)',  'color-mix(in srgb, var(--rx-green) 30%, transparent)'],
  ['rgba(15,214,90,0.2)',  'color-mix(in srgb, var(--rx-green) 20%, transparent)'],
  ['rgba(15,214,90,0.1)',  'color-mix(in srgb, var(--rx-green) 10%, transparent)'],
  ['rgba(15,214,90,0.5)',  'color-mix(in srgb, var(--rx-green) 50%, transparent)'],
  ['rgba(15,214,90,0.8)',  'color-mix(in srgb, var(--rx-green) 80%, transparent)'],
  // rgba(13,21,32,0.9) — bg-raised tinted
  ["rgba(13,21,32,0.9)",  "var(--rx-card-bg)"],
  ["rgba(13,21,32,0.8)",  "var(--rx-card-bg)"],
  // hex in JS string
  ["'#0fd65a'", "'var(--rx-green)'"],
  ['"#0fd65a"', '"var(--rx-green)"'],
  ["'#1aff6e'", "'var(--rx-green-bright)'"],
  ['"#1aff6e"', '"var(--rx-green-bright)"'],
]

// Skip files where hardcoded colors are intentional
const SKIP_PATTERNS = [
  'src/firebase/config.js',
  'src/utils/tables.js',
  'src/config/themes.config.js',
  'src/index.css',
  'src/config/theme.js',
  'src/features/auth/',
  'src/features/admin/admin-pages/AdminDashboard.jsx',
  'src/features/admin/admin-pages/OrgDetailView.jsx',
  'src/features/client/client-view/avatar/',
  'src/features/trainer/groups-page/GroupComparison.jsx',
  'scripts/',
]

function shouldSkip(filePath) {
  const fp = filePath.replace(/\\/g, '/')
  return SKIP_PATTERNS.some(p => fp.includes(p.replace(/\\/g, '/')))
}

const files = globSync()
const changedFiles = []

for (const file of files) {
  if (shouldSkip(file)) continue

  let content = readFileSync(file, 'utf8')
  const original = content

  for (const [from, to] of replacements) {
    content = content.split(from).join(to)
  }

  if (content !== original) {
    writeFileSync(file, content, 'utf8')
    changedFiles.push(file)
  }
}

console.log(`Changed ${changedFiles.length} files:`)
changedFiles.forEach(f => console.log(' -', f))
