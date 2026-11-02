window.CarrefourSorter.Core = {
    run: async function() {
        const Config = window.CarrefourSorter.Config;
        const Utils = window.CarrefourSorter.Utils;
        const UI = window.CarrefourSorter.UI;
        
        let keepFetching = true;
        const cgid = Utils.getCgid();
        const searchQuery = Utils.getSearchQuery();
        const storeId = Utils.getStoreId();
                 
        if (!cgid && !searchQuery) {
            alert("Vai in una categoria prodotti o effettua una ricerca per usare lo strumento.");
            return;
        }
        
        let allProducts = [];
        let start = 0;
        let seenIds = new Set();
        let hasErrors = false; // Traccia se il caricamento si è interrotto per errori di rete
        
        const loaders = document.querySelectorAll(Config.SELECTORS.LOADER);
        loaders.forEach(l => l.style.display = 'none');
                 
        const gridContainer = document.querySelector(Config.SELECTORS.GRID);
        if(gridContainer) gridContainer.classList.remove('js-search-content');
        
        UI.updateStatus(false);
        const parser = new DOMParser(); 

        while (keepFetching) {
            let url;
            const baseUrl = `${window.location.origin}/on/demandware.store/Sites-carrefour-IT-Site/it_IT`;
            
            if (searchQuery) {
                url = `${baseUrl}/FactFinder-Search?q=${searchQuery}&start=${start}&sz=${Config.BATCH_SIZE}&storeId=${storeId}&updateGrid=true`;
            } else {
                url = `${baseUrl}/Search-UpdateGrid?cgid=${cgid}&start=${start}&sz=${Config.BATCH_SIZE}&storeId=${storeId}`;
            }
                         
            let success = false;
            let retries = 0;
            const maxRetries = 3;
            let text = "";

            // Sistema di retry locale per la singola chiamata HTTP
            while (retries < maxRetries && !success) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        text = await response.text();
                        success = true;
                    } else if (response.status === 404 || response.status === 400) {
                        // Fine dei risultati raggiungibile dal server
                        keepFetching = false;
                        break;
                    } else {
                        // Errore server (es. 500, 502, 504)
                        retries++;
                        await new Promise(r => setTimeout(r, 1000));
                    }
                } catch (err) {
                    // Errore di rete (es. disconnessione)
                    retries++;
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            // Se dopo i tentativi non c'è stato successo, interrompe tutto
            if (!success && keepFetching) {
                hasErrors = true;
                break;
            }

            // Procediamo al parsing solo se la chiamata è andata a buon fine
            if (success) {
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
                    } catch(e) {
                         console.warn("Errore parsing JSON prodotto", e);
                    }
                });
                
                start += Config.BATCH_SIZE;
                await new Promise(r => setTimeout(r, Config.DELAY_MS));
            }
        }
                 
        // Ordina array: dal più economico al più costoso
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
        } else if (!hasErrors) {
            alert("Nessun prodotto trovato. Assicurati di essere in una pagina valida.");
        }

        UI.updateStatus(true);

        // Avvisa se l'ordinamento è parziale a causa di errori
        if (hasErrors) {
            setTimeout(() => {
                alert("Si è verificato un errore di rete. L'ordinamento mostra solo i prodotti scaricati parzialmente.");
            }, 500);
        }
    }
};