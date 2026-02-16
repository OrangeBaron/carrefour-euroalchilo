(function() {
    const UI = window.CarrefourSorter.UI;
    const Config = window.CarrefourSorter.Config;

    // --- OBSERVER ---
    const observer = new MutationObserver((mutations) => {
        // Controlla se il menu esiste ma il nostro bottone no
        if (document.querySelector(Config.SELECTORS.SORT_LIST) && 
            !document.getElementById(Config.SELECTORS.SORT_LI_ID)) {
            UI.injectSortOption();
        }
    });

    // Avvia observer
    observer.observe(document.body, { childList: true, subtree: true });

    // Check iniziale
    UI.injectSortOption();
    
    console.log("Carrefour Sorter Refactored loaded.");
})();