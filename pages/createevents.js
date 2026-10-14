// pages/createevents.js — Create Event form
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ArrowLeft } from 'lucide-react';
import { useEvent } from '../context/EventContext';
import { useHideBottomNav } from '../hooks/useHideBottomNav';

const TAGS = ["Music", "Art", "Tech", "Business", "Health", "Sports", "Fashion", "Food", "Film", "Education", "Gaming", "Charity", "Culture", "Workshop", "Comedy"];

export default function CreateEventPage() {
  const router = useRouter();
  const { updateEventData } = useEvent();
  useHideBottomNav(true);

  const [formData, setFormData] = useState({ title: '', date: '', time: '', ampm: 'AM', location: '', description: '', tags: [] });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [coverPhoto, setCoverPhoto] = useState(null);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setCoverPhoto(file);
  };

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : prev.tags.length < 3 ? [...prev.tags, tag] : prev.tags,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      updateEventData({ ...formData, coverPhoto });
      router.push('/events/tickets');
    } catch (err) {
      setMessage('Error saving event');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', height: 40, backgroundColor: 'transparent', border: '1px solid rgba(171,212,158,0.4)', color: '#ABD49E', paddingLeft: 10, fontSize: 14, outline: 'none' };
  const labelStyle = { color: '#ABD49E', fontSize: 13, marginBottom: 6, display: 'block', marginLeft: 4 };

  return (
    <>
      <Head><title>Create Event — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: '#151413', color: '#ABD49E', paddingLeft: 16, paddingRight: 16, paddingBottom: 40 }}>
        {/* Header */}
        <div style={{ height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', paddingTop: 10 }}>
          <button onClick={() => router.back()} style={{ position: 'absolute', left: 0, background: 'none', border: 'none', color: '#ABD49E', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: 16, fontWeight: 700 }}>Create Event</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {/* Event Name */}
          <div>
            <label style={labelStyle}>Event Name</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} style={inputStyle} placeholder="Enter event name" required />
          </div>

          {/* Cover Photo */}
          <div>
            <label style={labelStyle}>Event Cover Photo</label>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 42, backgroundColor: 'rgba(171,212,158,0.1)', border: '1px solid rgba(171,212,158,0.4)', cursor: 'pointer', color: '#ABD49E', fontSize: 14 }}>
              + Add Event Cover Photo
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
            {coverPhoto && <div style={{ fontSize: 12, marginTop: 6, opacity: 0.7 }}>{coverPhoto.name}</div>}
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>Event Tags (Choose up to 3)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  style={{
                    padding: '4px 12px', fontSize: 12, cursor: 'pointer', border: '1px solid rgba(171,212,158,0.4)',
                    backgroundColor: formData.tags.includes(tag) ? '#ABD49E' : 'transparent',
                    color: formData.tags.includes(tag) ? '#151413' : '#ABD49E',
                    fontWeight: formData.tags.includes(tag) ? 700 : 400,
                  }}
                >{tag}</button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange}
              style={{ ...inputStyle, height: 80, paddingTop: 8, resize: 'vertical' }}
              placeholder="Enter event description"
            />
          </div>

          {/* Location */}
          <div>
            <label style={labelStyle}>Location</label>
            <input name="location" value={formData.location} onChange={handleChange} style={inputStyle} placeholder="Enter location" required />
          </div>

          {/* Date & Time */}
          <div>
            <label style={labelStyle}>Date and Time</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input type="date" name="date" value={formData.date} onChange={handleChange} style={{ ...inputStyle, flex: '1 1 45%' }} required />
              <div style={{ flex: '1 1 45%', display: 'flex', gap: 8 }}>
                <input type="time" name="time" value={formData.time} onChange={handleChange} style={{ ...inputStyle, flex: 2 }} required />
                <select name="ampm" value={formData.ampm} onChange={handleChange} style={{ ...inputStyle, flex: 1, paddingLeft: 6 }}>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            style={{ width: '100%', height: 46, backgroundColor: '#ABD49E', color: '#151413', border: 'none', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, letterSpacing: 1 }}
          >
            {loading ? 'Saving...' : 'NEXT: SETUP TICKETS'}
          </button>

          {message && <p style={{ textAlign: 'center', color: '#ff6b6b', fontSize: 13 }}>{message}</p>}
        </form>
      </div>
    </>
  );
}
