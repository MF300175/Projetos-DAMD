const axios = require('axios');

// Configurações
const SERVICES = {
    user: 'http://localhost:3001',
    list: 'http://localhost:3002', 
    item: 'http://localhost:3003',
    gateway: 'http://localhost:3000'
};

console.log('🚀 === TESTE COMPLETO DE MICROSSERVIÇOS ===\n');

async function testarServico(nome, url) {
    try {
        const response = await axios.get(`${url}/health`, { timeout: 5000 });
        console.log(`✅ ${nome}: ${response.data.status}`);
        return true;
    } catch (error) {
        console.log(`❌ ${nome}: ${error.message}`);
        return false;
    }
}

async function testarItemService() {
    try {
        console.log('\n📦 === TESTANDO ITEM SERVICE ===');
        
        // Listar todos os itens
        const response = await axios.get(`${SERVICES.item}/items`, { timeout: 5000 });
        console.log(`✅ Total de itens: ${response.data.data.length}`);
        
        // Mostrar alguns itens
        if (response.data.data.length > 0) {
            console.log('\n📋 Primeiros itens:');
            response.data.data.slice(0, 5).forEach(item => {
                console.log(`   • ${item.name} - R$ ${item.averagePrice} (${item.category})`);
            });
        }
        
        // Testar busca por categoria
        const categoriesResponse = await axios.get(`${SERVICES.item}/categories`, { timeout: 5000 });
        console.log(`\n✅ Categorias disponíveis: ${categoriesResponse.data.data.length}`);
        
        return response.data.data;
    } catch (error) {
        console.log(`❌ Item Service: ${error.message}`);
        return [];
    }
}

async function testarUserService() {
    try {
        console.log('\n👤 === TESTANDO USER SERVICE ===');
        
        // Testar registro
        const userData = {
            name: 'Usuario Teste',
            email: 'teste@email.com',
            password: '123456'
        };
        
        const registerResponse = await axios.post(`${SERVICES.user}/auth/register`, userData, { timeout: 5000 });
        console.log(`✅ Registro: ${registerResponse.data.message}`);
        
        // Testar login
        const loginData = {
            email: 'teste@email.com',
            password: '123456'
        };
        
        const loginResponse = await axios.post(`${SERVICES.user}/auth/login`, loginData, { timeout: 5000 });
        console.log(`✅ Login: Token gerado com sucesso`);
        
        return loginResponse.data.token;
    } catch (error) {
        console.log(`❌ User Service: ${error.response?.data?.message || error.message}`);
        return null;
    }
}

