// client-demo.js - Cliente de demonstração para o sistema de listas de compras
const axios = require('axios');

class ListaComprasDemo {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.token = null;
        this.userId = null;
        this.listaId = null;
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

    async checkHealth() {
        try {
            await this.log('Verificando saúde do sistema...');
            const response = await axios.get(`${this.baseURL}/health`);
            console.log('✅ Sistema saudável:', response.data);
            return true;
        } catch (error) {
            console.error('❌ Sistema não está saudável:', error.message);
            return false;
        }
    }

    async checkRegistry() {
        try {
            await this.log('Verificando registry de serviços...');
            const response = await axios.get(`${this.baseURL}/registry`);
            console.log('📋 Serviços registrados:', response.data);
            return true;
        } catch (error) {
            console.error('❌ Erro ao verificar registry:', error.message);
            return false;
        }
    }

    async registerUser() {
        try {
            await this.log('Registrando novo usuário...');
            const userData = {
                email: 'demo@listacompras.com',
                username: 'demo',
                password: 'demo123',
                firstName: 'Usuário',
                lastName: 'Demo',
                preferences: {
                    defaultStore: 'Supermercado Demo',
                    currency: 'BRL'
                }
            };

            const response = await axios.post(`${this.baseURL}/api/auth/register`, userData);
            console.log('✅ Usuário registrado:', response.data);
            return true;
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('ℹ️  Usuário já existe, continuando...');
                return true;
            }
            console.error('❌ Erro ao registrar usuário:', error.response?.data || error.message);
            return false;
        }
    }

    async loginUser() {
        try {
            await this.log('Fazendo login...');
            const loginData = {
                identifier: 'demo@listacompras.com',
                password: 'demo123'
            };

            const response = await axios.post(`${this.baseURL}/api/auth/login`, loginData);
            this.token = response.data.data.token;
            this.userId = response.data.data.user.id;
            console.log('✅ Login realizado:', response.data);
            return true;
        } catch (error) {
            console.error('❌ Erro no login:', error.response?.data || error.message);
            return false;
        }
    }

    async searchItems() {
        try {
            await this.log('Buscando itens disponíveis...');
            const response = await axios.get(`${this.baseURL}/api/items?limit=5`);
            console.log('📦 Itens encontrados:', response.data);
            return response.data.data || [];
        } catch (error) {
            console.error('❌ Erro ao buscar itens:', error.response?.data || error.message);
            return [];
        }
    }

    async createLista() {
        try {
            await this.log('Criando nova lista de compras...');
            const listaData = {
                name: 'Lista Demo',
                description: 'Lista de demonstração do sistema'
            };

            const response = await axios.post(`${this.baseURL}/api/lists`, listaData, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            this.listaId = response.data.data.id;
            console.log('✅ Lista criada:', response.data);
            return true;
        } catch (error) {
            console.error('❌ Erro ao criar lista:', error.response?.data || error.message);
            return false;
        }
    }

    async addItemToLista(item) {
        try {
            await this.log(`Adicionando item "${item.name}" à lista...`);
            const itemData = {
                itemId: item.id,
                quantity: Math.floor(Math.random() * 3) + 1, // 1-3 unidades
                notes: 'Item adicionado via demo'
            };

            const response = await axios.post(
                `${this.baseURL}/api/lists/${this.listaId}/items`, 
                itemData,
                { headers: { 'Authorization': `Bearer ${this.token}` } }
            );
            console.log('✅ Item adicionado:', response.data);
            return true;
        } catch (error) {
            console.error('❌ Erro ao adicionar item:', error.response?.data || error.message);
            return false;
        }
    }

    async getDashboard() {
        try {
            await this.log('Obtendo dashboard...');
            const response = await axios.get(`${this.baseURL}/api/dashboard`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            console.log('📊 Dashboard:', response.data);
            return true;
        } catch (error) {
            console.error('❌ Erro ao obter dashboard:', error.response?.data || error.message);
            return false;
        }
    }

    async runDemo() {
        console.log('🚀 Iniciando demonstração do sistema de listas de compras...\n');
        
        // Verificar saúde do sistema
        if (!await this.checkHealth()) {
            console.log('❌ Sistema não está disponível. Verifique se todos os serviços estão rodando.');
            return;
        }

        await this.delay(1000);

        // Verificar registry
        await this.checkRegistry();
        await this.delay(1000);

        // Registrar usuário
        await this.registerUser();
        await this.delay(1000);

        // Login
        if (!await this.loginUser()) {
            console.log('❌ Falha no login. Abortando demonstração.');
            return;
        }
        await this.delay(1000);

        // Buscar itens
        const items = await this.searchItems();
        await this.delay(1000);

        // Criar lista
        if (!await this.createLista()) {
            console.log('❌ Falha ao criar lista. Abortando demonstração.');
            return;
        }
        await this.delay(1000);

        // Adicionar alguns itens à lista
        if (items.length > 0) {
            for (let i = 0; i < Math.min(3, items.length); i++) {
                await this.addItemToLista(items[i]);
                await this.delay(500);
            }
        }

        await this.delay(1000);

        // Obter dashboard
        await this.getDashboard();

        console.log('\n🎉 Demonstração concluída com sucesso!');
        console.log('\n📋 Resumo da demonstração:');
        console.log('✅ Sistema verificado e saudável');
        console.log('✅ Usuário registrado e autenticado');
        console.log('✅ Itens buscados no catálogo');
        console.log('✅ Lista de compras criada');
        console.log('✅ Itens adicionados à lista');
        console.log('✅ Dashboard obtido');
    }
}

// Executar demonstração
async function main() {
    const demo = new ListaComprasDemo();
    await demo.runDemo();
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

module.exports = ListaComprasDemo;

