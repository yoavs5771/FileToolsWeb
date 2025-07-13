let currentStep = 1;
const steps = ["step-1", "step-2", "step-3", "step-4"];
const inputFiles = document.getElementById("inputFiles");
const filePreview = document.getElementById("filePreview");
const formatOptions = document.getElementById("formatOptions");
const mergeOptionContainer = document.getElementById("mergeOptionContainer");
const summaryBox = document.getElementById("summary-box");
const toast = document.getElementById("toastBox");
const progressBar = document.getElementById("progressBar");

let selectedFiles = [];
let detectedFileType = "";

function showToast(message, isSuccess = false) {
  toast.textContent = message;
  toast.className = isSuccess ? "toast success" : "toast";
  toast.style.display = "block";
  
  setTimeout(() => {
    toast.style.display = "none";
  }, 4000);
}

function showStep(step) {
  // הסתר את כל השלבים
  document.querySelectorAll('.step-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // הצג את השלב הנוכחי
  document.getElementById(`step-${step}`).classList.add('active');
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

// אתחול האפליקציה
document.addEventListener("DOMContentLoaded", () => {
  // הסתר את כל השלבים חוץ מהראשון
  showStep(1);
  
  // אתחל את מערכת השפות
  initializeLanguageSystem();
  
  // אתחל מצב חשוך
  initializeDarkMode();
  
  // הוסף מאזיני אירועים
  setupEventListeners();
});

function setupEventListeners() {
  // אירועי קבצים
  inputFiles.addEventListener("change", handleFileChange);
  
  // אירועי ניווט
  document.getElementById("nextStep1").addEventListener("click", goToStep2);
  document.getElementById("prevStep2").addEventListener("click", () => showStep(1));
  document.getElementById("nextStep2").addEventListener("click", goToStep3);
  document.getElementById("prevStep3").addEventListener("click", () => showStep(2));
  document.getElementById("convertButton").addEventListener("click", handleConversion);
}

function handleFileChange(e) {
  selectedFiles = Array.from(e.target.files);
  const nextButton = document.getElementById("nextStep1");
  const pdfToolsContainer = document.getElementById("pdfToolsContainer");
  
  if (selectedFiles.length > 0) {
    filePreview.textContent = selectedFiles.map(f => `• ${f.name}`).join("\n");
    detectedFileType = detectFileType(selectedFiles);
    nextButton.disabled = false;

    if (detectedFileType === 'pdf') {
      pdfToolsContainer.style.display = 'block';
    } else {
      pdfToolsContainer.style.display = 'none';
    }

  } else {
    filePreview.textContent = "";
    nextButton.disabled = true;
    pdfToolsContainer.style.display = 'none';
  }
}

function goToStep2() {
  if (selectedFiles.length === 0) {
    showToast("אנא בחר קבצים תחילה");
    return;
  }
  renderFormatOptions();
  showStep(2);
}

function goToStep3() {
  const selectedFormats = document.querySelectorAll('input[name="formatOption"]:checked');
  const pdfToolsUsed = detectedFileType === 'pdf' && (
    document.getElementById("mergeOption")?.checked ||
    document.getElementById("splitOption")?.checked ||
    document.getElementById("deletePagesInput")?.value.trim()
  );
  
  if (selectedFormats.length === 0 && !pdfToolsUsed) {
    showToast("אנא בחר לפחות פורמט אחד או כלי PDF");
    return;
  }
  renderSummary();
  showStep(3);
}

async function handleConversion() {
  progressBar.style.width = "10%";
  progressBar.textContent = "10%";

  const formData = new FormData();
  selectedFiles.forEach(file => formData.append("files", file));

  const selectedFormats = [];
  document.querySelectorAll('input[name="formatOption"]:checked').forEach(checkbox => {
    selectedFormats.push(checkbox.value);
  });
  
  const pdfToolsUsed = detectedFileType === 'pdf' && (
    document.getElementById("mergeOption")?.checked ||
    document.getElementById("splitOption")?.checked ||
    document.getElementById("deletePagesInput")?.value.trim()
  );
  
  if (selectedFormats.length === 0 && !pdfToolsUsed) {
    showToast("אנא בחר לפחות פורמט אחד או כלי PDF");
    return;
  }
  
  selectedFormats.forEach(format => formData.append("formats[]", format));

  if (detectedFileType === "pdf") {
    if (document.getElementById("mergeOption")?.checked) {
      formData.append("merge", "true");
    }
    if (document.getElementById("splitOption")?.checked) {
      formData.append("split", "true");
    }
    const deletePages = document.getElementById("deletePagesInput")?.value;
    if (deletePages) {
      formData.append("delete_pages", deletePages);
    }
  }

  progressBar.style.width = "40%";
  progressBar.textContent = "40%";

  try {
    const res = await fetch("/convert", { method: "POST", body: formData });
    
    progressBar.style.width = "80%";
    progressBar.textContent = "80%";
    
    if (res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const errorData = await res.json();
        throw new Error(errorData.error || "שגיאה לא ידועה מהשרת");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted_files.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      progressBar.style.width = "100%";
      progressBar.textContent = "100%";
      showStep(4);
      showToast("ההמרה הושלמה בהצלחה!", true);
    } else {
      const errorData = await res.json().catch(() => ({ error: "תגובת שגיאה לא תקינה מהשרת" }));
      throw new Error(errorData.error || "שגיאה בהמרה");
    }
  } catch (err) {
    showToast("שגיאה בביצוע ההמרה: " + err.message);
    console.error(err);
    progressBar.style.width = "0%";
    progressBar.textContent = "0%";
  }
}

function renderFormatOptions() {
  const formatMap = {
    word: ["PDF", "TXT", "HTML"],
    ppt: ["PDF"],
    excel: ["PDF", "CSV"],
    image: ["PDF", "JPG", "PNG", "BMP", "TIFF"],
    pdf: ["TXT", "DOC", "JPG"], // אפשרויות עבור PDF
    mixed: ["PDF"] // אפשרות ברירת מחדל לקבצים מעורבים
  };

  const options = formatMap[detectedFileType] || formatMap.mixed;
  
  // הצג/הסתר אפשרות מיזוג עבור PDF
  if (mergeOptionContainer) {
    mergeOptionContainer.style.display = detectedFileType === "pdf" ? "block" : "none";
  }

  formatOptions.innerHTML = "";
  
  if (options.length > 0) {
    options.forEach(fmt => {
      const id = `format_${fmt}`;
      const labelElement = document.createElement("label");
      labelElement.innerHTML = `
        <input type="checkbox" name="formatOption" id="${id}" value="${fmt}" />
        <span>${fmt}</span>
      `;
      formatOptions.appendChild(labelElement);
    });
  } else {
    formatOptions.innerHTML = "<p>אין אפשרויות המרה זמינות לסוג קובץ זה</p>";
  }
}

function renderSummary() {
  const selectedFormats = [];
  document.querySelectorAll('input[name="formatOption"]:checked').forEach(checkbox => {
    selectedFormats.push(checkbox.value);
  });

  let summary = `
    <strong>קבצים שנבחרו:</strong><br>
    ${selectedFiles.map(f => `• ${f.name}`).join("<br>")}<br><br>
    <strong>סוג קובץ מזוהה:</strong> ${getFileTypeDisplayName(detectedFileType)}<br><br>
  `;

  if (selectedFormats.length > 0) {
    summary += `<strong>פורמטים נבחרים:</strong><br>• ${selectedFormats.join("<br>• ")}<br><br>`;
  }

  if (detectedFileType === "pdf" && document.getElementById("mergeOption") && document.getElementById("mergeOption").checked) {
    summary += `<strong>אפשרויות נוספות:</strong><br>• מיזוג קבצי PDF לקובץ אחד<br>`;
  }

  document.getElementById("summaryText").innerHTML = summary;
}

function getFileTypeDisplayName(type) {
  const displayNames = {
    word: "מסמכי Word",
    ppt: "מצגות PowerPoint", 
    excel: "גיליונות Excel",
    image: "תמונות",
    pdf: "קבצי PDF",
    mixed: "קבצים מעורבים"
  };
  return displayNames[type] || type;
}

// אתחול האפליקציה
window.addEventListener("DOMContentLoaded", () => {
  // הסתר את כל השלבים חוץ מהראשון
  showStep(1);
  
  // אתחל את מערכת השפות
  initializeLanguageSystem();
});

function initializeLanguageSystem() {
  // הגדרת השפות הזמינות
  const languages = {
    en: "English", 
    he: "עברית", 
    fr: "Français", 
    es: "Español",
    ru: "Русский", 
    zh: "中文", 
    ar: "العربية", 
    hi: "हिन्दी",
    fa: "فارسی", 
    pt: "Português"
  };

  const languageSelect = document.getElementById("languageSelect");
  languageSelect.innerHTML = ''; // ניקוי אפשרויות קיימות למניעת כפילויות
  
  // מלא את רשימת השפות
  Object.entries(languages).forEach(([code, name]) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = name;
    languageSelect.appendChild(option);
  });

  // קבע שפת ברירת מחדל
  const savedLanguage = localStorage.getItem("selectedLanguage");
  const browserLanguage = navigator.language.slice(0, 2);
  const defaultLanguage = savedLanguage || (languages[browserLanguage] ? browserLanguage : "en");
  
  languageSelect.value = defaultLanguage;
  loadLanguage(defaultLanguage);

  // האזן לשינוי שפה
  languageSelect.addEventListener("change", (e) => {
    const selectedLanguage = e.target.value;
    localStorage.setItem("selectedLanguage", selectedLanguage);
    loadLanguage(selectedLanguage);
  });
}

function loadLanguage(languageCode) {
  fetch(`/translations/${languageCode}.json`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(translations => {
      // עדכן את כל הטקסטים
      document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.getAttribute("data-i18n");
        if (translations[key]) {
          element.textContent = translations[key];
        }
      });

      // הגדר כיוון הטקסט
      const rtlLanguages = ["he", "ar", "fa"];
      const htmlElement = document.documentElement;
      
      if (rtlLanguages.includes(languageCode)) {
        htmlElement.setAttribute("dir", "rtl");
        htmlElement.setAttribute("lang", languageCode);
      } else {
        htmlElement.setAttribute("dir", "ltr");
        htmlElement.setAttribute("lang", languageCode);
      }
    })
    .catch(error => {
      console.error(`Error loading language ${languageCode}:`, error);
      showToast(`שגיאה בטעינת השפה: ${languageCode}`);
    });
}

function initializeDarkMode() {
  const darkModeToggle = document.getElementById("darkModeToggle");
  const savedDarkMode = localStorage.getItem("darkMode") === "true";
  
  if (savedDarkMode) {
    document.body.classList.add("dark-mode");
    darkModeToggle.textContent = "☀️";
  }
  
  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDarkMode = document.body.classList.contains("dark-mode");
    darkModeToggle.textContent = isDarkMode ? "☀️" : "🌙";
    localStorage.setItem("darkMode", isDarkMode);
  });
}
