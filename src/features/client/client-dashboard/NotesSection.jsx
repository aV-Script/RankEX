import { useState }                   from 'react'
import { SectionLabel, EmptyState }  from '../../../components/ui'
import { Skeleton }                  from '../../../components/common/Skeleton'
import { ConfirmDialog }             from '../../../components/common/ConfirmDialog'
import { IconDocument }              from '../../../components/ui/icons'
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
  const [deletingIds,  setDeletingIds]  = useState(new Set())
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const handleDeleteThread = async (threadId) => {
    if (deletingIds.has(threadId)) return
    setDeletingIds(prev => new Set([...prev, threadId]))
    await handleDelete(threadId)
    setDeletingIds(prev => {
      const next = new Set(prev)
      next.delete(threadId)
      return next
    })
  }

  const handleConfirmDeleteThread = async () => {
    if (!confirmDeleteId) return
    await handleDeleteThread(confirmDeleteId)
    setConfirmDeleteId(null)
  }

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
          <div className="flex flex-col gap-1">
            <Skeleton variant="list" count={3} />
          </div>
        ) : threads.length === 0 ? (
          <EmptyState
            color={color}
            icon={<IconDocument size={20} />}
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
                deleting={deletingIds.has(thread.id)}
                onToggle={() => toggleExpand(thread.id)}
                onReplyChange={(text) => setReplyTexts(prev => ({ ...prev, [thread.id]: text }))}
                onReplySubmit={() => handleSubmitComment(thread.id)}
                onDelete={() => setConfirmDeleteId(thread.id)}
              />
            ))}
          </div>
        )}

        {confirmDeleteId && (
          <ConfirmDialog
            title="Eliminare la nota?"
            description="La nota e i suoi eventuali commenti verranno eliminati definitivamente."
            confirmLabel="ELIMINA"
            variant="danger"
            loading={deletingIds.has(confirmDeleteId)}
            onConfirm={handleConfirmDeleteThread}
            onCancel={() => setConfirmDeleteId(null)}
          />
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
  thread, color, expanded, replyText, replyLoading, readonly, deleting,
  onToggle, onReplyChange, onReplySubmit, onDelete,
}) {
  const commentCount = thread.comments.length

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
          <span className="font-body text-[10px] text-white/60">
            {formatDate(thread.createdAt)}
          </span>
        </div>
        {!readonly && (
          <button
            onClick={() => onDelete(thread.id)}
            disabled={deleting}
            aria-label="Elimina nota"
            className="text-white/20 hover:text-red-400 transition-colors text-[11px] font-body shrink-0 disabled:opacity-40 disabled:pointer-events-none"
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
                <span className="font-body text-[10px] text-white/60">
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
