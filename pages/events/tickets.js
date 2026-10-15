// pages/events/tickets.js — Step 2 of the create-event wizard ("Setup Tickets").
//
// Ported from the donor design (UPDATED/client/pages/events/tickets.js). Three donor
// behaviours were changed rather than copied:
//
//   1. It imported `createEvent` from ../../utils/api, which does not exist in this
//      build. Publishing goes through EventContext.createEventWithTickets.
//   2. It posted `createdBy: 'user-id'` — a hardcoded constant. This backend takes the
//      creator from the session (create_event reads req.session.user._id), so the field
//      is dropped instead of being sent as a lie.
//   3. Its invite dialog filtered a hardcoded list of five invented people and alerted
//      "Invitation sent to: Sarah Johnson". Nothing was sent and those people do not
//      exist. This API exposes GET /api/users/:id only — no directory search — so the
//      dialog keeps its layout and states plainly how invitations actually go out.
//
// Keep this a STATIC route. Until it existed, /events/tickets fell through to the
// dynamic pages/events/[eventId].js, which read "tickets" as an event id, failed the
// ObjectId cast, and returned 500 -> "Event not found".
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ArrowLeft } from 'lucide-react';
import { useEvent } from '../../context/EventContext';
import { useHideBottomNav } from '../../hooks/useHideBottomNav';
import TicketsList from '../../components/TicketsList';
import SuccessPopup from '../../components/SuccessPopup';

