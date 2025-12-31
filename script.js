const categories = {
  all: "همه اخبار",
  economic: "اقتصادی",
  sport: "ورزشی",
  political: "سیاسی",
  cultural: "فرهنگی",
  international: "بین‌الملل",
  game: "بازی"
};

const sources = {
  economic: [{ name: "اقتصاد آنلاین", url: "https://www.eghtesadonline.com/rss" }],
  sport: [{ name: "ورزش سه", url: "https://www.varzesh3.com/rss" }],
  political: [{ name: "ایرنا", url: "https://www.irna.ir/rss/tp/1" }],
  cultural: [
    { name: "مهر", url: "https://www.mehrnews.com/rss/tp/4" },
    { name: "تسنیم", url: "https://www.tasnimnews.com/rss/tp/14" }
  ],
  international: [{ name: "خبرآنلاین - بین‌الملل", url: "https://www.khabaronline.ir/rss/tp/3" }],
  game: [{ name: "گیم‌گپ", url: "https://gamegap.ir/feed/" }]
};

const logos = {
  "اقتصاد آنلاین": "https://www.eghtesadonline.com/images/logo.png",
  "ورزش سه": "https://www.varzesh3.com/images/logo.png",
  "ایرنا": "https://www.irna.ir/images/logo.png",
  "مهر": "https://www.mehrnews.com/images/logo.png",
  "تسنیم": "https://www.tasnimnews.com/images/logo.png",
  "خبرآنلاین": "https://www.khabaronline.ir/images/logo.png",
  "گیم‌گپ": "https://gamegap.ir/images/logo.png"
};

function stripHTML(html) {
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return div.textContent || "";
}

function getLogo(sourceName) {
  for (const key in logos) {
    if (sourceName.includes(key)) return logos[key];
  }
  return "https://placehold.co/600x400?text=خبر&font=roboto";
}

async function loadCategory(catKey) {
  const newsEl = document.getElementById("news");
  newsEl.innerHTML = "در حال بارگذاری...";

  let items = [];
  const list = catKey === "all" 
    ? Object.values(sources).flat() 
    : sources[catKey] || [];

  for (const src of list) {
    try {
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(src.url)}`);
      const data = await res.json();
      if (data.status === "ok") {
        data.items.forEach(item => {
          item.sourceName = src.name;
          items.push(item);
        });
      }
    } catch (e) {
      console.warn("خطا در:", src.name);
    }
  }

  items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  
  if (catKey === "all" && items[0]) {
    document.getElementById("breaking").textContent = "🔔 خبر فوری: " + stripHTML(items[0].title);
  }

  renderNews(items.slice(0, 20));
}

function renderNews(items) {
  const newsEl = document.getElementById("news");
  newsEl.innerHTML = "";

  items.forEach(item => {
    const imgUrl = item.thumbnail || 
                   (item.enclosure?.url) ||
                   getLogo(item.sourceName);

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${imgUrl}" onerror="this.src='https://placehold.co/600x400?text=بدون+عکس&font=roboto'">
      <div class="content">
        <h3>${stripHTML(item.title)}</h3>
        <div class="meta">${item.sourceName}</div>
        <p>${stripHTML(item.description).substring(0, 140)}...</p>
        <a href="${item.link}" target="_blank">مشاهده خبر</a>
      </div>
    `;
    newsEl.appendChild(card);
  });
}

function initUI() {
  const catNav = document.getElementById("categories");
  Object.entries(categories).forEach(([key, label]) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    if (key === "all") btn.classList.add("active");
    btn.onclick = () => {
      document.querySelectorAll("#categories button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadCategory(key);
    };
    catNav.appendChild(btn);
  });
  loadCategory("all");
}

document.addEventListener("DOMContentLoaded", initUI);
