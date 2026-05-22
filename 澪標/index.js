  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 60));

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  function handleSubmit(e) {
    e.preventDefault();
    document.getElementById('modal').style.display = 'flex';
  }

  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav-links');
  hamburger.addEventListener('click', () => {
    const open = navLinks.style.display === 'flex';
    navLinks.style.cssText = open ? '' : 'display:flex;flex-direction:column;position:absolute;top:60px;left:0;right:0;background:rgba(253,248,242,0.97);backdrop-filter:blur(16px);padding:20px 24px;gap:6px;box-shadow:0 8px 24px rgba(92,61,46,0.1);';
  });

  document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) this.style.display = 'none';
  });
  document.addEventListener('click', (e) => {
  if (!nav.contains(e.target)) {
    navLinks.style.cssText = '';
    hamburger.setAttribute('aria-expanded', 'false');
  }
});
hamburger.addEventListener('click', () => {
  const open = navLinks.style.display === 'flex';
  hamburger.setAttribute('aria-expanded', String(!open));
  navLinks.style.cssText = open ? '' : '...';
});
// ========== ギャラリー「もっと見る」 ==========
let galleryExpanded = false;
function toggleGalleryMore() {
  const extras = document.querySelectorAll('.gallery-extra');
  const btn = document.getElementById('galleryMoreBtn');
  galleryExpanded = !galleryExpanded;
  extras.forEach((el) => {
    if (galleryExpanded) {
      el.classList.remove('hidden');
      el.classList.add('showing');
      setTimeout(() => observer.observe(el), 10);
    } else {
      el.classList.add('hidden');
      el.classList.remove('showing');
    }
  });
  btn.textContent = galleryExpanded ? '閉じる ↑' : 'もっと見る ↓';
}
/*
// ========== メンバーログイン ==========
const MEMBERS = [
  { id: 'soedaisaku', pass: 'miotsukushi2023' },
  { id: 'nakanomana',    pass: 'miotsukushi2023' },
];
*/

let isLoggedIn = false;

// ========== ログイン状態の維持（リロード対策） ==========
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session) {
    // Supabaseにログインの記憶が残っていれば、強制的にログイン状態にする
    isLoggedIn = true;
    document.body.classList.add('member-logged-in');
  } else {
    // 記憶がなければログアウト状態にする
    isLoggedIn = false;
    document.body.classList.remove('member-logged-in');
  }
});

function openAdminLogin() {
  if (isLoggedIn) {
    document.getElementById('uploadModal').style.display = 'flex';
    return;
  }
  document.getElementById('adminIdInput').value = '';
  document.getElementById('adminPassInput').value = '';
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('adminLoginModal').style.display = 'flex';
}

// 新しいログイン関数（Supabase認証版）
async function doAdminLogin() {
  const email = document.getElementById('adminIdInput').value.trim(); // ID入力欄をメールアドレスとして使う
  const pass  = document.getElementById('adminPassInput').value.trim();
  const err   = document.getElementById('loginError');

  // Supabaseに「この人あってる？」と聞きに行く
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: pass,
  });

  if (error) {
    console.error('ログイン失敗:', error.message);
    err.style.display = 'block';
    err.textContent = "メールアドレスまたはパスワードが違います";
    return;
  }

  // ログイン成功時の処理
  console.log('ログイン成功:', data.user);
  err.style.display = 'none';
  
  // ログイン状態を反映させる
  isLoggedIn = true; 
  document.body.classList.add('member-logged-in'); // メンバー専用UIを表示
  
  // モーダルを閉じて投稿画面へ
  document.getElementById('adminLoginModal').style.display = 'none';
  document.getElementById('uploadModal').style.display = 'flex';
}

document.getElementById('adminPassInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') doAdminLogin();
});

['adminLoginModal','uploadModal','addScheduleModal','editNextEventModal'].forEach(id => {
  document.getElementById(id).addEventListener('click', function(e) {
    if (e.target === this) this.style.display = 'none';
  });
});

// ========== 料理写真投稿（トリミング対応） ==========
let cropImage = null;
let cropOffsetX = 0, cropOffsetY = 0;
let cropScale = 1;
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let dragStartOffsetX = 0, dragStartOffsetY = 0;

function handlePhotoSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    const img = new Image();
    img.onload = function() {
      cropImage = img;
      cropScale = 1;
      cropOffsetX = 0;
      cropOffsetY = 0;
      document.getElementById('zoomSlider').value = 100;
      document.getElementById('zoomLabel').textContent = '100';
      document.getElementById('photoSelectArea').style.display = 'none';
      document.getElementById('cropArea').style.display = 'block';
      requestAnimationFrame(drawCrop);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function drawCrop() {
  const canvas = document.getElementById('cropCanvas');
  const viewport = document.getElementById('cropViewport');
  const W = viewport.clientWidth;
  const H = viewport.clientHeight;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const imgW = cropImage.naturalWidth;
  const imgH = cropImage.naturalHeight;
  const baseScale = Math.max(W / imgW, H / imgH);
  const scale = baseScale * (cropScale / 100);
  const drawW = imgW * scale;
  const drawH = imgH * scale;

  const x = (W - drawW) / 2 + cropOffsetX;
  const y = (H - drawH) / 2 + cropOffsetY;
  ctx.drawImage(cropImage, x, y, drawW, drawH);
}

function updateCrop() {
  cropScale = parseInt(document.getElementById('zoomSlider').value);
  document.getElementById('zoomLabel').textContent = cropScale;
  if (cropImage) drawCrop();
}

// ドラッグで移動（マウス）
const cropViewport = document.getElementById('cropViewport');
cropViewport.addEventListener('mousedown', e => {
  if (!cropImage) return;
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragStartOffsetX = cropOffsetX;
  dragStartOffsetY = cropOffsetY;
  cropViewport.style.cursor = 'grabbing';
});
window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  cropOffsetX = dragStartOffsetX + (e.clientX - dragStartX);
  cropOffsetY = dragStartOffsetY + (e.clientY - dragStartY);
  drawCrop();
});
window.addEventListener('mouseup', () => {
  isDragging = false;
  cropViewport.style.cursor = 'grab';
});

// タッチ対応（スマホ）
cropViewport.addEventListener('touchstart', e => {
  if (!cropImage || e.touches.length !== 1) return;
  isDragging = true;
  dragStartX = e.touches[0].clientX;
  dragStartY = e.touches[0].clientY;
  dragStartOffsetX = cropOffsetX;
  dragStartOffsetY = cropOffsetY;
}, { passive: true });
window.addEventListener('touchmove', e => {
  if (!isDragging || e.touches.length !== 1) return;
  cropOffsetX = dragStartOffsetX + (e.touches[0].clientX - dragStartX);
  cropOffsetY = dragStartOffsetY + (e.touches[0].clientY - dragStartY);
  drawCrop();
}, { passive: true });
window.addEventListener('touchend', () => { isDragging = false; });

function getCroppedDataUrl() {
  const OUTPUT_W = 600, OUTPUT_H = 450;
  const viewport = document.getElementById('cropViewport');
  const scaleRatio = OUTPUT_W / viewport.clientWidth;

  const out = document.createElement('canvas');
  out.width = OUTPUT_W;
  out.height = OUTPUT_H;
  const ctx = out.getContext('2d');

  const imgW = cropImage.naturalWidth;
  const imgH = cropImage.naturalHeight;
  const baseScale = Math.max(viewport.clientWidth / imgW, viewport.clientHeight / imgH);
  const scale = baseScale * (cropScale / 100);
  const drawW = imgW * scale * scaleRatio;
  const drawH = imgH * scale * scaleRatio;
  const x = (OUTPUT_W - drawW) / 2 + cropOffsetX * scaleRatio;
  const y = (OUTPUT_H - drawH) / 2 + cropOffsetY * scaleRatio;
  ctx.drawImage(cropImage, x, y, drawW, drawH);
  return out.toDataURL('image/jpeg', 0.9);
}

function closeUploadModal() {
  document.getElementById('uploadModal').style.display = 'none';
  cropImage = null;
  cropOffsetX = cropOffsetY = 0;
  cropScale = 1;
  document.getElementById('photoSelectArea').style.display = 'block';
  document.getElementById('cropArea').style.display = 'none';
  document.getElementById('uploadDish').value = '';
  document.getElementById('uploadMeta').value = '';
  document.getElementById('photoFileInput').value = '';
  document.getElementById('uploadError').style.display = 'none';
}

