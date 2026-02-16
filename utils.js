window.CarrefourSorter.Utils = {
    getCgid: function() {
        const params = new URLSearchParams(window.location.search);
        let cgid = params.get('cgid');
        if (!cgid) {
            const path = window.location.pathname;
            const parts = path.split('/').filter(p => p);
            if (parts.length > 0) {
                cgid = parts[parts.length - 1].replace('.html', '');
                if (cgid === 'spesa-online' || cgid.match(/^[\d]+$/)) {
                   if(parts.length > 1) cgid = parts[parts.length - 2];
                }
            }
        }
        return cgid;
    },

    getStoreId: function() {
        const cookies = document.cookie.split('; ');
        const storeCookie = cookies.find(row => row.startsWith('store_id='));
        return storeCookie ? storeCookie.split('=')[1] : "0415"; 
    },

    parseWeightToKg: function(dimString) {
        if (!dimString) return null;
        const regex = /([\d\.,]+)\s*(kg|g|l|ml|lt|cl)/i; 
        const match = dimString.match(regex);
        if (!match) return null;
        let value = parseFloat(match[1].replace(',', '.'));
        const unit = match[2].toLowerCase();
        if (unit === 'g' || unit === 'ml') value /= 1000;
        if (unit === 'cl') value /= 100;
        return value;
    }
};