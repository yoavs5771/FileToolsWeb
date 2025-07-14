// JavaScript מעוצב ומשופר עם אנימציות
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
const loadingOverlay = document.getElementById('loadingOverlay');

// Format options with enhanced icons
const formatData = {
  'pdf': { icon: 'fas fa-file-pdf', name: 'PDF', color: '#dc3545' },
  'docx': { icon: 'fas fa-file-word', name: 'Word', color: '#2b579a' },
  'pptx': { icon: 'fas fa-file-powerpoint', name: 'PowerPoint', color: '#d24726' },
  'xlsx': { icon: 'fas fa-file-excel', name: 'Excel', color: '#107c41' },
  'jpg': { icon: 'fas fa-image', name: 'JPG', color: '#ff6b35' },
  'png': { icon: 'fas fa-image', name: 'PNG', color: '#4285f4' },
  'gif': { icon: 'fas fa-image', name: 'GIF', color: '#ff9500' },
  'bmp': { icon: 'fas fa-image', name: 'BMP', color: '#9b59b6' }
};

// Enhanced toast function with animations
function showToast(message, type = 'info') {
  const toastIcon = toastBox.querySelector('.toast-icon i');
  const toastTitle = toastBox.querySelector('.toast-title');
  const toastMessage = toastBox.querySelector('.toast-message');
  
  // Set icon and title based on type
  switch(type) {
    case 'success':
      toastIcon.className = 'fas fa-check-circle';
      toastTitle.textContent = '✅ Success';
      toastBox.className = 'toast success show';
      break;
    case 'error':
      toastIcon.className = 'fas fa-exclamation-triangle';
      toastTitle.textContent = '❌ Error';
      toastBox.className = 'toast error show';
      break;
    case 'warning':
      toastIcon.className = 'fas fa-exclamation-circle';
      toastTitle.textContent = '⚠️ Warning';
      toastBox.className = 'toast warning show';
      break;
    default:
      toastIcon.className = 'fas fa-info-circle';
      toastTitle.textContent = 'ℹ️ Info';
      toastBox.className = 'toast show';
  }
  
  toastMessage.textContent = message;
  
  // Add success animation for success toasts
  if (type === 'success') {
    toastBox.classList.add('success-animation');
    setTimeout(() => toastBox.classList.remove('success-animation'), 1000);
  }
  
  setTimeout(() => {
    toastBox.classList.remove('show');
  }, 5000);
}

// Enhanced file handling with animations
function handleFiles(files) {
  selectedFiles = Array.from(files);
  
  if (selectedFiles.length === 0) {
    hideAllSections();
    return;
  }
  
  displayFiles();
  showFormatOptions();
  showSections();
}

function hideAllSections() {
  fileList.classList.add('hidden');
  formatOptions.classList.add('hidden');
  pdfTools.classList.add('hidden');
  convertSection.classList.add('hidden');
}

function showSections() {
  fileList.classList.remove('hidden');
  convertSection.classList.remove('hidden');
}

