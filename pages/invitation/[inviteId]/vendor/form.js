// pages/invitation/[inviteId]/vendor/form.js — Vendor application
import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { useHideBottomNav } from '../../../../hooks/useHideBottomNav';

export default function VendorForm() {
  const router = useRouter();
  const { inviteId } = router.query;
  const [form, setForm] = useState({ name: '', email: '', company: '', services: '', website: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useHideBottomNav(true);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/invitations/' + inviteId + '/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, type: 'vendor' }),
      });
      if (res.ok) setDone(true);
      else alert('Submission failed');
    } catch { alert('Submission failed'); }
    setLoading(false);
  };

  const inputStyle = { width: '100%', height: 40, backgroundColor: 'transparent', border: '1px solid rgba(171,212,158,0.4)', color: '#ABD49E', paddingLeft: 10, fontSize: 14, outline: 'none' };
  const labelStyle = { color: '#ABD49E', fontSize: 11, letterSpacing: 1, marginBottom: 6, display: 'block', opacity: 0.7 };

  if (done) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#151413', color: '#ABD49E', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Application Submitted!</h2>
      <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 24 }}>The event organizer will review your application.</p>
      <button onClick={() => router.push('/')} style={{ height: 44, padding: '0 24px', backgroundColor: '#ABD49E', color: '#151413', border: 'none', fontWeight: 700, cursor: 'pointer' }}>BACK TO HOME</button>
    </div>
  );

  return (
    <>
      <Head><title>Vendor Application — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: '#151413', color: '#ABD49E', paddingBottom: 40 }}>
        <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 16px', borderBottom: '1px solid rgba(171,212,158,0.15)' }}>
          <button onClick={() => router.back()} style={{ position: 'absolute', left: 16, background: 'none', border: 'none', color: '#ABD49E', cursor: 'pointer' }}><ArrowLeft size={22} /></button>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Vendor Application</span>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[['name', 'YOUR NAME', 'text', 'Contact name'], ['email', 'EMAIL', 'email', 'Contact email'], ['company', 'COMPANY / BRAND', 'text', 'Your company name'], ['services', 'SERVICES OFFERED', 'text', 'e.g. Catering, AV Equipment'], ['website', 'WEBSITE', 'url', 'https://']].map(([name, label, type, ph]) => (
            <div key={name}>
              <label style={labelStyle}>{label}</label>
              <input type={type} name={name} value={form[name]} onChange={handleChange} style={inputStyle} placeholder={ph} required={['name', 'email'].includes(name)} />
            </div>
          ))}
          <div>
            <label style={labelStyle}>DESCRIPTION</label>
            <textarea name="description" value={form.description} onChange={handleChange} style={{ ...inputStyle, height: 80, paddingTop: 8 }} placeholder="Tell the organizer about your services" />
          </div>
          <button type="submit" disabled={loading} style={{ height: 46, backgroundColor: '#ABD49E', color: '#151413', border: 'none', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, letterSpacing: 1, marginTop: 8 }}>
            {loading ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
          </button>
        </form>
      </div>
    </>
  );
}
