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
  political: [{ name: "ایرنا", url: "https://www.irna.ir/rss/tp/1" }],
  economic: [{ name: "اقتصاد آنلاین", url: "https://www.eghtesadonline.com/rss" }],
  sport: [{ name: "ورزش سه", url: "https://www.varzesh3.com/rss" }],
  science: [{ name: "ایسنا - علمی", url: "https://www.isna.ir/rss/tp/60" }],
  cultural: [{ name: "مهر - فرهنگی", url: "https://www.mehrnews.com/rss/tp/4" }],
  market: [{ name: "بورس نیوز", url: "https://www.boursenews.ir/rss" }],
  cinema: [{ name: "تسنیم - سینما", url: "https://www.tasnimnews.com/rss/tp/14" }],
  game: [{ name: "گیم‌گپ", url: "https://gamegap.ir/feed/" }],
  international: [{ name: "ایرنا - بین‌الملل", url: "https://www.irna.ir/rss/tp/7" }]
};

// لوگوهای ثابت برای سایت‌های بدون تصویر
const siteLogos = {
  "ورزش سه": "https://www.varzesh3.com/images/logo.png",
  "اقتصاد آنلاین": "https://www.eghtesadonline.com/images/logo.png",
  "ایرنا": "https://www.irna.ir/images/logo.png",
  "ایسنا": "https://www.isna.ir/images/logo.png",
  "مهر": "https://www.mehrnews.com/images/logo.png",
  "تسنیم": "https://www.tasnimnews.com/images/logo.png",
  "بورس نیوز": "https://www.boursenews.ir/images/logo.png",
  "گیم‌گپ": "https://gamegap.ir/images/logo.png",
  default: "https://placehold.co/600x400?text=خبر+بدون+عکس&font=roboto"
};

function getSiteLogo(sourceName) {
  for (const key in siteLogos) {
    if (sourceName.includes(key)) {
      return siteLogos[key];
    }
  }
  return siteLogos.default;
}

function stripHTML(html) {
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return div.textContent || "";
}

async function loadNews() {
  const newsContainer = document.getElementById("news");
  newsContainer.innerHTML = "در حال بارگذاری...";

  let allItems = [];

  for (const [cat, feeds] of Object.entries(sources)) {
    for (const feed of feeds) {
      try {
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
        const data = await res.json();
        if (data.status === "ok") {
          data.items.forEach(item => {
            allItems.push({
              ...item,
              category: cat,
              sourceName: feed.name
            });
          });
        }
      } catch (e) {
        console.warn("خطا در:", feed.name);
      }
    }
  }

  allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  renderNews(allItems.slice(0, 30));
}

function renderNews(items) {
  const newsContainer = document.getElementById("news");
  newsContainer.innerHTML = "";

  items.forEach((item, idx) => {
    // تنظیم خبر فوری
    if (idx === 0 && document.getElementById("breaking")) {
      document.getElementById("breaking").textContent = "🔔 خبر فوری: " + stripHTML(item.title);
    }

    // تصویر: اگر RSS داد، استفاده کن؛ اگر نه، لوگوی سایت
    let imgUrl = item.thumbnail || 
                 (item.enclosure?.url) ||
                 getSiteLogo(item.sourceName);

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${imgUrl}" 
           onerror="this.src='https://placehold.co/600x400?text=بدون+عکس&font=roboto'"
           style="width:100%; height:180px; object-fit:cover;">
      <div class="content">
        <h3>${stripHTML(item.title)}</h3>
        <div class="meta">${item.sourceName}</div>
        <p>${stripHTML(item.description).substring(0, 120)}...</p>
        <a href="${item.link}" target="_blank">مشاهده خبر</a>
      </div>
    `;
    newsContainer.appendChild(card);
  });
}

// بارگذاری اولیه
document.addEventListener("DOMContentLoaded", () => {
  // منو ساده
  const catNav = document.getElementById("categories");
  if (catNav) {
    catNav.innerHTML = `<button onclick="loadNews()" class="active">همه اخبار</button>`;
  }
  loadNews();
});
