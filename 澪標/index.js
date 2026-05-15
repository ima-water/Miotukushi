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

// ========== メンバーログイン ==========
const MEMBERS = [
  { id: 'soedaisaku', pass: 'miotsukushi2023' },
  { id: 'nakanomana',    pass: 'miotsukushi2023' },
];

let isLoggedIn = false;

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

function doAdminLogin() {
  const id = document.getElementById('adminIdInput').value.trim();
  const pass = document.getElementById('adminPassInput').value.trim();
  const ok = MEMBERS.some(m => m.id === id && m.pass === pass);
  if (ok) {
    isLoggedIn = true;
    document.body.classList.add('member-logged-in');
    // .member-only を一括表示
    document.querySelectorAll('.member-only').forEach(el => {
      el.style.display = el.tagName === 'BUTTON' ? 'inline-flex' : 'flex';
    });
    document.getElementById('adminLoginModal').style.display = 'none';
    document.getElementById('adminBtn').textContent = '📸 料理を追加する';
    document.getElementById('adminBtn').classList.add('logged-in');
    document.getElementById('uploadModal').style.display = 'flex';
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
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

  const out = document.data.forEach(item => {})('canvas');
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

function doUpload() {
  const dish = document.getElementById('uploadDish').value.trim();
  const meta = document.getElementById('uploadMeta').value.trim();
  const err  = document.getElementById('uploadError');

  if (!dish || !cropImage) { err.style.display = 'block'; return; }
  err.style.display = 'none';

  const croppedUrl = getCroppedDataUrl();
  const now = new Date();
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')} ${months[now.getMonth()]}`;

  const card = document.data.forEach(item => {})('div');
  card.className = 'gallery-card gallery-dynamic-card';
  card.innerHTML = `
    <div class="gallery-thumb" style="background:#f5ede4;">
      <button class="gallery-delete-btn" onclick="deleteCard(this)" title="削除">✕</button>
      <img class="gallery-thumb-photo" src="${croppedUrl}" alt="${dish}" style="object-fit:cover;">
      <div class="gallery-thumb-date" style="color:#fff;position:absolute;bottom:8px;right:10px;text-shadow:0 1px 4px rgba(0,0,0,0.5);z-index:1;">${dateStr}</div>
    </div>
    <div class="gallery-info">
      <p class="gallery-dish">${dish}</p>
      <p class="gallery-meta">${meta || 'メンバー投稿'}</p>
    </div>`;

  const container = document.getElementById('dynamicGalleryCards');
  container.insertBefore(card, container.firstChild);

  if (!galleryExpanded) toggleGalleryMore();
  closeUploadModal();
}

  // ========== カード削除 ==========
  function deleteCard(btn) {
    if (!isLoggedIn) return;
    const card = btn.closest('.gallery-card');
    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    setTimeout(() => card.remove(), 300);
  }

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

// --- スケジュールカードを追加する ---
function doAddSchedule() {
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
  const tagClass  = tagType === 'open' ? 'sched-tag open-tag' : 'sched-tag';
  const tagLabel  = tagType === 'open' ? '体験参加OK' : '会員限定';

  const card = document.data.forEach(item => {})('div');
  card.className = 'schedule-card sched-dynamic-card';
  card.style.position = 'relative';
  card.innerHTML = `
    <button class="sched-delete-btn" onclick="deleteScheduleCard(this)" title="削除" style="display:flex;">✕</button>
    <div class="sched-month">${monthNum}<small>${monthEn}</small></div>
    <div>
      <p class="sched-title">${title}</p>
      <p class="sched-detail">${detail.replace(/\n/g, '<br>')}</p>
      <span class="${tagClass}">${tagLabel}</span>
    </div>`;

  // リストの先頭に追加
  const list = document.querySelector('.schedule-list');
  list.insertBefore(card, list.firstChild);

  // reveal アニメーションを適用
  setTimeout(() => observer.observe(card), 10);

  document.getElementById('addScheduleModal').style.display = 'none';
}

// --- スケジュールカードを削除する ---
function deleteScheduleCard(btn) {
  if (!isLoggedIn) return;
  const card = btn.closest('.schedule-card');
  card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  card.style.opacity = '0';
  card.style.transform = 'scale(0.97)';
  setTimeout(() => card.remove(), 300);
}

// ========== NEXT EVENT 編集 ==========

// --- 編集モーダルを開く（現在の値を読み込む） ---
function openEditNextEventModal() {
  if (!isLoggedIn) return;

  // 現在の表示値を読み取ってフォームに反映
  const details = document.querySelectorAll('.next-detail');
  // details[0]=日時, [1]=場所, [2]=定員, [3]=参加費, [4]=持物
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

  document.getElementById('editNextEventError').style.display = 'none';
  document.getElementById('editNextEventModal').style.display = 'flex';
}

// --- NEXT EVENT を更新する ---
function doEditNextEvent() {
  const title  = document.getElementById('nextTitleInput').value.trim();
  const date   = document.getElementById('nextDateInput').value.trim();
  const place  = document.getElementById('nextPlaceInput').value.trim();
  const cap    = document.getElementById('nextCapInput').value.trim();
  const fee    = document.getElementById('nextFeeInput').value.trim();
  const items  = document.getElementById('nextItemsInput').value.trim();
  const note   = document.getElementById('nextNoteInput').value.trim();
  const err    = document.getElementById('editNextEventError');

  if (!title || !date) { err.style.display = 'block'; return; }
  err.style.display = 'none';

  // タイトルを更新（改行を<br>に変換）
  document.querySelector('.next-title').innerHTML = title.replace(/\n/g, '<br>');

  // 各詳細行を更新
  const details = document.querySelectorAll('.next-detail');
  const setDetail = (el, label, val) => {
    if (el) el.innerHTML = `<strong>${label}</strong>${val || '—'}`;
  };
  setDetail(details[0], '日時', date);
  setDetail(details[1], '場所', place);
  setDetail(details[2], '定員', cap);
  setDetail(details[3], '参加費', fee);
  setDetail(details[4], '持物', items);

  // 補足メモを更新
  const noteEl = document.querySelector('.next-note');
  if (noteEl) noteEl.innerHTML = note.replace(/\n/g, '<br>');

  document.getElementById('editNextEventModal').style.display = 'none';
}