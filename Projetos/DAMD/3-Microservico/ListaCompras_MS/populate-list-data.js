// populate-list-data.js - Script para popular dados de exemplo no List Service
const axios = require('axios');

class ListDataPopulator {
    constructor() {
        this.baseUrl = 'http://localhost:3002';
        this.authToken = 'Bearer demo-token'; // Token de demonstração
    }

    log(message) {
        console.log(`📝 ${message}`);
    }

    async populateSampleLists() {
        this.log('Populando listas de exemplo...');

        const sampleLists = [
            {
                name: 'Lista de Compras Semanal',
                description: 'Compras para a semana de 15/01 a 21/01',
                status: 'active'
            },
            {
                name: 'Lista de Limpeza',
                description: 'Produtos de limpeza para o mês',
                status: 'active'
            },
            {
                name: 'Lista de Padaria',
                description: 'Pães, bolos e doces',
                status: 'active'
            },
            {
                name: 'Lista Concluída',
                description: 'Compras do final de semana passado',
                status: 'completed'
            }
        ];

        const createdLists = [];

        for (const listData of sampleLists) {
            try {
                const response = await axios.post(`${this.baseUrl}/lists`, listData, {
                    headers: {
                        'Authorization': this.authToken,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.success) {
                    createdLists.push(response.data.data);
                    this.log(`✅ Lista criada: ${listData.name}`);
                }
            } catch (error) {
                console.error(`❌ Erro ao criar lista ${listData.name}:`, error.message);
            }
        }

        return createdLists;
    }

    async addItemsToLists(lists) {
        this.log('Adicionando itens às listas...');

        // Itens de exemplo para diferentes listas
        const itemsByList = {
            'Lista de Compras Semanal': [
                { itemId: 'item-1', quantity: 2, notes: 'Orgânico preferível' },
                { itemId: 'item-2', quantity: 1, notes: 'Grande' },
                { itemId: 'item-3', quantity: 3, notes: 'Sem lactose' }
            ],
            'Lista de Limpeza': [
                { itemId: 'item-4', quantity: 1, notes: 'Concentrado' },
                { itemId: 'item-5', quantity: 2, notes: 'Lavanda' },
                { itemId: 'item-6', quantity: 1, notes: 'Multiuso' }
            ],
            'Lista de Padaria': [
                { itemId: 'item-7', quantity: 1, notes: 'Integral' },
                { itemId: 'item-8', quantity: 6, notes: 'Caseiro' },
                { itemId: 'item-9', quantity: 1, notes: 'Sem açúcar' }
            ]
        };

        for (const list of lists) {
            const items = itemsByList[list.name] || [];
            
            for (const item of items) {
                try {
                    const response = await axios.post(
                        `${this.baseUrl}/lists/${list.id}/items`,
                        item,
                        {
                            headers: {
                                'Authorization': this.authToken,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    if (response.data.success) {
                        this.log(`✅ Item adicionado à lista ${list.name}`);
                    }
                } catch (error) {
                    console.error(`❌ Erro ao adicionar item à lista ${list.name}:`, error.message);
                }
            }
        }
    }

    async checkListService() {
        this.log('Verificando se List Service está rodando...');
        
        try {
            const response = await axios.get(`${this.baseUrl}/health`);
            if (response.data.status === 'healthy') {
                this.log('✅ List Service está rodando');
                return true;
            }
        } catch (error) {
            console.error('❌ List Service não está rodando:', error.message);
            return false;
        }
    }

    async run() {
        console.log('🚀 Iniciando população de dados do List Service...\n');

        try {
            // Verificar se o serviço está rodando
            const isRunning = await this.checkListService();
            if (!isRunning) {
                console.log('❌ List Service não está rodando. Execute: npm start');
                return;
            }

            // Criar listas de exemplo
            const lists = await this.populateSampleLists();
            
            if (lists.length > 0) {
                // Adicionar itens às listas
                await this.addItemsToLists(lists);
                
                console.log('\n✅ Dados populados com sucesso!');
                console.log(`📊 ${lists.length} listas criadas`);
                console.log('\n🔗 Para verificar:');
                console.log(`   curl -H "Authorization: Bearer demo-token" http://localhost:3002/lists`);
            } else {
                console.log('⚠️ Nenhuma lista foi criada');
            }

        } catch (error) {
            console.error('❌ Erro durante a população:', error.message);
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const populator = new ListDataPopulator();
    populator.run();
}

module.exports = ListDataPopulator;
