const availableLanguages = ["en", "he", "fr", "es", "ru", "zh", "ar", "hi", "fa", "pt"];

window.addEventListener("DOMContentLoaded", () => {
    const languageSelect = document.getElementById("languageSelect");
    const htmlTag = document.documentElement;

    // Populate language dropdown
    availableLanguages.forEach(lang => {
        const option = document.createElement("option");
        option.value = lang;
        option.textContent = getLanguageName(lang);
        languageSelect.appendChild(option);
    });

    // Try to set default language from browser or fallback to English
    const defaultLang = navigator.language.slice(0, 2);
    if (availableLanguages.includes(defaultLang)) {
        languageSelect.value = defaultLang;
        loadLanguage(defaultLang);
    } else {
        languageSelect.value = "en";
        loadLanguage("en");
    }

    // Change language when selected
    languageSelect.addEventListener("change", () => {
        const selectedLang = languageSelect.value;
        loadLanguage(selectedLang);
    });

    function loadLanguage(lang) {
        fetch(`/translations/${lang}.json`)
            .then(res => res.json())
            .then(strings => {
                for (const key in strings) {
                    const elem = document.querySelector(`[data-i18n="${key}"]`);
                    if (elem) {
                        elem.textContent = strings[key];
                    }
                }

                // Set direction
                if (["he", "ar", "fa"].includes(lang)) {
                    htmlTag.setAttribute("dir", "rtl");
                } else {
                    htmlTag.setAttribute("dir", "ltr");
                }
            })
            .catch(err => console.error(`Could not load language: ${lang}`, err));
    }

    function getLanguageName(code) {
        const names = {
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
        return names[code] || code;
    }
});
