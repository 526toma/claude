// モバイルメニュー開閉
function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('hidden');
}

// スクロールでメニューを閉じる
window.addEventListener('scroll', () => {
  const menu = document.getElementById('mobile-menu');
  if (!menu.classList.contains('hidden')) {
    menu.classList.add('hidden');
  }
});

// お問い合わせフォーム送信
function submitForm(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const company = document.getElementById('company').value.trim();
  const email = document.getElementById('email').value.trim();
  const category = document.getElementById('category').value;

  if (!name || !company || !email || !category) {
    alert('必須項目をすべて入力してください。');
    return;
  }

  // 送信成功UI
  const form = document.querySelector('.contact-form');
  const success = document.getElementById('form-success');
  const wrapper = document.querySelector('.contact-wrapper');

  wrapper.classList.add('hidden');
  success.classList.remove('hidden');

  // スクロール
  success.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ナビゲーションのアクティブ状態管理
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');

function updateActiveNav() {
  const scrollY = window.scrollY + 80;
  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    if (scrollY >= top && scrollY < top + height) {
      navLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === `#${id}`) {
          link.style.color = 'var(--primary)';
        }
      });
    }
  });
}

window.addEventListener('scroll', updateActiveNav);

// スクロールアニメーション（カードが画面に入ったときにフェードイン）
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.service-card, .advisor-card, .flow-step, .hero-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});
