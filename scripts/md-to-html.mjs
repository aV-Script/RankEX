import { readFileSync, writeFileSync } from 'fs'
import { join, dirname }              from 'path'
import { fileURLToPath }              from 'url'
import { marked }                     from 'marked'

const __dir = dirname(fileURLToPath(import.meta.url))
const src   = join(__dir, '..', 'docs', 'user-stories.md')
const dst   = join(__dir, '..', 'docs', 'user-stories.html')

const md   = readFileSync(src, 'utf8')
const body = marked.parse(md)

const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>RankEX — User Stories</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    color: #1a1a2e;
    background: #fff;
    padding: 40px 52px;
    max-width: 920px;
    margin: 0 auto;
    line-height: 1.6;
  }

  h1 {
    font-size: 22pt;
    font-weight: 800;
    color: #0d1117;
    border-bottom: 3px solid #0ec452;
    padding-bottom: 8px;
    margin: 32px 0 14px;
  }

  h2 {
    font-size: 13pt;
    font-weight: 700;
    color: #fff;
    background: #0d1520;
    padding: 7px 14px;
    margin: 36px 0 12px;
    border-left: 4px solid #0ec452;
    border-radius: 3px;
    page-break-before: always;
  }
  h2:first-of-type { page-break-before: avoid; }

  h3 { font-size: 12pt; color: #0d1520; margin: 20px 0 6px; }

  h4 {
    font-size: 11pt;
    font-weight: 700;
    color: #0d1520;
    background: #f0fdf4;
    border-left: 3px solid #0ec452;
    padding: 5px 10px;
    margin: 22px 0 6px;
    border-radius: 2px;
    page-break-after: avoid;
  }

  p {
    margin: 5px 0 10px;
    color: #2d3748;
  }

  blockquote {
    border-left: 3px solid #cbd5e0;
    padding: 4px 14px;
    color: #718096;
    font-style: italic;
    margin: 6px 0 12px;
    font-size: 10pt;
  }

  em { font-style: italic; }
  strong { font-weight: 700; color: #1a202c; }

  code {
    font-family: 'Cascadia Code', 'Consolas', monospace;
    font-size: 9.5pt;
    background: #f1f5f9;
    color: #1e4d2b;
    padding: 1px 5px;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
  }

  pre {
    background: #0d1520;
    color: #e2e8f0;
    padding: 12px 16px;
    border-radius: 4px;
    margin: 8px 0 12px;
    font-size: 9pt;
    overflow-x: auto;
  }
  pre code {
    background: none;
    border: none;
    color: inherit;
    padding: 0;
    font-size: inherit;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 16px;
    font-size: 10pt;
    page-break-inside: avoid;
  }
  th {
    background: #0d1520;
    color: #fff;
    text-align: left;
    padding: 6px 10px;
    font-weight: 600;
    font-size: 9.5pt;
  }
  td {
    padding: 5px 10px;
    border-bottom: 1px solid #e2e8f0;
    color: #2d3748;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #f8fafc; }

  hr {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 18px 0;
  }

  ul, ol {
    margin: 6px 0 10px 20px;
    color: #2d3748;
  }
  li { margin: 3px 0; }

  /* US card: h4 + next p treated as a block */
  h4 + p {
    margin-top: 2px;
    color: #374151;
  }

  /* italic file reference at end of each US */
  h4 ~ p > em:only-child {
    display: block;
    font-size: 9.5pt;
    color: #6b7280;
    margin-top: 4px;
    font-style: normal;
  }
  h4 ~ p > em:only-child code {
    background: #f0fdf4;
    color: #065f46;
    border-color: #a7f3d0;
    font-size: 9pt;
  }

  @media print {
    body { padding: 16px 24px; font-size: 10pt; }
    h2 { page-break-before: always; font-size: 12pt; }
    h2:first-of-type { page-break-before: avoid; }
    h4 { page-break-after: avoid; }
    table, pre { page-break-inside: avoid; }
  }
</style>
</head>
<body>
${body}
</body>
</html>`

writeFileSync(dst, html, 'utf8')
console.log('✓ Generato:', dst)
