import { useState } from 'react'

const KEY = 'rankex_color_source'

export function useColorSource() {
  const [source, setSourceState] = useState(() => {
    return localStorage.getItem(KEY) ?? 'rank'
  })

  function setSource(val) {
    setSourceState(val)
    localStorage.setItem(KEY, val)
  }

  return [source, setSource]
}
