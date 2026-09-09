import {rename,writeFile} from 'node:fs/promises';
await rename('dist-standalone/standalone.html','dist-standalone/index.html');
await writeFile('dist-standalone/robots.txt','User-agent: *\nDisallow: /admin\nDisallow: /api/\n');
console.log('Build preparado para un dominio propio.');