async function doUpload() {
  const dish = document.getElementById('uploadDish').value.trim();
  const meta = document.getElementById('uploadMeta').value.trim();
  const err  = document.getElementById('uploadError');

  if (!dish || !cropImage) { err.style.display = 'block'; return; }
  err.style.display = 'none';

  try {
    // 1. トリミングした画像を「データ」として取得
    const canvas = document.createElement('canvas'); // さっき直したところ！
    const OUTPUT_W = 600, OUTPUT_H = 450;
    canvas.width = OUTPUT_W; canvas.height = OUTPUT_H;
    const ctx = canvas.getContext('2d');
    
    // トリミング計算
    const viewport = document.getElementById('cropViewport');
    const scaleRatio = OUTPUT_W / viewport.clientWidth;
    const imgW = cropImage.naturalWidth;
    const imgH = cropImage.naturalHeight;
    const baseScale = Math.max(viewport.clientWidth / imgW, viewport.clientHeight / imgH);
    const scale = baseScale * (cropScale / 100);
    const drawW = imgW * scale * scaleRatio;
    const drawH = imgH * scale * scaleRatio;
    const x = (OUTPUT_W - drawW) / 2 + cropOffsetX * scaleRatio;
    const y = (OUTPUT_H - drawH) / 2 + cropOffsetY * scaleRatio;
    ctx.drawImage(cropImage, x, y, drawW, drawH);

    // 2. キャンバスからBlob（ファイルデータ）を作成
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    const fileName = `${Date.now()}.jpg`;

    // 3. Supabase Storageに画像をアップロード
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('gallery-images')
      .upload(fileName, blob);

    if (uploadError) throw uploadError;

    // 4. 画像のURLを取得
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from('gallery-images')
      .getPublicUrl(fileName);

    // 5. Supabaseのテーブル(gallery)に情報を保存
const { error: dbError } = await supabaseClient
  .from('gallery')
  .insert({
    dish_name: dish,    // ここを title から dish_name に変更！
    description: meta,
    image_url: publicUrl,
    date_str: "2026.05 MAY"
  });

    if (dbError) throw dbError;

    // 6. 成功したら画面を更新してモーダルを閉じる
    alert('保存しました！');
    location.reload(); // これで最新のデータを読み込み直します

  } catch (error) {
    console.error('保存エラー:', error);
    alert('保存に失敗しました: ' + error.message);
  }
}

  /*
  function deleteCard(btn) {
    if (!isLoggedIn) return;
    const card = btn.closest('.gallery-card');
    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    setTimeout(() => card.remove(), 300);
  }
    */

// ========== スケジュール管理 ==========

// --- 追加モーダルを開く ---
function openAddScheduleModal() {
  if (!isLoggedIn) return;
  document.getElementById('schedMonthInput').value = '';
  document.getElementById('schedTitleInput').value = '';
  document.getElementById('schedDetailInput').value = '';
  document.getElementById('schedTagInput').value = 'open';
  document.getElementById('addScheduleError').style.display = 'none';
  document.getElementById('addScheduleModal').style.display = 'flex';
}

// --- スケジュールカードを追加する（Supabase保存版） ---
async function doAddSchedule() {
  const monthVal  = document.getElementById('schedMonthInput').value;
  const title     = document.getElementById('schedTitleInput').value.trim();
  const detail    = document.getElementById('schedDetailInput').value.trim();
  const tagType   = document.getElementById('schedTagInput').value;
  const err       = document.getElementById('addScheduleError');

  if (!monthVal || !title || !detail) {
    err.style.display = 'block';
    return;
  }
  err.style.display = 'none';

  const [monthNum, monthEn] = monthVal.split('|');

  try {
    // 🔴 Supabase の schedules テーブルに保存
    const { error } = await supabaseClient
      .from('schedules')
      .insert({
        month_num: monthNum,
        month_en: monthEn,
        title: title,
        detail: detail,
        tag_type: tagType
      });

    if (error) throw error;

    alert('予定を追加しました！');
    location.reload(); // 再読み込みして最新の予定を表示

  } catch (error) {
    console.error('スケジュール保存エラー:', error);
    alert('保存に失敗しました: ' + error.message);
  }
}

