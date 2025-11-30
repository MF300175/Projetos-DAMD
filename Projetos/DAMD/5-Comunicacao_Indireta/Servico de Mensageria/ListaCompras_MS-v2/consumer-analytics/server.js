const amqp = require('amqplib');

class AnalyticsConsumer {
    constructor() {
        this.rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
        this.exchangeName = 'shopping_events';
        this.queueName = 'analytics_queue';
        this.routingKey = 'list.checkout.#';

        this.analyticsDb = {
            dailyStats: new Map(),
            weeklyStats: new Map(),
            monthlyStats: new Map()
        };
    }

    async start() {
        try {
            console.log('Iniciando Consumer de Analytics...');

            const connection = await amqp.connect(this.rabbitmqUrl);
            const channel = await connection.createChannel();

            console.log('Conectado ao RabbitMQ');

            await channel.assertExchange(this.exchangeName, 'topic', { durable: true });
            console.log(`Exchange '${this.exchangeName}' verificado`);

            const queueResult = await channel.assertQueue('', { exclusive: true });
            const queueName = queueResult.queue;
            console.log(`Fila criada: ${queueName}`);

            await channel.bindQueue(queueName, this.exchangeName, this.routingKey);
            console.log(`Fila vinculada ao exchange com routing key: ${this.routingKey}`);

            console.log('Aguardando mensagens de checkout para analytics...');

            channel.consume(queueName, async (msg) => {
                if (msg) {
                    try {
                        const messageData = JSON.parse(msg.content.toString());
                        console.log('Dados recebidos:', messageData);

                        await this.processAnalytics(messageData);

                        channel.ack(msg);
                        console.log(`Analytics processado para lista ${messageData.listId}`);

                    } catch (error) {
                        console.error('Erro ao processar analytics:', error);
                        channel.nack(msg, false, false);
                    }
                }
            });

            console.log('Consumer de Analytics iniciado com sucesso!');
            console.log(`Processando eventos: ${this.routingKey}`);
            console.log(`Exchange: ${this.exchangeName}`);

            this.displayAnalyticsReport();

            process.on('SIGINT', async () => {
                console.log('Encerrando consumer de analytics...');
                this.displayFinalReport();
                await channel.close();
                await connection.close();
                process.exit(0);
            });

        } catch (error) {
            console.error('Erro ao iniciar consumer de analytics:', error);
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

            console.log(`Receita diaria atualizada: R$ ${dailyStats.totalRevenue.toFixed(2)}`);
            console.log(`Checkouts hoje: ${dailyStats.totalCheckouts}`);
            console.log(`Itens vendidos hoje: ${dailyStats.totalItems}`);

        } catch (error) {
            console.error('Erro ao processar analytics:', error);
            throw error;
        }
    }

    getWeekKey(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();

        const weekStart = new Date(year, month, day - date.getDay());
        return weekStart.toISOString().split('T')[0];
    }

    displayAnalyticsReport() {
        console.log('\n=== RELATORIO DE ANALYTICS ===');

        console.log('\nEstatisticas Diarias:');
        for (const [date, stats] of this.analyticsDb.dailyStats) {
            console.log(`  ${date}: R$ ${stats.totalRevenue.toFixed(2)} (${stats.totalCheckouts} checkouts, ${stats.totalItems} itens)`);
        }

        console.log('\nEstatisticas Semanais:');
        for (const [week, stats] of this.analyticsDb.weeklyStats) {
            console.log(`  Semana ${week}: R$ ${stats.totalRevenue.toFixed(2)} (${stats.totalCheckouts} checkouts)`);
        }

        console.log('\nEstatisticas Mensais:');
        for (const [month, stats] of this.analyticsDb.monthlyStats) {
            console.log(`  ${month}: R$ ${stats.totalRevenue.toFixed(2)} (${stats.totalCheckouts} checkouts)`);
        }

        console.log('================================\n');
    }

    displayFinalReport() {
        console.log('\n=== RELATORIO FINAL DE ANALYTICS ===');
        this.displayAnalyticsReport();
        console.log('Consumer de Analytics encerrado.');
    }
}

if (require.main === module) {
    const consumer = new AnalyticsConsumer();
    consumer.start();
}

module.exports = AnalyticsConsumer;
