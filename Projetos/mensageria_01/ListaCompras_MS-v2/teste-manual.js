#!/usr/bin/env node

/**
 * 🧪 Teste Manual - Verificação Básica dos Serviços
 * Execute este script para verificar se os serviços estão funcionando
 */

const axios = require('axios');

async function testServices() {
    console.log('🔍 Verificando serviços ListaCompras MS v2...\n');

    const services = [
        { name: 'API Gateway', url: 'http://localhost:3000/health' },
        { name: 'User Service', url: 'http://localhost:3001/health' },
        { name: 'List Service', url: 'http://localhost:3002/health' },
        { name: 'Item Service', url: 'http://localhost:3003/health' }
    ];

    let allOk = true;

    for (const service of services) {
        try {
            const response = await axios.get(service.url, { timeout: 3000 });
            console.log(`✅ ${service.name}: OK`);
        } catch (error) {
            console.log(`❌ ${service.name}: FALHA`);
            allOk = false;
        }
    }

    console.log('');

    if (allOk) {
        console.log('🎉 Todos os serviços estão funcionando!');
        console.log('🚀 Pronto para teste no dispositivo Samsung');
        console.log('📱 Siga o GUIA_TESTE_DISPOSITIVO.md');
    } else {
        console.log('⚠️ Alguns serviços não estão respondendo');
        console.log('💡 Execute: npm install && npm start em cada service/');
    }

    return allOk;
}

if (require.main === module) {
    testServices().catch(console.error);
}

module.exports = { testServices };
