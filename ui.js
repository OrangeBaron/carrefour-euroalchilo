window.CarrefourSorter.UI = {
    statusBox: null,

    initStatusBox: function() {
        if (!this.statusBox) {
            this.statusBox = document.createElement('div');
            this.statusBox.id = 'carrefour-sort-status';
            this.statusBox.style.cssText = "position:fixed; top:100px; right:20px; background:rgba(0,0,0,0.85); color:#fff; padding:10px 20px; z-index:99999; border-radius:30px; font-family: sans-serif; font-size:14px; backdrop-filter: blur(4px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: opacity 0.5s ease; display:none;";
            this.statusBox.innerText = "Caricamento...";
            document.body.appendChild(this.statusBox);
        }
    },

    updateStatus: function(isComplete) {
        this.initStatusBox(); // Assicura che esista
        if (isComplete) {
            this.statusBox.style.opacity = '0';
            setTimeout(() => {
                this.statusBox.style.display = 'none';
            }, 500);
        } else {
            this.statusBox.style.display = 'block';
            this.statusBox.style.opacity = '1';
            this.statusBox.innerText = "Caricamento...";
        }
    },

    injectSortOption: function() {
        const Config = window.CarrefourSorter.Config;
        
        // 1. Trova la lista UL
        const list = document.querySelector(Config.SELECTORS.SORT_LIST);
        if (!list || document.getElementById(Config.SELECTORS.SORT_LI_ID)) return;

        // 2. Creazione elementi DOM
        const li = document.createElement('li');
        li.id = Config.SELECTORS.SORT_LI_ID;
        li.className = 'filter-input check-filter weight-sorter';
        li.setAttribute('data-id', 'weight-sorter');
        
        const div = document.createElement('div');
        div.className = 'form-group form-radio floatl floatl--active';
        div.setAttribute('data-component', 'inputComponent');
        div.setAttribute('data-component-init', 'true');

        const input = document.createElement('input');
        input.id = 'weight-sorter-input';
        input.className = 'form-group-input floatl__input';
        input.type = 'radio';
        input.name = 'orderFilter';
        input.value = 'weight-sorter';
        input.autocomplete = 'off';

        const label = document.createElement('label');
        label.className = 'form-group-label floatl__label';
        label.setAttribute('for', 'weight-sorter-input');

        const span = document.createElement('span');
        span.textContent = 'Prezzo al chilo';
        
        // Assemblaggio
        label.appendChild(span);
        div.appendChild(input);
        div.appendChild(label);
        li.appendChild(div);

        // 3. Gestione Eventi
        input.addEventListener('change', () => {
            const closeBtn = document.querySelector('.js-close-dropdown');
            if (closeBtn) closeBtn.click();
            
            // Chiama la logica Core
            if (window.CarrefourSorter.Core && window.CarrefourSorter.Core.run) {
                window.CarrefourSorter.Core.run();
            } else {
                console.error("Modulo Logic non caricato ancora.");
            }
        });

        // Aggiungi alla lista
        list.appendChild(li);
    }
};