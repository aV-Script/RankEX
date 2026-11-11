/**
 * Lettura minimale di un PDF generato da Chromium (page.pdf, Skia/PDF) per i test di stampa,
 * senza dipendenze: conta le pagine e legge l'area di stampa di ognuna.
 *
 * Skia apre il contenuto di ogni pagina con la matrice di scala/ribaltamento
 * ("a 0 0 -a 0 H cm") e poi imposta un clip sull'area stampabile ("x y w h re W* n"): il
 * clip è il foglio meno i margini di @page, quindi il margine effettivamente applicato
 * dal motore.
 */
import { createHash } from 'crypto'
import { inflateSync } from 'zlib'

const PAGE_TYPE_RE    = /\/Type\s*\/Page(?![s\w])/g
const STREAM_START_RE = /stream\r?\n/g
const PAGE_CTM_RE     = /^\s*([\d.]+) 0 0 -([\d.]+) 0 ([\d.]+) cm/
const CLIP_RE         = /([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) re\s+W\* n/

/**
 * @param {Buffer} buffer
 * @returns {{ pages: Array<{ height: number, contentTop: number, contentBottom: number, contentHash: string }> }}
 *   misure in punti PDF (72 dpi), contentTop dal bordo alto del foglio; contentHash = sha1 del
 *   content stream decompresso (due PDF con lo stesso layout differiscono solo dove cambia il disegno)
 */
export function inspectPdf(buffer) {
  const text = buffer.toString('latin1')
  const declaredPages = (text.match(PAGE_TYPE_RE) ?? []).length

  const pages = []
  for (const match of text.matchAll(STREAM_START_RE)) {
    const start   = match.index + match[0].length
    const end     = text.indexOf('endstream', start)
    const content = tryInflate(Buffer.from(text.slice(start, end), 'latin1'))
    const ctm     = content && PAGE_CTM_RE.exec(content)
    if (!ctm) continue
    const [scale, , height] = ctm.slice(1).map(Number)
    // Il primo clip del flusso è il clip di pagina. Senza clip (margine 0, nessuna area ridotta)
    // la pagina è trattata come margine 0: l'asserzione sul margine fallisce, non il parsing
    const clip = CLIP_RE.exec(content)
    const [, clipY, , clipHeight] = clip ? clip.slice(1).map(Number) : [0, 0, 0, height / scale]
    pages.push({
      height,
      contentTop:    clipY * scale,
      contentBottom: (clipY + clipHeight) * scale,
      contentHash:   createHash('sha1').update(content, 'latin1').digest('hex'),
    })
  }

  if (pages.length !== declaredPages) {
    throw new Error(`PDF non interpretabile: ${declaredPages} pagine dichiarate, ${pages.length} con area di stampa`)
  }
  return { pages }
}

function tryInflate(data) {
  try {
    return inflateSync(data).toString('latin1')
  } catch {
    return null
  }
}
