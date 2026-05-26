fetch('http://localhost:3000/api/search?q=test').then(r=>r.json()).then(t=>console.log(t[0], typeof t[0])).catch(console.error);
