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

  // スマートフォン下部の固定CTA
  // FVの申込ボタンを上へ通り過ぎてから出す（ページを開いた直後にFVの文章を隠さないため）。
  // 料金・スケジュールの申込欄が見えている間は、同じボタンが二重にならないよう隠す。
  const heroActions = document.querySelector(".hero__actions");
  const applyBands = [...document.querySelectorAll(".apply-band")];
  if (sticky && heroActions && "IntersectionObserver" in window) {
    let heroPassed = false;
    const bandsOnScreen = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === heroActions) {
          heroPassed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        } else if (entry.isIntersecting) {
          bandsOnScreen.add(entry.target);
        } else {
          bandsOnScreen.delete(entry.target);
        }
      });
      sticky.classList.toggle("is-visible", heroPassed && bandsOnScreen.size === 0);
    });
    [heroActions, ...applyBands].forEach((target) => observer.observe(target));
  } else if (sticky) {
    sticky.classList.add("is-visible");
  }

  // スマートフォン：講座カードは「講座名・写真・詳細を見る」だけにし、詳細はモーダルで開く
  const courses = document.querySelectorAll(".course");
  if (courses.length && typeof HTMLDialogElement === "function") {
    const spQuery = matchMedia("(max-width: 719px)");
    const modal = document.createElement("dialog");
    modal.className = "course-modal";
    modal.setAttribute("aria-labelledby", "course-modal-title");
    modal.innerHTML = `
      <div class="course-modal__head">
        <h2 id="course-modal-title" class="course-modal__title" tabindex="-1" autofocus></h2>
        <button type="button" class="course-modal__close" aria-label="閉じる" data-modal-close>
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <div class="course-modal__body"></div>
      <button type="button" class="btn btn-sub btn--sm course-modal__back" data-modal-close>閉じる</button>`;
    document.body.append(modal);
    const modalTitle = modal.querySelector(".course-modal__title");
    const modalBody = modal.querySelector(".course-modal__body");

    const openCourse = (course) => {
      modalTitle.textContent = course.querySelector(".course__title").textContent;
      modalBody.replaceChildren(
        ...[".tags", ".course__img", ".course__text"]
          .map((selector) => course.querySelector(selector))
          .filter(Boolean)
          .map((el) => {
            const copy = el.cloneNode(true);
            copy.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
            return copy;
          })
      );
      modal.showModal();
      modal.scrollTop = 0;
      document.documentElement.classList.add("is-modal-open");
    };

    courses.forEach((course) => {
      const name = course.querySelector(".course__title").textContent;
      const more = document.createElement("button");
      more.type = "button";
      more.className = "btn btn-sub btn--sm course__more";
      more.setAttribute("aria-haspopup", "dialog");
      more.setAttribute("aria-label", `${name}の詳細を見る`);
      more.innerHTML = '詳細を見る<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>';
      course.append(more);
      // カードのどこをタップしても開く（ボタンのクリックもここに伝わる）
      course.addEventListener("click", () => {
        if (spQuery.matches) openCourse(course);
      });
    });

    modal.addEventListener("click", (event) => {
      // 背景（モーダルの外側）または閉じるボタンで閉じる
      if (event.target === modal || event.target.closest("[data-modal-close]")) modal.close();
    });
    modal.addEventListener("close", () => document.documentElement.classList.remove("is-modal-open"));
    spQuery.addEventListener("change", () => {
      if (!spQuery.matches && modal.open) modal.close();
    });
    document.documentElement.classList.add("has-course-modal");
  }

  sessions().forEach(syncSession);
  applyFilter("all");
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();
