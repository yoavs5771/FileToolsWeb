// Fixed and cleaned script.js
let currentStep = 1;
const steps = ["step-1", "step-2", "step-3", "step-4"];
const inputFiles = document.getElementById("inputFiles");
const filePreview = document.getElementById("filePreview");
const fileList = document.getElementById("fileList");
const formatOptions = document.getElementById("formatOptions");
const mergeOptionContainer = document.getElementById("mergeOptionContainer");
const summaryBox = document.getElementById("summary-box");
const toast = document.getElementById("toastBox");
const progressBar = document.getElementById("progressBar");
const uploadPlaceholder = document.getElementById("uploadPlaceholder");
const uploadArea = document.querySelector(".upload-area");

let selectedFiles = [];
let detectedFileType = "";

// Language Support
const supportedLanguages = ['en', 'he', 'ar', 'es', 'fr', 'pt', 'ru', 'zh', 'hi', 'fa'];
let currentLanguage = 'en';
let translations = {};

// Enhanced toast function
function showToast(message, isSuccess = false, title = null) {
  if (!toast) return;
  
  const toastTitle = toast.querySelector('.toast-title');
  const toastMessage = toast.querySelector('.toast-message');
  const toastIcon = toast.querySelector('.toast-icon i');
  
  if (toastTitle) toastTitle.textContent = title || (isSuccess ? 'Success' : 'Error');
  if (toastMessage) toastMessage.textContent = message;
  
  // Update icon
  if (toastIcon) {
    toastIcon.className = isSuccess ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
  }
  
  toast.className = isSuccess ? "toast success show" : "toast show";
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 5000);
}

