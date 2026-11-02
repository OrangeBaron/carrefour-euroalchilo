window.CarrefourSorter.Utils = {
    /**
     * Recupera l'ID della categoria (cgid) dall'URL o dal path.
     */
    getCgid: function() {
        const params = new URLSearchParams(window.location.search);
        let cgid = params.get('cgid');
        if (!cgid) {
            const path = window.location.pathname;
            const parts = path.split('/').filter(p => p);
            if (parts.length > 0) {
                // Tenta di estrarre l'ID dall'ultima parte del path (es. 'pasta.html' -> 'pasta')
                cgid = parts[parts.length - 1].replace('.html', '');
                // Gestione casi particolari (es. path numerici o 'spesa-online')
                if (cgid === 'spesa-online' || cgid.match(/^[\d]+$/)) {
                   if(parts.length > 1) cgid = parts[parts.length - 2];
                }
            }
        }
        return cgid;
    },

    /**
     * Recupera la query di ricerca (q) dall'URL se presente.
     * Es: ?q=olive -> "olive"
     */
    getSearchQuery: function() {
        const params = new URLSearchParams(window.location.search);
        return params.get('q');
    },

    /**
     * Recupera lo Store ID dai cookie o usa un default.
     */
    getStoreId: function() {
        const cookies = document.cookie.split('; ');
        const storeCookie = cookies.find(row => row.startsWith('store_id='));
        return storeCookie ? storeCookie.split('=')[1] : "0415"; 
    },

    /**
     * Converte stringhe come "500g", "1 kg", "0.75 l" in un valore numerico in Kg (o Litri).
     */
    parseWeightToKg: function(dimString) {
        if (!dimString) return null;
        const regex = /([\d\.,]+)\s*(kg|g|l|ml|lt|cl)/i; 
        const match = dimString.match(regex);
        if (!match) return null;
        
        let value = parseFloat(match[1].replace(',', '.'));
        const unit = match[2].toLowerCase();
        
        // Normalizza tutto a Kg/L
        if (unit === 'g' || unit === 'ml') value /= 1000;
        if (unit === 'cl') value /= 100;
        
        return value;
    },

    /**
     * Costruisce l'URL corretto per le chiamate in background,
     * cercando prima l'API nativa e usando i metodi classici come fallback.
     */
    buildApiUrl: function(startPos, batchSz) {
        // 1. Tenta prima di usare l'URL nativo
        const footer = document.querySelector('.grid-footer');
        if (footer && footer.hasAttribute('data-sort-options')) {
            try {
                const data = JSON.parse(footer.getAttribute('data-sort-options'));
                const baseUrlNative = data.options[0].url; 
                
                const urlObj = new URL(baseUrlNative);
                urlObj.searchParams.set('start', startPos);
                urlObj.searchParams.set('sz', batchSz);
                urlObj.searchParams.delete('srule'); 
                
                const storeId = this.getStoreId();
                if (!urlObj.searchParams.has('storeId')) {
                    urlObj.searchParams.set('storeId', storeId);
                }
                return urlObj.toString();
            } catch (e) {
                console.warn("Impossibile parsare l'URL nativo, uso il fallback.");
            }
        }

        // 2. Fallback
        const cgid = this.getCgid();
        const searchQuery = this.getSearchQuery();
        const storeId = this.getStoreId();
        const baseUrl = `${window.location.origin}/on/demandware.store/Sites-carrefour-IT-Site/it_IT`;

        if (searchQuery) {
            return `${baseUrl}/FactFinder-Search?q=${searchQuery}&start=${startPos}&sz=${batchSz}&storeId=${storeId}&updateGrid=true`;
        } else {
            return `${baseUrl}/Search-UpdateGrid?cgid=${cgid}&start=${startPos}&sz=${batchSz}&storeId=${storeId}`;
        }
    }
};