// --- スケジュールカードを削除する（Supabase連動版） ---
async function deleteScheduleCard(idOrBtn, btn) {
  if (!isLoggedIn) return;

  if (typeof idOrBtn === 'string') {
    // 🔴 データベースから追加された動的カードの削除
    if (!confirm("この予定を削除しますか？")) return;
    
    const { error } = await supabaseClient
      .from('schedules')
      .delete()
      .eq('id', idOrBtn);

    if (error) {
      alert('削除に失敗しました');
      return;
    }
    const card = btn.closest('.schedule-card');
    card.remove();
  } else {
    // もともと HTML に直書きされているカードの削除（画面上から消すだけ）
    const card = idOrBtn.closest('.schedule-card');
    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.97)';
    setTimeout(() => card.remove(), 300);
  }
}
// ========== NEXT EVENT 編集 ==========

// --- 編集モーダルを開く（現在の値をフォームに読み込む） ---
function openEditNextEventModal() {
  if (!isLoggedIn) return;

  const details = document.querySelectorAll('.next-detail');
  const getValue = (el) => el ? el.textContent.replace(/^.+?\s/, '').trim() : '';

  document.getElementById('nextTitleInput').value =
    document.querySelector('.next-title') ? document.querySelector('.next-title').innerHTML.replace(/<br>/g, '\n').trim() : '';
  document.getElementById('nextDateInput').value  = getValue(details[0]);
  document.getElementById('nextPlaceInput').value = getValue(details[1]);
  document.getElementById('nextCapInput').value   = getValue(details[2]);
  document.getElementById('nextFeeInput').value   = getValue(details[3]);
  document.getElementById('nextItemsInput').value = getValue(details[4]);
  document.getElementById('nextNoteInput').value  =
    document.querySelector('.next-note') ? document.querySelector('.next-note').innerText.trim() : '';
    
  // カレンダー入力は毎回新しく選んでもらうため空にする
  document.getElementById('nextTargetDateInput').value = '';

  document.getElementById('editNextEventError').style.display = 'none';
  document.getElementById('editNextEventModal').style.display = 'flex';
}

// --- NEXT EVENT を新規追加する（一番近い未来のものを自動表示させるためINSERTにする） ---
async function doEditNextEvent() {
  const title  = document.getElementById('nextTitleInput').value.trim();
  const date   = document.getElementById('nextDateInput').value.trim();
  const target = document.getElementById('nextTargetDateInput').value; // 追加
  const place  = document.getElementById('nextPlaceInput').value.trim();
  const cap    = document.getElementById('nextCapInput').value.trim();
  const fee    = document.getElementById('nextFeeInput').value.trim();
  const items  = document.getElementById('nextItemsInput').value.trim();
  const note   = document.getElementById('nextNoteInput').value.trim();
  const err    = document.getElementById('editNextEventError');

  // カレンダーの日付選択も必須チェックに含める
  if (!title || !date || !target) { err.style.display = 'block'; return; }
  err.style.display = 'none';

  try {
    // 🔴 過去データを残したまま、今日以降を絞り込めるように insert で新規追加する
    const { error } = await supabaseClient
      .from('next_event')
      .insert({
        id: Math.floor(Math.random() * 1000000), // 👈 100万以下のランダムな数字に変更！
        title: title,
        event_date: date,
        target_date: target, // カレンダー日付を保存
        place: place,
        capacity: cap,
        fee: fee,
        items: items,
        note: note
      });

    if (error) throw error;

    alert('活動予定を新しく保存しました！');
    location.reload(); // リロードして最新状態に自動更新

  } catch (error) {
    console.error('保存エラー:', error);
    alert('保存に失敗しました: ' + error.message);
  }
}
// ========== ログアウト処理 ==========
async function doLogout() {
  // 間違えて押した時のために確認を出す
  if (!confirm("ログアウトしますか？")) return;

  // 🔴 supabase ではなく supabaseClient を使うように修正！
  const { error } = await supabaseClient.auth.signOut();
  
  if (error) {
    console.error('ログアウトエラー:', error);
    alert('ログアウトに失敗しました');
    return;
  }
  
  // ログアウト状態に戻す
  isLoggedIn = false;
  document.body.classList.remove('member-logged-in');
  
  // ページをリロードして、画面の表示（編集ボタンなど）を完全にリセットする
  location.reload(); 
}