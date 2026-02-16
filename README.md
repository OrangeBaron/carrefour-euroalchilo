# 🛒 Carrefour Price/Weight Sorter

Questa è una semplice estensione per il browser Google Chrome che ti aiuta a fare la spesa sul sito di **Carrefour.it** in modo più intelligente.

### A cosa serve?

Di solito, i siti di e-commerce ordinano i prodotti per "prezzo più basso" (il prezzo della confezione). Questo però trae in inganno: una confezione piccola costa meno di una grande, ma spesso costa molto di più **al chilo**.

Questa estensione aggiunge una nuova opzione per **ordinare i prodotti in base al prezzo al Chilo (o al Litro)**. Così puoi vedere subito qual è l'offerta davvero più conveniente.

### Come funziona?

Quando visiti una pagina di ricerca o una categoria su Carrefour.it:

1. L'estensione scarica automaticamente tutti i prodotti della categoria.
2. Legge il peso e il prezzo di ognuno.
3. Calcola il prezzo al Kg.
4. Riordina la griglia dei prodotti mostrandoti prima quelli che costano meno al chilo.

---

### 📦 Come installarla

Poiché questa estensione non è sul Chrome Web Store, devi installarla manualmente (ci vuole 1 minuto):

1. [Scarica questo repository](https://github.com/OrangeBaron/carrefour-euroalchilo/archive/refs/heads/main.zip) ed estrai la cartella sul tuo computer.
2. Apri Chrome e vai all'indirizzo `chrome://extensions`.
3. Attiva l'interruttore **Modalità sviluppatore** (in alto a destra).
4. Clicca sul pulsante **Carica estensione non pacchettizzata**.
5. Seleziona la cartella che hai estratto al punto 1.

Fatto! L'icona dell'estensione dovrebbe apparire nel tuo browser.

---

### 🚀 Come usarla

1. Vai sul sito [Carrefour.it](https://www.carrefour.it/spesa-online.html).
2. Fai una ricerca (es. "Pasta") o entra in una categoria (es. "Biscotti").
3. Clicca sul menu a tendina **"Ordina per"** (dove di solito vedi "Rilevanza" o "Prezzo crescente").
4. Seleziona la nuova voce **"Prezzo al chilo"**.
5. Vedrai un box "Caricamento..." in alto a destra. Attendi qualche secondo che l'estensione analizzi tutti i prodotti.
6. La pagina si aggiornerà mostrandoti i prodotti più convenienti per primi!
