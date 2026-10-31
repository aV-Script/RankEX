import { readFileSync } from 'fs'
import { describe, it, expect } from 'vitest'

// BUG-012: con fill-mode `forwards` l'animazione d'ingresso lasciava un
// transform sull'elemento, che diventava il containing block dei figli
// position:fixed (barre azioni di BiaView e del form valutazione): la barra
// finiva in fondo alla pagina invece di restare fissa sul viewport.
describe('.rx-animate-in', () => {
  const css = readFileSync(new URL('../../index.css', import.meta.url), 'utf8')
  const rule = css.match(/\.rx-animate-in\s*\{([^}]*)\}/)?.[1] ?? ''

  it('non mantiene lo stato finale dell\'animazione (niente transform residuo)', () => {
    expect(rule).toMatch(/animation:\s*rx-fadeIn/)
    expect(rule).not.toMatch(/\b(forwards|both)\b/)
  })
})
