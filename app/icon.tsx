import { ImageResponse } from 'next/og';

export const size = {
  width: 512,
  height: 512,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 220,
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 110,
          color: '#ffffff',
          fontWeight: 900,
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        }}
      >
        🌾
      </div>
    ),
    {
      ...size,
    }
  );
}
