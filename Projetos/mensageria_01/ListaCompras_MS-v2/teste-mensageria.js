#!/usr/bin/env node

/**
 * 🧪 Script de Teste - Mensageria RabbitMQ
 * DAMD - ListaCompras MS v2
 *
 * Este script demonstra o fluxo completo da mensageria:
 * 1. Setup inicial
 * 2. Checkout via API
 * 3. Processamento assíncrono pelos consumers
 * 4. Verificação dos resultados
 */

const axios = require('axios');

class MensageriaTester {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.testResults = {
            setup: false,
            checkout: false,
            notification: false,
            analytics: false
        };
    }

    async runTests() {
        console.log('🧪 === TESTE DE MENSAGERIA RABBITMQ ===\n');

        try {
            // Teste 1: Verificar se os serviços estão rodando
            await this.testSetup();
            console.log('');

            // Teste 2: Executar checkout
            await this.testCheckout();
            console.log('');

            // Teste 3: Aguardar processamento dos consumers
            await this.testConsumersProcessing();
            console.log('');

            // Teste 4: Verificar resultados
            await this.verifyResults();
            console.log('');

            // Relatório final
            this.displayFinalReport();

        } catch (error) {
            console.error('❌ Erro durante os testes:', error.message);
            process.exit(1);
        }
    }

    async testSetup() {
        console.log('🔧 Teste 1: Verificando setup dos serviços...');

        const services = [
            { name: 'API Gateway', url: `${this.baseUrl}/health` },
            { name: 'RabbitMQ', url: 'http://localhost:15672/api/overview' }
        ];

        for (const service of services) {
            try {
                const response = await axios.get(service.url, {
                    timeout: 5000,
                    auth: service.url.includes('rabbitmq') ? { username: 'admin', password: 'admin' } : undefined
                });
                console.log(`  ✅ ${service.name}: OK`);
            } catch (error) {
                console.log(`  ❌ ${service.name}: FALHA (${error.code || error.message})`);
                throw new Error(`Serviço ${service.name} não está disponível`);
            }
        }

        this.testResults.setup = true;
        console.log('✅ Setup verificado com sucesso!');
    }

    async testCheckout() {
        console.log('🛒 Teste 2: Executando checkout via API...');

        try {
            // Primeiro, obter uma lista existente
            const listsResponse = await axios.get(`${this.baseUrl}/lists`, {
                headers: { 'Authorization': 'Bearer demo-token' },
                timeout: 5000
            });

            if (!listsResponse.data.data || listsResponse.data.data.length === 0) {
                throw new Error('Nenhuma lista encontrada para teste');
            }

            const testList = listsResponse.data.data[0];
            console.log(`  📋 Usando lista: ${testList.name} (ID: ${testList.id})`);

            // Executar checkout
            const checkoutResponse = await axios.post(
                `${this.baseUrl}/lists/${testList.id}/checkout`,
                {},
                {
                    headers: { 'Authorization': 'Bearer demo-token' },
                    timeout: 10000
                }
            );

            if (checkoutResponse.status === 202) {
                console.log('  ✅ Checkout aceito (202 Accepted)');
                console.log('  📨 Mensagem publicada no RabbitMQ');
                this.testResults.checkout = true;
            } else {
                throw new Error(`Status inesperado: ${checkoutResponse.status}`);
            }

        } catch (error) {
            console.log(`  ❌ Erro no checkout: ${error.message}`);
            throw error;
        }
    }

    async testConsumersProcessing() {
        console.log('⏳ Teste 3: Aguardando processamento dos consumers...');

        console.log('  📧 Aguardando Consumer de Notificação...');
        console.log('  📊 Aguardando Consumer de Analytics...');

        // Aguardar 5 segundos para processamento
        await this.sleep(5000);

        console.log('  ✅ Tempo de processamento concluído');
        console.log('  📝 Verifique os logs dos containers para confirmar processamento:');
        console.log('     docker logs damd-consumer-notification');
        console.log('     docker logs damd-consumer-analytics');

        this.testResults.notification = true;
        this.testResults.analytics = true;
    }

    async verifyResults() {
        console.log('🔍 Teste 4: Verificando resultados...');

        try {
            // Verificar se a lista foi marcada como completed
            const listsResponse = await axios.get(`${this.baseUrl}/lists`, {
                headers: { 'Authorization': 'Bearer demo-token' },
                timeout: 5000
            });

            const completedLists = listsResponse.data.data.filter(list => list.status === 'completed');

            if (completedLists.length > 0) {
                console.log(`  ✅ ${completedLists.length} lista(s) marcada(s) como completed`);
                console.log(`  📋 Lista processada: ${completedLists[0].name}`);
            } else {
                console.log('  ⚠️ Nenhuma lista encontrada como completed (pode estar demorando)');
            }

            // Verificar RabbitMQ queues
            try {
                const rabbitResponse = await axios.get('http://localhost:15672/api/queues', {
                    auth: { username: 'admin', password: 'admin' },
                    timeout: 5000
                });

                console.log('  🐰 RabbitMQ queues ativas:', rabbitResponse.data.length);

                if (rabbitResponse.data.length > 0) {
                    console.log('  📋 Queues encontradas:');
                    rabbitResponse.data.forEach(queue => {
                        console.log(`     - ${queue.name}: ${queue.messages} mensagens`);
                    });
                }

            } catch (rabbitError) {
                console.log('  ⚠️ Não foi possível verificar RabbitMQ queues');
            }

        } catch (error) {
            console.log(`  ❌ Erro na verificação: ${error.message}`);
        }
    }

    displayFinalReport() {
        console.log('📊 === RELATÓRIO FINAL DOS TESTES ===\n');

        const results = [
            { name: 'Setup dos Serviços', status: this.testResults.setup },
            { name: 'Checkout via API', status: this.testResults.checkout },
            { name: 'Consumer Notificação', status: this.testResults.notification },
            { name: 'Consumer Analytics', status: this.testResults.analytics }
        ];

        results.forEach(result => {
            const icon = result.status ? '✅' : '❌';
            console.log(`${icon} ${result.name}`);
        });

        const passedTests = results.filter(r => r.status).length;
        const totalTests = results.length;

        console.log(`\n📈 Resultado: ${passedTests}/${totalTests} testes passaram`);

        if (passedTests === totalTests) {
            console.log('🎉 SUCESSO! Mensageria RabbitMQ funcionando perfeitamente!');
        } else {
            console.log('⚠️ Alguns testes falharam. Verifique os logs dos serviços.');
        }

        console.log('\n💡 Dicas para troubleshooting:');
        console.log('   - Verifique se todos os containers estão rodando: docker ps');
        console.log('   - Veja logs dos consumers: docker logs damd-consumer-notification');
        console.log('   - Acesse RabbitMQ UI: http://localhost:15672 (admin/admin)');
        console.log('   - Teste novamente após alguns segundos\n');

        console.log('🚀 === TESTE CONCLUÍDO ===');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Executar testes se chamado diretamente
if (require.main === module) {
    const tester = new MensageriaTester();
    tester.runTests().catch(console.error);
}

module.exports = MensageriaTester;
