fetch('https://pipedapi.kavin.rocks/search?q=test&filter=all').then(r=>r.json()).then(t=>console.log(t.items[0])).catch(console.error);
