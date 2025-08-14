'use client';

export default function TestPage() {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px',
      color: 'white'
    }}>
      <h1>Test Page</h1>
      <p>If you can see this, React is working.</p>
      <p>Purple background is intentional - it's the app theme.</p>
      <button onClick={() => alert('JavaScript works!')}>
        Test JavaScript
      </button>
    </div>
  );
}