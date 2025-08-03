/**
 * キャラクター詳細の一括操作用スクリプト
 * マークダウンファイルに<script src="toggle-script.js"></script>を追加するだけで使用可能
 */
(function() {
  // ページ読み込み完了時に実行
  document.addEventListener('DOMContentLoaded', () => {
    // コントロールパネルを作成
    createControlPanel();
    
    // 初期カウンター更新
    updateCounter();
  });

  // コントロールパネルを作成する関数
  function createControlPanel() {
    // 既存のコントロールパネルがあれば削除（重複防止）
    const existingPanel = document.getElementById('character-controls');
    if (existingPanel) {
      existingPanel.remove();
    }
    
    // コントロールパネルを作成
    const controlPanel = document.createElement('div');
    controlPanel.id = 'character-controls';
    controlPanel.style.position = 'sticky';
    controlPanel.style.top = '0';
    controlPanel.style.backgroundColor = '#f5f5f5';
    controlPanel.style.padding = '10px';
    controlPanel.style.marginBottom = '20px';
    controlPanel.style.display = 'flex';
    controlPanel.style.gap = '10px';
    controlPanel.style.zIndex = '100';
    controlPanel.style.borderBottom = '1px solid #ddd';
    
    // 「全て開く」ボタン
    const openAllBtn = createButton('全て開く', () => {
      document.querySelectorAll('details').forEach(detail => {
        detail.open = true;
      });
    });
    
    // 「全て閉じる」ボタン
    const closeAllBtn = createButton('全て閉じる', () => {
      document.querySelectorAll('details').forEach(detail => {
        detail.open = false;
      });
    });
    
    // 検索ボックス
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'character-search';
    searchInput.placeholder = 'キャラクター名で検索...';
    searchInput.style.padding = '8px';
    searchInput.style.border = '1px solid #ddd';
    searchInput.style.borderRadius = '4px';
    searchInput.style.flexGrow = '1';
    searchInput.style.maxWidth = '300px';
    searchInput.addEventListener('input', filterCharacters);
    
    // カウンター
    const counter = document.createElement('span');
    counter.id = 'character-counter';
    
    // パネルに要素を追加
    controlPanel.appendChild(openAllBtn);
    controlPanel.appendChild(closeAllBtn);
    controlPanel.appendChild(searchInput);
    controlPanel.appendChild(counter);
    
    // ページの先頭に追加
    document.body.insertBefore(controlPanel, document.body.firstChild);
    
    // スタイルシートを追加
    addStyles();
  }
  
  // ボタン作成ヘルパー関数
  function createButton(text, clickHandler) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.padding = '8px 15px';
    button.style.backgroundColor = '#4a6fa5';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';
    button.addEventListener('click', clickHandler);
    return button;
  }
  
  // キャラクター検索機能
  function filterCharacters() {
    const searchTerm = document.getElementById('character-search').value.toLowerCase();
    const details = document.querySelectorAll('details');
    
    details.forEach(detail => {
      const summaryText = detail.querySelector('summary').textContent.toLowerCase();
      if (summaryText.includes(searchTerm)) {
        detail.style.display = '';
      } else {
        detail.style.display = 'none';
      }
    });
    
    updateCounter();
  }
  
  // 表示件数更新
  function updateCounter() {
    const total = document.querySelectorAll('details').length;
    const visible = Array.from(document.querySelectorAll('details')).filter(
      detail => detail.style.display !== 'none'
    ).length;
    
    const counter = document.getElementById('character-counter');
    if (counter) {
      counter.textContent = `${visible}/${total}件表示`;
    }
  }
  
  // スタイルを追加
  function addStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      details {
        margin-bottom: 15px;
        padding: 10px;
        background-color: white;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      
      summary {
        cursor: pointer;
        font-weight: bold;
        padding: 5px;
      }
      
      summary:hover {
        background-color: #f0f0f0;
      }
      
      #character-controls button:hover {
        background-color: #3a5985;
      }
    `;
    document.head.appendChild(styleEl);
  }
})();