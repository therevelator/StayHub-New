
console.log('Starting debug loading...');

async function testImports() {
    try {
        console.log('1. Importing dotenv');
        await import('dotenv');

        console.log('2. Importing express');
        await import('express');

        console.log('3. Importing cors');
        await import('cors');

        console.log('4. Importing mysql2/promise');
        await import('mysql2/promise'); // Test DB lib directly

        console.log('5. Importing ../src/config/index.js');
        await import('./src/config/index.js');

        console.log('6. Importing ../src/db/index.js');
        await import('./src/db/index.js');

        console.log('7. Importing ../src/controllers/auth.controller.js');
        await import('./src/controllers/auth.controller.js');

        // Now routes
        console.log('8. Importing ../src/routes/auth.routes.js');
        await import('./src/routes/auth.routes.js');

        console.log('9. Importing ../src/app.js');
        await import('./src/app.js');

        console.log('All imports successful!');
    } catch (err) {
        console.error('Import failed:', err);
    }
}

testImports();
