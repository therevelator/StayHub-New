console.log('Loading config...');
import('./src/config/index.js').then(m => console.log('Config loaded', m)).catch(e => console.error(e));
