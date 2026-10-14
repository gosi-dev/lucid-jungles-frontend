// WAKING — Physical Plane (REAL WORLD map)
//
// Ported verbatim from CONSOLIDATED/client/pages/index.js. This is the *real world*
// map: physical-plane events plotted by lat/lng with an always-visible bottom drawer
// that cycles through 3 states (collapsed tabs → expanded → fully expanded).
//
// The DREAM world map (procedural jungle grid, entity nodes, connections DRAWER) is a
// different product and lives on its own route at /profile — see pages/profile/index.js.
// Do not conflate the two: this page must never render jungle entities.
//
// Token note: CONSOLIDATED's tailwind maps primary=#151413 (charcoal) and
// secondary=#ABD49E (sage) — the exact inverse of rebuilt's config. Every colour class
// below was swapped (primary<->secondary) when porting so the rendered result is
// identical to CONSOLIDATED. `text-accent`/`bg-accent` (CONSOLIDATED accent = #8B5CF6)
// were inlined as arbitrary values because rebuilt's `accent` is an object, not a colour.
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { MapPin, Calendar, Clock, Search, X, Filter, ChevronUp, ChevronDown, Sparkles, Compass, ArrowRight, Navigation, Plus } from 'lucide-react';

const MOCK_EVENTS = [
  { _id: '1', title: 'ENTERTAINMENT WEEK AFRICA 2025', location: 'LANDMARK CENTER, VI LAGOS', lat: 6.4435, lng: 3.4315, date: 'NOV 22', time: '10:00AM', price: 'FREE', tags: ['PARTY', 'CONFERENCE', 'TRADE FAIR'], category: 'conference' },
  { _id: '2', title: 'LUCID JUNGLES LAUNCH PARTY', location: 'ART TECH HUB, IKEJA', lat: 6.6018, lng: 3.3515, date: 'DEC 15', time: '8:00PM', price: '₦5,000', tags: ['MUSIC', 'NETWORKING', 'ART'], category: 'music' },
  { _id: '3', title: 'CAPPUCCINO STUDIOS SHOWCASE', location: 'VIRTUAL REALM', lat: 6.5, lng: 3.4, date: 'JAN 10', time: '6:00PM', price: 'FREE', tags: ['ART', 'PORTFOLIO', 'DIGITAL'], category: 'art' },
  { _id: '4', title: 'FITNESS FESTIVAL LAGOS', location: 'EKO ATLANTIC, LAGOS', lat: 6.4275, lng: 3.4175, date: 'FEB 5', time: '7:00AM', price: '₦3,000', tags: ['FITNESS', 'WELLNESS', 'OUTDOOR'], category: 'fitness' },
  { _id: '5', title: 'DREAM WORKSHOP SERIES', location: 'THE DOJO, IKEJA', lat: 6.605, lng: 3.358, date: 'MAR 12', time: '2:00PM', price: 'FREE', tags: ['WORKSHOP', 'DREAMS', 'GROWTH'], category: 'workshop' },
  { _id: '6', title: 'NIGHT MARKET: JUNGLE EDITION', location: 'FREEDOM PARK, LAGOS', lat: 6.4531, lng: 3.3958, date: 'APR 20', time: '6:00PM', price: '₦2,000', tags: ['MARKET', 'MUSIC', 'FOOD'], category: 'market' },
];

const CATEGORIES = ['all', 'conference', 'music', 'art', 'fitness', 'workshop', 'market'];

