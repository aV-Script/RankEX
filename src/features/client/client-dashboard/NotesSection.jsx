import { useState }                   from 'react'
import { SectionLabel, EmptyState }  from '../../../components/ui'
import { useNotes }                  from '../../../hooks/useNotes'

const ROLE_LABELS = {
  trainer:      'Trainer',
  org_admin:    'Admin',
  staff_readonly: 'Staff',
  client:       'Atleta',
}

/**
 * Sezione Note e Commenti nel profilo cliente.
 *
 * @param {string}  orgId
 * @param {string}  clientId
 * @param {string}  color         — colore accent del profilo
 * @param {{ role, name }} author — utente corrente (trainer o client)
 * @param {boolean} readonly      — true per staff_readonly
 */
export function NotesSection({ orgId, clientId, color, author, readonly = false }) {
  const { threads, loading, handleAddThread, handleAddComment, handleDelete } =
    useNotes(orgId, clientId, author)

  const [newText,      setNewText]      = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [expandedIds,  setExpandedIds]  = useState(new Set())
  const [replyTexts,   setReplyTexts]   = useState({})
  const [replyLoading, setReplyLoading] = useState({})

  const toggleExpand = (id) =>
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleSubmitThread = async () => {
    if (!newText.trim() || submitting) return
    setSubmitting(true)
    await handleAddThread(newText)
    setNewText('')
    setSubmitting(false)
  }

  const handleSubmitComment = async (parentId) => {
    const text = replyTexts[parentId] ?? ''
    if (!text.trim() || replyLoading[parentId]) return
    setReplyLoading(prev => ({ ...prev, [parentId]: true }))
    await handleAddComment(parentId, text)
    setReplyTexts(prev => ({ ...prev, [parentId]: '' }))
    setReplyLoading(prev => ({ ...prev, [parentId]: false }))
    // mantieni thread espanso dopo risposta
    setExpandedIds(prev => new Set([...prev, parentId]))
  }

  return (
    <section className="px-4 py-6">
      <div className="rounded-[4px] p-5 rx-card">
        <SectionLabel className="mb-4">◈ Note</SectionLabel>

        {loading ? (
          <p className="font-body text-[13px] text-white/25">Caricamento…</p>
        ) : threads.length === 0 ? (
          <EmptyState
            color={color}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
            title="Nessuna nota"
            description="Aggiungi la prima nota per tenere traccia dei progressi o delle osservazioni."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {threads.map(thread => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                color={color}
                expanded={expandedIds.has(thread.id)}
                replyText={replyTexts[thread.id] ?? ''}
                replyLoading={!!replyLoading[thread.id]}
                readonly={readonly}
                currentAuthorId={author?.id}
                onToggle={() => toggleExpand(thread.id)}
                onReplyChange={(text) => setReplyTexts(prev => ({ ...prev, [thread.id]: text }))}
                onReplySubmit={() => handleSubmitComment(thread.id)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Input nuova nota — nascosto in readonly */}
        {!readonly && (
          <div className="mt-4 flex flex-col gap-2">
            <textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Scrivi una nuova nota…"
              rows={2}
              className="w-full input-base resize-none rounded-[4px] text-[13px] font-body"
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmitThread() }}
            />
            <div className="flex justify-end">
              <button
                onClick={handleSubmitThread}
                disabled={!newText.trim() || submitting}
                className="font-display text-[11px] px-4 py-1.5 rounded-[3px] cursor-pointer border transition-all disabled:opacity-30"
                style={{ color, borderColor: color + '55', background: color + '11' }}
              >
                {submitting ? '…' : 'AGGIUNGI NOTA'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function ThreadCard({
  thread, color, expanded, replyText, replyLoading, readonly,
  currentAuthorId, onToggle, onReplyChange, onReplySubmit, onDelete,
}) {
  const commentCount = thread.comments.length
  const canDelete    = thread.authorId === currentAuthorId

  return (
    <div
      className="rounded-[4px] p-4"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Header nota root */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display font-bold text-[12px] text-white/80">
            {thread.authorName}
          </span>
          <RoleBadge role={thread.authorRole} color={color} />
          <span className="font-body text-[10px] text-white/25">
            {formatDate(thread.createdAt)}
          </span>
        </div>
        {canDelete && !readonly && (
          <button
            onClick={() => onDelete(thread.id)}
            className="text-white/20 hover:text-red-400 transition-colors text-[11px] font-body shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      {/* Testo nota */}
      <p className="font-body text-[13px] text-white/70 leading-relaxed m-0 whitespace-pre-wrap">
        {thread.text}
      </p>

      {/* Toggle commenti */}
      <button
        onClick={onToggle}
        className="mt-3 flex items-center gap-1.5 text-[11px] font-body cursor-pointer transition-colors"
        style={{ color: expanded ? color : 'rgba(255,255,255,0.3)', background: 'transparent', border: 'none', padding: 0 }}
      >
        <span>{expanded ? '▾' : '▸'}</span>
        <span>{commentCount > 0 ? `${commentCount} ${commentCount === 1 ? 'commento' : 'commenti'}` : 'Rispondi'}</span>
      </button>

      {/* Commenti inline */}
      {expanded && (
        <div className="mt-3 pl-4 border-l flex flex-col gap-2" style={{ borderColor: color + '30' }}>
          {thread.comments.map(comment => (
            <div key={comment.id} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-bold text-[11px] text-white/70">
                  {comment.authorName}
                </span>
                <RoleBadge role={comment.authorRole} color={color} small />
                <span className="font-body text-[10px] text-white/20">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="font-body text-[12px] text-white/55 m-0 whitespace-pre-wrap leading-relaxed">
                {comment.text}
              </p>
            </div>
          ))}

          {/* Input risposta — nascosto in readonly */}
          {!readonly && (
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={replyText}
                onChange={e => onReplyChange(e.target.value)}
                placeholder="Scrivi un commento…"
                className="flex-1 input-base text-[12px] font-body rounded-[3px] py-1.5 px-2"
                onKeyDown={e => { if (e.key === 'Enter') onReplySubmit() }}
              />
              <button
                onClick={onReplySubmit}
                disabled={!replyText.trim() || replyLoading}
                className="font-display text-[10px] px-3 py-1.5 rounded-[3px] cursor-pointer border transition-all disabled:opacity-30 shrink-0"
                style={{ color, borderColor: color + '55', background: color + '11' }}
              >
                {replyLoading ? '…' : 'INVIA'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RoleBadge({ role, color, small = false }) {
  const label = ROLE_LABELS[role] ?? role
  const size  = small ? 'text-[9px] px-1.5 py-0' : 'text-[10px] px-2 py-0.5'
  return (
    <span
      className={`rounded-full font-display font-bold ${size}`}
      style={{ background: color + '18', color: color + 'cc', border: `1px solid ${color}33` }}
    >
      {label}
    </span>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}
