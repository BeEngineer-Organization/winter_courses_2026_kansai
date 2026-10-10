/* =========================================================
   演出（スクロールで現れる・数字のカウントアップ・雪・進捗バーなど）
   - <head> の小さなスクリプトが html に .js-motion を付けたときだけ動く
     （OSで「視差効果を減らす」を選んでいる人には付かない）
   - 隠す処理はこのファイルが行うので、読み込みに失敗しても内容は全部見える
   ========================================================= */
(() => {
  const root = document.documentElement;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- スクロール進捗バー（ヘッダー上端） ---------- */
  const header = document.querySelector(".site-header");
  if (header) {
    const bar = document.createElement("span");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    header.prepend(bar);
    let ticking = false;
    const update = () => {
      const max = root.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
      ticking = false;
    };
    addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  if (!root.classList.contains("js-motion") || !("IntersectionObserver" in window)) return;

  /* ---------- スクロールで現れる要素の登録 ---------- */
  // [セレクター, 動きの種類, 兄弟の中で順番に遅らせるか]
  const groups = [
    [".section-head > *", "up", true],
    [".campus-label", "left", false],
    [".course", "up", false],
    [".price-wrap", "up", false],
    [".price-table tbody tr", "right", true],
    [".apply-band", "zoom", false],
    [".filters > .filter", "up", true],
    [".session", "left", true],
    [".stripes", "draw", false],
  ];

  const targets = [];
  groups.forEach(([selector, type, stagger]) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.classList.add("rv");
      el.dataset.rv = type;
      if (stagger) el.style.setProperty("--i", [...el.parentElement.children].indexOf(el));
      targets.push(el);
    });
  });

  // 講座カード内の一覧は1行ずつ流れて出す
  document.querySelectorAll(".course .spec__row").forEach((row) => {
    row.style.setProperty("--j", [...row.parentElement.children].indexOf(row));
  });

  /* ---------- 数字のカウントアップ（料金） ---------- */
  const countUp = (el) => {
    if (el.dataset.counted) return;
    const node = [...el.childNodes].find((n) => n.nodeType === 3 && /\d/.test(n.textContent));
    if (!node) return;
    const original = node.textContent;
    const target = Number(original.replace(/[^\d]/g, ""));
    if (!target) return;
    el.dataset.counted = "true";
    const suffix = original.replace(/[\d,]+/, "{n}");
    const duration = 1000;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      node.textContent = suffix.replace("{n}", Math.round(target * eased).toLocaleString("ja-JP"));
      if (t < 1) requestAnimationFrame(step);
      else node.textContent = original;
    };
    requestAnimationFrame(step);
  };

  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add("is-in");
        el.querySelectorAll(".price, .spec__price").forEach((p) => setTimeout(() => countUp(p), 250));
        reveal.unobserve(el);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
  );
  targets.forEach((el) => reveal.observe(el));

  // ページ内リンクで飛んだ先は、待たずにすぐ表示する
  const showNow = (el) => {
    el.classList.add("is-in");
    el.querySelectorAll(".price, .spec__price").forEach(countUp);
    reveal.unobserve(el);
  };
  addEventListener("hashchange", () => {
    const dest = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!dest) return;
    targets.filter((el) => el === dest || el.contains(dest) || dest.contains(el)).forEach(showNow);
  });

  /* ---------- FVの雪 ---------- */
  const hero = document.querySelector(".hero");
  if (hero) {
    const canvas = document.createElement("canvas");
    canvas.className = "hero__snow";
    canvas.setAttribute("aria-hidden", "true");
    hero.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let flakes = [];
    let running = false;
    let raf = 0;

    const make = (initial) => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : -10,
      r: 1.2 + Math.random() * 2.8,
      vy: 0.35 + Math.random() * 0.75,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.005 + Math.random() * 0.012,
      // 白い雪と、明るい地でも見える水色の雪をまぜる
      color: Math.random() < 0.55 ? "rgba(255,255,255,0.9)" : "rgba(93,161,255,0.45)",
    });

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(70, Math.max(28, w / 22)));
      flakes = Array.from({ length: count }, () => make(true));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.sway += f.swaySpeed;
        f.y += f.vy;
        f.x += Math.sin(f.sway) * 0.4;
        if (f.y > h + 10) Object.assign(f, make(false));
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    const setRunning = (on) => {
      if (on === running) return;
      running = on;
      if (on) raf = requestAnimationFrame(draw);
      else cancelAnimationFrame(raf);
    };

    let heroVisible = true;
    new IntersectionObserver(([e]) => {
      heroVisible = e.isIntersecting;
      setRunning(heroVisible && !document.hidden);
    }).observe(hero);
    document.addEventListener("visibilitychange", () => setRunning(heroVisible && !document.hidden));
    let resizeTimer = 0;
    addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });
    resize();
    setRunning(true);
  }

  /* ---------- FVの写真がマウスの方へ少し傾く（PCのみ） ---------- */
  const media = document.querySelector(".hero__media");
  if (media && finePointer) {
    let raf = 0;
    hero.addEventListener("pointermove", (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        media.style.setProperty("--tx", `${(x * 10).toFixed(2)}px`);
        media.style.setProperty("--ty", `${(y * 8).toFixed(2)}px`);
        media.style.setProperty("--rx", `${(-y * 3).toFixed(2)}deg`);
        media.style.setProperty("--ry", `${(x * 4).toFixed(2)}deg`);
      });
    });
    hero.addEventListener("pointerleave", () => {
      ["--tx", "--ty", "--rx", "--ry"].forEach((p) => media.style.removeProperty(p));
    });
  }
})();
