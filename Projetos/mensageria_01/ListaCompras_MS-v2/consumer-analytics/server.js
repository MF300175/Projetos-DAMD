const amqp = require('amqplib');

class AnalyticsConsumer {
    constructor() {
        this.rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
        this.exchangeName = 'shopping_events';
        this.queueName = 'analytics_queue';
        this.routingKey = 'list.checkout.#';

        // Simulação de banco de dados para analytics
        this.analyticsDb = {
            dailyStats: new Map(),
            weeklyStats: new Map(),
            monthlyStats: new Map()
        };
    }

    async start() {
        try {
            console.log('📊 Iniciando Consumer de Analytics...');

            // Conectar ao RabbitMQ
            const connection = await amqp.connect(this.rabbitmqUrl);
            const channel = await connection.createChannel();

            console.log('✅ Conectado ao RabbitMQ');

            // Garantir que o exchange existe
            await channel.assertExchange(this.exchangeName, 'topic', { durable: true });
            console.log(`📨 Exchange '${this.exchangeName}' verificado`);

            // Criar fila exclusiva para este consumer
            const queueResult = await channel.assertQueue('', { exclusive: true });
            const queueName = queueResult.queue;
            console.log(`📋 Fila criada: ${queueName}`);

            // Vincular fila ao exchange com routing key
            await channel.bindQueue(queueName, this.exchangeName, this.routingKey);
            console.log(`🔗 Fila vinculada ao exchange com routing key: ${this.routingKey}`);

            console.log('📈 Aguardando mensagens de checkout para analytics...');

            // Consumir mensagens
            channel.consume(queueName, async (msg) => {
                if (msg) {
                    try {
                        const messageData = JSON.parse(msg.content.toString());
                        console.log('📊 Dados recebidos:', messageData);

                        // Processar analytics
                        await this.processAnalytics(messageData);

                        // Confirmar processamento da mensagem
                        channel.ack(msg);
                        console.log(`✅ Analytics processado para lista ${messageData.listId}`);

                    } catch (error) {
                        console.error('❌ Erro ao processar analytics:', error);
                        // Em caso de erro, rejeitar a mensagem
                        channel.nack(msg, false, false);
                    }
                }
            });

            console.log('🚀 Consumer de Analytics iniciado com sucesso!');
            console.log(`📈 Processando eventos: ${this.routingKey}`);
            console.log(`🏠 Exchange: ${this.exchangeName}`);

            // Exibir relatório inicial
            this.displayAnalyticsReport();

            // Manter o processo rodando
            process.on('SIGINT', async () => {
                console.log('🛑 Encerrando consumer de analytics...');
                this.displayFinalReport();
                await channel.close();
                await connection.close();
                process.exit(0);
            });

        } catch (error) {
            console.error('❌ Erro ao iniciar consumer de analytics:', error);
            process.exit(1);
        }
    }

    async processAnalytics(messageData) {
        try {
            const { listId, userId, total, itemCount, timestamp } = messageData;
            const checkoutDate = new Date(timestamp);
            const dayKey = checkoutDate.toISOString().split('T')[0];
            const weekKey = this.getWeekKey(checkoutDate);
            const monthKey = `${checkoutDate.getFullYear()}-${String(checkoutDate.getMonth() + 1).padStart(2, '0')}`;

            // Atualizar estatísticas diárias
            if (!this.analyticsDb.dailyStats.has(dayKey)) {
                this.analyticsDb.dailyStats.set(dayKey, {
                    totalRevenue: 0,
                    totalCheckouts: 0,
                    totalItems: 0,
                    averageOrderValue: 0
                });
            }

            const dailyStats = this.analyticsDb.dailyStats.get(dayKey);
            dailyStats.totalRevenue += total;
            dailyStats.totalCheckouts += 1;
            dailyStats.totalItems += itemCount;
            dailyStats.averageOrderValue = dailyStats.totalRevenue / dailyStats.totalCheckouts;

            // Atualizar estatísticas semanais
            if (!this.analyticsDb.weeklyStats.has(weekKey)) {
                this.analyticsDb.weeklyStats.set(weekKey, {
                    totalRevenue: 0,
                    totalCheckouts: 0,
                    totalItems: 0
                });
            }

            const weeklyStats = this.analyticsDb.weeklyStats.get(weekKey);
            weeklyStats.totalRevenue += total;
            weeklyStats.totalCheckouts += 1;
            weeklyStats.totalItems += itemCount;

            // Atualizar estatísticas mensais
            if (!this.analyticsDb.monthlyStats.has(monthKey)) {
                this.analyticsDb.monthlyStats.set(monthKey, {
                    totalRevenue: 0,
                    totalCheckouts: 0,
                    totalItems: 0
                });
            }

            const monthlyStats = this.analyticsDb.monthlyStats.get(monthKey);
            monthlyStats.totalRevenue += total;
            monthlyStats.totalCheckouts += 1;
            monthlyStats.totalItems += itemCount;

            console.log(`💰 Receita diária atualizada: R$ ${dailyStats.totalRevenue.toFixed(2)}`);
            console.log(`📊 Checkouts hoje: ${dailyStats.totalCheckouts}`);
            console.log(`🛒 Itens vendidos hoje: ${dailyStats.totalItems}`);

        } catch (error) {
            console.error('❌ Erro ao processar analytics:', error);
            throw error;
        }
    }

    getWeekKey(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();

        // Calcular início da semana (domingo)
        const weekStart = new Date(year, month, day - date.getDay());
        return weekStart.toISOString().split('T')[0];
    }

    displayAnalyticsReport() {
        console.log('\n📊 === RELATÓRIO DE ANALYTICS ===');

        // Estatísticas diárias
        console.log('\n📅 Estatísticas Diárias:');
        for (const [date, stats] of this.analyticsDb.dailyStats) {
            console.log(`  ${date}: R$ ${stats.totalRevenue.toFixed(2)} (${stats.totalCheckouts} checkouts, ${stats.totalItems} itens)`);
        }

        // Estatísticas semanais
        console.log('\n📆 Estatísticas Semanais:');
        for (const [week, stats] of this.analyticsDb.weeklyStats) {
            console.log(`  Semana ${week}: R$ ${stats.totalRevenue.toFixed(2)} (${stats.totalCheckouts} checkouts)`);
        }

        // Estatísticas mensais
        console.log('\n📊 Estatísticas Mensais:');
        for (const [month, stats] of this.analyticsDb.monthlyStats) {
            console.log(`  ${month}: R$ ${stats.totalRevenue.toFixed(2)} (${stats.totalCheckouts} checkouts)`);
        }

        console.log('================================\n');
    }

    displayFinalReport() {
        console.log('\n🎯 === RELATÓRIO FINAL DE ANALYTICS ===');
        this.displayAnalyticsReport();
        console.log('✅ Consumer de Analytics encerrado.');
    }
}

// Iniciar consumer se executado diretamente
if (require.main === module) {
    const consumer = new AnalyticsConsumer();
    consumer.start();
}

module.exports = AnalyticsConsumer;
