async function testConnection() {
  // 🔴 supabaseClient に変更
  const { data, error } = await supabaseClient
    .from('gallery')
    .select('*');

  console.log('data:', data);
  console.log('error:', error);
}

testConnection();

async function loadGallery() {
  // 🔴 supabaseClient に変更
  const { data, error } = await supabaseClient
    .from('gallery')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('データ取得エラー:', error);
    return;
  }

  const container = document.getElementById('dynamicGalleryCards');
  if (!container) return;

  container.innerHTML = '';

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'gallery-card gallery-dynamic-card';
    
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

document.addEventListener('DOMContentLoaded', loadGallery);

// カードを削除する関数
async function deleteCard(id, btn) {
  // ログインチェック（現状のindex.jsの変数を参照）
  if (!isLoggedIn) {
    alert("ログインが必要です");
    return;
  }

  if (!confirm("本当にこの投稿を削除しますか？")) return;

  // 1. Supabaseから削除を実行
  const { error } = await supabaseClient
    .from('gallery')
    .delete()
    .eq('id', id); // 覚えたての「id」を使ってピンポイントで消す！

  if (error) {
    console.error('削除エラー:', error);
    alert('削除に失敗しました');
    return;
  }

  // 2. DB削除に成功したら、画面上のカードを消すアニメーション
  const card = btn.closest('.gallery-card');
  card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  card.style.opacity = '0';
  card.style.transform = 'scale(0.95)';
  
  setTimeout(() => {
    card.remove();
  }, 300);
}