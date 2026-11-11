import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// Browser-tab icon: a tiny raft on the sea, drawn with primitives so no
// binary asset is committed and no emoji font is required.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #57B8E0 0%, #2D8FBD 60%, #1F6E93 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 6,
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: '#F5D76E',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 7,
            left: 4,
            width: 24,
            height: 6,
            borderRadius: 2,
            background: '#8B4513',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 15,
            left: 13,
            width: 6,
            height: 8,
            borderRadius: 1,
            background: '#E6A15E',
          }}
        />
      </div>
    ),
    size,
  );
}