function displayFiles() {
  fileItems.innerHTML = '';
  
  selectedFiles.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item fade-in-up';
    
    const extension = file.name.split('.').pop().toLowerCase();
    const format = formatData[extension] || { icon: 'fas fa-file', name: 'File', color: '#6c757d' };
    
    fileItem.innerHTML = `
      <div class="file-icon" style="color: ${format.color}">
        <i class="${format.icon}"></i>
      </div>
      <div class="file-info">
        <h4>${file.name}</h4>
        <p>${(file.size / 1024 / 1024).toFixed(2)} MB • ${format.name}</p>
      </div>
      <button class="file-remove" onclick="removeFile(${index})" title="Remove file">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    fileItems.appendChild(fileItem);
  });
  
  // Add animation delay for staggered effect
  document.querySelectorAll('.file-item').forEach((item, index) => {
    item.style.animationDelay = `${index * 0.1}s`;
  });
}

function removeFile(index) {
  const fileItem = document.querySelectorAll('.file-item')[index];
  if (fileItem) {
    fileItem.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => {
      selectedFiles.splice(index, 1);
      handleFiles(selectedFiles);
      showToast('File removed successfully', 'success');
    }, 300);
  }
}

function showFormatOptions() {
  formatGrid.innerHTML = '';
  
  // Detect file types
  const hasImages = selectedFiles.some(f => /\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(f.name));
  const hasPDFs = selectedFiles.some(f => /\.pdf$/i.test(f.name));
  const hasDocuments = selectedFiles.some(f => /\.(docx|pptx|xlsx)$/i.test(f.name));
  
  // Show format options
  if (hasImages || hasDocuments) {
    createFormatOption('pdf', formatData.pdf);
  }
  if (hasPDFs || hasDocuments) {
    createFormatOption('jpg', formatData.jpg);
    createFormatOption('png', formatData.png);
  }
  if (hasImages || hasPDFs) {
    createFormatOption('docx', formatData.docx);
  }
  
  // Always add these basic conversions
  if (hasImages) {
    createFormatOption('png', formatData.png);
    createFormatOption('jpg', formatData.jpg);
  }
  
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

function togglePDFOption(optionName) {
  const checkbox = document.getElementById(optionName);
  const option = checkbox.closest('.format-option');
  
  checkbox.checked = !checkbox.checked;
  option.classList.toggle('selected', checkbox.checked);
  
  if (optionName === 'split' && checkbox.checked) {
    document.getElementById('deleteSection').classList.remove('hidden');
  } else if (optionName === 'split' && !checkbox.checked) {
    document.getElementById('deleteSection').classList.add('hidden');
  }
}

// Enhanced convert files function
async function startConversion() {
  const selectedFormats = Array.from(document.querySelectorAll('.format-option.selected input[value]')).map(input => input.value);
  const merge = document.getElementById('merge').checked;
  const split = document.getElementById('split').checked;
  const deletePages = document.getElementById('deletePages').value;
  
  if (selectedFormats.length === 0 && !merge && !split) {
    showToast('Please select an action or format', 'warning');
    return;
  }
  
  if (selectedFiles.length === 0) {
    showToast('Please select files first', 'warning');
    return;
  }
  
  // Show loading overlay
  loadingOverlay.classList.remove('hidden');
  
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
  
  // Disable button and show progress
  convertBtn.disabled = true;
  convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
  progressContainer.classList.remove('hidden');
  
  // Animate progress bar
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 90) progress = 90;
    progressFill.style.width = progress + '%';
  }, 500);
  
  try {
    const response = await fetch('/convert', {
      method: 'POST',
      body: formData
    });
    
    clearInterval(progressInterval);
    progressFill.style.width = '100%';
    
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
        document.body.removeChild(a);
        
        // Success feedback
        showToast('Files converted successfully! 🎉', 'success');
        convertBtn.classList.add('success-animation');
        setTimeout(() => convertBtn.classList.remove('success-animation'), 1000);
      } else {
        showToast('No file was generated for download', 'warning');
      }
    } else {
      const error = await response.json();
      showToast(error.error || 'Conversion failed', 'error');
    }
  } catch (error) {
    clearInterval(progressInterval);
    showToast('Conversion error: ' + error.message, 'error');
  } finally {
    // Reset UI
    loadingOverlay.classList.add('hidden');
    convertBtn.disabled = false;
    convertBtn.innerHTML = '<i class="fas fa-rocket"></i> <span data-i18n="convert">🚀 Convert Files</span>';
    progressContainer.classList.add('hidden');
    progressFill.style.width = '0%';
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
    
    if (element.tagName === 'INPUT' && element.placeholder !== undefined) {
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

// Enhanced dark mode toggle
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  
  const icon = darkModeToggle.querySelector('i');
  icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  
  // Add rotation animation
  darkModeToggle.style.transform = 'rotate(360deg)';
  setTimeout(() => {
    darkModeToggle.style.transform = '';
  }, 300);
  
  showToast(`${isDark ? '🌙 Dark' : '☀️ Light'} mode activated`, 'success');
}

// Enhanced drag and drop with visual feedback
function setupDragAndDrop() {
  uploadArea.addEventListener('click', (e) => {
    e.preventDefault();
    inputFiles.click();
  });

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    if (!uploadArea.contains(e.relatedTarget)) {
      uploadArea.classList.remove('dragover');
    }
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    uploadArea.classList.add('file-uploading');
    
    if (e.dataTransfer.files.length > 0) {
      setTimeout(() => {
        handleFiles(e.dataTransfer.files);
        uploadArea.classList.remove('file-uploading');
      }, 500);
    }
  });

  inputFiles.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      uploadArea.classList.add('file-uploading');
      setTimeout(() => {
        handleFiles(e.target.files);
        uploadArea.classList.remove('file-uploading');
      }, 300);
    }
  });
}

languageSelect.addEventListener('change', (e) => {
  changeLanguage(e.target.value);
});

darkModeToggle.addEventListener('click', toggleDarkMode);

// Enhanced initialization
document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
  const savedDarkMode = localStorage.getItem('darkMode') === 'true';
  
  // Apply saved settings
  if (savedDarkMode) {
    document.body.classList.add('dark-mode');
    darkModeToggle.querySelector('i').className = 'fas fa-sun';
  }
  
  languageSelect.value = savedLanguage;
  changeLanguage(savedLanguage);
  
  // Setup enhanced interactions
  setupDragAndDrop();
  
  // Add event listeners
  languageSelect.addEventListener('change', (e) => {
    changeLanguage(e.target.value);
  });
  
  darkModeToggle.addEventListener('click', toggleDarkMode);
  
  // Add entrance animation to main elements
  document.querySelector('.header').classList.add('fade-in-up');
  document.querySelector('.main-content').classList.add('fade-in-up');
  document.querySelector('.footer').classList.add('fade-in-up');
  
  // Welcome message
  setTimeout(() => {
    showToast('Welcome to File Converter Pro! 🚀', 'success');
  }, 1000);
});
