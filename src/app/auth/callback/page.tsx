'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Magic Link / OTP の戻り先。
 * Supabase が付与する code / state を受け取り、セッションへ交換してから
 * アプリのトップ（または設定画面）へ遷移する。
 *
 * 注意:
 * - SupabaseのPKCEでは code と code_verifier が必要。exchangeCodeForSession(url) を使う。
 * - 一部のブラウザ／拡張でクエリが欠落することがあるため、防御的にチェックする。
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState<string>('認証処理中です...');

  useEffect(() => {
    const run = async () => {
      try {
        // code/state が無ければその旨を表示（メールリンクが古い/URLが変換された等）
        const code = searchParams?.get('code');
        const state = searchParams?.get('state');

        if (!code || !state) {
          console.error('[auth/callback] missing params', { code: !!code, state: !!state, href: window.location.href });
          setStatus('error');
          setMessage('認証リンクが無効か期限切れです。もう一度お試しください。');
          return;
        }

        // Supabase JS v2: URLからcodeを取得してセッションに交換
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);

        if (error) {
          console.error('[auth/callback] exchange error:', error);
          setStatus('error');

          // 代表的なエラー文言に応じたメッセージ
          const msg =
            error.message?.includes('code verifier')
              ? '認証コードの検証に失敗しました。リンクを再度開くか、新しいメールをお試しください。'
              : error.message?.includes('expired')
              ? '認証リンクの有効期限が切れています。新しいメールを送信してください。'
              : `認証に失敗しました: ${error.message}`;

          setMessage(msg);
          return;
        }

        // 成功
        console.log('[auth/callback] session:', data?.session?.user?.email);
        setStatus('success');
        setMessage('認証が完了しました。画面を移動します...');

        // 少し待ってから遷移（UI上のフィードバック用）
        setTimeout(() => {
          router.replace('/');
        }, 800);
      } catch (e: unknown) {
        console.error('[auth/callback] unexpected error:', e);
        setStatus('error');
        setMessage('不明なエラーが発生しました。もう一度お試しください。');
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold mb-3">認証処理</h1>
        <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-gray-700'}`}>
          {message}
        </p>
        {status === 'processing' && (
          <div className="mt-4 text-sm text-gray-500">ブラウザが自動で処理しています...</div>
        )}
        {status === 'success' && (
          <div className="mt-4 text-sm text-green-600">成功しました。まもなく移動します。</div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-600">認証処理中...</p>
      </div>
    </div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
