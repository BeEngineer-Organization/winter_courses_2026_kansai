/* =========================================================
   ハロウィン仕様（?theme=halloween のときだけ読み込まれる）
   1. 黒い画面に、カボチャのお化けの目と口だけが白く浮かんで笑う
   2. 黒い画面がコウモリになって飛び立ち、はがれるようにLPが現れる
   3. その後はFVにコウモリとカボチャの飾りを残す
   - 視差効果を減らす設定の人には 1・2 を出さず、飾りも動かさない
   - パラメータの判定は index.html の <head> 内スクリプト
   ========================================================= */
(() => {
  window.__hwStarted = true;
  const root = document.documentElement;

  const BAT_PATH =
    "M32 9L29 4l-1 6C24 6 16 4 2 8c6 3 8 8 7 14 4-3 9-3 11 2 3-4 7-3 8 2l4 4 4-4c1-5 5-6 8-2 2-5 7-5 11-2-1-6 1-11 7-14-14-4-22-2-26 2l-1-6z";

  const batSvg = () =>
    `<svg viewBox="0 0 64 32" aria-hidden="true" focusable="false"><path d="${BAT_PATH}" /></svg>`;

  // カボチャのお化け（ジャック・オ・ランタン）
  const pumpkinSvg = () => `
    <svg class="hw-pumpkin__svg" viewBox="0 0 200 190" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="hw-body" cx="45%" cy="40%" r="70%">
          <stop offset="0" stop-color="#ffa646" />
          <stop offset="0.6" stop-color="#ff7a1a" />
          <stop offset="1" stop-color="#c94f05" />
        </radialGradient>
        <radialGradient id="hw-fire" cx="50%" cy="50%" r="60%">
          <stop offset="0" stop-color="#fff6b0" />
          <stop offset="0.55" stop-color="#ffd23f" />
          <stop offset="1" stop-color="#ff9a00" />
        </radialGradient>
      </defs>
      <path d="M96 38c-2-14 2-24 14-32l8 6c-9 6-12 14-11 26z" fill="#4a7a1f" />
      <path d="M108 20c10-6 22-4 30 4-10 0-18 2-24 8z" fill="#6aa82b" />
      <ellipse cx="62" cy="112" rx="46" ry="68" fill="#d9600b" />
      <ellipse cx="138" cy="112" rx="46" ry="68" fill="#d9600b" />
      <ellipse cx="100" cy="112" rx="58" ry="72" fill="url(#hw-body)" />
      <ellipse cx="44" cy="112" rx="30" ry="62" fill="url(#hw-body)" />
      <ellipse cx="156" cy="112" rx="30" ry="62" fill="url(#hw-body)" />
      <path d="M100 44c-8 20-8 116 0 138M70 50c-14 24-14 104 0 128M130 50c14 24 14 104 0 128" fill="none" stroke="#b84a03" stroke-width="3" opacity=".5" />
      <g class="hw-pumpkin__brows" fill="#3a1500">
        <path d="M50 70l34 10-2 6-34-8z" />
        <path d="M150 70l-34 10 2 6 34-8z" />
      </g>
      <g class="hw-pumpkin__eyes" fill="url(#hw-fire)">
        <path d="M54 84l30 8-22 22z" />
        <path d="M146 84l-30 8 22 22z" />
      </g>
      <path class="hw-pumpkin__nose" d="M100 108l-8 14h16z" fill="url(#hw-fire)" />
      <path class="hw-pumpkin__mouth" fill="url(#hw-fire)"
        d="M44 128c16 10 36 14 56 14s40-4 56-14c-4 22-14 36-28 42l-6-12-8 14-14-4-14 4-8-14-6 12c-14-6-24-20-28-42z" />
    </svg>`;

  // 黒い画面に浮かぶ、目と口だけの顔（カボチャのお化けの顔の部分）
  const faceSvg = () => `
    <svg class="hw-face" viewBox="36 74 128 104" aria-hidden="true" focusable="false">
      <g class="hw-pumpkin__eyes">
        <path d="M54 84l30 8-22 22z" />
        <path d="M146 84l-30 8 22 22z" />
      </g>
      <path class="hw-pumpkin__mouth"
        d="M44 128c16 10 36 14 56 14s40-4 56-14c-4 22-14 36-28 42l-6-12-8 14-14-4-14 4-8-14-6 12c-14-6-24-20-28-42z" />
    </svg>`;

  // クモ（＝プログラムの「バグ」）
  const spiderSvg = () => `
    <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <g fill="none" stroke="#1a1024" stroke-width="2" stroke-linecap="round">
        <path d="M16 20c-5-3-8-7-10-12M16 22c-6-1-10-3-13-6M16 24c-6 1-10 4-12 9M17 26c-4 3-6 7-7 11" />
        <path d="M24 20c5-3 8-7 10-12M24 22c6-1 10-3 13-6M24 24c6 1 10 4 12 9M23 26c4 3 6 7 7 11" />
      </g>
      <ellipse cx="20" cy="25" rx="7" ry="8" fill="#1a1024" />
      <circle cx="20" cy="15" r="5" fill="#1a1024" />
      <circle cx="18" cy="14" r="1.4" fill="#ff5a3c" />
      <circle cx="22" cy="14" r="1.4" fill="#ff5a3c" />
    </svg>`;

  // 角に張るクモの巣（左上が角。右側に置くときは CSS で反転）
  const webSvg = () => {
    const spokes = [0, 15, 30, 45, 60, 75, 90].map((deg) => (deg * Math.PI) / 180);
    const lines = spokes.map((a) => `M0 0L${(Math.cos(a) * 120).toFixed(1)} ${(Math.sin(a) * 120).toFixed(1)}`).join("");
    const rings = [22, 42, 62, 82, 102]
      .map((r) => {
        let d = "";
        spokes.forEach((a, i) => {
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (i === 0) {
            d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
          } else {
            // 隣の糸との間を、少したるませてつなぐ
            const mid = (a + spokes[i - 1]) / 2;
            const sag = r * 0.86;
            d += `Q${(Math.cos(mid) * sag).toFixed(1)} ${(Math.sin(mid) * sag).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
          }
        });
        return d;
      })
      .join("");
    return `<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false"><path d="${lines}${rings}" /></svg>`;
  };

  const ready = (fn) => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn, { once: true }) : fn());

  const cssLoaded = () =>
    new Promise((resolve) => {
      const link = document.getElementById("hw-css");
      if (!link || link.sheet) return resolve();
      link.addEventListener("load", resolve, { once: true });
      link.addEventListener("error", resolve, { once: true });
      setTimeout(resolve, 2500);
    });

  /* ---------- タップしたときの小道具 ---------- */
  const canPlay = () => root.classList.contains("js-motion");

  // 画面上の位置に、ひとこと吹き出しを出す
  const say = (text, x, y) => {
    const bubble = document.createElement("span");
    bubble.className = "hw-say";
    bubble.setAttribute("aria-hidden", "true");
    bubble.textContent = text;
    bubble.style.cssText = `left:${x}px;top:${y}px`;
    document.body.appendChild(bubble);
    setTimeout(() => bubble.remove(), 1400);
  };

  // 包み紙のアメ
  const CANDY_COLORS = ["#ff7a1a", "#8b4fd6", "#3fb04d", "#ff5fa2", "#ffd23f", "#18acf4"];
  const candySvg = (color) => `
    <svg viewBox="0 0 40 20" aria-hidden="true" focusable="false">
      <path d="M10 10L1 3v14z M30 10l9-7v14z" fill="${color}" opacity=".75" />
      <ellipse cx="20" cy="10" rx="11" ry="8" fill="${color}" />
      <path d="M13 6c3 2 11 2 14 0" stroke="#fff" stroke-width="2" fill="none" opacity=".6" stroke-linecap="round" />
    </svg>`;

  // タップした位置から、お菓子がはじけ飛ぶ
  const candyBurst = (x, y) => {
    const box = document.createElement("div");
    box.className = "hw-candies";
    box.setAttribute("aria-hidden", "true");
    document.body.appendChild(box);
    let last = 0;
    for (let i = 0; i < 12; i += 1) {
      const candy = document.createElement("span");
      candy.className = "hw-candy";
      candy.innerHTML = candySvg(CANDY_COLORS[i % CANDY_COLORS.length]);
      box.appendChild(candy);
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
      const power = 90 + Math.random() * 110;
      const dx = Math.cos(angle) * power;
      const peak = Math.sin(angle) * power;
      const spin = (Math.random() - 0.5) * 720;
      const duration = 900 + Math.random() * 500;
      last = Math.max(last, duration);
      candy.animate(
        [
          { transform: `translate(${x}px, ${y}px) scale(.4) rotate(0deg)`, opacity: 1 },
          { transform: `translate(${x + dx * 0.6}px, ${y + peak}px) scale(1) rotate(${spin * 0.5}deg)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${x + dx}px, ${y + peak + 160}px) scale(.9) rotate(${spin}deg)`, opacity: 0 },
        ],
        { duration, easing: "cubic-bezier(.2, .7, .4, 1)", fill: "forwards" }
      );
    }
    setTimeout(() => box.remove(), last + 50);
  };

  const centerOf = (el) => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2, r];
  };

  // FVの飾りをタップしたときの反応
  const bindDecorations = () => {
    // 写真の角のカボチャ：弾んでお菓子をばらまく
    const peek = document.querySelector(".hw-peek");
    if (peek && !peek.dataset.bound) {
      peek.dataset.bound = "1";
      peek.addEventListener("click", () => {
        if (!canPlay()) return;
        const [x, y] = centerOf(peek);
        candyBurst(x, y);
        peek.animate(
          [
            { transform: "scale(1) rotate(0deg)" },
            { transform: "scale(1.25, .8) rotate(-8deg)", offset: 0.25 },
            { transform: "scale(.9, 1.15) rotate(8deg)", offset: 0.55 },
            { transform: "scale(1) rotate(0deg)" },
          ],
          { duration: 520, easing: "ease-out", composite: "add" }
        );
      });
    }

    // 巣のクモ：あわてて巣に逃げ込み、少ししてから戻ってくる
    const hang = document.querySelector(".hw-hang");
    if (hang && !hang.dataset.bound) {
      hang.dataset.bound = "1";
      let busy = false;
      hang.addEventListener("click", () => {
        if (!canPlay() || busy) return;
        busy = true;
        const thread = hang.querySelector(".hw-hang__thread");
        const body = hang.querySelector("svg");
        const [x, , r] = centerOf(body);
        say("にげろ〜！", x, r.top - 8);
        const up = thread.offsetHeight;
        const timing = { duration: 3200, easing: "ease-in-out" };
        thread.animate(
          [
            { transform: "scaleY(1)" },
            { transform: "scaleY(.05)", offset: 0.12 },
            { transform: "scaleY(.05)", offset: 0.7 },
            { transform: "scaleY(1)" },
          ],
          timing
        );
        body.animate(
          [
            { transform: "translateY(0)" },
            { transform: `translateY(${-up}px)`, offset: 0.12 },
            { transform: `translateY(${-up}px) rotate(12deg)`, offset: 0.4 },
            { transform: `translateY(${-up}px) rotate(-12deg)`, offset: 0.55 },
            { transform: `translateY(${-up}px)`, offset: 0.7 },
            { transform: "translateY(0)" },
          ],
          timing
        ).onfinish = () => {
          busy = false;
        };
      });
    }

    // FVを飛ぶコウモリ：びっくりして上へ逃げ、しばらくしてまた飛んでくる
    // コウモリは文字の後ろを飛んでいるので、FVの何もない所をタップしたときに、その位置にいるコウモリを探す
    // （リンクやボタンの上は対象外。申込ボタンの操作を邪魔しない）
    const hero = document.querySelector(".hero");
    if (hero && !hero.dataset.batBound) {
      hero.dataset.batBound = "1";
      hero.addEventListener("click", (e) => {
        if (!canPlay() || e.target.closest("a, button, .hw-peek, .hw-hang")) return;
        const hit = [...hero.querySelectorAll(".hw-deco__bat:not(.is-scared)")].find((bat) => {
          const r = bat.getBoundingClientRect();
          const pad = 14;
          return e.clientX > r.left - pad && e.clientX < r.right + pad && e.clientY > r.top - pad && e.clientY < r.bottom + pad;
        });
        if (hit) scareBat(hit);
      });
    }
    function scareBat(bat) {
      const [x, , r] = centerOf(bat);
      say("キィッ！", x, r.top - 6);
      const from = getComputedStyle(bat).transform;
      bat.classList.add("is-scared"); // 横切るアニメーションを止める
      const base = from === "none" ? "" : from;
      bat.animate(
        [
          { transform: `${base} scale(1)` },
          { transform: `${base} translate(0, 6px) scale(1.3)`, offset: 0.15 },
          { transform: `${base} translate(${(Math.random() - 0.5) * 240}px, -420px) scale(.6)` },
        ],
        { duration: 900, easing: "cubic-bezier(.5, 0, .9, .5)", fill: "forwards" }
      ).onfinish = (e) => {
        setTimeout(() => {
          e.target.cancel();
          bat.classList.remove("is-scared"); // 画面の外から、また横切り始める
        }, 6000);
      };
    }
  };

  /* ---------- 演出のあとに残す飾り ---------- */
  const decorate = () => {
    const hero = document.querySelector(".hero");
    const media = document.querySelector(".hero__media");
    if (hero && !hero.querySelector(".hw-deco")) {
      const deco = document.createElement("div");
      deco.className = "hw-deco";
      deco.setAttribute("aria-hidden", "true");
      deco.innerHTML = [1, 2, 3, 4, 5].map((n) => `<span class="hw-deco__bat hw-deco__bat--${n}">${batSvg()}</span>`).join("");
      hero.appendChild(deco);
    }
    if (hero && !hero.querySelector(".hw-web")) {
      hero.insertAdjacentHTML(
        "beforeend",
        `<div class="hw-web hw-web--left" aria-hidden="true">${webSvg()}</div>
         <div class="hw-web hw-web--right" aria-hidden="true">${webSvg()}
           <span class="hw-hang"><span class="hw-hang__thread"></span>${spiderSvg()}</span>
         </div>`
      );
    }
    const footer = document.querySelector(".site-footer");
    if (footer && !footer.querySelector(".hw-web")) {
      footer.style.position = "relative";
      footer.insertAdjacentHTML(
        "beforeend",
        `<div class="hw-web hw-web--left hw-web--small" aria-hidden="true">${webSvg()}</div>
         <div class="hw-web hw-web--right hw-web--small" aria-hidden="true">${webSvg()}</div>`
      );
    }
    if (media && !media.querySelector(".hw-peek")) {
      const peek = document.createElement("div");
      peek.className = "hw-peek";
      peek.setAttribute("aria-hidden", "true");
      peek.innerHTML = pumpkinSvg();
      media.appendChild(peek);
    }
    bindDecorations();
  };

  /* ---------- LP内のちょっとした仕掛け（各1回だけ） ----------
     講習会紹介：右端からカボチャがひょこっと出る
     料金      ：コウモリの群れが斜めに横切る
     スケジュール：左端からカボチャがひょこっと出る
     フッター  ：コウモリの群れが逆の斜めに横切る */
  const motionOK = () => root.classList.contains("js-motion") && !root.classList.contains("is-modal-open");

  const peekPumpkin = (side) => {
    const pop = document.createElement("div");
    pop.className = `hw-pop hw-pop--${side}`;
    pop.setAttribute("aria-hidden", "true");
    pop.innerHTML = pumpkinSvg();
    document.body.appendChild(pop);
    const sign = side === "right" ? 1 : -1;
    const off = `translateX(${sign * 120}%) rotate(${sign * 30}deg)`;
    const on = `translateX(${sign * 30}%) rotate(${sign * -16}deg)`;
    const tilt = `translateX(${sign * 30}%) rotate(${sign * -4}deg)`;
    const anim = pop.animate(
      [
        { transform: off },
        { transform: on, offset: 0.12, easing: "ease-out" },
        { transform: tilt, offset: 0.3 },
        { transform: on, offset: 0.48 },
        { transform: tilt, offset: 0.66 },
        { transform: on, offset: 0.86, easing: "ease-in" },
        { transform: off },
      ],
      { duration: 3800, easing: "cubic-bezier(.3, 1.4, .5, 1)" }
    );
    // タップすると、お菓子をばらまいて、あわてて引っ込む
    pop.addEventListener("click", () => {
      const [x, y] = centerOf(pop);
      candyBurst(x, y);
      anim.cancel();
      pop.animate([{ transform: on }, { transform: off }], { duration: 260, easing: "ease-in", fill: "forwards" }).onfinish = () => pop.remove();
    }, { once: true });
    anim.onfinish = () => pop.remove();
  };

  const batFlock = (direction) => {
    const flock = document.createElement("div");
    flock.className = "hw-flock";
    flock.setAttribute("aria-hidden", "true");
    document.body.appendChild(flock);
    const w = innerWidth;
    const h = innerHeight;
    const count = w < 720 ? 10 : 16;
    let last = 0;
    for (let i = 0; i < count; i += 1) {
      const bat = document.createElement("span");
      bat.className = "hw-flock__bat";
      bat.innerHTML = batSvg();
      const size = 20 + Math.random() * 26;
      bat.style.width = `${size}px`;
      flock.appendChild(bat);
      // 群れの中で少しずつ位置をずらす
      const spreadX = (Math.random() - 0.5) * w * 0.5;
      const spreadY = (Math.random() - 0.5) * h * 0.35;
      const fromX = direction === "up" ? -80 + spreadX * 0.3 : w + 80 + spreadX * 0.3;
      const toX = direction === "up" ? w + 120 + spreadX : -120 + spreadX;
      const fromY = h * 0.85 + spreadY;
      const toY = -100 + spreadY;
      const flip = direction === "up" ? "" : " scaleX(-1)";
      const delay = Math.random() * 700;
      const duration = 2200 + Math.random() * 1200;
      last = Math.max(last, delay + duration);
      bat.animate(
        [
          { transform: `translate(${fromX}px, ${fromY}px)${flip}` },
          { transform: `translate(${(fromX + toX) / 2}px, ${(fromY + toY) / 2 + (Math.random() - 0.5) * 80}px)${flip}`, offset: 0.5 },
          { transform: `translate(${toX}px, ${toY}px)${flip}` },
        ],
        { duration, delay, easing: "ease-in-out", fill: "backwards" }
      );
    }
    setTimeout(() => flock.remove(), last + 100);
  };

  /* ---------- 時々ヘッダーの下から降りてくるクモ（タップで「バグ発見！」） ---------- */
  const BUG_LINES = ["バグ発見！", "またバグ！", "デバッグ完了！"];
  let bugsSquashed = 0;

  const dropSpider = () => {
    const header = document.querySelector(".site-header");
    const top = header ? header.getBoundingClientRect().bottom : 0;
    const narrow = innerWidth < 720;
    const length = (narrow ? 110 : 150) + Math.random() * (narrow ? 90 : 120);
    const x = innerWidth * (0.12 + Math.random() * 0.76);

    const drop = document.createElement("div");
    drop.className = "hw-drop";
    drop.setAttribute("aria-hidden", "true");
    drop.style.cssText = `left:${x}px;top:${top}px`;
    drop.innerHTML = `<span class="hw-drop__thread" style="height:${length}px"></span>
      <span class="hw-drop__spider" style="top:${length - 6}px">${spiderSvg()}</span>`;
    document.body.appendChild(drop);
    const thread = drop.querySelector(".hw-drop__thread");
    const spider = drop.querySelector(".hw-drop__spider");

    const timing = { duration: 6200, fill: "forwards" };
    const runs = [
      // 糸が伸びて降り、しばらくぶら下がって、また登っていく
      thread.animate(
        [
          { transform: "scaleY(0)" },
          { transform: "scaleY(1.04)", offset: 0.2, easing: "ease-out" },
          { transform: "scaleY(1)", offset: 0.26 },
          { transform: "scaleY(1)", offset: 0.78, easing: "ease-in" },
          { transform: "scaleY(0)" },
        ],
        timing
      ),
      spider.animate(
        [
          { transform: `translateY(${-length}px)` },
          { transform: `translateY(${length * 0.04}px)`, offset: 0.2, easing: "ease-out" },
          { transform: "translateY(0)", offset: 0.26 },
          { transform: "translateY(0)", offset: 0.78, easing: "ease-in" },
          { transform: `translateY(${-length}px)` },
        ],
        timing
      ),
      // ぶら下がっている間、振り子のように揺れる
      drop.animate(
        [
          { transform: "rotate(0deg)" },
          { transform: "rotate(0deg)", offset: 0.24 },
          { transform: "rotate(7deg)", offset: 0.38 },
          { transform: "rotate(-6deg)", offset: 0.52 },
          { transform: "rotate(4deg)", offset: 0.66 },
          { transform: "rotate(0deg)", offset: 0.78 },
          { transform: "rotate(0deg)" },
        ],
        { duration: 6200, easing: "ease-in-out" }
      ),
    ];
    runs[0].onfinish = () => drop.remove();

    spider.addEventListener(
      "click",
      () => {
        runs.forEach((a) => a.pause());
        const bubble = document.createElement("span");
        bubble.className = "hw-drop__bubble";
        bubble.textContent = BUG_LINES[Math.min(bugsSquashed, BUG_LINES.length - 1)];
        bugsSquashed += 1;
        // 最後の1匹をつぶしたら、お祝いにお菓子
        if (bugsSquashed === BUG_LINES.length) {
          const [x, y] = centerOf(spider);
          candyBurst(x, y);
        }
        spider.appendChild(bubble);
        thread.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" });
        spider.querySelector("svg").animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.35, 0.25)", offset: 0.25 },
            { transform: "scale(1.35, 0.25)", opacity: 1, offset: 0.7 },
            { transform: "scale(1.35, 0.25)", opacity: 0 },
          ],
          { duration: 1300, fill: "forwards", easing: "ease-out" }
        ).onfinish = () => drop.remove();
      },
      { once: true }
    );
  };

  const scheduleSpiders = () => {
    if (!root.classList.contains("js-motion")) return;
    let count = 0;
    const next = (wait) =>
      setTimeout(() => {
        // 見ていないとき・モーダルを開いているときは少し待ってから
        if (document.hidden || root.classList.contains("is-modal-open")) return next(5000);
        dropSpider();
        count += 1;
        if (count < 3) next(30000 + Math.random() * 15000);
      }, wait);
    next(7000);
  };

  const setupSurprises = () => {
    scheduleSpiders();
    if (!root.classList.contains("js-motion") || !("IntersectionObserver" in window)) return;
    const plan = [
      [document.querySelector("#events .section-head"), () => peekPumpkin("right")],
      [document.querySelector("#pricing .section-head"), () => batFlock("up")],
      [document.querySelector("#schedule .section-head"), () => peekPumpkin("left")],
      [document.querySelector(".site-footer"), () => batFlock("down")],
    ].filter(([el]) => el);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || !motionOK()) return;
          const item = plan.find(([el]) => el === entry.target);
          io.unobserve(entry.target);
          setTimeout(item[1], 250);
        });
      },
      { threshold: 0.6 }
    );
    plan.forEach(([el]) => io.observe(el));
  };

  /* ---------- 黒い画面の演出 ---------- */
  const playIntro = async () => {
    await cssLoaded();
    root.classList.add("hw-lock");

    const intro = document.createElement("div");
    intro.className = "hw-intro";
    const stage = document.createElement("div");
    stage.className = "hw-intro__stage";
    stage.setAttribute("aria-hidden", "true");

    // 黒い画面を、コウモリになるタイルで敷き詰める
    const w = innerWidth;
    const h = innerHeight;
    const size = w < 720 ? 64 : 92;
    const cols = Math.ceil(w / size);
    const rows = Math.ceil(h / size);
    const cx = w / 2;
    const cy = h / 2;
    const maxDist = Math.hypot(cx, cy);
    const cells = [];
    const frag = document.createDocumentFragment();
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const cell = document.createElement("div");
        cell.className = "hw-cell";
        const x = c * size;
        const y = r * size;
        // 1px重ねて、タイルの継ぎ目が線にならないようにする
        cell.style.cssText = `left:${x}px;top:${y}px;width:${size + 1}px;height:${size + 1}px`;
        cell.innerHTML = `<span class="hw-cell__bg"></span><span class="hw-cell__bat">${batSvg()}</span>`;
        frag.appendChild(cell);
        const mx = x + size / 2;
        const my = y + size / 2;
        cells.push({ cell, mx, my, dist: Math.hypot(mx - cx, my - cy) });
      }
    }
    stage.appendChild(frag);

    const pumpkin = document.createElement("div");
    pumpkin.className = "hw-pumpkin";
    pumpkin.innerHTML = faceSvg();
    stage.appendChild(pumpkin);

    // あえてスキップは付けない（最後まで見てもらう演出）
    intro.append(stage);
    document.body.appendChild(intro);
    // 幕（読み込み前から出していた黒）を外す。同じ黒なので切れ目は見えない
    requestAnimationFrame(() => root.classList.remove("hw-cover"));

    let done = false;
    const timers = [];
    const finish = () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      intro.remove();
      root.classList.remove("hw-lock", "hw-hold", "hw-cover");
      decorate();
      setupSurprises();
    };

    // 笑い終わったら、黒い画面が中心からコウモリになって飛び立つ
    const peel = () => {
      if (done) return;
      root.classList.remove("hw-hold"); // FVの登場演出をここから再開
      pumpkin.classList.add("is-out");
      stage.classList.add("is-peeling");
      let last = 0;
      const reach = Math.max(w, h) * 0.9;
      cells.forEach(({ cell, mx, my, dist }) => {
        const delay = (dist / maxDist) * 650 + Math.random() * 150;
        const duration = 900 + Math.random() * 600;
        last = Math.max(last, delay + duration);
        const len = dist || 1;
        const dx = ((mx - cx) / len) * reach + (Math.random() - 0.5) * 160;
        const dy = ((my - cy) / len) * reach - 120 - Math.random() * 160;
        // 黒いタイルは一瞬で消え、同じ場所にいたコウモリだけが残って飛び立つ
        cell.querySelector(".hw-cell__bg").animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 1,
          delay,
          fill: "forwards",
        });
        cell.querySelector(".hw-cell__bat").animate(
          [
            { transform: "translate(0, 0) scale(1.6) rotate(0deg)", opacity: 1 },
            { transform: `translate(${dx * 0.25}px, ${dy * 0.25 - 30}px) scale(1) rotate(${(Math.random() - 0.5) * 30}deg)`, opacity: 1, offset: 0.35 },
            { transform: `translate(${dx}px, ${dy}px) scale(0.5) rotate(${(Math.random() - 0.5) * 60}deg)`, opacity: 0 },
          ],
          { duration, delay, fill: "forwards", easing: "cubic-bezier(.45, 0, .75, .6)" }
        );
      });
      timers.push(setTimeout(finish, last + 80));
    };
    timers.push(setTimeout(peel, 2300));
  };

  ready(() => {
    if (root.classList.contains("hw-cover")) {
      playIntro();
    } else {
      root.classList.remove("hw-hold");
      cssLoaded().then(() => {
        decorate();
        setupSurprises();
      });
    }
  });
})();
