async function testConnection() {
  const { data, error } = await supabaseClient
    .from('gallery')
    .select('*');

  console.log('data:', data);
  console.log('error:', error);
}

testConnection();

// ========== 料理記録ギャラリーの読み込み ==========
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

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'gallery-card gallery-dynamic-card';
    
    card.innerHTML = `
      <div class="gallery-thumb" style="background:#f5ede4;">
        <button class="gallery-delete-btn" onclick="deleteCard('${item.id}', this)" title="削除">✕</button>
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
}

// ========== NEXT EVENT を自動判定して1件だけ読み込む ==========
async function loadNextEvent() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

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

  if (data) {
    const titleEl = document.querySelector('.next-title');
    if (titleEl) titleEl.innerHTML = data.title.replace(/\n/g, '<br>');

    const details = document.querySelectorAll('.next-detail');
    const setDetail = (el, label, val) => {
      if (el) el.innerHTML = `<strong>${label}</strong>${val || '—'}`;
    };

    setDetail(details[0], '日時', data.event_date);
    setDetail(details[1], '場所', data.place);
    setDetail(details[2], '定員', data.capacity);
    setDetail(details[3], '参加費', data.fee);
    setDetail(details[4], '持物', data.items);

    const noteEl = document.querySelector('.next-note');
    if (noteEl) noteEl.innerHTML = data.note.replace(/\n/g, '<br>');
  } else {
    console.log('今日以降に開催予定の NEXT EVENT は登録されていません。');
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

// ========== ページ読み込み時にすべてを同時に実行する ==========
document.addEventListener('DOMContentLoaded', () => {
  loadGallery();
  loadNextEvent();
  loadSchedules();
});

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