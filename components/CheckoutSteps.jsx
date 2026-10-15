// components/CheckoutSteps.jsx
//
// The purchase flow is three committed steps, and a user who has just tapped "+" needs to
// see that they are on step one of three with somewhere to go. Shared by the select,
// details and payment screens so the indicator can never disagree with the page.
import { ArrowLeft } from 'lucide-react';
import { STEPS } from '../utils/orderDraft';

const INK = '#151413';
const LEAF = '#ABD49E';

export default function CheckoutSteps({ step = 1, title, subtitle, onBack }) {
  return (
    <div>
      <div
        style={{
          height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', padding: '0 16px', borderBottom: `1px solid ${LEAF}`,
        }}
      >
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Go back"
            style={{ position: 'absolute', left: 12, background: 'none', border: 'none', color: LEAF, cursor: 'pointer', padding: 4 }}
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>{title}</span>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px 0' }}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 10, fontWeight: 700,
                    backgroundColor: done || active ? LEAF : 'transparent',
                    color: done || active ? INK : LEAF,
                    border: `1px solid ${LEAF}`, opacity: done ? 0.55 : 1,
                  }}
                >
                  {done ? '✓' : n}
                </span>
                <span style={{ fontSize: 10, letterSpacing: 1, fontWeight: active ? 700 : 400, opacity: active ? 1 : 0.55 }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span style={{ flex: 1, height: 1, backgroundColor: LEAF, opacity: 0.35, margin: '0 8px' }} />
              )}
            </div>
          );
        })}
      </div>

      {subtitle && <div style={{ padding: '10px 16px 0', fontSize: 12, opacity: 0.6 }}>{subtitle}</div>}
    </div>
  );
}