function showStep(step) {
  // הסתר את כל השלבים
  document.querySelectorAll('.step-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // הצג את השלב הנוכחי
  const stepElement = document.getElementById(`step-${step}`);
  if (stepElement) {
    stepElement.classList.add('active');
  }
  currentStep = step;
}

// Enhanced file size formatting
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get file icon based on extension
function getFileIcon(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  const iconMap = {
    'pdf': 'fas fa-file-pdf',
    'doc': 'fas fa-file-word',
    'docx': 'fas fa-file-word',
    'ppt': 'fas fa-file-powerpoint',
    'pptx': 'fas fa-file-powerpoint',
    'xls': 'fas fa-file-excel',
    'xlsx': 'fas fa-file-excel',
    'jpg': 'fas fa-file-image',
    'jpeg': 'fas fa-file-image',
    'png': 'fas fa-file-image',
    'gif': 'fas fa-file-image',
    'bmp': 'fas fa-file-image',
    'tiff': 'fas fa-file-image',
    'mp4': 'fas fa-file-video',
    'avi': 'fas fa-file-video',
    'txt': 'fas fa-file-alt',
    'zip': 'fas fa-file-archive',
    'rar': 'fas fa-file-archive'
  };
  return iconMap[ext] || 'fas fa-file';
}

// Enhanced file preview
function updateFilePreview() {
  if (!filePreview || !fileList) return;
  
  if (selectedFiles.length === 0) {
    filePreview.style.display = 'none';
    if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
    const nextBtn = document.getElementById('nextStep1');
    if (nextBtn) nextBtn.disabled = true;
    return;
  }

  if (uploadPlaceholder) uploadPlaceholder.style.display = 'none';
  filePreview.style.display = 'block';
  
  // Update file count and total size
  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  const fileCountEl = document.getElementById('fileCount');
  const totalSizeEl = document.getElementById('totalSize');
  
  if (fileCountEl) fileCountEl.textContent = selectedFiles.length;
  if (totalSizeEl) totalSizeEl.textContent = formatFileSize(totalSize);
  
  // Clear existing file list
  fileList.innerHTML = '';
  
  // Add each file to the list
  selectedFiles.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
      <div class="file-icon">
        <i class="${getFileIcon(file.name)}"></i>
      </div>
      <div class="file-info">
        <div class="file-name">${file.name}</div>
        <div class="file-size">${formatFileSize(file.size)}</div>
      </div>
      <button class="file-remove" onclick="removeFile(${index})" title="Remove file">
        <i class="fas fa-times"></i>
      </button>
    `;
    fileList.appendChild(fileItem);
  });
  
  const nextBtn = document.getElementById('nextStep1');
  if (nextBtn) nextBtn.disabled = false;
}

// Remove file function
function removeFile(index) {
  selectedFiles.splice(index, 1);
  updateFilePreview();
  updatePDFToolsVisibility();
}

// Enhanced drag and drop functionality
function setupDragAndDrop() {
  if (!uploadArea) return;
  
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, unhighlight, false);
  });

  uploadArea.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight() {
  if (uploadArea) uploadArea.classList.add('dragover');
}

function unhighlight() {
  if (uploadArea) uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(Array.from(files));
}

// Enhanced file handling
function handleFiles(files) {
  selectedFiles = [...selectedFiles, ...files];
  updateFilePreview();
  updatePDFToolsVisibility();
  showToast(`${files.length} file(s) added successfully!`, true, 'Files Added');
}

// Clear all files
function clearAllFiles() {
  selectedFiles = [];
  updateFilePreview();
  updatePDFToolsVisibility();
  showToast('All files cleared', true, 'Files Cleared');
}

// Enhanced PDF tools visibility
function updatePDFToolsVisibility() {
  const hasPDFs = selectedFiles.some(file => 
    file.name.toLowerCase().endsWith('.pdf')
  );
  
  const pdfToolsContainer = document.getElementById('pdfToolsContainer');
  if (pdfToolsContainer) {
    if (hasPDFs) {
      pdfToolsContainer.style.display = 'block';
      pdfToolsContainer.style.animation = 'fadeInUp 0.5s ease-out';
    } else {
      pdfToolsContainer.style.display = 'none';
    }
  }
}

function detectFileType(files) {
  if (!files || files.length === 0) return "unknown";
  
  const extensions = Array.from(files).map(f => f.name.split('.').pop().toLowerCase());
  
  if (extensions.every(ext => ["pdf"].includes(ext))) return "pdf";
  if (extensions.every(ext => ["docx", "doc"].includes(ext))) return "word";
  if (extensions.every(ext => ["pptx", "ppt"].includes(ext))) return "ppt";
  if (extensions.every(ext => ["xlsx", "xls", "csv"].includes(ext))) return "excel";
  if (extensions.every(ext => ["jpg", "jpeg", "png", "bmp", "gif", "tiff", "webp"].includes(ext))) return "image";
  return "mixed";
}

// Enhanced format options generation
function generateFormatOptions() {
  if (!formatOptions) return;
  
  const formatGroups = {
    'Documents': {
      formats: ['pdf', 'docx', 'txt'],
      icon: 'fas fa-file-alt',
      description: 'Document formats'
    },
    'Images': {
      formats: ['jpg', 'png', 'bmp', 'tiff', 'webp'],
      icon: 'fas fa-image',
      description: 'Image formats'
    },
    'Archives': {
      formats: ['zip'],
      icon: 'fas fa-file-archive',
      description: 'Compressed files'
    }
  };

  formatOptions.innerHTML = '';

  Object.entries(formatGroups).forEach(([groupName, group]) => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'format-group';
    groupDiv.innerHTML = `<h4><i class="${group.icon}"></i> ${groupName}</h4>`;
    
    const formatsDiv = document.createElement('div');
    formatsDiv.className = 'format-group-items';
    
    group.formats.forEach(format => {
      const label = document.createElement('label');
      label.className = 'format-option';
      label.innerHTML = `
        <input type="checkbox" name="formats" value="${format}">
        <div class="format-icon">
          <i class="${getFormatIcon(format)}"></i>
        </div>
        <span>${format.toUpperCase()}</span>
        <div class="format-description">${getFormatDescription(format)}</div>
      `;
      formatsDiv.appendChild(label);
    });
    
    groupDiv.appendChild(formatsDiv);
    formatOptions.appendChild(groupDiv);
  });
}

function getFormatIcon(format) {
  const iconMap = {
    'pdf': 'fas fa-file-pdf',
    'docx': 'fas fa-file-word',
    'txt': 'fas fa-file-alt',
    'jpg': 'fas fa-file-image',
    'png': 'fas fa-file-image',
    'bmp': 'fas fa-file-image',
    'tiff': 'fas fa-file-image',
    'webp': 'fas fa-file-image',
    'zip': 'fas fa-file-archive'
  };
  return iconMap[format] || 'fas fa-file';
}

function getFormatDescription(format) {
  const descriptions = {
    'pdf': 'Portable Document',
    'docx': 'Word Document',
    'txt': 'Plain Text',
    'jpg': 'JPEG Image',
    'png': 'PNG Image',
    'bmp': 'Bitmap Image',
    'tiff': 'TIFF Image',
    'webp': 'WebP Image',
    'zip': 'ZIP Archive'
  };
  return descriptions[format] || 'File Format';
}

// Enhanced summary generation
function updateSummary() {
  const selectedFormats = Array.from(document.querySelectorAll('input[name="formats"]:checked'))
    .map(cb => cb.value);
  
  const summaryFiles = document.getElementById('summaryFiles');
  const summaryOperations = document.getElementById('summaryOperations');
  const summaryOutput = document.getElementById('summaryOutput');
  
  // Files summary
  if (summaryFiles) {
    summaryFiles.innerHTML = selectedFiles.map(file => `
      <div class="summary-file-item">
        <i class="${getFileIcon(file.name)}"></i>
        <span>${file.name}</span>
        <span class="file-size">${formatFileSize(file.size)}</span>
      </div>
    `).join('');
  }
  
  // Operations summary
  const operations = [];
  if (selectedFormats.length > 0) {
    operations.push(`Convert to: ${selectedFormats.join(', ').toUpperCase()}`);
  }
  
  const mergeOption = document.getElementById('mergeOption');
  const splitOption = document.getElementById('splitOption');
  const deletePagesInput = document.getElementById('deletePagesInput');
  
  if (mergeOption && mergeOption.checked) {
    operations.push('Merge PDFs into one file');
  }
  if (splitOption && splitOption.checked) {
    operations.push('Split PDF into separate pages');
  }
  if (deletePagesInput && deletePagesInput.value) {
    operations.push(`Delete pages: ${deletePagesInput.value}`);
  }
  
  if (summaryOperations) {
    summaryOperations.innerHTML = operations.length > 0 
      ? operations.map(op => `<div class="operation-item"><i class="fas fa-check"></i> ${op}</div>`).join('')
      : '<div class="no-operations">No additional operations selected</div>';
  }
  
  // Output summary
  const outputFiles = selectedFiles.length * (selectedFormats.length || 1);
  if (summaryOutput) {
    summaryOutput.innerHTML = `
      <div class="output-info">
        <i class="fas fa-download"></i>
        <span>Expected output: ${outputFiles} file(s) in a ZIP archive</span>
      </div>
    `;
  }
}

// Enhanced loading and progress
function showLoading(show = true) {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = show ? 'block' : 'none';
  }
}

function updateProgress(percentage, status = '') {
  const progressBar = document.getElementById('progressBar');
  const progressText = progressBar ? progressBar.querySelector('.progress-text') : null;
  const progressStatus = document.getElementById('progressStatus');
  
  if (progressBar) {
    progressBar.style.width = percentage + '%';
  }
  if (progressText) {
    progressText.textContent = percentage + '%';
  }
  
  if (progressStatus && status) {
    progressStatus.textContent = status;
  }
}

// Language Support Functions
async function loadTranslation(lang) {
  try {
    const response = await fetch(`/translations/${lang}.json`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error(`Failed to load translation for ${lang}:`, error);
  }
  return null;
}

async function changeLanguage(lang) {
  if (!supportedLanguages.includes(lang)) {
    lang = 'en';
  }
  
  const translation = await loadTranslation(lang);
  if (translation) {
    translations = translation;
    currentLanguage = lang;
    updatePageTexts();
    localStorage.setItem('selectedLanguage', lang);
  }
}

function updatePageTexts() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[key]) {
      if (element.tagName === 'INPUT' && element.type === 'text') {
        element.placeholder = translations[key];
      } else {
        element.textContent = translations[key];
      }
    }
  });
  
  // Update document title
  if (translations.title) {
    document.title = translations.title;
  }
  
  // Update document direction for RTL languages
  const rtlLanguages = ['he', 'ar', 'fa'];
  document.documentElement.dir = rtlLanguages.includes(currentLanguage) ? 'rtl' : 'ltr';
}

function setupLanguageSelector() {
  const languageSelect = document.getElementById('languageSelect');
  if (!languageSelect) return;
  
  // Populate language options
  const languageNames = {
    'en': 'English',
    'he': 'עברית',
    'ar': 'العربية',
    'es': 'Español',
    'fr': 'Français',
    'pt': 'Português',
    'ru': 'Русский',
    'zh': '中文',
    'hi': 'हिन्दी',
    'fa': 'فارسی'
  };
  
  languageSelect.innerHTML = '';
  supportedLanguages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang;
    option.textContent = languageNames[lang] || lang;
    languageSelect.appendChild(option);
  });
  
  // Set saved language or default
  const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
  languageSelect.value = savedLanguage;
  changeLanguage(savedLanguage);
  
  // Add event listener
  languageSelect.addEventListener('change', (e) => {
    changeLanguage(e.target.value);
  });
}

// Dark Mode Functions
function setupDarkMode() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (!darkModeToggle) return;
  
  // Check saved preference or default to light mode
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  }
  
  // Add event listener
  darkModeToggle.addEventListener('click', () => {
    const isCurrentlyDark = document.body.classList.contains('dark-mode');
    
    if (isCurrentlyDark) {
      document.body.classList.remove('dark-mode');
      darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      localStorage.setItem('darkMode', 'false');
    } else {
      document.body.classList.add('dark-mode');
      darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      localStorage.setItem('darkMode', 'true');
    }
  });
}

// Navigation Functions
function goToStep2() {
  if (selectedFiles.length === 0) {
    showToast("Please select at least one file", false, "No Files Selected");
    return;
  }
  generateFormatOptions();
  showStep(2);
}

function goToStep3() {
  const selectedFormats = document.querySelectorAll('input[name="formats"]:checked');
  const pdfToolsUsed = selectedFiles.some(f => f.name.toLowerCase().endsWith('.pdf')) && (
    document.getElementById("mergeOption")?.checked ||
    document.getElementById("splitOption")?.checked ||
    document.getElementById("deletePagesInput")?.value.trim()
  );
  
  if (selectedFormats.length === 0 && !pdfToolsUsed) {
    showToast("Please select at least one output format or PDF operation", false, "No Action Selected");
    return;
  }
  updateSummary();
  showStep(3);
}

function handleFileChange(e) {
  handleFiles(Array.from(e.target.files));
}

// Conversion Function
async function handleConversion() {
  // Show loading overlay
  showLoading(true);
  
  // Show conversion progress section
  const conversionProgress = document.querySelector('.conversion-progress');
  if (conversionProgress) {
    conversionProgress.style.display = 'block';
  }
  
  updateProgress(10, 'Preparing files...');
  
  const formData = new FormData();
  selectedFiles.forEach(file => formData.append('files', file));

  // Get selected formats
  const selectedFormats = Array.from(document.querySelectorAll('input[name="formats"]:checked'))
    .map(cb => cb.value);
  selectedFormats.forEach(format => formData.append('formats[]', format));

  // PDF Tools
  const mergeOption = document.getElementById("mergeOption");
  const splitOption = document.getElementById("splitOption");
  const deletePagesInput = document.getElementById("deletePagesInput");

  if (mergeOption?.checked) formData.append('merge', 'true');
  if (splitOption?.checked) formData.append('split', 'true');
  if (deletePagesInput?.value) formData.append('delete_pages', deletePagesInput.value);

  try {
    updateProgress(30, 'Uploading files...');
    
    const response = await fetch('/convert', {
      method: 'POST',
      body: formData
    });

    updateProgress(70, 'Converting files...');

    if (response.ok) {
      updateProgress(90, 'Finalizing...');
      
      // Check if response is a file download
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/zip')) {
        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted_files.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        updateProgress(100, 'Download started!');
        setTimeout(() => {
          showLoading(false);
          showStep(4);
          showToast('Files converted and downloaded successfully!', true, 'Success');
        }, 1000);
      } else {
        // Handle JSON response
        const result = await response.json();
        showLoading(false);
        
        if (result.success) {
          showStep(4);
          showToast(result.message || 'Conversion completed successfully!', true, 'Success');
        } else {
          showToast(result.message || 'Conversion completed with warnings', true, 'Info');
          showStep(4);
        }
      }
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Conversion failed');
    }
  } catch (error) {
    showLoading(false);
    showToast(error.message, false, 'Conversion Failed');
    console.error('Conversion error:', error);
  }
}

// אתחול האפליקציה
document.addEventListener("DOMContentLoaded", () => {
  // הסתר את כל השלבים חוץ מהראשון
  showStep(1);
  
  // Setup all components
  setupDragAndDrop();
  setupLanguageSelector();
  setupDarkMode();
  
  // Setup file input change event
  if (inputFiles) {
    inputFiles.addEventListener('change', handleFileChange);
  }
  
  // Setup clear all button
  const clearAllBtn = document.getElementById('clearAll');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllFiles);
  }
  
  // Setup toast close button
  if (toast) {
    const toastClose = toast.querySelector('.toast-close');
    if (toastClose) {
      toastClose.addEventListener('click', () => {
        toast.classList.remove('show');
      });
    }
  }
  
  // Setup convert another button
  const convertAnotherBtn = document.getElementById('convertAnother');
  if (convertAnotherBtn) {
    convertAnotherBtn.addEventListener('click', () => {
      selectedFiles = [];
      updateFilePreview();
      showStep(1);
    });
  }
  
  // Setup navigation event listeners
  const nextStep1 = document.getElementById("nextStep1");
  const prevStep2 = document.getElementById("prevStep2");
  const nextStep2 = document.getElementById("nextStep2");
  const prevStep3 = document.getElementById("prevStep3");
  const convertButton = document.getElementById("convertButton");
  
  if (nextStep1) nextStep1.addEventListener("click", goToStep2);
  if (prevStep2) prevStep2.addEventListener("click", () => showStep(1));
  if (nextStep2) nextStep2.addEventListener("click", goToStep3);
  if (prevStep3) prevStep3.addEventListener("click", () => showStep(2));
  if (convertButton) convertButton.addEventListener("click", handleConversion);
});
