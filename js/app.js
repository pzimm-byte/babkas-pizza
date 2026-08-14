(() => {
  const galleryImages = [
    { src: "assets/gozney-peel-cut.jpg", alt: "Pizza sliding off the peel into the oven", tall: true },
    { src: "assets/margherita-overhead.jpg", alt: "Overhead shot of a fresh Margherita" },
    { src: "assets/checkerboard-spread.jpg", alt: "Spread of pizzas on checkered napkins" },
    { src: "assets/picnic-slice-pull.jpg", alt: "Pulling a cheesy slice at a picnic table" },
    { src: "assets/assembly-toppings.jpg", alt: "Assembling toppings on fresh dough" },
    { src: "assets/tent-menu-board.jpg", alt: "Pop-up tent with the menu board" },
    { src: "assets/pop-up-tent-team.jpg", alt: "The crew at the wood-fired pop-up" },
  ];

  const loader = document.getElementById("loader");
  const loaderVideo = document.getElementById("loader-video");
  let loaderClosing = false;

  function hideLoader() {
    if (loaderClosing) return;
    loaderClosing = true;
    loader.classList.add("is-hiding");
    document.body.classList.remove("loader-open");
    setTimeout(() => {
      loader.classList.add("is-gone");
      loader.setAttribute("hidden", "");
    }, 400);
  }

  loaderVideo?.addEventListener("ended", hideLoader);
  setTimeout(hideLoader, 2000);
  loaderVideo?.play?.().catch(() => hideLoader());

  const hamburger = document.getElementById("hamburger");
  const mobilePanel = document.getElementById("mobile-panel");

  function closeNav() {
    mobilePanel.classList.remove("is-open");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Open menu");
  }

  hamburger.addEventListener("click", () => {
    const open = mobilePanel.classList.toggle("is-open");
    hamburger.setAttribute("aria-expanded", String(open));
    hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  mobilePanel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  const galleryGrid = document.getElementById("gallery-grid");
  galleryImages.forEach((img, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery-cell" + (img.tall ? " tall" : "");
    button.setAttribute("aria-label", `View ${img.alt}`);
    button.innerHTML = `<img src="${img.src}" alt="${img.alt}">`;
    button.addEventListener("click", () => openLightbox(index));
    galleryGrid.appendChild(button);
  });

  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  let lightboxIndex = 0;

  function openLightbox(index) {
    lightboxIndex = index;
    const item = galleryImages[lightboxIndex];
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
    lightbox.classList.add("is-open");
    lightbox.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("hidden", "");
    document.body.style.overflow = "";
  }

  function showLightbox(delta, event) {
    event?.stopPropagation();
    lightboxIndex = (lightboxIndex + delta + galleryImages.length) % galleryImages.length;
    const item = galleryImages[lightboxIndex];
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
  }

  lightbox.addEventListener("click", closeLightbox);
  lightboxImage.addEventListener("click", (event) => event.stopPropagation());
  lightbox.querySelector(".lightbox-close").addEventListener("click", (event) => {
    event.stopPropagation();
    closeLightbox();
  });
  lightbox.querySelector(".lightbox-prev").addEventListener("click", (event) => showLightbox(-1, event));
  lightbox.querySelector(".lightbox-next").addEventListener("click", (event) => showLightbox(1, event));

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") showLightbox(-1, event);
    if (event.key === "ArrowRight") showLightbox(1, event);
  });

  const calDays = document.getElementById("cal-days");
  const calLabel = document.getElementById("cal-label");
  const selectedDateEl = document.getElementById("selected-date");
  let calMonth = new Date();
  calMonth.setDate(1);
  let selectedDate = null;

  function renderCalendar() {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    calLabel.textContent = calMonth.toLocaleString(undefined, { month: "long", year: "numeric" });
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    calDays.innerHTML = "";
    for (let i = 0; i < firstDow; i += 1) {
      const blank = document.createElement("button");
      blank.type = "button";
      blank.className = "is-empty";
      blank.tabIndex = -1;
      blank.disabled = true;
      calDays.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(day);
      const isPast = date < today;
      const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
      button.disabled = isPast;
      if (isSelected) button.classList.add("is-selected");
      if (!isPast) {
        button.addEventListener("click", () => {
          selectedDate = date;
          selectedDateEl.textContent =
            "Selected: " +
            date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
          renderCalendar();
        });
      }
      calDays.appendChild(button);
    }
  }

  document.getElementById("prev-month").addEventListener("click", () => {
    calMonth.setMonth(calMonth.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById("next-month").addEventListener("click", () => {
    calMonth.setMonth(calMonth.getMonth() + 1);
    renderCalendar();
  });

  renderCalendar();

  const form = document.getElementById("book-form");
  const formError = document.getElementById("form-error");
  const submitBtn = document.getElementById("submit-btn");
  const submitLabel = submitBtn.querySelector(".submit-label");
  const thanks = document.getElementById("thanks");
  const thanksCopy = document.getElementById("thanks-copy");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const eventType = String(data.get("eventType") || "").trim();

    if (!name || !email || !phone || !eventType || !selectedDate) {
      formError.textContent = "Please fill out your contact info, event type, and pick a date.";
      formError.classList.add("is-visible");
      return;
    }

    formError.classList.remove("is-visible");
    submitBtn.disabled = true;
    submitBtn.classList.add("is-loading");
    submitLabel.textContent = "Sending…";

    setTimeout(() => {
      const label = selectedDate.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      thanksCopy.textContent = `We got your request for ${label} and will reach out shortly to confirm details. Come taste the difference!`;
      form.classList.add("is-hidden");
      thanks.classList.add("is-visible");
    }, 1300);
  });
})();