export default function WakingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  // Drawer states: 0 = collapsed (tabs only, always visible), 1 = expanded (shows content), 2 = fully expanded (to search bar)
  const [drawerState, setDrawerState] = useState(0);
  const [drawerMode, setDrawerMode] = useState('events'); // 'events' | 'search'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const data = await res.json();
          setEvents(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.log('Events API not available, using mock data');
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const displayEvents = events.length > 0 ? events : MOCK_EVENTS;

  const filteredEvents = displayEvents.filter(ev => {
    const matchesCategory = selectedCategory === 'all' || ev.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length > 0) {
      setDrawerMode('search');
      if (drawerState === 0) setDrawerState(1);
    } else {
      setDrawerMode('events');
    }
  };

  const handleDrawerClick = () => {
    // Cycle: 0 → 1 → 2 → 0
    setDrawerState(prev => prev === 2 ? 0 : prev + 1);
  };

  // Drawer height based on state
  const getDrawerHeight = () => {
    if (drawerState === 0) return 'auto'; // collapsed — just the handle + tabs
    if (drawerState === 1) return '55vh'; // expanded — shows content
    return 'calc(100vh - 120px)'; // fully expanded — to just below search bar
  };

  return (
    <>
      <Head>
        <title>WAKING | Lucid Jungles — Physical Plane</title>
      </Head>

      <div className="bleed-nav relative w-full h-screen overflow-hidden bg-secondary">
        {/* ── Search Bar ── */}
        <div className="absolute top-4 left-4 right-4 z-30">
          <div className="flex items-center gap-2 bg-secondary/90 backdrop-blur-md border border-primary/20 rounded-lg px-4 py-2.5"
            onClick={() => searchInputRef.current?.focus()}
          >
            <Search size={14} className="text-primary/40 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              onFocus={() => searchQuery && (setDrawerMode('search'), drawerState === 0 && setDrawerState(1))}
              placeholder="Search events, locations, tags..."
              className="flex-1 bg-transparent border-none outline-none text-xs text-primary placeholder-primary/30 font-mono tracking-wider"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setDrawerMode('events'); }} className="flex-shrink-0">
                <X size={14} className="text-primary/40 hover:text-primary" />
              </button>
            )}
          </div>
        </div>

        {/* ── Map Area ── */}
        <div ref={mapRef} className="absolute inset-0 bg-[#1a1a2e]">
          {/* Stylized map background — grid with city blocks */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(to right, rgba(171,212,158,0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(171,212,158,0.08) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }} />
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(to right, rgba(171,212,158,0.15) 2px, transparent 2px),
                linear-gradient(to bottom, rgba(171,212,158,0.15) 2px, transparent 2px)
              `,
              backgroundSize: '300px 300px',
            }} />
          </div>

          {/* Decorative map elements — stylized city blocks */}
          {[
            { x: '15%', y: '20%', w: '8%', h: '6%' },
            { x: '45%', y: '15%', w: '12%', h: '8%' },
            { x: '70%', y: '25%', w: '6%', h: '10%' },
            { x: '25%', y: '50%', w: '10%', h: '6%' },
            { x: '55%', y: '55%', w: '8%', h: '12%' },
            { x: '80%', y: '60%', w: '10%', h: '6%' },
            { x: '10%', y: '70%', w: '6%', h: '8%' },
            { x: '40%', y: '75%', w: '14%', h: '6%' },
          ].map((block, i) => (
            <div key={i} className="absolute border border-primary/10 rounded-sm"
              style={{ left: block.x, top: block.y, width: block.w, height: block.h, background: 'rgba(171,212,158,0.03)' }}
            />
          ))}

          {/* Event pins on map */}
          {displayEvents.map((event) => {
            const x = ((event.lng - 3.3) / 0.2) * 15 + 20;
            const y = ((6.65 - event.lat) / 0.3) * 20 + 15;
            const isSelected = selectedEvent?._id === event._id;

            return (
              <div key={event._id}
                className="absolute z-10 cursor-pointer transition-all duration-200"
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -100%)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(isSelected ? null : event);
                }}
              >
                <div className={`flex flex-col items-center transition-transform duration-200 ${isSelected ? 'scale-125' : 'hover:scale-110'}`}>
                  <div className="w-8 h-8 flex items-center justify-center rounded-full"
                    style={{
                      background: isSelected ? '#ABD49E' : '#151413',
                      border: `2px solid ${isSelected ? '#151413' : '#ABD49E'}`,
                    }}
                  >
                    <MapPin size={14} color={isSelected ? '#151413' : '#ABD49E'} />
                  </div>
                  <span className="mt-1 text-[7px] font-bold tracking-wider text-primary/70 whitespace-nowrap px-1"
                    style={{ textShadow: '0 0 4px rgba(0,0,0,0.9)' }}
                  >
                    {event.title.substring(0, 20)}...
                  </span>
                </div>

                {isSelected && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20" style={{ minWidth: 220 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="bg-secondary border border-primary/30 rounded-lg p-3 shadow-xl">
                      <h3 className="text-xs font-bold text-primary mb-1 tracking-wide">{event.title}</h3>
                      <div className="space-y-1 mb-2">
                        <p className="text-[9px] text-primary/50 flex items-center gap-1">
                          <MapPin size={8} /> {event.location}
                        </p>
                        <p className="text-[9px] text-primary/50 flex items-center gap-1">
                          <Calendar size={8} /> {event.date} · <Clock size={8} /> {event.time}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#8B5CF6]">{event.price}</span>
                        <Link href={`/events/${event._id}`}
                          className="text-[8px] text-primary/40 hover:text-primary flex items-center gap-1"
                        >
                          DETAILS <ArrowRight size={8} />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Center marker */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="relative">
              <div className="w-4 h-4 bg-[#8B5CF6] rounded-full animate-pulse opacity-50" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#8B5CF6] rounded-full" />
            </div>
          </div>
        </div>

        {/* ── FABs (Floating Action Buttons) — from UPDATED ── */}
        <div className="fixed flex flex-col items-center z-[60]" style={{ right: 20, bottom: '200px' }}>
          <Link href="/createevents">
            <button className="w-[54px] h-[54px] bg-[#151413] text-[#ABD49E] shadow-lg flex items-center justify-center border border-[#ABD49E] text-3xl font-bold rounded-full mb-2 hover:bg-[#ABD49E] hover:text-[#151413] transition-all">
              <Plus size={24} />
            </button>
          </Link>
          <button className="w-[54px] h-[54px] bg-[#151413] text-[#ABD49E] shadow-lg flex items-center justify-center text-2xl border border-[#ABD49E] font-bold rounded-full hover:bg-[#ABD49E] hover:text-[#151413] transition-all">
            <Compass size={22} />
          </button>
        </div>

        {/* ── Map overlay controls ── */}
        <div className="absolute bottom-24 right-4 z-20 flex flex-col gap-2">
          <button className="w-10 h-10 bg-secondary/90 backdrop-blur-md border border-primary/20 rounded-lg flex items-center justify-center hover:border-primary/40 transition-all">
            <Navigation size={16} className="text-primary/60" />
          </button>
          <button className="w-10 h-10 bg-secondary/90 backdrop-blur-md border border-primary/20 rounded-lg flex items-center justify-center hover:border-primary/40 transition-all">
            <Filter size={16} className="text-primary/60" />
          </button>
        </div>

        {/* ── Always-Visible Bottom Drawer ── */}
        <div className="fixed bottom-0 left-0 right-0 z-[100]"
          style={{ bottom: '75px' }} // sits right above bottom nav
        >
          <div className="bg-secondary border-t border-primary/20 rounded-t-xl"
            style={{ maxHeight: getDrawerHeight(), transition: 'max-height 0.3s ease-in-out' }}
          >
            {/* ── Clickable Handle (cycles through states) ── */}
            <div className="flex flex-col items-center pt-2 pb-1 cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={handleDrawerClick}
            >
              <div className="w-10 h-1 bg-primary/30 rounded-full mb-1" />
              {drawerState === 0 && <ChevronUp size={12} className="text-primary/30" />}
              {drawerState === 1 && <ChevronUp size={12} className="text-primary/50" />}
              {drawerState === 2 && <ChevronDown size={12} className="text-primary/50" />}
            </div>

            {/* ── Drawer tabs (always visible) ── */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-primary/10 flex-shrink-0">
              <div className="flex gap-4">
                <button onClick={() => setDrawerMode('events')}
                  className={`text-[9px] font-bold tracking-wider pb-1 border-b-2 transition-colors ${
                    drawerMode === 'events' ? 'text-primary border-primary' : 'text-primary/40 border-transparent'
                  }`}
                >
                  EVENTS
                </button>
                <button onClick={() => setDrawerMode('search')}
                  className={`text-[9px] font-bold tracking-wider pb-1 border-b-2 transition-colors ${
                    drawerMode === 'search' ? 'text-primary border-primary' : 'text-primary/40 border-transparent'
                  }`}
                >
                  SEARCH
                </button>
              </div>
              <span className="text-[8px] text-primary/30 tracking-wider">
                {filteredEvents.length} EVENTS
              </span>
            </div>

            {/* ── Content (only visible when expanded) ── */}
            {drawerState > 0 && (
              <>
                {/* Category filters */}
                {drawerMode === 'events' && (
                  <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none border-b border-primary/10 flex-shrink-0">
                    {CATEGORIES.map(cat => (
                      <button key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-[8px] font-bold tracking-wider px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                          selectedCategory === cat
                            ? 'bg-primary text-secondary'
                            : 'bg-transparent border border-primary/20 text-primary/50 hover:border-primary/40'
                        }`}
                      >
                        {cat.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}

                {/* Drawer content — pb-20 accounts for bottom nav bar */}
                <div className="overflow-y-auto px-4 pb-20" style={{ maxHeight: drawerState === 2 ? 'calc(100vh - 280px)' : 'calc(55vh - 160px)' }}>
                  {drawerMode === 'search' && searchQuery && (
                    <div className="py-3">
                      <p className="text-[9px] text-primary/40 mb-3 tracking-wider">
                        SEARCH RESULTS FOR &ldquo;{searchQuery}&rdquo;
                      </p>
                      {filteredEvents.length === 0 ? (
                        <p className="text-xs text-primary/30 text-center py-8">No results found</p>
                      ) : (
                        <div className="space-y-2">
                          {filteredEvents.map(event => (
                            <EventListItem key={event._id} event={event} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {drawerMode === 'events' && (
                    <div className="py-3 space-y-2">
                      {filteredEvents.length === 0 ? (
                        <p className="text-xs text-primary/30 text-center py-8">No events in this category</p>
                      ) : (
                        filteredEvents.map(event => (
                          <EventListItem key={event._id} event={event} />
                        ))
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function EventListItem({ event }) {
  return (
    <Link href={`/events/${event._id}`}
      className="block border border-primary/10 rounded-lg p-3 hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold tracking-wide text-primary mb-1 truncate">{event.title}</h3>
          <div className="flex flex-wrap gap-2 text-[8px] text-primary/40">
            <span className="flex items-center gap-1"><MapPin size={8} /> {event.location}</span>
            <span className="flex items-center gap-1"><Calendar size={8} /> {event.date}</span>
            <span className="flex items-center gap-1"><Clock size={8} /> {event.time}</span>
          </div>
          {event.tags && (
            <div className="flex gap-1.5 mt-1.5">
              {event.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[7px] px-1.5 py-0.5 border border-primary/10 text-primary/30 rounded-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="text-[10px] font-bold text-[#8B5CF6] whitespace-nowrap flex-shrink-0">{event.price}</span>
      </div>
    </Link>
  );
}
