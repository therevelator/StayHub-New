console.log('Loading express...');
import('express').then(m => console.log('Express loaded')).catch(e => console.error(e));
