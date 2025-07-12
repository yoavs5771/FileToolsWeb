document.addEventListener("DOMContentLoaded", function () {
    const langSelector = document.getElementById("language");
    const defaultLang = localStorage.getItem("lang") || "en";
    const supportedLangs = ["en", "he", "fr", "es", "ru", "ar", "zh", "fa", "pt", "hi"];

    // Populate language dropdown
    supportedLangs.forEach(lang => {
        const option = document.createElement("option");
        option.value = lang;
        option.textContent = lang.toUpperCase();
        if (lang === defaultLang) option.selected = true;
        langSelector.appendChild(option);
    });

    // Load translation file
    function loadLanguage(lang) {
        fetch(`/translations/${lang}.json`)
            .then(res => res.json())
            .then(data => {
                window.translations = data;
                applyTranslations(data);
            })
            .catch(() => console.warn("⚠️ Translation file missing for: ", lang));
    }

    // Replace text content using data-i18n attribute
    function applyTranslations(dict) {
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (dict[key]) {
                el.textContent = dict[key];
            }
        });
    }

    // Handle language change
    langSelector.addEventListener("change", function () {
        const selected = this.value;
        localStorage.setItem("lang", selected);
        loadLanguage(selected);
    });

    // Initial load
    loadLanguage(defaultLang);
});
