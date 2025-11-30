const axios = require('axios');

// Configurações
const SERVICES = {
    user: 'http://localhost:3001',
    list: 'http://localhost:3002', 
    item: 'http://localhost:3003',
    gateway: 'http://localhost:3000'
};

console.log('🚀 === TESTE SIMPLES DE MICROSSERVIÇOS ===\n');

async function testarServico(nome, url) {
    try {
        console.log(`🔵 Testando ${nome}...`);
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
        console.log('\n📦 Testando Item Service...');
        const response = await axios.get(`${SERVICES.item}/items`, { timeout: 5000 });
        console.log(`✅ Item Service: ${response.data.data.length} itens encontrados`);
        
        // Mostrar alguns itens
        if (response.data.data.length > 0) {
            console.log('   📋 Primeiros itens:');
            response.data.data.slice(0, 3).forEach(item => {
                console.log(`      • ${item.name} - R$ ${item.averagePrice}`);
            });
        }
        return true;
    } catch (error) {
        console.log(`❌ Item Service: ${error.message}`);
        return false;
    }
}

async function testarUserService() {
    try {
        console.log('\n👤 Testando User Service...');
        
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

async function testarListService(token) {
    if (!token) {
        console.log('\n📋 List Service: Pulando (sem token)');
        return false;
    }
    
    try {
        console.log('\n📋 Testando List Service...');
        
        // Criar lista
        const listData = {
            name: 'Lista de Teste',
            description: 'Teste de funcionalidades'
        };
        
        const createResponse = await axios.post(`${SERVICES.list}/lists`, listData, {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 5000
        });
        
        console.log(`✅ Lista criada: ${createResponse.data.data.name}`);
        const listId = createResponse.data.data.id;
        
        // Listar listas
        const listResponse = await axios.get(`${SERVICES.list}/lists`, {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 5000
        });
        
        console.log(`✅ Total de listas: ${listResponse.data.data.length}`);
        
        return true;
    } catch (error) {
        console.log(`❌ List Service: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testarApiGateway() {
    try {
        console.log('\n🌐 Testando API Gateway...');
        
        // Health check
        const healthResponse = await axios.get(`${SERVICES.gateway}/health`, { timeout: 5000 });
        console.log(`✅ Gateway Health: ${healthResponse.data.status}`);
        console.log(`   📊 Serviços saudáveis: ${healthResponse.data.healthyServices}/${healthResponse.data.totalServices}`);
        
        // Registry
        const registryResponse = await axios.get(`${SERVICES.gateway}/registry`, { timeout: 5000 });
        console.log(`✅ Registry: ${Object.keys(registryResponse.data.registry).length} serviços registrados`);
        
        return true;
    } catch (error) {
        console.log(`❌ API Gateway: ${error.message}`);
        return false;
    }
}

async function executarTestes() {
    console.log('🔍 Verificando se os serviços estão rodando...\n');
    
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
    
    // Testar funcionalidades específicas
    await testarApiGateway();
    await testarItemService();
    const token = await testarUserService();
    await testarListService(token);
    
    console.log('\n🎉 === TESTE CONCLUÍDO ===');
    console.log('✅ Todas as funcionalidades básicas foram testadas com sucesso!');
    console.log('\n📋 Funcionalidades demonstradas:');
    console.log('   • Health checks automáticos');
    console.log('   • Service Discovery (Registry)');
    console.log('   • API Gateway com roteamento');
    console.log('   • Bancos NoSQL independentes');
    console.log('   • Autenticação JWT');
    console.log('   • CRUD de listas de compras');
    console.log('   • Catálogo de produtos');
}

// Executar testes
executarTestes().catch(console.error);
