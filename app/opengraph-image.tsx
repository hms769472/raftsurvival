import { ImageResponse } from 'next/og';

export const alt = 'Stranded on a Raft — Raft Survival';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Social share card (OpenGraph / Twitter). Rendered at build time from
// primitives — no binary image is committed.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: 'linear-gradient(180deg, #57B8E0 0%, #2D8FBD 55%, #1F6E93 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 70,
            right: 110,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: '#F5D76E',
            boxShadow: '0 0 80px rgba(245,215,110,0.6)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 150,
            left: 90,
            width: 320,
            height: 56,
            borderRadius: 12,
            background: '#8B4513',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 206,
            left: 220,
            width: 64,
            height: 74,
            borderRadius: 6,
            background: '#E6A15E',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: 6,
              textShadow: '0 6px 0 rgba(0,0,0,1)',
            }}
          >
            STRANDED
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: '#F5D76E',
              letterSpacing: 8,
              marginTop: 12,
              textShadow: '0 4px 0 rgba(0,0,0,1)',
            }}
          >
            ON A RAFT
          </div>
          <div
            style={{
              fontSize: 26,
              color: 'rgba(255,255,255,0.92)',
              marginTop: 28,
            }}
          >
            Fish • Build • Fight • Survive 20 Days
          </div>
        </div>
      </div>
    ),
    size,
  );
}