// Step 1 collects a native 24-hour <input type="time"> *and* a separate AM/PM <select>,
// so an hour can arrive encoded twice. Treat the time input as authoritative and only
// apply the meridiem when the hour is in 12-hour form — otherwise "18:00" + "PM" would
// be stored as 30:00 and move the event into the following day.
function combineDateTime(date, time, ampm) {
  if (!date) return null;
  const [hRaw = '0', mRaw = '0'] = String(time || '').split(':');
  let hours = parseInt(hRaw, 10);
  const minutes = parseInt(mRaw, 10) || 0;
  if (Number.isNaN(hours)) hours = 0;
  if (hours <= 12) {
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  }
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

// The three collaborator cards each open the dialog with their own copy.
const INVITE_COPY = {
  talent:        { title: 'Featured Talent',      body: 'Speakers, hosts, panelists, artists, DJs and performers are invited with the private sign-up link on the Collaborators tab.' },
  vendors:       { title: 'Vendors & Exhibitors', body: 'Vendors, exhibitors and suppliers are invited with the private sign-up link on the Collaborators tab.' },
  collaborators: { title: 'Collaborators',        body: 'Collaborators helping to run the event are invited with the private sign-up link on the Collaborators tab.' },
};

const InviteDialog = ({ isOpen, onClose, type = 'talent' }) => {
  if (!isOpen) return null;
  const copy = INVITE_COPY[type] || INVITE_COPY.talent;

  return (
    <div className="fixed inset-0 bg-black/80 z-50">
      <div
        className="bg-[#151413] border border-[#ABD49E]/40 rounded-lg"
        style={{ width: 'calc(100% - 32px)', maxWidth: '500px', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <div className="flex justify-between items-center" style={{ width: 'calc(100% - 20px)', margin: '0 auto', paddingTop: '15px' }}>
          <h2 className="text-xl font-bold text-[#ABD49E]">
            Invite {copy.title}
          </h2>
          <button onClick={onClose} className="text-[#ABD49E] text-lg font-bold" aria-label="Close">×</button>
        </div>

        <div style={{ width: 'calc(100% - 20px)', margin: '0 auto', padding: '15px 0' }}>
          <p className="text-sm opacity-80" style={{ lineHeight: 1.6 }}>
            {copy.body}
          </p>
          <p className="text-sm opacity-60" style={{ lineHeight: 1.6, marginTop: 12 }}>
            Inviting from a search box needs a users directory this API does not expose yet
            (GET /api/users/:id only), so nothing is sent from this dialog.
          </p>
        </div>

        <div style={{ width: 'calc(100% - 20px)', margin: '0 auto', paddingBottom: '15px' }}>
          <button onClick={onClose} style={{ height: '40px' }} className="w-full bg-[#ABD49E] text-[#151413] font-semibold rounded">
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default function TicketSetup() {
  const router = useRouter();
  const { eventData, updateEventData, resetEventData, createEventWithTickets } = useEvent();

  const [activeTab, setActiveTab] = useState('TICKETS');
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [newTicket, setNewTicket] = useState({ name: '', price: '', quantity: '', perks: '' });
  const [inviteDialog, setInviteDialog] = useState({ isOpen: false, type: 'talent' });
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishedPopup, setShowPublishedPopup] = useState(false);
  const [publishedEventId, setPublishedEventId] = useState(null);
  const [publishedEventLink, setPublishedEventLink] = useState(null);

  useHideBottomNav(true);

  const tickets = eventData.tickets || [];

  const closeTicketModal = () => {
    setShowAddTicket(false);
    setEditingTicketId(null);
    setNewTicket({ name: '', price: '', quantity: '', perks: '' });
  };

  // A free tier (price 0) is allowed here on purpose. The donor required `price` to be
  // truthy and then rejected `price <= 0` at publish time, which made a ₦0 tier
  // impossible to save — yet the seeded Gathering event sells one. Only a blank or
  // negative price is refused.
  const addTicket = () => {
    const price = Number(newTicket.price);
    const quantity = parseInt(newTicket.quantity, 10);
    if (!newTicket.name.trim()) { alert('Give the tier a name.'); return; }
    if (newTicket.price === '' || Number.isNaN(price) || price < 0) { alert('Enter a price of 0 or more.'); return; }
    if (!quantity || quantity < 1) { alert('Enter a quantity of at least 1.'); return; }

    const ticket = {
      id: editingTicketId || Date.now(),
      name: newTicket.name.trim(),
      price,
      currency: 'NGN',
      quantity,
      perks: newTicket.perks,
    };

    updateEventData({
      tickets: editingTicketId
        ? tickets.map(t => (t.id === editingTicketId ? ticket : t))
        : [...tickets, ticket],
    });
    closeTicketModal();
  };

  const deleteTicket = (ticketId) => {
    updateEventData({ tickets: tickets.filter(t => t.id !== ticketId) });
    closeTicketModal();
  };

  const handleEditTicket = (ticket) => {
    setNewTicket({
      name: ticket.name || '',
      price: String(ticket.price ?? ''),
      quantity: String(ticket.quantity ?? ''),
      perks: ticket.perks || '',
    });
    setEditingTicketId(ticket.id);
    setShowAddTicket(true);
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  const handlePublishEvent = async () => {
    if (!eventData.title || !eventData.date || !eventData.location) {
      alert('Event details are incomplete — go back a step and fill in the name, date and location.');
      return;
    }
    if (tickets.length === 0) {
      alert('Add at least one ticket tier before publishing your event.');
      return;
    }

    setIsPublishing(true);
    try {
      // The cover upload is best-effort: POST /api/main/upload-media hands the file to
      // Google Cloud Storage, a service that can be unavailable on its own. A failure
      // there must not block publishing, so the event is created with coverImage null.
      let coverImage = null;
      if (eventData.coverPhoto) {
        try {
          const form = new FormData();
          form.append('media', eventData.coverPhoto);
          const upload = await fetch('/api/main/upload-media', { method: 'POST', credentials: 'include', body: form });
          const uploaded = await upload.json().catch(() => ({}));
          coverImage = uploaded?.data?.url || null;
          if (!coverImage) console.warn('Cover upload returned no url:', uploaded);
        } catch (err) {
          console.warn('Cover upload failed; publishing without a cover image', err);
        }
      }

      const created = await createEventWithTickets({
        title: eventData.title,
        date: combineDateTime(eventData.date, eventData.time, eventData.ampm),
        location: eventData.location,
        description: eventData.description,
        isVirtual: false,
        coverImage,
        tags: eventData.tags || [],
        tickets: tickets.map(t => ({
          name: t.name,
          price: t.price,
          currency: t.currency || 'NGN',
          quantity: t.quantity,
          perks: t.perks || '',
        })),
      });

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      setPublishedEventId(created._id);
      setPublishedEventLink(`${origin}/events/${created._id}`);
      setShowPublishedPopup(true);
      resetEventData(); // the draft is published — do not leave it lying in context
    } catch (error) {
      console.error('Failed to publish event:', error);
      alert(`Failed to publish event: ${error?.message || String(error)}`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <Head><title>Setup Tickets — Lucid Jungles</title></Head>
      <div className="min-h-screen bg-[#151413] text-[#ABD49E] flex flex-col" style={{ paddingTop: '20px', paddingBottom: '120px' }}>
        <div style={{ flex: '1 0 auto', padding: '0 16px' }}>
          <div className="max-w-2xl mx-auto h-full">

            {/* Header */}
            <div className="mb-6" style={{ position: 'relative', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={() => router.push('/createevents')}
                aria-label="Back to event details"
                style={{ position: 'absolute', left: 0, background: 'none', border: 'none', color: '#ABD49E', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-center">Setup Tickets</h1>
            </div>

            <div className="flex justify-center border-b border-[#ABD49E]/30 mb-6">
              <button
                onClick={() => setActiveTab('TICKETS')}
                className={`pb-2 px-6 font-semibold ${activeTab === 'TICKETS' ? 'border-b-2 border-[#ABD49E] text-[#ABD49E]' : 'text-[#ABD49E]/60'}`}
              >
                TICKETS
              </button>
              <button
                onClick={() => setActiveTab('COLLABORATORS')}
                className={`pb-2 px-6 font-semibold ${activeTab === 'COLLABORATORS' ? 'border-b-2 border-[#ABD49E] text-[#ABD49E]' : 'text-[#ABD49E]/60'}`}
              >
                COLLABORATORS
              </button>
            </div>

            {activeTab === 'TICKETS' && (
              <div style={{ marginTop: '3px' }}>
                <p className="mb-6 pt-5 pb-2.5" style={{ marginLeft: '5px' }}>Add ticket tiers to your event</p>

                {tickets.length > 0 && (
                  <div style={{ marginTop: '21px' }}>
                    {/* isSelectable is left off deliberately: the donor passed true, but
                        with isEventOwner the organiser branch inside TicketCard wins and
                        the quantity selector never rendered anyway. Tapping a tier edits it. */}
                    <TicketsList
                      tickets={tickets.map(t => ({ ...t, type: t.name, description: t.perks }))}
                      onTicketClick={handleEditTicket}
                      isEventOwner={true}
                    />
                  </div>
                )}

                <div style={{ marginTop: '21px' }}>
                  <button
                    onClick={() => { setNewTicket({ name: '', price: '', quantity: '', perks: '' }); setEditingTicketId(null); setShowAddTicket(true); }}
                    className="w-[calc(100%-32px)] h-[42px] border-2 border-dashed border-[#ABD49E]/40 rounded-lg hover:bg-[#ABD49E]/10 transition mx-auto block"
                  >
                    + ADD TICKET TIER
                  </button>
                </div>

                {tickets.length === 0 && (
                  <p className="text-center text-sm text-[#ABD49E]/60 mt-3">
                    No tiers yet — an event needs at least one before it can be published.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'COLLABORATORS' && (
              <div>
                <p className="mb-2 pt-5 text-sm opacity-80" style={{ marginLeft: '5px' }}>
                  Share these links privately with the people contributing to your event.
                </p>

                {[
                  { key: 'talent', title: 'Featured Talent', body: 'Share this link privately with speakers, hosts, panelists, artists, DJs, performers and other talents contributing to the event.' },
                  { key: 'vendors', title: 'Vendors & Exhibitors', body: 'Share this link privately with the vendors, exhibitors and suppliers for the event.' },
                  { key: 'collaborators', title: 'Collaborators', body: 'Share this link privately with the collaborators helping to run the event.' },
                ].map(card => (
                  <div key={card.key} className="w-full px-[12px] mb-[25px]">
                    <div className="w-full bg-[#151413] rounded-lg overflow-hidden border border-[#ABD49E] text-[#ABD49E]">
                      <div className="h-[40px] border-b border-[#ABD49E] bg-[#ABD49E] flex items-center px-3 text-[#151413]">
                        <h3 className="text-sm font-semibold truncate ml-[7px]">{card.title}</h3>
                      </div>

                      <div className="min-h-[64px] border-b border-[#ABD49E] flex items-center px-3 py-2">
                        <p className="text-sm opacity-80 ml-[7px]">{card.body}</p>
                      </div>

                      <div className="h-[40px] border-b border-[#ABD49E] flex items-center px-3">
                        <div className="flex-1 truncate text-sm ml-[7px]">
                          {publishedEventLink || 'Publish the event to generate this link'}
                        </div>
                      </div>

                      <div className="h-[40px] flex items-center px-3 gap-2">
                        <button
                          onClick={() => setInviteDialog({ isOpen: true, type: card.key })}
                          aria-label={`Invite ${card.title}`}
                          className="w-[60px] h-[40px] bg-[#ABD49E] text-[#151413] font-semibold rounded flex items-center justify-center text-lg hover:opacity-90 transition"
                        >
                          +
                        </button>
                        <button
                          onClick={() => copyLink(publishedEventLink)}
                          disabled={!publishedEventLink}
                          className="flex-1 h-[40px] bg-[#ABD49E] text-[#151413] font-semibold text-sm rounded hover:opacity-90 transition flex items-center justify-center ml-[7px] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          COPY LINK
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* The donor pointed these cards at /talent-signup/<temp-event-id> on the
                    production domain. Those pages do not exist in this app, so the cards
                    share the one link that resolves here: the published event page. */}
                <p className="text-sm opacity-60 px-[12px] pb-6">
                  Per-role sign-up pages are not part of this build yet, so the cards currently
                  share the event&apos;s public link. The + button explains how invitations go out
                  in the meantime.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PUBLISH EVENT */}
        <div style={{ position: 'fixed', bottom: '24px', left: 0, right: 0, padding: '0 16px' }}>
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handlePublishEvent}
              disabled={isPublishing || tickets.length === 0}
              className="w-full h-[46px] bg-[#ABD49E] text-[#151413] font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
            >
              {isPublishing ? 'PUBLISHING…' : 'PUBLISH EVENT'}
            </button>

            {tickets.length === 0 && (
              <p className="text-center text-sm text-[#ABD49E]/60 mt-2">
                Add at least one ticket tier to publish your event
              </p>
            )}
          </div>
        </div>

        {/* ADD / EDIT TICKET MODAL */}
        {showAddTicket && (
          <div className="fixed inset-0 bg-black/80 z-50">
            <div
              className="bg-[#151413] border border-[#ABD49E]/40 rounded-lg"
              style={{ width: 'calc(100% - 32px)', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            >
              <div className="flex justify-between items-center" style={{ width: 'calc(100% - 20px)', margin: '0 auto', paddingTop: '15px' }}>
                <h2 className="text-xl font-bold">{editingTicketId ? 'Edit Ticket' : 'Add Ticket'}</h2>
                <button onClick={closeTicketModal} className="text-[#ABD49E] text-lg font-bold" aria-label="Close">×</button>
              </div>

              <div style={{ width: 'calc(100% - 20px)', margin: '0 auto', paddingTop: '15px' }}>
                <div style={{ paddingBottom: '10px' }}>
                  <label className="block text-sm font-semibold mb-2">TIER NAME</label>
                  <input
                    type="text"
                    value={newTicket.name}
                    onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })}
                    placeholder="GENERAL ADMISSION/TABLE FOR 5/VIP"
                    style={{ height: '40px' }}
                    className="w-full bg-transparent border border-[#ABD49E]/40 rounded px-3 text-sm"
                  />
                </div>

                <div style={{ paddingBottom: '10px' }}>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold mb-2">PRICE (₦)</label>
                      <input
                        type="number"
                        min="0"
                        value={newTicket.price}
                        onChange={(e) => setNewTicket({ ...newTicket, price: e.target.value })}
                        placeholder="10000"
                        style={{ height: '40px' }}
                        className="w-full bg-transparent border border-[#ABD49E]/40 rounded px-3 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold mb-2">QUANTITY</label>
                      <input
                        type="number"
                        min="1"
                        value={newTicket.quantity}
                        onChange={(e) => setNewTicket({ ...newTicket, quantity: e.target.value })}
                        placeholder="1000"
                        style={{ height: '40px' }}
                        className="w-full bg-transparent border border-[#ABD49E]/40 rounded px-3 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div style={{ paddingBottom: '10px' }}>
                  <label className="block text-sm font-semibold mb-2">PERKS</label>
                  <input
                    type="text"
                    value={newTicket.perks}
                    onChange={(e) => setNewTicket({ ...newTicket, perks: e.target.value })}
                    placeholder="E.G DRINKS, ITEM 7, VIP ACCESS"
                    style={{ height: '40px' }}
                    className="w-full bg-transparent border border-[#ABD49E]/40 rounded px-3 text-sm"
                  />
                </div>
              </div>

              <div style={{ width: 'calc(100% - 20px)', margin: '0 auto', padding: '10px 0 15px' }}>
                {editingTicketId ? (
                  <div className="flex gap-3">
                    <button onClick={addTicket} style={{ height: '40px' }} className="flex-1 bg-[#ABD49E] text-[#151413] font-semibold rounded text-sm">
                      UPDATE TICKET
                    </button>
                    <button onClick={() => deleteTicket(editingTicketId)} style={{ height: '40px' }} className="bg-red-600 text-white font-semibold rounded text-sm px-4 hover:bg-red-700 transition">
                      Delete
                    </button>
                  </div>
                ) : (
                  <button onClick={addTicket} style={{ height: '40px' }} className="w-full bg-[#ABD49E] text-[#151413] font-semibold rounded text-sm">
                    SAVE TICKET
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* INVITE DIALOG */}
        <InviteDialog
          isOpen={inviteDialog.isOpen}
          onClose={() => setInviteDialog({ isOpen: false, type: 'talent' })}
          type={inviteDialog.type}
        />

        {/* PUBLISHED */}
        {showPublishedPopup && (
          <SuccessPopup
            title="EVENT PUBLISHED!"
            message="Your event is live. Tickets are on sale and the event page is ready to share."
            primaryLabel="VIEW EVENT"
            onPrimary={() => router.push(`/events/${publishedEventId}`)}
            secondaryLabel="SHARE LINK"
            onSecondary={() => {
              if (publishedEventLink) {
                navigator.clipboard.writeText(publishedEventLink);
                alert('Event link copied to clipboard');
              }
            }}
          />
        )}
      </div>
    </>
  );
}
