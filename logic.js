window.CarrefourSorter.Core = {
    run: async function() {
        const Config = window.CarrefourSorter.Config;
        const Utils = window.CarrefourSorter.Utils;
        const UI = window.CarrefourSorter.UI;

        // CORE LOGIC
        let keepFetching = true;
        const cgid = Utils.getCgid();
        const storeId = Utils.getStoreId();
        
        if (!cgid) {
            alert("⚠️ Vai in una categoria prodotti specifica per usare lo strumento.");
            return;
        }

        let allProducts = [];
        let start = 0;
        let seenIds = new Set();

        const loaders = document.querySelectorAll(Config.SELECTORS.LOADER);
        loaders.forEach(l => l.style.display = 'none');
        
        const gridContainer = document.querySelector(Config.SELECTORS.GRID);
        if(gridContainer) gridContainer.classList.remove('js-search-content');

        // UI Feedback
        UI.updateStatus(false);

        while (keepFetching) {
            const url = `${window.location.origin}/on/demandware.store/Sites-carrefour-IT-Site/it_IT/Search-UpdateGrid?cgid=${cgid}&start=${start}&sz=${Config.BATCH_SIZE}&storeId=${storeId}`;
            
            try {
                const response = await fetch(url);
                if (!response.ok) break; 
                const text = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');
                const tiles = doc.querySelectorAll(Config.SELECTORS.ITEM);
                if (tiles.length === 0) break; 

                tiles.forEach(tile => {
                    let jsonEl = tile.tagName === 'ARTICLE' ? tile : tile.querySelector('article');
                    let jsonAttr = null;
                    if (jsonEl && jsonEl.hasAttribute('data-product-json')) {
                        jsonAttr = jsonEl.getAttribute('data-product-json');
                    } else if (tile.hasAttribute('data-product-json')) {
                        jsonAttr = tile.getAttribute('data-product-json');
                    }

                    if (!jsonAttr) return; 

                    try {
                        const data = JSON.parse(jsonAttr);
                        if (!seenIds.has(data.id)) {
                            seenIds.add(data.id);
                            const weightKg = Utils.parseWeightToKg(data.dimension52);
                            const price = parseFloat(data.price);
                            const ppg = (weightKg && price) ? (price / weightKg) : Infinity;

                            allProducts.push({
                                id: data.id,
                                pricePerKg: ppg,
                                html: tile.outerHTML
                            });
                        }
                    } catch(e) { }
                });

                start += Config.BATCH_SIZE;
                await new Promise(r => setTimeout(r, Config.DELAY_MS));

            } catch (err) {
                console.error("Errore di rete", err);
                keepFetching = false;
            }
        }

        allProducts.sort((a, b) => a.pricePerKg - b.pricePerKg);

        if (gridContainer && allProducts.length > 0) {
            gridContainer.innerHTML = '';
            const fragment = document.createDocumentFragment();
            allProducts.forEach(p => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = p.html;
                let productNode = tempDiv.firstElementChild;
                while(productNode && productNode.nodeType !== 1) {
                    productNode = productNode.nextSibling;
                }
                if(productNode) fragment.appendChild(productNode);
            });
            gridContainer.appendChild(fragment);
            
            // Fine caricamento
            UI.updateStatus(true);
        } else {
            alert("Nessun prodotto trovato. Assicurati di essere in una categoria.");
            UI.updateStatus(true);
        }
    }
};