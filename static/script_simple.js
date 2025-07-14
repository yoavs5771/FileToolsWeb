// JavaScript פשוט ועובד
let selectedFiles = [];
let currentLanguage = 'en';
let translations = {};

// Elements
const uploadArea = document.getElementById('uploadArea');
const inputFiles = document.getElementById('inputFiles');
const fileList = document.getElementById('fileList');
const fileItems = document.getElementById('fileItems');
const formatOptions = document.getElementById('formatOptions');
const formatGrid = document.getElementById('formatGrid');
const pdfTools = document.getElementById('pdfTools');
const convertSection = document.getElementById('convertSection');
const convertBtn = document.getElementById('convertBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const toastBox = document.getElementById('toastBox');
const languageSelect = document.getElementById('languageSelect');
const darkModeToggle = document.getElementById('darkModeToggle');

// Format options
const formatData = {
  'pdf': { icon: 'fas fa-file-pdf', name: 'PDF' },
  'docx': { icon: 'fas fa-file-word', name: 'Word' },
  'pptx': { icon: 'fas fa-file-powerpoint', name: 'PowerPoint' },
  'xlsx': { icon: 'fas fa-file-excel', name: 'Excel' },
  'jpg': { icon: 'fas fa-image', name: 'JPG' },
  'png': { icon: 'fas fa-image', name: 'PNG' }
};

// Show toast message
function showToast(message, isSuccess = false) {
  const toastIcon = toastBox.querySelector('.toast-icon i');
  const toastTitle = toastBox.querySelector('.toast-title');
  const toastMessage = toastBox.querySelector('.toast-message');
  
  toastIcon.className = isSuccess ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
  toastTitle.textContent = isSuccess ? 'Success' : 'Error';
  toastMessage.textContent = message;
  
  toastBox.className = isSuccess ? 'toast success show' : 'toast show';
  
  setTimeout(() => {
    toastBox.classList.remove('show');
  }, 4000);
}

// File handling
function handleFiles(files) {
  selectedFiles = Array.from(files);
  
  if (selectedFiles.length === 0) {
    fileList.classList.add('hidden');
    formatOptions.classList.add('hidden');
    pdfTools.classList.add('hidden');
    convertSection.classList.add('hidden');
    return;
  }
  
  displayFiles();
  showFormatOptions();
  fileList.classList.remove('hidden');
  convertSection.classList.remove('hidden');
}

function displayFiles() {
  fileItems.innerHTML = '';
  
  selectedFiles.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const extension = file.name.split('.').pop().toLowerCase();
    const format = formatData[extension] || { icon: 'fas fa-file', name: 'File' };
    
    fileItem.innerHTML = `
      <div class="file-icon">
        <i class="${format.icon}"></i>
      </div>
      <div class="file-info">
        <h4>${file.name}</h4>
        <p>${(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
      <button class="file-remove" onclick="removeFile(${index})">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    fileItems.appendChild(fileItem);
  });
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  handleFiles(selectedFiles);
}

function showFormatOptions() {
  formatGrid.innerHTML = '';
  
  // Detect file types
  const hasImages = selectedFiles.some(f => /\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(f.name));
  const hasPDFs = selectedFiles.some(f => /\.pdf$/i.test(f.name));
  const hasDocuments = selectedFiles.some(f => /\.(docx|pptx|xlsx)$/i.test(f.name));
  
  // Show format options based on file types
  Object.entries(formatData).forEach(([format, data]) => {
    if (format === 'pdf' && (hasImages || hasDocuments)) {
      createFormatOption(format, data);
    } else if ((format === 'jpg' || format === 'png') && (hasPDFs || hasDocuments)) {
      createFormatOption(format, data);
    }
  });
  
  // Show PDF tools if PDFs are selected
  if (hasPDFs) {
    pdfTools.classList.remove('hidden');
  } else {
    pdfTools.classList.add('hidden');
  }
  
  formatOptions.classList.remove('hidden');
}

function createFormatOption(format, data) {
  const option = document.createElement('div');
  option.className = 'format-option';
  option.onclick = () => toggleFormat(format, option);
  
  option.innerHTML = `
    <input type="checkbox" value="${format}">
    <i class="${data.icon}"></i>
    <span>${data.name}</span>
  `;
  
  formatGrid.appendChild(option);
}

function toggleFormat(format, element) {
  const checkbox = element.querySelector('input');
  checkbox.checked = !checkbox.checked;
  element.classList.toggle('selected', checkbox.checked);
}

function toggleOption(optionName) {
  const checkbox = document.getElementById(optionName);
  checkbox.checked = !checkbox.checked;
  
  if (optionName === 'split' && checkbox.checked) {
    document.getElementById('deleteSection').classList.remove('hidden');
  } else if (optionName === 'split' && !checkbox.checked) {
    document.getElementById('deleteSection').classList.add('hidden');
  }
}

// Convert files
async function startConversion() {
  const selectedFormats = Array.from(document.querySelectorAll('.format-option.selected input')).map(input => input.value);
  const merge = document.getElementById('merge').checked;
  const split = document.getElementById('split').checked;
  const deletePages = document.getElementById('deletePages').value;
  
  if (selectedFormats.length === 0 && !merge && !split) {
    showToast(getTranslation('select_action') || 'Please select an action');
    return;
  }
  
  const formData = new FormData();
  selectedFiles.forEach(file => {
    formData.append('files', file);
  });
  
  selectedFormats.forEach(format => {
    formData.append('formats[]', format);
  });
  
  if (merge) formData.append('merge', 'true');
  if (split) formData.append('split', 'true');
  if (deletePages) formData.append('delete_pages', deletePages);
  
  convertBtn.disabled = true;
  progressContainer.style.display = 'block';
  
  try {
    const response = await fetch('/convert', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const blob = await response.blob();
      if (blob.size > 0) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'converted_files.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        showToast(getTranslation('conversion_success') || 'Files converted successfully!', true);
      } else {
        showToast(getTranslation('no_file_error') || 'No file to download');
      }
    } else {
      const error = await response.json();
      showToast(error.error || 'Conversion failed');
    }
  } catch (error) {
    showToast(getTranslation('conversion_error') || 'Conversion failed: ' + error.message);
  } finally {
    convertBtn.disabled = false;
    progressContainer.style.display = 'none';
  }
}

// Language system
async function loadTranslation(lang) {
  try {
    const response = await fetch(`/translations/${lang}.json`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to load translation:', error);
  }
  return {};
}

function getTranslation(key) {
  return translations[key] || key;
}

function updateUI() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = getTranslation(key);
    
    if (element.tagName === 'INPUT' && element.type === 'text') {
      element.placeholder = translation;
    } else {
      element.textContent = translation;
    }
  });
  
  // Update direction for RTL languages
  if (['he', 'ar', 'fa'].includes(currentLanguage)) {
    document.body.classList.add('rtl');
  } else {
    document.body.classList.remove('rtl');
  }
}

async function changeLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('selectedLanguage', lang);
  languageSelect.value = lang;
  
  translations = await loadTranslation(lang);
  updateUI();
}

// Dark mode
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  
  const icon = darkModeToggle.querySelector('i');
  icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

// Event listeners
uploadArea.addEventListener('click', () => inputFiles.click());

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});

inputFiles.addEventListener('change', (e) => {
  handleFiles(e.target.files);
});

languageSelect.addEventListener('change', (e) => {
  changeLanguage(e.target.value);
});

darkModeToggle.addEventListener('click', toggleDarkMode);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
  const savedDarkMode = localStorage.getItem('darkMode') === 'true';
  
  if (savedDarkMode) {
    document.body.classList.add('dark-mode');
    darkModeToggle.querySelector('i').className = 'fas fa-sun';
  }
  
  changeLanguage(savedLanguage);
});
