// pages/world.js — WORLD MAP (API: /api/map; JUNGLE_MAP_SYSTEM.md)
import { useState, useEffect } from 'react';
import Link from 'next/link';
import MvpShell, { mvpCard, mvpButton } from '../components/MvpShell';

const CELL = 56;

export default function WorldPage() {
  const [positions, setPositions] = useState({ users: [], communities: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/map')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPositions(data.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const all = [...positions.users, ...positions.communities];
  const maxX = all.reduce((m, p) => Math.max(m, p.gridX || 0), 0);
  const maxY = all.reduce((m, p) => Math.max(m, p.gridY || 0), 0);
  const cols = Math.max(maxX + 1, 1);
  const rows = Math.max(maxY + 1, 1);

  return (
    <MvpShell title="WORLD" subtitle="THE JUNGLES MAP">
      {loading ? (
        <div style={{ opacity: 0.5, padding: 40, textAlign: 'center' }}>Loading the world...</div>
      ) : (
        <>
          {error ? <div style={{ color: '#E9040C', marginBottom: 12 }}>{error}</div> : null}

          <div style={mvpCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, letterSpacing: 1, opacity: 0.7 }}>
              <span>{positions.users.length} EXPLORERS</span>
              <span>{positions.communities.length} COMMUNITIES</span>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              width: '100%',
              overflow: 'auto',
              border: '1px solid rgba(171,212,158,0.15)',
              padding: 12,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, ${CELL}px)`,
                gridTemplateRows: `repeat(${rows}, ${CELL}px)`,
                gap: 2,
                width: cols * (CELL + 2),
              }}
            >
              {Array.from({ length: cols * rows }).map((_, idx) => {
                const x = idx % cols;
                const y = Math.floor(idx / cols);
                const here = all.filter((p) => p.gridX === x && p.gridY === y);
                if (here.length === 0) {
                  return (
                    <div key={idx} style={{ width: CELL, height: CELL, border: '1px dashed rgba(171,212,158,0.08)' }} />
                  );
                }
                const isCommunity = here[0].entityType === 'Community';
                const node = here[0];
                return (
                  <Link
                    key={idx}
                    href={isCommunity ? `/communities/${node.entityId}` : `/u/${node.entityName}`}
                    style={{
                      width: CELL,
                      height: CELL,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #ABD49E',
                      background: isCommunity ? 'rgba(171,212,158,0.25)' : 'transparent',
                      borderRadius: isCommunity ? 0 : '50%',
                      color: '#ABD49E',
                      fontSize: 9,
                      textAlign: 'center',
                      overflow: 'hidden',
                      textDecoration: 'none',
                      padding: 2,
                    }}
                    title={node.entityName}
                  >
                    <span style={{ fontWeight: 700 }}>{node.entityName}</span>
                    {here.length > 1 ? <span style={{ opacity: 0.6 }}>+{here.length - 1}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <Link href="/jungle" style={mvpButton(false)}>OPEN JUNGLE VIEW</Link>
            <Link href="/fanbase" style={{ ...mvpButton(false), background: 'transparent', color: '#ABD49E' }}>
              ALL COMMUNITIES
            </Link>
          </div>
        </>
      )}
    </MvpShell>
  );
}
