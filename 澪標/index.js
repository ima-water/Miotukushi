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

['adminLoginModal','uploadModal'].forEach(id => {
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

  const card = document.createElement('div');
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