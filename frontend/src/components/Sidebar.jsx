import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, MessageSquare, Trash2, Edit2, GraduationCap, Settings, FolderClosed } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function Sidebar({ 
  currentSessionId, 
  onSelectSession, 
  onNewChat,
  projects = [],
  currentProjectId = 'default',
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject
}) {
  const [sessions, setSessions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editProjectName, setEditProjectName] = useState('');

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/api/sessions');
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [currentSessionId]); 

  const handleNewChat = async () => {
    if (onNewChat) {
      await onNewChat(currentProjectId);
    } else {
      const newId = uuidv4();
      try {
        await axios.post('/api/sessions', { 
          sessionId: newId, 
          title: 'New Chat',
          projectId: currentProjectId 
        });
        onSelectSession(newId);
        fetchSessions();
      } catch (err) {
        console.error('Failed to create session', err);
      }
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat?")) return;
    try {
      await axios.delete(`/api/sessions/${id}`);
      if (currentSessionId === id) {
        const remaining = sessions.filter(s => s.id !== id && (currentProjectId === 'default' ? (!s.project_id || s.project_id === 'default') : s.project_id === currentProjectId));
        if (remaining.length > 0) {
          onSelectSession(remaining[0].id);
        } else {
          handleNewChat();
        }
      } else {
        fetchSessions();
      }
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  const handleRenameSave = async (e, id) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      try {
        await axios.put(`/api/sessions/${id}`, { title: editTitle });
        setEditingId(null);
        fetchSessions();
      } catch (err) {
        console.error('Failed to rename session', err);
      }
    } else {
      setEditingId(null);
    }
  };

  const handleProjectRenameSave = async (e, id) => {
    e.stopPropagation();
    if (editProjectName.trim()) {
      if (onRenameProject) {
        await onRenameProject(id, editProjectName.trim());
      }
      setEditingProjectId(null);
    } else {
      setEditingProjectId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all conversations? Existing projects will be preserved, but all their chats will be cleared.")) return;
    try {
      await axios.delete('/api/sessions');
      handleNewChat();
    } catch (err) {
      console.error('Failed to clear all sessions', err);
    }
  };

  // Filter sessions belonging to the currently active project space
  const filteredSessions = sessions.filter(s => {
    if (currentProjectId === 'default') {
      return !s.project_id || s.project_id === 'default';
    }
    return s.project_id === currentProjectId;
  });

  const activeProjectObj = projects.find(p => p.id === currentProjectId);
  const activeWorkspaceName = currentProjectId === 'default' ? 'General Chats' : (activeProjectObj?.name || 'Project Chat');

  return (
    <div 
      className="w-full h-screen flex flex-col shrink-0 z-20 transition-all duration-300 border-r-4 border-double"
      style={{ 
        backgroundColor: '#e0f2fe',
        borderColor: '#7dd3fc',
        color: '#0f172a'
      }}
    >
      {/* Sidebar Top: Space / Project Selector */}
      <div className="px-4 pt-4 flex flex-col gap-1">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-800">Workspace</span>
          <button 
            onClick={onCreateProject} 
            className="p-1 rounded hover:bg-sky-200/50 transition text-sky-700 hover:text-sky-950 cursor-pointer"
            title="Create Custom Project Space"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="flex flex-col gap-0.5 max-h-[160px] overflow-y-auto pr-1">
          {/* General Space Option */}
          <div 
            onClick={() => onSelectProject('default')}
            className="group w-full flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer text-xs transition-all"
            style={{
              backgroundColor: currentProjectId === 'default' ? 'var(--bg-user-bubble)' : 'transparent',
              color: currentProjectId === 'default' ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              <span className="font-semibold truncate">General Chat</span>
            </div>
          </div>

          {/* Custom Projects */}
          {projects.filter(proj => proj.id !== 'default').map(proj => (
            <div 
              key={proj.id}
              onClick={() => onSelectProject(proj.id)}
              className="group w-full flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer text-xs transition-all"
              style={{
                backgroundColor: currentProjectId === proj.id ? 'var(--bg-user-bubble)' : 'transparent',
                color: currentProjectId === proj.id ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <FolderClosed className="w-3.5 h-3.5 shrink-0" />
                {editingProjectId === proj.id ? (
                  <input 
                    autoFocus
                    type="text"
                    value={editProjectName}
                    onChange={e => setEditProjectName(e.target.value)}
                    onBlur={(e) => handleProjectRenameSave(e, proj.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleProjectRenameSave(e, proj.id);
                      if (e.key === 'Escape') setEditingProjectId(null);
                    }}
                    className="bg-transparent border-none outline-none w-full font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  />
                ) : (
                  <span className="font-semibold truncate">{proj.name}</span>
                )}
              </div>

              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingProjectId(proj.id);
                    setEditProjectName(proj.name);
                  }}
                  className="p-0.5 rounded hover:bg-sky-200/50 transition text-sky-700 hover:text-sky-950"
                  title="Rename Project"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDeleteProject) onDeleteProject(proj.id);
                  }}
                  className="p-0.5 rounded hover:bg-sky-200/50 transition text-sky-700 hover:text-red-500"
                  title="Delete Project"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="my-2" style={{ borderColor: '#7dd3fc' }} />

      {/* Sidebar Middle: "+ New Chat" in active Workspace */}
      <div className="px-4 py-1">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all duration-200 border cursor-pointer hover:scale-[1.01]"
          style={{
            backgroundColor: 'var(--color-accent)',
            borderColor: 'var(--border-color)',
            color: 'var(--bg-app)'
          }}
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Sidebar Chats: List chats of the active Workspace */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1">
        <div className="text-[10px] font-bold mb-1 px-2 uppercase tracking-wider text-sky-800">
          Chats in {activeWorkspaceName}
        </div>
        
        {filteredSessions.length === 0 ? (
          <div className="text-xs text-zinc-500 px-3 py-4 italic text-center">
            No chats here. Click "New Chat" to begin!
          </div>
        ) : (
          filteredSessions.map(session => (
            <div
              key={session.id}
              onClick={() => {
                if (editingId !== session.id) onSelectSession(session.id);
              }}
              className="group w-full flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-all duration-200 hover:bg-sky-200/50"
              style={{
                backgroundColor: currentSessionId === session.id ? 'var(--bg-user-bubble)' : 'transparent',
                color: currentSessionId === session.id ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <MessageSquare 
                  className="w-3.5 h-3.5 shrink-0" 
                  style={{ color: currentSessionId === session.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                />
                {editingId === session.id ? (
                  <input 
                    autoFocus
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onBlur={(e) => handleRenameSave(e, session.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSave(e, session.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="bg-transparent border-none outline-none w-full font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  />
                ) : (
                  <span className="truncate font-semibold" style={{ color: currentSessionId === session.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{session.title}</span>
                )}
              </div>
              
              <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity ml-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(session.id);
                    setEditTitle(session.title);
                  }}
                  className="p-0.5 rounded hover:bg-sky-200/50 transition-colors text-sky-700 hover:text-sky-950"
                  title="Rename Chat"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  className="p-0.5 rounded hover:bg-sky-200/50 transition-colors text-sky-700 hover:text-red-500"
                  title="Delete Chat"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Clear conversations button */}
      <div 
        className="p-4 border-t flex flex-col gap-2 transition-all duration-300"
        style={{ borderColor: '#7dd3fc', backgroundColor: '#bae6fd' }}
      >
         <button 
           onClick={handleClearAll}
           className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 text-[10px] font-bold uppercase tracking-wider cursor-pointer border-red-300 hover:border-red-400 hover:bg-red-500/10 hover:text-red-600"
           style={{
             backgroundColor: '#ffffff',
             color: '#64748b'
           }}
           title="Delete all conversations"
         >
           <Settings className="w-3.5 h-3.5 animate-spin-slow shrink-0" />
           Clear all chats
         </button>
      </div>
    </div>
  );
}
