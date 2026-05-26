const url = 'https://corsproxy.io/?' + encodeURIComponent('https://inv.projectsegfau.lt/api/v1/search?q=test');
fetch(url).then(r => r.text()).then(t => console.log(t.substring(0, 200))).catch(console.error);
