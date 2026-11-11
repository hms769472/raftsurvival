import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// iOS home-screen icon (Apple touch icon), same motif as the tab icon.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: 'linear-gradient(180deg, #57B8E0 0%, #2D8FBD 60%, #1F6E93 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 24,
            right: 30,
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: '#F5D76E',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 22,
            width: 136,
            height: 30,
            borderRadius: 8,
            background: '#8B4513',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 82,
            left: 74,
            width: 32,
            height: 42,
            borderRadius: 4,
            background: '#E6A15E',
          }}
        />
      </div>
    ),
    size,
  );
}
