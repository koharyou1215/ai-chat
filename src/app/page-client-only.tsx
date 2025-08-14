'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// クライアントサイドでのみレンダリングされるコンポーネント
const ClientOnlyContent = () => {
  const [message, setMessage] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // クライアントサイドでのみ実行される
    setIsClient(true);
  }, []);

  // サーバーサイドでは何も表示しない
  if (!isClient) {
    return null;
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        marginBottom: '20px',
        color: 'white'
      }}>
        AI Chat - クライアントサイド専用テスト
      </h2>
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
        padding: '20px', 
        borderRadius: '10px', 
        marginBottom: '20px',
        flex: 1
      }}>
        <p style={{ marginBottom: '10px', color: 'white' }}>
          このコンポーネントは完全にクライアントサイドでのみレンダリングされます。
        </p>
        <p style={{ color: 'white' }}>
          サーバーサイドレンダリングは一切行われません。
        </p>
        <p style={{ color: 'yellow', marginTop: '10px' }}>
          現在の状態: クライアントサイドレンダリング完了
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="テストメッセージを入力"
          style={{ 
            flex: 1, 
            padding: '15px', 
            borderRadius: '10px', 
            backgroundColor: 'rgba(255, 255, 255, 0.2)', 
            color: 'white',
            border: 'none',
            fontSize: '16px'
          }}
        />
        <button
          onClick={() => {
            alert('メッセージ: ' + message);
            setMessage('');
          }}
          style={{ 
            padding: '15px 30px', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            borderRadius: '10px', 
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          送信
        </button>
      </div>
    </div>
  );
};

// dynamic importでSSRを無効化
const DynamicClientOnlyContent = dynamic(() => Promise.resolve(ClientOnlyContent), {
  ssr: false,
  loading: () => (
    <div style={{ color: 'white', padding: '20px' }}>
      クライアントサイドコンポーネントを読み込み中...
    </div>
  )
});

export default function Page() {
  return <DynamicClientOnlyContent />;
}