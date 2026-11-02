window.CarrefourSorter.Core = {
    run: async function() {
        const Config = window.CarrefourSorter.Config;
        const Utils = window.CarrefourSorter.Utils;
        const UI = window.CarrefourSorter.UI;

        const batchSz = 10; 

        if (!Utils.getCgid() && !Utils.getSearchQuery()) {
            alert("Vai in una categoria prodotti o effettua una ricerca per usare lo strumento.");
            return;
        }
                 
        let allProducts = [];
        let seenIds = new Set();
        let hasErrors = false;

        let expectedTotal = 0;
        const countEl = document.querySelector('.results-count');
        if (countEl) {
            const match = countEl.textContent.replace(/\./g, '').match(/\d+/);
            if (match) expectedTotal = parseInt(match[0], 10);
        }

        const loaders = document.querySelectorAll(Config.SELECTORS.LOADER);
        loaders.forEach(l => l.style.display = 'none');
                          
        const gridContainer = document.querySelector(Config.SELECTORS.GRID);
        if(gridContainer) gridContainer.classList.remove('js-search-content');

        UI.updateStatus(false);
        UI.statusBox.innerText = expectedTotal > 0 ? `Caricamento... 0 / ${expectedTotal}` : 'Caricamento in corso...';

        const parser = new DOMParser(); 

        const getUrl = (startPos) => Utils.buildApiUrl(startPos, batchSz);

        // Funzione di utilità per parsare l'HTML e aggiornare l'array
        const processHtml = (text) => {
            const doc = parser.parseFromString(text, 'text/html');
            const tiles = doc.querySelectorAll(Config.SELECTORS.ITEM);

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
                } catch(e) {
                     console.warn("Errore parsing JSON prodotto", e);
                }
            });

            // Aggiorna progressivamente il counter visivo
            if (expectedTotal > 0) {
                UI.statusBox.innerText = `Caricamento... ${Math.min(allProducts.length, expectedTotal)} / ${expectedTotal}`;
            } else {
                UI.statusBox.innerText = `Caricamento... ${allProducts.length} estratti`;
            }
        };

        // Funzione sicura per fare la singola chiamata con ritentativi
        const fetchWithRetry = async (url) => {
            for (let retries = 0; retries < 3; retries++) {
                try {
                    const response = await fetch(url);
                    if (response.ok) return await response.text();
                    if (response.status === 404 || response.status === 400) return null;
                } catch (err) {
                    // Errore di rete, riprova al giro successivo
                }
                await new Promise(r => setTimeout(r, 1000));
            }
            hasErrors = true;
            return null;
        };

        // === FASE DI RECUPERO DATI ===
        if (expectedTotal > 0) {
            const concurrencyLimit = 5; 
            const offsets = [];

            for (let start = 0; start < expectedTotal; start += batchSz) {
                offsets.push(start);
            }

            let activeRequests = 0;
            let currentIndex = 0;

            await new Promise((resolve) => {
                const processNext = () => {
                    if (currentIndex >= offsets.length && activeRequests === 0) {
                        resolve();
                        return;
                    }

                    while (activeRequests < concurrencyLimit && currentIndex < offsets.length) {
                        const start = offsets[currentIndex];
                        currentIndex++;
                        activeRequests++;

                        const url = getUrl(start);
                        
                        fetchWithRetry(url)
                            .then(text => {
                                if (text) processHtml(text);
                            })
                            .finally(() => {
                                activeRequests--;
                                processNext(); 
                            });
                    }
                };

                processNext(); 
            });

            await new Promise(r => setTimeout(r, 200));

        } else {
            let start = 0;
            let keepFetching = true;
            while (keepFetching) {
                const url = getUrl(start);
                const text = await fetchWithRetry(url);
                
                if (text) {
                    const doc = parser.parseFromString(text, 'text/html');
                    const tiles = doc.querySelectorAll(Config.SELECTORS.ITEM);

                    if (tiles.length === 0) {
                        keepFetching = false;
                    } else {
                        processHtml(text);
                        start += batchSz;
                    }
                } else {
                    keepFetching = false;
                }
            }
        }

        // === FASE DI ORDINAMENTO E RENDERING ===
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
        } else if (!hasErrors && allProducts.length === 0) {
            alert("Nessun prodotto trovato. Assicurati di essere in una pagina valida.");
        }

        UI.updateStatus(true);

        if (hasErrors) {
            setTimeout(() => {
                alert(`Si è verificato un errore di rete. L'ordinamento mostra i ${allProducts.length} prodotti recuperati con successo.`);
            }, 500);
        }
    }
};