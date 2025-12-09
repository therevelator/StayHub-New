console.log('Loading app...');
import('./src/app.js').then(m => console.log('App loaded')).catch(e => console.error(e));
