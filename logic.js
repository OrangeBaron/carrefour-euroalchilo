window.CarrefourSorter.Core = {
    run: async function() {
        const Config = window.CarrefourSorter.Config;
        const Utils = window.CarrefourSorter.Utils;
        const UI = window.CarrefourSorter.UI;

        // --- CORE LOGIC ---
        let keepFetching = true;

        // 1. Recupero parametri contesto
        const cgid = Utils.getCgid();
        const searchQuery = Utils.getSearchQuery();
        const storeId = Utils.getStoreId();
        
        // 2. Controllo validità: serve o una categoria o una query di ricerca
        if (!cgid && !searchQuery) {
            alert("⚠️ Vai in una categoria prodotti o effettua una ricerca per usare lo strumento.");
            return;
        }

        let allProducts = [];
        let start = 0;
        let seenIds = new Set();

        // Nascondi loader esistenti per evitare confusione visiva
        const loaders = document.querySelectorAll(Config.SELECTORS.LOADER);
        loaders.forEach(l => l.style.display = 'none');
        
        // Preparazione container griglia
        const gridContainer = document.querySelector(Config.SELECTORS.GRID);
        if(gridContainer) gridContainer.classList.remove('js-search-content');

        // Mostra status box "Caricamento..."
        UI.updateStatus(false);

        // --- LOOP DI FETCHING ---
        while (keepFetching) {
            let url;
            const baseUrl = `${window.location.origin}/on/demandware.store/Sites-carrefour-IT-Site/it_IT`;

            // 3. Costruzione URL dinamica
            if (searchQuery) {
                // Endpoint per la PAGINA DI RICERCA
                url = `${baseUrl}/FactFinder-Search?q=${searchQuery}&start=${start}&sz=${Config.BATCH_SIZE}&storeId=${storeId}&updateGrid=true`;
            } else {
                // Endpoint per le CATEGORIE
                url = `${baseUrl}/Search-UpdateGrid?cgid=${cgid}&start=${start}&sz=${Config.BATCH_SIZE}&storeId=${storeId}`;
            }
            
            try {
                const response = await fetch(url);
                if (!response.ok) break; 
                
                const text = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');
                
                // Seleziona le card prodotto
                const tiles = doc.querySelectorAll(Config.SELECTORS.ITEM);
                
                // Se non ci sono prodotti, abbiamo raggiunto la fine
                if (tiles.length === 0) break; 

                tiles.forEach(tile => {
                    // Trova l'elemento che contiene il JSON
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
                        // Evita duplicati
                        if (!seenIds.has(data.id)) {
                            seenIds.add(data.id);
                            
                            // Calcolo Prezzo al KG
                            const weightKg = Utils.parseWeightToKg(data.dimension52);
                            const price = parseFloat(data.price);
                            // Se peso non trovato o prezzo 0, metti Infinity per mandarli in fondo
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

                // Incrementa offset per la prossima pagina
                start += Config.BATCH_SIZE;
                
                // Piccolo delay per non sovraccaricare il server
                await new Promise(r => setTimeout(r, Config.DELAY_MS));

            } catch (err) {
                console.error("Errore di rete durante il fetch:", err);
                keepFetching = false;
            }
        }

        // --- ORDINAMENTO E RENDERING ---
        
        // Ordina array: dal più economico al più costoso (al Kg)
        allProducts.sort((a, b) => a.pricePerKg - b.pricePerKg);

        if (gridContainer && allProducts.length > 0) {
            gridContainer.innerHTML = '';
            const fragment = document.createDocumentFragment();
            
            allProducts.forEach(p => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = p.html;
                
                // Estrae il nodo elemento dal wrapper temporaneo
                let productNode = tempDiv.firstElementChild;
                while(productNode && productNode.nodeType !== 1) {
                    productNode = productNode.nextSibling;
                }
                if(productNode) fragment.appendChild(productNode);
            });
            
            gridContainer.appendChild(fragment);
            
            // Fine caricamento: nascondi status
            UI.updateStatus(true);
        } else {
            alert("Nessun prodotto trovato. Assicurati di essere in una pagina valida.");
            UI.updateStatus(true);
        }
    }
};