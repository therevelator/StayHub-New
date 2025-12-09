console.log('Loading db...');
import('./src/db/index.js').then(m => console.log('DB loaded')).catch(e => console.error(e));
