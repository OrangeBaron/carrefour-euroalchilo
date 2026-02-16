// Inizializza il namespace globale
window.CarrefourSorter = window.CarrefourSorter || {};

window.CarrefourSorter.Config = {
    BATCH_SIZE: 10,
    DELAY_MS: 10,
    SELECTORS: {
        GRID: '.product-grid',
        ITEM: '.product-item',
        LOADER: '.loader, .infinite-scroll, .show-more',
        SORT_LIST: 'ul[name="sort-order"]',
        SORT_LI_ID: 'weight-sorter-li'
    }
};