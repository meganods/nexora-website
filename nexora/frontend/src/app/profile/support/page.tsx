"use client";

import React, { useState, useEffect } from 'react';
import { LifeBuoy, Send, Plus, Calendar, AlertTriangle, Loader2, X, MessageCircle } from 'lucide-react';
import api from '@/lib/api';

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Ticket create state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);

  // Active chat state
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Edit/Delete message states
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleEditMessage = (msgId: string, currentText: string) => {
    setEditingMessageId(msgId);
    setEditContent(currentText);
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!editContent.trim() || !activeTicket) return;
    try {
      const { data } = await api.put(`/user/dashboard/tickets/${activeTicket._id}/messages/${msgId}`, {
        message: editContent
      });
      if (data?.success) {
        setActiveTicket(data.ticket);
        setEditingMessageId(null);
        setEditContent('');
        fetchTickets();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update message');
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const { data } = await api.delete(`/user/dashboard/tickets/${activeTicket._id}/messages/${msgId}`);
      if (data?.success) {
        setActiveTicket(data.ticket);
        fetchTickets();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete message');
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const { data } = await api.get('/user/dashboard/tickets');
      if (data?.success) {
        setTickets(data.data || []);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        setErrorMsg('Access denied. Please login with a customer account to manage support tickets.');
      } else {
        setErrorMsg('Failed to load support tickets.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) return;

    try {
      setCreatingTicket(true);
      const { data } = await api.post('/user/dashboard/tickets', {
        subject,
        message: initialMessage
      });

      if (data?.success) {
        alert('Support ticket created successfully!');
        setShowCreateModal(false);
        setSubject('');
        setInitialMessage('');
        fetchTickets();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create ticket.');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleOpenChat = async (ticket: any) => {
    try {
      const { data } = await api.get(`/user/dashboard/tickets/${ticket._id}`);
      if (data?.success) {
        setActiveTicket(data.data);
      }
    } catch (err) {
      console.error(err);
      setActiveTicket(ticket);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeTicket) return;

    try {
      setSendingReply(true);
      const { data } = await api.post(`/user/dashboard/tickets/${activeTicket._id}/reply`, {
        message: chatMessage
      });

      if (data?.success) {
        setActiveTicket(data.ticket);
        setChatMessage('');
        fetchTickets(); // Refresh lists status
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send reply.');
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gold/15 pb-4 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Help &amp; Support</h1>
          <p className="text-xs text-foreground/50">Submit support requests and resolve concerns with the Nexora support desk</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="text-xs font-bold text-white bg-primary px-4 py-2.5 rounded-full hover:bg-primary/95 transition-all flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" /> Create Ticket
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-bold leading-normal">{errorMsg}</p>
        </div>
      )}

      {showCreateModal ? (
        <div className="bg-white border border-gold/15 rounded-3xl p-6 shadow-sm w-full">
          <div className="flex justify-between items-center border-b border-gold/15 pb-3 mb-4">
            <h3 className="font-serif text-base font-bold text-primary">Open Support Ticket</h3>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-xs font-bold text-[#C3AB84] hover:text-primary"
            >
              Cancel &times;
            </button>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground/60 uppercase mb-1">Subject</label>
              <input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Payment issue, Refund status, service delay"
                className="w-full border border-gold/20 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground/60 uppercase mb-1">Detailed Message</label>
              <textarea
                required
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Provide context or instructions here so support desk can help..."
                className="w-full border border-gold/20 rounded-xl px-3.5 py-2.5 text-xs h-28 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={creatingTicket}
                className="flex-grow py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50"
              >
                {creatingTicket ? 'Submitting...' : 'Open Ticket'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 border border-gold/30 text-primary font-bold rounded-xl hover:bg-cream/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        tickets.length === 0 ? (
          <div className="bg-white border border-gold/15 rounded-3xl p-12 text-center">
            <LifeBuoy className="w-12 h-12 text-gold/30 mx-auto mb-4" />
            <h3 className="font-serif text-base font-bold text-primary mb-1">No active support tickets</h3>
            <p className="text-xs text-foreground/50 leading-relaxed max-w-sm mx-auto">
              You don't have any support tickets opened. Click "Create Ticket" to get help with payments, bookings, or accounts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tickets list */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Your Ticket Log</h3>
              <div className="space-y-3">
                {tickets.map((t) => (
                  <div
                    key={t._id}
                    onClick={() => handleOpenChat(t)}
                    className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all hover:border-primary ${
                      activeTicket?._id === t._id ? 'border-primary ring-2 ring-primary/5' : 'border-gold/15'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-bold text-primary truncate max-w-[120px]">{t.subject}</p>
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                        t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-foreground/50 mt-1 font-mono">ID: {String(t._id).slice(-6).toUpperCase()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Chat box */}
            <div className="lg:col-span-2">
              {activeTicket ? (
                <div className="bg-white border border-gold/15 rounded-3xl shadow-sm h-[500px] flex flex-col justify-between overflow-hidden">
                  {/* Header */}
                  <div className="p-4 border-b border-gold/15 bg-cream/10 flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-primary truncate max-w-[300px]">{activeTicket.subject}</h3>
                      <p className="text-[9px] text-foreground/45 mt-0.5 font-mono">Ticket ID: {activeTicket._id}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-wider">
                      {activeTicket.status}
                    </span>
                  </div>

                  {/* Messages body */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-cream/5 scrollbar-thin">
                    {activeTicket.messages?.map((msg: any, i: number) => {
                      const isAdmin = msg.senderType === 'admin';
                      return (
                        <div
                          key={i}
                          className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                              isAdmin
                                ? 'bg-cream text-primary border border-gold/10'
                                : 'bg-primary text-white shadow-md'
                            }`}
                          >
                            <p className="font-bold text-[9px] mb-1 opacity-70 uppercase tracking-wide">
                              {isAdmin ? 'Nexora Support' : 'You'}
                            </p>
                            {editingMessageId === msg._id ? (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="text-xs text-primary bg-white border border-gold/30 rounded px-2 py-1 focus:outline-none w-full font-semibold"
                                />
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => handleSaveEdit(msg._id)} className="text-[9px] font-bold text-white hover:underline bg-green-700 px-2 py-0.5 rounded">Save</button>
                                  <button onClick={() => setEditingMessageId(null)} className="text-[9px] font-bold text-white hover:underline bg-gray-500 px-2 py-0.5 rounded">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p>{msg.message}</p>
                                <div className={`flex items-center gap-4 mt-1.5 pt-1.5 border-t ${
                                  isAdmin ? 'border-primary/10 justify-end' : 'border-white/10 justify-between'
                                }`}>
                                  {!isAdmin && (
                                    <div className="flex gap-2">
                                      <button onClick={() => handleEditMessage(msg._id, msg.message)} className="text-[9px] font-bold hover:underline opacity-70 hover:opacity-100">Edit</button>
                                      <button onClick={() => handleDeleteMessage(msg._id)} className="text-[9px] font-bold hover:underline opacity-70 hover:opacity-100 text-red-200 hover:text-red-100">Delete</button>
                                    </div>
                                  )}
                                  <p className={`text-[8px] opacity-50 ${isAdmin ? 'text-primary/70' : 'text-white/70'}`}>
                                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Chat Form */}
                  {activeTicket.status !== 'CLOSED' && activeTicket.status !== 'RESOLVED' ? (
                    <form onSubmit={handleSendReply} className="p-3 border-t border-gold/15 bg-white flex gap-2">
                      <input
                        required
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Type reply..."
                        className="flex-grow border border-gold/20 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
                      />
                      <button
                        type="submit"
                        disabled={sendingReply}
                        className="bg-primary text-white p-2.5 rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50 flex items-center justify-center flex-shrink-0"
                      >
                        {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </form>
                  ) : (
                    <div className="p-4 bg-gray-50 border-t border-gold/15 text-center text-xs font-semibold text-foreground/45 italic">
                      This support ticket is marked as resolved or closed.
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-gold/15 rounded-3xl p-12 text-center h-[500px] flex flex-col justify-center items-center">
                  <MessageCircle className="w-12 h-12 text-gold/30 mb-3" />
                  <h4 className="font-serif text-sm font-bold text-primary">No active ticket selected</h4>
                  <p className="text-xs text-foreground/50 max-w-xs leading-relaxed mt-1">
                    Select a support log card from the left panel to load active conversations and response history.
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
