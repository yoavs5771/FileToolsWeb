let currentStep = 1;
const steps = ["step1", "step2", "step3", "step4"];
const inputFiles = document.getElementById("inputFiles");
const filePreview = document.getElementById("filePreview");
const conversionOptions = document.getElementById("conversionOptions");
const pdfTools = document.getElementById("pdfTools");
const summaryBox = document.getElementById("summary-box");
const toast = document.getElementById("toast");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");

let selectedFiles = [];
let detectedFileType = "";

function showStep(step) {
  steps.forEach((id, index) => {
    document.getElementById(id).classList.toggle("active", index === step - 1);
  });
  currentStep = step;
}

function detectFileType(files) {
  const extensions = Array.from(files).map(f => f.name.split('.').pop().toLowerCase());
  if (extensions.every(ext => ["pdf"].includes(ext))) return "pdf";
  if (extensions.every(ext => ["docx", "doc"].includes(ext))) return "word";
  if (extensions.every(ext => ["pptx", "ppt"].includes(ext))) return "ppt";
  if (extensions.every(ext => ["xlsx", "xls", "csv"].includes(ext))) return "excel";
  if (extensions.every(ext => ["jpg", "jpeg", "png", "bmp", "gif", "tiff", "webp"].includes(ext))) return "image";
  return "mixed";
}

function showToast(msg, success = false) {
  toast.innerText = msg;
  toast.className = "toast" + (success ? " success" : "");
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 4000);
}

inputFiles.addEventListener("change", (e) => {
  selectedFiles = Array.from(e.target.files);
  filePreview.innerText = selectedFiles.map(f => f.name).join("\n");
  detectedFileType = detectFileType(selectedFiles);
  document.getElementById("nextBtn1").disabled = selectedFiles.length === 0;
});

document.getElementById("nextBtn1").addEventListener("click", () => {
  renderConversionOptions();
  showStep(2);
});

document.getElementById("backBtn2").addEventListener("click", () => showStep(1));
document.getElementById("nextBtn2").addEventListener("click", () => {
  renderSummary();
  showStep(3);
});
document.getElementById("backBtn3").addEventListener("click", () => showStep(2));

document.getElementById("convertBtn").addEventListener("click", async () => {
  progressContainer.style.display = "block";
  progressBar.style.width = "10%";
  progressBar.innerText = "10%";

  const formData = new FormData();
  selectedFiles.forEach(file => formData.append("files", file));

  const format = document.querySelector('input[name="formatOption"]:checked');
  if (format) formData.append("format", format.value);

  if (detectedFileType === "pdf") {
    if (document.getElementById("mergePdf").checked) formData.append("merge", "1");
    if (document.getElementById("splitPdf").checked) formData.append("split", "1");
    if (document.getElementById("deletePages").checked) formData.append("delete_pages", "1");
  }

  progressBar.style.width = "40%";
  progressBar.innerText = "40%";

  try {
    const res = await fetch("/convert", { method: "POST", body: formData });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted_output.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();

    progressBar.style.width = "100%";
    progressBar.innerText = "100%";
    showStep(4);
  } catch (err) {
    showToast("שגיאה בביצוע ההמרה.");
    console.error(err);
  }
});

function renderConversionOptions() {
  const map = {
    word: ["PDF", "TXT", "HTML"],
    ppt: ["PDF"],
    excel: ["PDF", "CSV"],
    image: ["PDF", "JPG", "PNG", "BMP", "TIFF"],
    pdf: [] // ניהול בכלים אחרים
  };

  const options = map[detectedFileType] || [];
  pdfTools.style.display = detectedFileType === "pdf" ? "block" : "none";

  conversionOptions.innerHTML = "";
  if (options.length > 0) {
    options.forEach(fmt => {
      const id = `opt_${fmt}`;
      conversionOptions.innerHTML += `
        <label>
          <input type="radio" name="formatOption" id="${id}" value="${fmt}" />
          ${fmt}
        </label><br/>
      `;
    });
  } else {
    conversionOptions.innerHTML = "<p>אין אפשרויות להמרה לקובץ זה.</p>";
  }
}

function renderSummary() {
  let summary = `
    <h5>סיכום לפני המרה:</h5>
    <p><strong>קבצים שנבחרו:</strong><br>${selectedFiles.map(f => f.name).join("<br>")}</p>
    <p><strong>סוג קובץ:</strong> ${detectedFileType}</p>
  `;

  const format = document.querySelector('input[name="formatOption"]:checked');
  if (format) summary += `<p><strong>פורמט נבחר:</strong> ${format.value}</p>`;

  if (detectedFileType === "pdf") {
    summary += `<p><strong>כלי PDF:</strong><ul>`;
    if (document.getElementById("mergePdf").checked) summary += "<li>מיזוג קבצים</li>";
    if (document.getElementById("splitPdf").checked) summary += "<li>פיצול קובץ</li>";
    if (document.getElementById("deletePages").checked) summary += "<li>מחיקת עמודים</li>";
    summary += "</ul></p>";
  }

  summaryBox.innerHTML = summary;
}

// תרגום שפות
document.getElementById("languageSelect").addEventListener("change", (e) => {
  const lang = e.target.value;
  localStorage.setItem("lang", lang);
  loadTranslations(lang);
});

function loadTranslations(lang) {
  fetch(`/translations/${lang}.json`)
    .then(res => res.json())
    .then(dict => {
      document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (dict[key]) el.innerText = dict[key];
      });

      document.documentElement.dir = ["ar", "he", "fa"].includes(lang) ? "rtl" : "ltr";
    });
}

function initLang() {
  const langSelect = document.getElementById("languageSelect");
  const langs = {
    en: "English", he: "עברית", fr: "Français", ru: "Русский",
    ar: "العربية", zh: "中文", fa: "فارسی", es: "Español", pt: "Português", hi: "हिन्दी"
  };
  for (const [code, label] of Object.entries(langs)) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.innerText = label;
    langSelect.appendChild(opt);
  }

  const lang = localStorage.getItem("lang") || "en";
  langSelect.value = lang;
  loadTranslations(lang);
}

window.onload = () => {
  initLang();
};
