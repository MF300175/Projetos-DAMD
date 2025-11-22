const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const EXCHANGE_NAME = 'shopping_events';
const ROUTING_KEY = 'list.checkout.#';

const analyticsData = {
    totalCheckouts: 0,
    totalRevenue: 0,
    itemsSold: 0,
    lastCheckout: null
};

async function startConsumer() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

        const q = await channel.assertQueue('', { exclusive: true });
        console.log(`Consumer Analytics: Aguardando mensagens na fila ${q.queue}`);

        await channel.bindQueue(q.queue, EXCHANGE_NAME, ROUTING_KEY);

        // Log de status periodico para apresentacao
        const statusInterval = setInterval(() => {
            const now = new Date().toLocaleTimeString('pt-BR');
            const stats = `Checkouts: ${analyticsData.totalCheckouts} | Receita: R$ ${analyticsData.totalRevenue.toFixed(2)} | Itens: ${analyticsData.itemsSold}`;
            console.log(`[${now}] Consumer Analytics: Ativo e aguardando mensagens. Stats: ${stats}`);
        }, 5000); // A cada 5 segundos

        channel.consume(q.queue, (msg) => {
            if (msg.content) {
                const event = JSON.parse(msg.content.toString());
                console.log(`Consumer Analytics: Recebido evento de checkout para lista ${event.listId}`);

                analyticsData.totalCheckouts++;
                analyticsData.totalRevenue += event.total;
                analyticsData.itemsSold += event.itemCount;
                analyticsData.lastCheckout = event.timestamp;

                console.log(`   Métricas: Checkouts: ${analyticsData.totalCheckouts}, Receita: R$ ${analyticsData.totalRevenue.toFixed(2)}, Itens Vendidos: ${analyticsData.itemsSold}`);

                setTimeout(() => {
                    channel.ack(msg);
                    console.log(`Consumer Analytics: Dados para lista ${event.listId} processados.`);
                }, 1500);
            }
        }, { noAck: false });

        // Limpar intervalo ao fechar conexao
        connection.on('close', () => {
            clearInterval(statusInterval);
        });

    } catch (error) {
        console.error('Consumer Analytics: Erro ao iniciar consumer:', error);
        setTimeout(startConsumer, 5000);
    }
}

startConsumer();
