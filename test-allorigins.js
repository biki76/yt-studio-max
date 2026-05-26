const url = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://inv.projectsegfau.lt/api/v1/search?q=test');
fetch(url).then(r => r.json()).then(t => console.log(typeof t.contents, t.contents.substring(0, 200))).catch(console.error);
