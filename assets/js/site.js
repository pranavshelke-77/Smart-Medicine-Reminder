/* MedAlarm site: theme, navigation, lightbox, code block and firmware-logic simulator */
(function () {
  "use strict";

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const themeButton = document.getElementById("theme-toggle");

  function applyThemeLabel() {
    const dark = root.getAttribute("data-theme") !== "light";
    themeButton.textContent = dark ? "Light" : "Dark";
    themeButton.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  }

  themeButton.addEventListener("click", function () {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("medalarm-theme", next);
    } catch (e) {}
    applyThemeLabel();
  });
  applyThemeLabel();

  /* ---------- mobile menu ---------- */
  const nav = document.getElementById("main-nav");
  const menuButton = document.getElementById("menu-toggle");

  menuButton.addEventListener("click", function () {
    const open = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", function (event) {
    if (event.target.tagName === "A") {
      nav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- scroll progress and active link ---------- */
  const progressBar = document.getElementById("scroll-progress-bar");
  const navLinks = Array.from(nav.querySelectorAll("a"));
  const sections = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";

    let current = null;
    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top < 140) {
        current = section.id;
      }
    });
    navLinks.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("href") === "#" + current);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- lightbox ---------- */
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = lightbox.querySelector("img");
  const lightboxCaption = lightbox.querySelector("figcaption");
  const seen = new Set();
  const slides = [];

  document.querySelectorAll("[data-lightbox]").forEach(function (button) {
    const src = button.getAttribute("data-lightbox");
    if (!seen.has(src)) {
      seen.add(src);
      slides.push({ src: src, caption: button.getAttribute("data-caption") || "" });
    }
    button.addEventListener("click", function () {
      openLightbox(slides.findIndex(function (s) { return s.src === src; }), button);
    });
  });

  let slideIndex = 0;
  let returnFocus = null;

  function showSlide(i) {
    slideIndex = (i + slides.length) % slides.length;
    lightboxImage.src = slides[slideIndex].src;
    lightboxImage.alt = slides[slideIndex].caption;
    lightboxCaption.textContent = slides[slideIndex].caption + "  (" + (slideIndex + 1) + " / " + slides.length + ")";
  }

  function openLightbox(i, opener) {
    returnFocus = opener;
    showSlide(i);
    lightbox.classList.add("open");
    lightbox.querySelector(".lb-close").focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    if (returnFocus) {
      returnFocus.focus();
    }
  }

  lightbox.querySelector(".lb-close").addEventListener("click", closeLightbox);
  lightbox.querySelector(".lb-prev").addEventListener("click", function () { showSlide(slideIndex - 1); });
  lightbox.querySelector(".lb-next").addEventListener("click", function () { showSlide(slideIndex + 1); });
  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });
  document.addEventListener("keydown", function (event) {
    if (!lightbox.classList.contains("open")) {
      return;
    }
    if (event.key === "Escape") {
      closeLightbox();
    } else if (event.key === "ArrowLeft") {
      showSlide(slideIndex - 1);
    } else if (event.key === "ArrowRight") {
      showSlide(slideIndex + 1);
    }
  });

  /* ---------- code block ---------- */
  const codeBlock = document.getElementById("code-block");
  const expandButton = document.getElementById("code-expand");
  const copyButton = document.getElementById("code-copy");

  expandButton.addEventListener("click", function () {
    const collapsed = codeBlock.classList.toggle("collapsed");
    expandButton.textContent = collapsed ? "Expand" : "Collapse";
  });
  copyButton.addEventListener("click", function () {
    const source = document.getElementById("code-text").textContent;
    navigator.clipboard.writeText(source).then(
      function () { copyButton.textContent = "Copied"; },
      function () { copyButton.textContent = "Copy failed"; }
    );
    setTimeout(function () { copyButton.textContent = "Copy"; }, 1800);
  });

  /* ---------- simulator: mirrors loop() in medicine_alarm.ino ---------- */
  const el = function (id) { return document.getElementById(id); };
  const sim = {};

  function resetSim() {
    sim.clockSet = false;
    sim.seconds = 0;              // seconds since midnight of the simulated day
    sim.day = 0;
    sim.medicine = "Medicine";
    sim.alarmHour = 9;
    sim.alarmMinute = 0;
    sim.alarmActive = false;
    sim.emergency = false;
    sim.lastTriggeredDay = -1;
    log("Simulation reset. Device clock not set.");
    render();
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function log(message) {
    el("sim-log").textContent = message;
  }

  function render() {
    const h = Math.floor(sim.seconds / 3600);
    const m = Math.floor((sim.seconds % 3600) / 60);
    const s = Math.floor(sim.seconds % 60);
    const clockText = sim.clockSet ? pad(h) + ":" + pad(m) + ":" + pad(s) : "--:--:--";
    el("device-clock").textContent = clockText;
    el("phone-clock").textContent = sim.clockSet ? pad(h) + ":" + pad(m) : "--:--";

    const beepOn = sim.alarmActive && Math.floor(performance.now() / 400) % 2 === 0;
    el("buzzer-led").classList.toggle("on", beepOn);
    el("alert-led").classList.toggle("alert", sim.emergency);
    el("device-panel").classList.toggle("buzzing", sim.alarmActive);

    el("device-status").textContent =
      "Medicine: " + sim.medicine +
      "\nReminder: " + sim.alarmHour + ":" + pad(sim.alarmMinute) +
      "\nClock set: " + (sim.clockSet ? "Yes" : "No") +
      "\nAlarm active: " + (sim.alarmActive ? "Yes" : "No") +
      "\nEmergency alert: " + (sim.emergency ? "YES" : "No");
  }

  /* optional beep through Web Audio */
  let audioContext = null;
  let lastBeepState = false;

  function beep(on) {
    if (!el("sim-sound").checked) {
      return;
    }
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (on && !lastBeepState) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.frequency.value = 2300;
      gain.gain.value = 0.05;
      osc.connect(gain).connect(audioContext.destination);
      osc.start();
      osc.stop(audioContext.currentTime + 0.35);
    }
    lastBeepState = on;
  }

  let lastTick = performance.now();

  function tick(now) {
    const dt = (now - lastTick) / 1000;
    lastTick = now;

    if (sim.clockSet) {
      sim.seconds += dt * Number(el("sim-speed").value);
      if (sim.seconds >= 86400) {
        sim.seconds -= 86400;
        sim.day += 1;
      }
      const h = Math.floor(sim.seconds / 3600);
      const m = Math.floor((sim.seconds % 3600) / 60);
      if (h === sim.alarmHour && m === sim.alarmMinute && sim.day !== sim.lastTriggeredDay) {
        sim.alarmActive = true;
        sim.lastTriggeredDay = sim.day;
        log("Reminder time reached: buzzer on. Take " + sim.medicine + ".");
      }
    }
    beep(sim.alarmActive && Math.floor(performance.now() / 400) % 2 === 0);
    render();
    requestAnimationFrame(tick);
  }

  el("sim-settime").addEventListener("click", function () {
    const value = el("sim-now").value;
    if (!/^\d{2}:\d{2}$/.test(value)) {
      log("400 Invalid date and time");
      return;
    }
    const parts = value.split(":").map(Number);
    sim.seconds = parts[0] * 3600 + parts[1] * 60;
    sim.clockSet = true;
    log("/settime → device clock set to " + value + ".");
  });

  el("sim-save").addEventListener("click", function () {
    const name = el("sim-med").value.trim();
    const value = el("sim-alarm").value;
    if (!name || !/^\d{2}:\d{2}$/.test(value)) {
      log("400 Invalid reminder settings");
      return;
    }
    const parts = value.split(":").map(Number);
    sim.medicine = name.slice(0, 40);
    sim.alarmHour = parts[0];
    sim.alarmMinute = parts[1];
    sim.lastTriggeredDay = -1;
    log("/save → reminder for " + sim.medicine + " at " + value + ".");
  });

  function stop(source) {
    sim.alarmActive = false;
    log(source + " → buzzer stopped.");
  }

  el("sim-stop").addEventListener("click", function () { stop("/stop (phone)"); });
  el("hw-stop").addEventListener("click", function () { stop("Stop button GPIO 26"); });
  el("sim-emergency").addEventListener("click", function () {
    sim.emergency = true;
    log("/emergency → alert registered on the device. No SMS or call is sent.");
  });
  el("hw-emergency").addEventListener("click", function () {
    sim.emergency = true;
    log("Emergency button GPIO 27 → alert flag set.");
  });
  el("sim-clear").addEventListener("click", function () {
    sim.emergency = false;
    log("/clear → emergency flag cleared.");
  });
  el("sim-reset").addEventListener("click", resetSim);

  resetSim();
  requestAnimationFrame(tick);
})();