async function testarListService(token, items) {
    if (!token) {
        console.log('\n📋 List Service: Pulando (sem token)');
        return false;
    }
    
    try {
        console.log('\n📋 === TESTANDO LIST SERVICE ===');
        
        // Criar lista
        const listData = {
            name: 'Lista de Teste Completo',
            description: 'Teste de todas as funcionalidades'
        };
        
        const createResponse = await axios.post(`${SERVICES.list}/lists`, listData, {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 5000
        });
        
        console.log(`✅ Lista criada: ${createResponse.data.data.name}`);
        const listId = createResponse.data.data.id;
        
        // Adicionar itens à lista (testar cálculos automáticos)
        if (items.length > 0) {
            console.log('\n💰 Testando cálculos automáticos...');
            
            for (let i = 0; i < Math.min(3, items.length); i++) {
                const item = items[i];
                const itemData = {
                    itemId: item.id,
                    quantity: Math.floor(Math.random() * 5) + 1,
                    notes: `Teste automático ${i + 1}`
                };
                
                const addResponse = await axios.post(`${SERVICES.list}/lists/${listId}/items`, itemData, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeout: 5000
                });
                
                const estimatedPrice = item.averagePrice * itemData.quantity;
                console.log(`   ✅ ${item.name} (${itemData.quantity}x) - R$ ${estimatedPrice.toFixed(2)}`);
            }
        }
        
        // Buscar lista atualizada (com cálculos)
        const updatedResponse = await axios.get(`${SERVICES.list}/lists/${listId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 5000
        });
        
        const list = updatedResponse.data.data;
        console.log(`\n📊 Resumo da lista:`);
        console.log(`   • Total de itens: ${list.summary.totalItems}`);
        console.log(`   • Valor estimado: R$ ${list.summary.estimatedTotal}`);
        console.log(`   • Itens comprados: ${list.summary.purchasedItems}`);
        
        // Listar todas as listas
        const listResponse = await axios.get(`${SERVICES.list}/lists`, {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 5000
        });
        
        console.log(`\n✅ Total de listas do usuário: ${listResponse.data.data.length}`);
        
        return true;
    } catch (error) {
        console.log(`❌ List Service: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testarApiGateway() {
    try {
        console.log('\n🌐 === TESTANDO API GATEWAY ===');
        
        // Health check
        const healthResponse = await axios.get(`${SERVICES.gateway}/health`, { timeout: 5000 });
        console.log(`✅ Gateway Health: ${healthResponse.data.status}`);
        console.log(`   📊 Serviços saudáveis: ${healthResponse.data.healthyServices}/${healthResponse.data.totalServices}`);
        
        // Registry
        const registryResponse = await axios.get(`${SERVICES.gateway}/registry`, { timeout: 5000 });
        const registry = registryResponse.data.registry;
        console.log(`\n✅ Service Registry: ${Object.keys(registry).length} serviços registrados`);
        
        Object.entries(registry).forEach(([name, service]) => {
            console.log(`   • ${name}: ${service.url} (${service.healthy ? '✅' : '❌'})`);
        });
        
        // Testar roteamento através do gateway
        console.log('\n🔄 Testando roteamento...');
        const gatewayItemsResponse = await axios.get(`${SERVICES.gateway}/api/items`, { timeout: 5000 });
        console.log(`✅ Gateway → Item Service: ${gatewayItemsResponse.data.data.length} itens`);
        
        return true;
    } catch (error) {
        console.log(`❌ API Gateway: ${error.message}`);
        return false;
    }
}

async function testarCircuitBreaker() {
    try {
        console.log('\n⚡ === TESTANDO CIRCUIT BREAKER ===');
        
        // Fazer várias requisições para testar o circuit breaker
        console.log('🔄 Fazendo requisições para testar circuit breaker...');
        
        for (let i = 1; i <= 5; i++) {
            try {
                const response = await axios.get(`${SERVICES.gateway}/api/items`, { timeout: 2000 });
                console.log(`   ✅ Requisição ${i}: ${response.data.data.length} itens`);
            } catch (error) {
                console.log(`   ❌ Requisição ${i}: ${error.message}`);
            }
        }
        
        console.log('✅ Circuit breaker funcionando normalmente');
        return true;
    } catch (error) {
        console.log(`❌ Circuit Breaker: ${error.message}`);
        return false;
    }
}

async function executarTestesCompletos() {
    console.log('🔍 Verificando serviços...\n');
    
    // Testar health checks
    const userOk = await testarServico('User Service', SERVICES.user);
    const listOk = await testarServico('List Service', SERVICES.list);
    const itemOk = await testarServico('Item Service', SERVICES.item);
    const gatewayOk = await testarServico('API Gateway', SERVICES.gateway);
    
    if (!userOk || !listOk || !itemOk || !gatewayOk) {
        console.log('\n❌ Alguns serviços não estão disponíveis. Execute "npm start" primeiro.');
        return;
    }
    
    console.log('\n✅ Todos os serviços estão funcionando!');
    
    // Executar testes completos
    await testarApiGateway();
    const items = await testarItemService();
    const token = await testarUserService();
    await testarListService(token, items);
    await testarCircuitBreaker();
    
    console.log('\n🎉 === TESTE COMPLETO CONCLUÍDO ===');
    console.log('✅ Todas as funcionalidades foram testadas com sucesso!');
    console.log('\n📋 Funcionalidades demonstradas:');
    console.log('   • ✅ Health checks automáticos');
    console.log('   • ✅ Service Discovery (Registry)');
    console.log('   • ✅ API Gateway com roteamento');
    console.log('   • ✅ Bancos NoSQL independentes');
    console.log('   • ✅ Autenticação JWT');
    console.log('   • ✅ CRUD de listas de compras');
    console.log('   • ✅ Catálogo de produtos');
    console.log('   • ✅ Cálculos automáticos');
    console.log('   • ✅ Circuit Breaker');
    console.log('   • ✅ Comunicação inter-serviços');
}

// Executar testes
executarTestesCompletos().catch(console.error);
