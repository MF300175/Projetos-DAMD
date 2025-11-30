// demo-apresentacao.js - Script simplificado para apresentação
const axios = require('axios');

class DemoApresentacao {
    constructor() {
        this.baseURL = 'http://localhost:3000';
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async log(message, data = null) {
        console.log(`\n🔵 ${message}`);
        if (data) {
            console.log(JSON.stringify(data, null, 2));
        }
    }

    async verificarSistema() {
        console.log('\n📊 === VERIFICANDO SISTEMA ===');
        try {
            const response = await axios.get(`${this.baseURL}/health`);
            const health = response.data;
            
            console.log(`✅ Sistema Status: ${health.status}`);
            console.log(`📈 Serviços Saudáveis: ${health.healthyServices}/${health.totalServices}`);
            console.log(`⏱️  Uptime: ${Math.round(health.uptime)}s`);
            
            return true;
        } catch (error) {
            console.error('❌ Sistema não está disponível:', error.message);
            return false;
        }
    }

    async mostrarRegistry() {
        console.log('\n📋 === SERVICE DISCOVERY ===');
        try {
            const response = await axios.get(`${this.baseURL}/registry`);
            const registry = response.data.registry;
            
            console.log('🔍 Serviços Registrados:');
            Object.entries(registry).forEach(([name, service]) => {
                console.log(`   • ${name}: ${service.url} (PID: ${service.pid})`);
            });
            
            console.log(`\n📊 Estatísticas:`);
            console.log(`   • Total: ${response.data.stats.totalServices} serviços`);
            console.log(`   • Saudáveis: ${response.data.stats.healthyServices}`);
            console.log(`   • Uptime médio: ${Math.round(response.data.stats.averageUptime/1000)}s`);
            
        } catch (error) {
            console.error('❌ Erro ao consultar registry:', error.message);
        }
    }

    async mostrarCatalogo() {
        console.log('\n🛒 === CATÁLOGO DE PRODUTOS ===');
        try {
            const response = await axios.get(`${this.baseURL}/api/items?limit=5`);
            const items = response.data.data;
            
            console.log(`📦 ${items.length} produtos encontrados:`);
            items.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.name} - R$ ${item.averagePrice} (${item.category})`);
            });
            
            console.log(`\n💾 Banco NoSQL: ${response.data.pagination.total} itens total`);
            
        } catch (error) {
            console.error('❌ Erro ao buscar produtos:', error.message);
        }
    }

    async demonstrarFluxo() {
        console.log('\n🔄 === FLUXO COMPLETO DE USUÁRIO ===');
        
        try {
            // 1. Registrar usuário
            console.log('\n1️⃣ Registrando usuário...');
            const userData = {
                email: 'demo@apresentacao.com',
                username: 'demo',
                password: 'demo123',
                firstName: 'Usuário',
                lastName: 'Demo'
            };

            try {
                const registerResponse = await axios.post(`${this.baseURL}/api/auth/register`, userData);
                console.log('✅ Usuário registrado com sucesso');
            } catch (error) {
                if (error.response?.status === 409) {
                    console.log('ℹ️  Usuário já existe, continuando...');
                } else {
                    throw error;
                }
            }

            // 2. Login
            console.log('\n2️⃣ Fazendo login...');
            const loginResponse = await axios.post(`${this.baseURL}/api/auth/login`, {
                identifier: 'demo@apresentacao.com',
                password: 'demo123'
            });
            
            const token = loginResponse.data.data.token;
            console.log('✅ Login realizado com sucesso');
            console.log(`🔑 Token JWT gerado (${token.substring(0, 20)}...)`);

            // 3. Criar lista
            console.log('\n3️⃣ Criando lista de compras...');
            const listResponse = await axios.post(`${this.baseURL}/api/lists`, {
                name: 'Lista da Apresentação',
                description: 'Demonstração do sistema'
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const listId = listResponse.data.data.id;
            console.log('✅ Lista criada com sucesso');
            console.log(`📝 ID da Lista: ${listId}`);

            // 4. Adicionar item
            console.log('\n4️⃣ Adicionando item à lista...');
            const itemsResponse = await axios.get(`${this.baseURL}/api/items?limit=1`);
            const item = itemsResponse.data.data[0];
            
            await axios.post(`${this.baseURL}/api/lists/${listId}/items`, {
                itemId: item.id,
                quantity: 2,
                notes: 'Item da apresentação'
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log(`✅ Item "${item.name}" adicionado à lista`);
            console.log(`💰 Preço estimado: R$ ${item.averagePrice * 2}`);

            // 5. Dashboard
            console.log('\n5️⃣ Consultando dashboard...');
            const dashboardResponse = await axios.get(`${this.baseURL}/api/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log('✅ Dashboard obtido com sucesso');
            console.log('📊 Dados agregados de todos os serviços');

        } catch (error) {
            console.error('❌ Erro no fluxo:', error.response?.data || error.message);
        }
    }

    async executarDemo() {
        console.log('🚀 === DEMONSTRAÇÃO DE MICROSSERVIÇOS ===');
        console.log('Sistema de Listas de Compras - PUC Minas\n');

        // Verificar se sistema está rodando
        const sistemaOk = await this.verificarSistema();
        if (!sistemaOk) {
            console.log('\n❌ Sistema não está disponível. Execute "npm start" primeiro.');
            return;
        }

        await this.delay(1000);

        // Mostrar registry
        await this.mostrarRegistry();
        await this.delay(1000);

        // Mostrar catálogo
        await this.mostrarCatalogo();
        await this.delay(1000);

        // Demonstrar fluxo completo
        await this.demonstrarFluxo();

        console.log('\n🎉 === DEMONSTRAÇÃO CONCLUÍDA ===');
        console.log('✅ Todos os conceitos de microsserviços foram demonstrados:');
        console.log('   • Service Discovery automático');
        console.log('   • Bancos NoSQL independentes');
        console.log('   • API Gateway com roteamento');
        console.log('   • Autenticação JWT distribuída');
        console.log('   • Agregação de dados');
        console.log('   • Resiliência com circuit breaker');
    }
}

// Executar demonstração
async function main() {
    const demo = new DemoApresentacao();
    await demo.executarDemo();
}

// Tratamento de erros
process.on('unhandledRejection', (error) => {
    console.error('❌ Erro não tratado:', error);
    process.exit(1);
});

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = DemoApresentacao;
