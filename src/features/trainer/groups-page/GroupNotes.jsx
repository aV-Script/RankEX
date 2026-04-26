import { useState, useEffect, useCallback } from 'react'
import { getAuth }                           from 'firebase/auth'
import { getGroupNotes, addGroupNote, deleteGroupNote } from '../../../firebase/services/groupNotes'
import { useTrainerState }                   from '../../../context/TrainerContext'

const ROLE_LABELS = {
  trainer:   'Trainer',
  org_admin: 'Admin',
}

export function GroupNotes({ orgId, groupId }) {
  const { userRole } = useTrainerState()
  const [notes,       setNotes]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [text,        setText]        = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [deletingId,  setDeletingId]  = useState(null)

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    const data = await getGroupNotes(orgId, groupId)
    setNotes(data)
    setLoading(false)
  }, [orgId, groupId])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const handleSubmit = async () => {
    const trimmed = text.trim()
    if (!trimmed || submitting) return
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) return

    setSubmitting(true)
    try {
      const doc = await addGroupNote(orgId, groupId, {
        text:       trimmed,
        authorId:   user.uid,
        authorName: user.displayName ?? user.email ?? 'Trainer',
        authorRole: userRole ?? 'trainer',
      })
      setNotes(prev => [{
        id:         doc.id,
        text:       trimmed,
        authorId:   user.uid,
        authorName: user.displayName ?? user.email ?? 'Trainer',
        authorRole: userRole ?? 'trainer',
        createdAt:  new Date().toISOString(),
      }, ...prev])
      setText('')
    } catch (err) {
      console.error('[GroupNotes] addGroupNote failed', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (noteId, authorId) => {
    const auth = getAuth()
    if (auth.currentUser?.uid !== authorId && userRole !== 'org_admin') return
    setDeletingId(noteId)
    try {
      await deleteGroupNote(orgId, groupId, noteId)
      setNotes(prev => prev.filter(n => n.id !== noteId))
    } catch (err) {
      console.error('[GroupNotes] deleteGroupNote failed', err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-[4px] p-5 rx-card">
      <div className="font-display text-[11px] font-semibold tracking-[2px] uppercase mb-5" style={{ color: '#0fd65a' }}>◈ Note di gruppo</div>

      {/* Composer */}
      <div className="mb-5">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit() }}
          placeholder="Scrivi un annuncio o una nota per il gruppo… (Ctrl+↵ per inviare)"
          rows={3}
          className="input-base w-full resize-none font-body text-[13px]"
          style={{ lineHeight: 1.6 }}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="font-display text-[11px] px-4 py-2 rounded-[3px] cursor-pointer border-0 transition-opacity hover:opacity-85 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #1aff6e, #0fd65a, #00c8ff)', color: '#080c12' }}
          >
            {submitting ? '…' : 'PUBBLICA'}
          </button>
        </div>
      </div>

      {/* Lista note */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-[3px]" />)}
        </div>
      ) : notes.length === 0 ? (
        <p className="font-body text-[13px] text-white/20">
          Nessuna nota pubblicata per questo gruppo.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              currentUserId={getAuth().currentUser?.uid}
              userRole={userRole}
              deleting={deletingId === note.id}
              onDelete={() => handleDelete(note.id, note.authorId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NoteCard({ note, currentUserId, userRole, deleting, onDelete }) {
  const canDelete = currentUserId === note.authorId || userRole === 'org_admin'
  const dateLabel = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div
      className="rounded-[3px] px-4 py-3"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-[3px] flex items-center justify-center shrink-0"
            style={{ background: 'rgba(15,214,90,0.10)' }}
          >
            <span className="font-display text-[11px]" style={{ color: '#0fd65a' }}>
              {note.authorName?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="font-display font-bold text-[13px] text-white/80">{note.authorName}</span>
            <span
              className="ml-2 font-display text-[10px] font-semibold tracking-[1px] px-1.5 py-0.5 rounded-[2px]"
              style={{ background: 'rgba(15,214,90,0.08)', color: '#0fd65a66' }}
            >
              {ROLE_LABELS[note.authorRole] ?? note.authorRole}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-body text-[11px] text-white/20">{dateLabel}</span>
          {canDelete && (
            <button
              onClick={onDelete}
              disabled={deleting}
              className="font-display text-[10px] px-2 py-1 rounded-[2px] cursor-pointer border transition-all disabled:opacity-40"
              style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.15)', background: 'transparent' }}
            >
              {deleting ? '…' : 'ELIMINA'}
            </button>
          )}
        </div>
      </div>
      <p className="font-body text-[13px] text-white/65 leading-relaxed whitespace-pre-wrap m-0">
        {note.text}
      </p>
    </div>
  )
}
