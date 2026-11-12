import { describe, it, expect } from 'vitest'
import React from 'react'
import { Button } from '../../components/ui/index.jsx'

// Il progetto compila il JSX con il runtime classico (React.createElement): serve React globale.
globalThis.React = React

// Button è una funzione pura: la chiamo e leggo le props del <button> restituito
// (nessun testing-library nel progetto). Regressione BUG-025.
const classesOf = props => Button({ children: 'X', ...props }).props.className

describe('Button — cursore', () => {
  it('abilitato: cursor-pointer, mai not-allowed', () => {
    const cls = classesOf({})
    expect(cls).toContain('cursor-pointer')
    expect(cls).not.toContain('cursor-not-allowed')
  })

  it('disabled: cursor-not-allowed, mai cursor-pointer', () => {
    const cls = classesOf({ disabled: true })
    expect(cls).toContain('cursor-not-allowed')
    expect(cls).not.toContain('cursor-pointer')
  })

  it('loading: cursor-not-allowed, mai cursor-pointer', () => {
    const cls = classesOf({ loading: true })
    expect(cls).toContain('cursor-not-allowed')
    expect(cls).not.toContain('cursor-pointer')
  })
})
