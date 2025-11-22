#!/usr/bin/env node

/**
 * 🧪 Teste Básico - Sistema ListaCompras MS v2
 * Verifica funcionamento básico dos serviços sem mensageria
 */

const axios = require('axios');

class BasicTester {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.services = [
            { name: 'API Gateway', url: `${this.baseUrl}/health`, port: 3000 },
            { name: 'User Service', url: 'http://localhost:3001/health', port: 3001 },
            { name: 'List Service', url: 'http://localhost:3002/health', port: 3002 },
            { name: 'Item Service', url: 'http://localhost:3003/health', port: 3003 }
        ];
    }

    async runBasicTests() {
        console.log('🧪 === TESTE BÁSICO - DAMD ListaCompras MS v2 ===\n');

        try {
            // Teste 1: Verificar saúde dos serviços
            await this.testServicesHealth();
            console.log('');

            // Teste 2: Verificar endpoints básicos
            await this.testBasicEndpoints();
            console.log('');

            // Teste 3: Verificar dados iniciais
            await this.testInitialData();
            console.log('');

            console.log('🎉 Testes básicos concluídos com sucesso!');

        } catch (error) {
            console.error('❌ Erro durante testes básicos:', error.message);
            console.log('\n💡 Para executar os testes:');
            console.log('   1. Instalar dependências: npm install (em cada service/)');
            console.log('   2. Iniciar serviços: npm start (em cada service/)');
            console.log('   3. Ou usar Docker: docker-compose up');
            process.exit(1);
        }
    }

    async testServicesHealth() {
        console.log('🔧 Teste 1: Verificando saúde dos serviços...');

        for (const service of this.services) {
            try {
                console.log(`   Testando ${service.name}...`);
                const response = await axios.get(service.url, { timeout: 5000 });

                if (response.status === 200) {
                    console.log(`   ✅ ${service.name}: OK (porta ${service.port})`);
                } else {
                    console.log(`   ⚠️  ${service.name}: Status ${response.status}`);
                }

            } catch (error) {
                console.log(`   ❌ ${service.name}: FALHA - ${error.code || error.message}`);
                console.log(`      💡 Verifique se o serviço está rodando na porta ${service.port}`);
            }
        }
    }

    async testBasicEndpoints() {
        console.log('📋 Teste 2: Verificando endpoints básicos...');

        try {
            // Testar listagem de usuários
            const usersResponse = await axios.get(`${this.baseUrl}/users`, {
                headers: { 'Authorization': 'Bearer demo-token' },
                timeout: 5000
            });

            if (usersResponse.data.data && usersResponse.data.data.length > 0) {
                console.log(`   ✅ Users API: ${usersResponse.data.data.length} usuários encontrados`);
            } else {
                console.log('   ⚠️  Users API: Nenhum usuário encontrado');
            }

            // Testar listagem de listas
            const listsResponse = await axios.get(`${this.baseUrl}/lists`, {
                headers: { 'Authorization': 'Bearer demo-token' },
                timeout: 5000
            });

            if (listsResponse.data.data) {
                console.log(`   ✅ Lists API: ${listsResponse.data.data.length} listas encontradas`);
            }

            // Testar listagem de itens
            const itemsResponse = await axios.get(`${this.baseUrl}/items`, {
                timeout: 5000
            });

            if (itemsResponse.data.data && itemsResponse.data.data.length > 0) {
                console.log(`   ✅ Items API: ${itemsResponse.data.data.length} itens encontrados`);
            } else {
                console.log('   ⚠️  Items API: Nenhum item encontrado');
            }

        } catch (error) {
            console.log(`   ❌ APIs: Erro ao testar - ${error.message}`);
            console.log('      💡 Certifique-se de que todos os serviços estão rodando');
        }
    }

    async testInitialData() {
        console.log('📊 Teste 3: Verificando dados iniciais...');

        try {
            // Verificar se existem dados de exemplo
            const response = await axios.get(`${this.baseUrl}/lists`, {
                headers: { 'Authorization': 'Bearer demo-token' },
                timeout: 5000
            });

            if (response.data.data && response.data.data.length > 0) {
                const sampleList = response.data.data[0];
                console.log(`   ✅ Dados encontrados:`);
                console.log(`      📋 Lista: ${sampleList.name}`);
                console.log(`      👤 Usuário: ${sampleList.userId}`);
                console.log(`      📦 Status: ${sampleList.status}`);
                console.log(`      🛒 Itens: ${sampleList.items?.length || 0}`);

                // Testar endpoint de summary se disponível
                if (sampleList.id) {
                    try {
                        const summaryResponse = await axios.get(`${this.baseUrl}/lists/${sampleList.id}/summary`, {
                            headers: { 'Authorization': 'Bearer demo-token' },
                            timeout: 5000
                        });

                        if (summaryResponse.data.data) {
                            const summary = summaryResponse.data.data.summary;
                            console.log(`      📊 Summary: ${summary.totalItems} itens, R$ ${summary.estimatedTotal?.toFixed(2) || '0.00'}`);
                        }
                    } catch (summaryError) {
                        console.log('      ⚠️  Summary não disponível (normal para v1)');
                    }
                }
            } else {
                console.log('   ⚠️  Nenhum dado inicial encontrado');
                console.log('      💡 Execute populate-list-data.js para criar dados de exemplo');
            }

        } catch (error) {
            console.log(`   ❌ Dados: Erro ao verificar - ${error.message}`);
        }
    }
}

// Executar testes se chamado diretamente
if (require.main === module) {
    const tester = new BasicTester();
    tester.runBasicTests().catch(console.error);
}

module.exports = BasicTester;
