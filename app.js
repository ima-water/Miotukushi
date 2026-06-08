async function testConnection() {
  const { data, error } = await supabaseClient
    .from('gallery')
    .select('*');

  console.log('data:', data);
  console.log('error:', error);
}

testConnection();

// ========== 料理記録ギャラリーの読み込み ==========
const INITIAL_SHOW_COUNT = 3; 

async function loadGallery() {
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

  data.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'gallery-card gallery-dynamic-card';
    
    if (index >= INITIAL_SHOW_COUNT) {
      card.style.display = 'none'; 
      card.classList.add('is-hidden'); 
    }

    card.innerHTML = `
      <div class="gallery-thumb" style="background:#f5ede4;">
        <button class="gallery-delete-btn member-only" onclick="deleteCard('${item.id}', this)" title="削除" style="display:${typeof isLoggedIn !== 'undefined' && isLoggedIn ? 'block' : 'none'};">✕</button>
        <img class="gallery-thumb-photo" src="${item.image_url}" alt="${item.dish_name}" style="object-fit:cover;">
        <div class="gallery-thumb-date" style="color:#fff;position:absolute;bottom:8px;right:10px;text-shadow:0 1px 4px rgba(0,0,0,0.5);z-index:1;">
          ${item.date_str}
        </div>
      </div>
      <div class="gallery-info">
        <p class="gallery-dish">${item.dish_name}</p>
        <p class="gallery-meta">${item.description || ''}</p>
      </div>
    `;
    container.appendChild(card);
  });

  setupLoadMoreButton();
}

// ギャラリーの「もっと見る」ボタン制御の初期化
function setupLoadMoreButton() {
  const btn = document.getElementById('galleryMoreBtn');
  if (!btn) return;

  const hiddenCards = document.querySelectorAll('.gallery-dynamic-card.is-hidden');
  
  if (hiddenCards.length > 0) {
    btn.style.display = 'inline-block';
    btn.onclick = () => {
      hiddenCards.forEach(card => {
        card.style.display = 'block'; 
        card.classList.remove('is-hidden'); 
      });
      btn.style.display = 'none'; 
    };
  } else {
    btn.style.display = 'none';
  }
}

// ========== NEXT EVENT を自動判定して1件だけ読み込む ==========
async function loadNextEvent() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // 今日以降（gte）のイベントを、開催日が近い順（ascending: true）に1件だけ取得
  const { data, error } = await supabaseClient
    .from('next_event')
    .select('*')
    .gte('target_date', todayStr)
    .order('target_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Next Event取得エラー:', error);
    return;
  }

  const titleEl = document.querySelector('.next-title');
  const details = document.querySelectorAll('.next-detail');
  const noteEl = document.querySelector('.next-note');

  const setDetail = (el, label, val) => {
    if (el) el.innerHTML = `<strong>${label}</strong>${val || '—'}`;
  };

  if (data) {
    if (titleEl) titleEl.innerHTML = data.title.replace(/\n/g, '<br>');
    setDetail(details[0], '日時', data.event_date);
    setDetail(details[1], '場所', data.place);
    setDetail(details[2], '定員', data.capacity);
    setDetail(details[3], '参加費', data.fee);
    setDetail(details[4], '持物', data.items);
    if (noteEl) noteEl.innerHTML = data.note.replace(/\n/g, '<br>');
  } else {
    // 未来のデータが1件もない場合の初期表示
    if (titleEl) titleEl.innerHTML = '次回の活動予定';
    setDetail(details[0], '日時', '未定');
    setDetail(details[1], '場所', '—');
    setDetail(details[2], '定員', '—');
    setDetail(details[3], '参加費', '—');
    setDetail(details[4], '持物', '—');
    if (noteEl) noteEl.innerHTML = '次回のイベントが決まり次第、ここでお知らせします！🌿';
  }
}

// ========== スケジュールデータを Supabase から読み込む ==========
async function loadSchedules() {
  const { data, error } = await supabaseClient
    .from('schedules')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('スケジュール取得エラー:', error);
    return;
  }

  const list = document.querySelector('.schedule-list');
  if (!list || !data) return;

  list.innerHTML = ''; // 一度リセット

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'schedule-card sched-dynamic-card';
    card.style.position = 'relative';

    const tagClass = item.tag_type === 'open' ? 'sched-tag open-tag' : 'sched-tag';
    const tagLabel = item.tag_type === 'open' ? '体験参加OK' : '会員限定';

    card.innerHTML = `
      <button class="sched-delete-btn member-only" onclick="deleteScheduleCard('${item.id}', this)" title="削除">✕</button>
      <div class="sched-month">${item.month_num}<small>${item.month_en}</small></div>
      <div>
        <p class="sched-title">${item.title}</p>
        <p class="sched-detail">${item.detail.replace(/\n/g, '<br>')}</p>
        <span class="${tagClass}">${tagLabel}</span>
      </div>`;

    list.insertBefore(card, list.firstChild);
  });
}

// ========== カードを削除する関数 (ギャラリー用) ==========
async function deleteCard(id, btn) {
  if (!isLoggedIn) {
    alert("ログインが必要です");
    return;
  }

  if (!confirm("本当にこの投稿を削除しますか？")) return;

  const { error } = await supabaseClient
    .from('gallery')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('削除エラー:', error);
    alert('削除に失敗しました');
    return;
  }

  const card = btn.closest('.gallery-card');
  card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  card.style.opacity = '0';
  card.style.transform = 'scale(0.95)';
  
  setTimeout(() => {
    card.remove();
  }, 300);
}

// ========== ページ読み込み時にすべてを同時に実行する ==========
document.addEventListener('DOMContentLoaded', () => {
  loadGallery();
  loadSchedules();
  loadNextEvent();
});