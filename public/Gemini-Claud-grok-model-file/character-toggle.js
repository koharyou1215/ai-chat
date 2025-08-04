/**
 * キャラクター定義を<details>タグで囲み、開閉可能にするスクリプト
 */
document.addEventListener('DOMContentLoaded', function() {
  // コントロールパネルを作成
  createControlPanel();
  
  // キャラクター定義を<details>タグで囲む
  wrapCharactersInDetails();
});

/**
 * コントロールパネルを作成する関数
 */
function createControlPanel() {
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
  controlPanel.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
  
  // 「全て開く」ボタン
  const openAllBtn = document.createElement('button');
  openAllBtn.textContent = '全て開く';
  openAllBtn.style.padding = '8px 15px';
  openAllBtn.style.backgroundColor = '#4a6fa5';
  openAllBtn.style.color = 'white';
  openAllBtn.style.border = 'none';
  openAllBtn.style.borderRadius = '4px';
  openAllBtn.style.cursor = 'pointer';
  openAllBtn.addEventListener('click', function() {
    document.querySelectorAll('details').forEach(detail => {
      detail.open = true;
    });
  });
  
  // 「全て閉じる」ボタン
  const closeAllBtn = document.createElement('button');
  closeAllBtn.textContent = '全て閉じる';
  closeAllBtn.style.padding = '8px 15px';
  closeAllBtn.style.backgroundColor = '#4a6fa5';
  closeAllBtn.style.color = 'white';
  closeAllBtn.style.border = 'none';
  closeAllBtn.style.borderRadius = '4px';
  closeAllBtn.style.cursor = 'pointer';
  closeAllBtn.addEventListener('click', function() {
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
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    document.querySelectorAll('details').forEach(detail => {
      const name = detail.querySelector('summary').textContent.toLowerCase();
      if (name.includes(searchTerm)) {
        detail.style.display = '';
      } else {
        detail.style.display = 'none';
      }
    });
    updateCounter();
  });
  
  // カウンター
  const counter = document.createElement('span');
  counter.id = 'character-counter';
  counter.style.marginLeft = 'auto';
  counter.style.alignSelf = 'center';
  
  // パネルに要素を追加
  controlPanel.appendChild(openAllBtn);
  controlPanel.appendChild(closeAllBtn);
  controlPanel.appendChild(searchInput);
  controlPanel.appendChild(counter);
  
  // ページの先頭に追加
  document.body.insertBefore(controlPanel, document.body.firstChild);
}

/**
 * キャラクター定義を<details>タグで囲む関数
 */
function wrapCharactersInDetails() {
  // 本文のテキストを取得
  const content = document.body.innerHTML;
  
  // --- で区切られたセクションを検出
  const sections = content.split(/---+/);
  
  // 最初のコントロールパネル部分を保持
  const controlPanel = document.getElementById('character-controls');
  
  // 本文をクリア
  document.body.innerHTML = '';
  
  // コントロールパネルを再追加
  document.body.appendChild(controlPanel);
  
  // 各セクションを処理
  sections.forEach(section => {
    if (section.trim() === '') return;
    
    try {
      // JSON部分を抽出
      const jsonMatch = section.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return;
      
      const jsonText = jsonMatch[0];
      const characterData = JSON.parse(jsonText);
      
      // details要素を作成
      const details = document.createElement('details');
      
      // summary要素を作成
      const summary = document.createElement('summary');
      summary.textContent = characterData.name || 'キャラクター';
      details.appendChild(summary);
      
      // pre要素を作成してJSONを表示
      const pre = document.createElement('pre');
      pre.textContent = section.trim();
      details.appendChild(pre);
      
      // ページに追加
      document.body.appendChild(details);
    } catch (e) {
      console.error('JSONのパースに失敗しました:', e);
      
      // パースに失敗した場合はそのまま表示
      const div = document.createElement('div');
      div.innerHTML = section;
      document.body.appendChild(div);
    }
  });
  
  // カウンター更新
  updateCounter();
}

/**
 * 表示件数カウンターを更新する関数
 */
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