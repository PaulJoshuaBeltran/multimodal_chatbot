// src/components/MessageBubble.tsx
'use client'

import React, { useState } from 'react'

export default function MessageBubble({ role, id, content, streaming, onEdit, onDelete, highlightQuery }:
  { role: 'user' | 'assistant';
    id?: string;
    content: string;
    streaming?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    highlightQuery?: string }) {
  
  const [menuOpen, setMenuOpen] = useState(false)
  const isUser = role === 'user'

  // Helper utility to safely inject highlight markings on matched live search text
  function highlightLiveText(text: string, keyword?: string) {
    if (!keyword || !keyword.trim()) return text
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts = text.split(new RegExp(`(${escapedKeyword})`, 'gi'))
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === keyword.toLowerCase() ? (
            <mark
              key={i}
              style={{
                backgroundColor: '#ffeb3b',
                padding: '0 2px',
                borderRadius: 2,
                color: '#000',
              }}>
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    )
  }

  return (
    <div 
      id={id ? `msg-${id}` : undefined}
      className="message-bubble-row"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
        position: 'relative',
        marginBottom: 8,
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .message-bubble-row .settings-menu-trigger { opacity: 0; transition: opacity 0.15s ease-in-out; }
        .message-bubble-row:hover .settings-menu-trigger { opacity: 1; }
      `}} />

      <div style={{
        background: isUser ? '#1a1a1a' : '#f1f1f1',
        color: isUser ? '#fff' : '#111',
        padding: '10px 16px',
        borderRadius: 16,
        borderBottomRightRadius: isUser ? 4 : 16,
        borderBottomLeftRadius: !isUser ? 4 : 16,
        whiteSpace: 'pre-wrap',
        lineHeight: 1.6,
        fontSize: 15,
        position: 'relative',
      }}>
        {/* FIXED: Highlights matching search text inline within the chat stream bubble */}
        <div>{highlightLiveText(content, highlightQuery)}</div>

        {isUser && (onEdit || onDelete) && (
          <div className="settings-menu-trigger" style={{
            position: 'absolute', top: '50%', left: '-34px', transform: 'translateY(-50%)', zIndex: 5
          }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              style={{
                background: '#fff', border: '1px solid #ddd', borderRadius: '50%',
                width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 'bold', color: '#333', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              ⋮
            </button>

            {menuOpen && (
              <div 
                onMouseLeave={() => setMenuOpen(false)}
                style={{
                  position: 'absolute', top: '100%', left: 0, backgroundColor: '#fff',
                  border: '1px solid #ddd', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  display: 'flex', flexDirection: 'column', minWidth: 80, overflow: 'hidden'
                }}
              >
                {onEdit && (
                  <button onClick={() => { setMenuOpen(false); onEdit(); }} style={{ padding: '6px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, cursor: 'pointer', color: '#333' }}>
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => { setMenuOpen(false); onDelete(); }} style={{ padding: '6px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, cursor: 'pointer', color: '#dc3545' }}>
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {streaming && !isUser && (
        <span style={{ marginTop: 4, marginLeft: 4, fontSize: 12, color: '#888' }}>• thinking…</span>
      )}
    </div>
  )
}