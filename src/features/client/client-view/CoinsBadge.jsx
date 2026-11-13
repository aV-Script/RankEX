// Badge "N MONETE": saldo del cliente (client.coins, aggiornato dall'onSnapshot di useClient).
// Usato dalla top nav desktop e dalla Home.

// Giallo brand dei badge (Pulcini): stesso valore di ClientCard
const COINS_BADGE_COLOR  = '#facc15'
const COINS_BADGE_BORDER = 'rgba(250,204,21,0.35)'

export function CoinsBadge({ coins = 0, style }) {
  return (
    <span
      className="font-display"
      style={{
        fontWeight: 800, fontSize: 12, color: COINS_BADGE_COLOR,
        border: `1px solid ${COINS_BADGE_BORDER}`, borderRadius: 3,
        padding: '4px 8px', whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {coins} MONETE
    </span>
  )
}
