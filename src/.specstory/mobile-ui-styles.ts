// モバイルUI修正用のスタイル

export const MOBILE_BUTTON_STYLES = {
  // 基本的なモバイルボタンスタイル
  base: `
    min-height: 44px;
    min-width: 44px;
    padding: 12px 16px;
    font-size: 16px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  `,
  
  // 保存ボタン
  save: `
    background: #10b981;
    color: white;
    font-weight: 600;
  `,
  
  // キャンセルボタン
  cancel: `
    background: #6b7280;
    color: white;
    font-weight: 600;
  `,
  
  // 戻るボタン
  back: `
    background: #3b82f6;
    color: white;
    font-weight: 600;
  `,
  
  // 削除ボタン
  delete: `
    background: #ef4444;
    color: white;
    font-weight: 600;
  `
};

// モバイル用のモーダルスタイル
export const MOBILE_MODAL_STYLES = {
  overlay: `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    padding: 16px;
  `,
  
  modal: `
    background: white;
    border-radius: 12px;
    padding: 24px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  `,
  
  header: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
  `,
  
  buttonRow: `
    display: flex;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  `,
  
  buttonRowMobile: `
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
    
    @media (min-width: 640px) {
      flex-direction: row;
    }
  `
};

export default { MOBILE_BUTTON_STYLES, MOBILE_MODAL_STYLES };
