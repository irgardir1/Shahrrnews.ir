const categories = {
  all: "همه اخبار",
  political: "سیاسی",
  economic: "اقتصادی",
  sport: "ورزشی",
  science: "علمی",
  cultural: "فرهنگی و هنری",
  market: "بازار",
  cinema: "سینما و هنر",
  game: "بازی و گیم",
  international: "بین‌الملل"
};

const sources = {
  political: [
    { name: "خبرگزاری جمهوری اسلامی", url: "https://www.irna.ir/rss/tp/1" },
    { name: "خبرآنلاین - سیاسی", url: "https://www.khabaronline.ir/rss/tp/1" }
  ],
  economic: [
    { name: "اقتصاد آنلاین", url: "https://www.eghtesadonline.com/rss" },
    { name: "ایسنا - اقتصادی", url: "https://www.isna.ir/rss/tp/33" }
  ],
  sport: [
    { name: "ورزش سه", url: "https://www.varzesh3.com/rss" },
    { name: "خبرگزاری فارس - ورزشی", url: "https://www.farsnews.ir/rss/tp/6" }
  ],
  science: [
    { name: "ایسنا - علمی", url: "https://www.isna.ir/rss/tp/60" },
    { name: "خبرگزاری دانشجو - علمی", url: "https://www.isna.ir/rss/tp/180" }
  ],
  cultural: [
    { name: "خبرگزاری مهر - فرهنگی", url: "https://www.mehrnews.com/rss/tp/4" },
    { name: "ایسنا - فرهنگی", url: "https://www.isna.ir/rss/tp/5" }
  ],
  market: [
    { name: "بورس نیوز", url: "https://www.boursenews.ir/rss" },
    { name: "کالا نیوز", url: "https://www.kalanews.ir/rss" }
  ],
  cinema: [
    { name: "تسنیم - سینما", url: "https://www.tasnimnews.com/rss/tp/14" },
    { name: "ایمنا - سینما", url: "https://www.ayandnews.ir/rss/tp/18" }
  ],
  game: [
    { name: "دیجی‌رُند", url: "https://digi-rund.ir/feed/" },
    { name: "گیمگپ", url: "https://gamegap.ir/feed/" }
  ],
  international: [
    { name: "خبرگزاری جمهوری اسلامی - بین‌الملل", url: "https://www.irna.ir/rss/tp/7" },
    { name: "خبرآنلاین - بین‌الملل", url: "https://www.khabaronline.ir/rss/tp/3" }
  ]
};

let allNews = [];

function renderTabs() {
  const tabs = document.getElementById('category-tabs');
  Object.keys(categories).forEach(cat => {
    const btn = document.createElement('button');
    btn.className = cat === 'all' ? 'tab-btn active' : 'tab-btn';
    btn.textContent = categories[cat];
    btn.dataset.cat = cat;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderNews(cat);
    });
    tabs.appendChild(btn);
  });
}

function cleanText(html) {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function extractImage(desc) {
  const match = desc.match(/<img[^>]+src=["']([^"']+)["']/);
  return match ? match[1] : "";
}

async function loadNews() {
  allNews = [];
  const promises = [];

  for (const [catId, feeds] of Object.entries(sources)) {
    for (const feed of feeds) {
      promises.push(
        fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`)
          .then(res => res.ok ? res.json() : Promise.reject())
          .then(data => {
            if (data.status === "ok") {
              data.items.slice(0, 3).forEach(item => {
                allNews.push({
                  title: cleanText(item.title),
                  desc: cleanText(item.description),
                  link: item.link,
                  image: item.thumbnail || extractImage(item.description) || '',
                  category: catId
                });
              });
            }
          })
          .catch(() => {})
      );
    }
  }

  await Promise.allSettled(promises);
  renderNews('all');
  document.querySelector('.loading').style.display = 'none';
}

function renderNews(category) {
  const container = document.getElementById('news-container');
  const filtered = category === 'all' ? allNews : allNews.filter(n => n.category === category);
  
  if (filtered.length === 0) {
    container.innerHTML = `<p class="no-news">خبری یافت نشد.</p>`;
    return;
  }

  container.innerHTML = filtered.map(news => `
    <article class="news-card" data-link="${news.link}" data-title="${news.title}" data-image="${news.image}">
      ${news.image ? `<div class="news-img" style="background-image: url('${news.image}')"></div>` : ''}
      <div class="news-content">
        <span class="category-badge">${categories[news.category]}</span>
        <h3>${news.title}</h3>
        <p>${news.desc.substring(0, 130)}${news.desc.length > 130 ? "…" : ""}</p>
      </div>
    </article>
  `).join('');

  // افزودن event listener به کارت‌ها
  document.querySelectorAll('.news-card').forEach(card => {
    card.addEventListener('click', async () => {
      const link = card.dataset.link;
      const title = card.dataset.title;
      const image = card.dataset.image;

      openModal(link, title, image);
    });
  });
}

async function openModal(url, title, image) {
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');
  const originalLink = document.getElementById('original-link');

  modalTitle.textContent = title;
  originalLink.href = url;

  // نمایش لودر
  modalContent.innerHTML = '<div class="loader">در حال بارگذاری خبر...</div>';

  try {
    // درخواست به Proxy برای بارگذاری صفحه
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    if (data.contents) {
      // پاک‌سازی محتوا و نمایش
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');

      // حذف اسکریپت‌ها و استایل‌های غیرضروری
      const body = doc.body;
      body.querySelectorAll('script, style, iframe, noscript, header, footer, nav').forEach(el => el.remove());

      // تنظیم عنوان و تصویر
      if (image) {
        modalContent.innerHTML = `<img src="${image}" alt="تصویر خبر" class="modal-image"><br><br>`;
      } else {
        modalContent.innerHTML = '';
      }

      // اضافه کردن محتوای خبر
      modalContent.innerHTML += body.innerHTML;

      // تنظیمات ظاهری
      modalContent.style.padding = '20px';
      modalContent.style.lineHeight = '1.8';

      // حذف لینک‌های داخلی (تا کاربر از سایت شما خارج نشود)
      modalContent.querySelectorAll('a').forEach(a => {
        a.target = '_self';
        a.onclick = (e) => {
          e.preventDefault();
          openModal(a.href, a.textContent, '');
        };
      });

    } else {
      modalContent.innerHTML = '<p>خطا در بارگذاری خبر. لطفاً <a href="' + url + '" target="_blank">در سایت اصلی مشاهده کنید</a>.</p>';
    }

  } catch (error) {
    console.error('Error loading article:', error);
    modalContent.innerHTML = '<p>خطا در بارگذاری خبر. لطفاً <a href="' + url + '" target="_blank">در سایت اصلی مشاهده کنید</a>.</p>';
  }

  document.getElementById('modal-overlay').style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = "none";
  document.body.style.overflow = "auto";
}

document.addEventListener('DOMContentLoaded', () => {
  renderTabs();
  loadNews();
});
