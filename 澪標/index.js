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