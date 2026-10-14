// context/EventContext.js
import { createContext, useContext, useState } from 'react';

const EventContext = createContext();

export function EventProvider({ children }) {
  const [eventData, setEventData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    coverPhoto: null,
    tags: [],
    tickets: [],
    collaborators: []
  });

  const [userEvents, setUserEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadUserEvents = async (userId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tkxts/user/${userId}/events`);
      if (!res.ok) throw new Error('Failed to load events');
      const data = await res.json();
      setUserEvents(data.events || data || []);
    } catch (error) {
      console.error('Failed to load user events:', error);
      setUserEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const createEventWithTickets = async (eventDataWithTickets) => {
    try {
      setLoading(true);
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(eventDataWithTickets),
      });
      if (!res.ok) throw new Error('Failed to create event');
      return await res.json();
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateEventData = (newData) => {
    setEventData(prev => ({ ...prev, ...newData }));
  };

  const resetEventData = () => {
    setEventData({
      title: '', date: '', time: '', location: '', description: '',
      coverPhoto: null, tags: [], tickets: [], collaborators: []
    });
  };

  return (
    <EventContext.Provider value={{
      eventData,
      updateEventData,
      resetEventData,
      userEvents,
      loadUserEvents,
      createEventWithTickets,
      loading
    }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}
