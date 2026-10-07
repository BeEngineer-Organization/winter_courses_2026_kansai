(() => {
  const header = document.querySelector(".site-header");
  const filters = document.querySelectorAll("[data-campus-filter]");
  const preparing = document.querySelector("[data-schedule-preparing]");
  const empty = document.querySelector("[data-schedule-empty]");
  const count = document.querySelector("[data-filter-count]");
  const sticky = document.querySelector("[data-sticky-cta]");
  const campusNames = {
    all: "関西2校舎",
    kyodai: "京大本校",
    umeda: "梅田校",
  };
  const statusLabels = {
    preparing: "準備中",
    open: "受付中",
    full: "満席",
    closed: "受付終了",
    cancelled: "中止",
  };
  const ctaLabels = {
    preparing: "申込準備中",
    full: "満席",
    closed: "受付は終了しました",
    cancelled: "中止",
  };

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  const parseJst = (value) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (/[zZ]|[+-]\d{2}:\d{2}$/.test(trimmed)) {
      const zoned = Date.parse(trimmed);
      return Number.isNaN(zoned) ? null : zoned;
    }
    const match = trimmed.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/
    );
    if (!match) return null;
    const [, year, month, day, hour = "23", minute = "59", second = "59"] = match;
    const parsed = Date.parse(`${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const lockCta = (cta, label) => {
    if (cta instanceof HTMLAnchorElement) {
      cta.removeAttribute("href");
      cta.setAttribute("role", "link");
      cta.setAttribute("aria-disabled", "true");
      cta.classList.add("is-disabled");
    }
    if (cta instanceof HTMLButtonElement) {
      cta.disabled = true;
    }
    cta.textContent = label;
  };

  const syncSession = (session) => {
    let status = session.dataset.status || "preparing";
    const now = Date.now();
    const deadline = parseJst(session.dataset.deadline || "");
    const end = parseJst(session.dataset.end || "");

    if (session.dataset.deadline && deadline === null) {
      console.warn("締切の日時を読み取れませんでした。+09:00 付きで書いてください。", session);
    }
    if (session.dataset.end && end === null) {
      console.warn("終了日時を読み取れませんでした。+09:00 付きで書いてください。", session);
    }

    if (status === "open" && ((deadline !== null && now > deadline) || (end !== null && now > end))) {
      status = "closed";
      session.dataset.status = "closed";
      session.dataset.autoClosed = "true";
    }

    const badge = session.querySelector("[data-status-label]");
    const paint = (nextStatus) => {
      if (!badge) return;
      badge.className = `status status--${nextStatus}`;
      badge.textContent = statusLabels[nextStatus] || statusLabels.preparing;
    };
    paint(status);

    const cta = session.querySelector("[data-session-cta]");
    if (!cta) return;

    if (status === "open" && cta instanceof HTMLAnchorElement) {
      const href = cta.getAttribute("href") || "";
      if (!href.startsWith("https://")) {
        session.dataset.status = "preparing";
        paint("preparing");
        lockCta(cta, ctaLabels.preparing);
      }
      return;
    }

    lockCta(cta, ctaLabels[status] || ctaLabels.preparing);
  };

  const sessions = () => [...document.querySelectorAll("[data-session]")];

  const applyFilter = (name) => {
    filters.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.campusFilter === name));
    });

    const list = sessions();
    if (!preparing || !empty) return;

    if (list.length === 0) {
      preparing.hidden = false;
      empty.hidden = true;
      return;
    }

    preparing.hidden = true;
    let visible = 0;
    list.forEach((session) => {
      const show = name === "all" || session.dataset.campus === name;
      session.hidden = !show;
      if (show) visible += 1;
    });

    if (count) {
      count.textContent = visible > 0 ? `${campusNames[name]}の開催枠 ${visible}件を表示しています` : "";
    }

    if (visible === 0) {
      empty.hidden = false;
      empty.textContent =
        name === "all"
          ? "現在公開中の日程はありません。"
          : `${campusNames[name]}の、現在公開中の日程はありません。`;
    } else {
      empty.hidden = true;
    }
  };

  document.addEventListener("click", (event) => {
    const locked = event.target instanceof Element ? event.target.closest('[aria-disabled="true"]') : null;
    if (locked) event.preventDefault();
  });

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      applyFilter(button.dataset.campusFilter || "all");
    });
  });

  // スマートフォン下部の固定CTA：FVの申込ボタンや末尾の申込欄が見えている間は隠し、同じボタンが二重に出ないようにする
  const stickyTargets = [document.querySelector(".hero__actions"), ...document.querySelectorAll(".apply-band")].filter(Boolean);
  if (sticky && stickyTargets.length && "IntersectionObserver" in window) {
    const onScreen = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      });
      sticky.classList.toggle("is-hidden", onScreen.size > 0);
    });
    stickyTargets.forEach((target) => observer.observe(target));
  }

  sessions().forEach(syncSession);
  applyFilter("all");
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();
