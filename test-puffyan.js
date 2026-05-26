fetch('https://vid.puffyan.us/api/v1/search?q=test').then(r=>r.json()).then(t=>console.log(t[0])).catch(console.error);
