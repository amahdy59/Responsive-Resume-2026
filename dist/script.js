const root = document.documentElement;
const toggle = document.querySelector(".theme-toggle");
const savedTheme = localStorage.getItem("resume-theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const toast = document.createElement("div");
let toastTimer;

document.querySelectorAll("img[data-fallback-src]").forEach((image) => {
  image.addEventListener(
    "error",
    () => {
      image.src = image.dataset.fallbackSrc;
      image.removeAttribute("data-fallback-src");
    },
    { once: true }
  );
});

toast.className = "copy-toast";
toast.setAttribute("role", "status");
toast.setAttribute("aria-live", "polite");
document.body.appendChild(toast);

function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem("resume-theme", theme);
  const isDark = theme === "dark";
  toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  toggle.querySelector("span").innerHTML = isDark
    ? '<svg aria-hidden="true"><use href="#icon-sun"></use></svg>'
    : '<svg aria-hidden="true"><use href="#icon-moon"></use></svg>';
}

async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1800);
}

function makeCopyButton(value, label) {
  const button = document.createElement("button");
  button.className = "copy-button";
  button.type = "button";
  button.dataset.copy = value;
  button.setAttribute("aria-label", label);
  button.innerHTML = '<span aria-hidden="true"></span>';
  return button;
}

setTheme(savedTheme || (prefersDark ? "dark" : "light"));

toggle.addEventListener("click", () => {
  setTheme(root.dataset.theme === "dark" ? "light" : "dark");
});

document.querySelectorAll(".compact-list a, .featured h4 a").forEach((link) => {
  const copyButton = makeCopyButton(link.href, `Copy ${link.textContent.trim()} link`);
  const container = link.closest("li, article");
  container.appendChild(copyButton);
  container.addEventListener("click", (event) => {
    if (event.target.closest("button") || event.target.closest("a")) return;
    link.click();
  });
});

document.querySelectorAll('a[target="_blank"]').forEach((link) => {
  const label = link.textContent.trim();
  if (!link.getAttribute("aria-label")) {
    link.setAttribute("aria-label", `${label} (opens external site)`);
  }
  link.setAttribute("title", "Opens external site");
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.stopPropagation();
    try {
      await copyText(button.dataset.copy);
      showToast("Copied");
    } catch {
      showToast("Copy failed");
    }
  });
});
