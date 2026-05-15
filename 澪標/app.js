async function testConnection() {

  const { data, error } = await supabase
    .from('gallery')
    .select('*');

  console.log('data:', data);
  console.log('error:', error);

}

testConnection();

async function loadGallery() {

  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .order('created_at', { ascending: false });

  console.log(data);

}

async function loadGallery() {
  // 1. Supabaseからデータを取得
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .order('created_at', { ascending: false }); // 新しい順に並べる

  if (error) {
    console.error('データ取得エラー:', error);
    return;
  }

  // 2. 表示先のエリア（HTMLのid）を取得
  const container = document.getElementById('dynamicGalleryCards');
  if (!container) return;

  // 3. 一旦中身を空にする
  container.innerHTML = '';

  // 4. 取得したデータの分だけカードを作成して追加
  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'gallery-card gallery-dynamic-card';
    
    // ここでデータベースの「カラム名」を使って表示を作る
    card.innerHTML = `
      <div class="gallery-thumb" style="background:#f5ede4;">
        <button class="gallery-delete-btn" onclick="deleteCard('${item.id}', this)" title="削除">✕</button>
        <img class="gallery-thumb-photo" src="${item.image_url}" alt="${item.title}" style="object-fit:cover;">
        <div class="gallery-thumb-date" style="color:#fff;position:absolute;bottom:8px;right:10px;text-shadow:0 1px 4px rgba(0,0,0,0.5);z-index:1;">
          ${item.date_str}
        </div>
      </div>
      <div class="gallery-info">
        <p class="gallery-dish">${item.title}</p>
        <p class="gallery-meta">${item.description || ''}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

// ページを読み込んだら実行するようにする
document.addEventListener('DOMContentLoaded', loadGallery);