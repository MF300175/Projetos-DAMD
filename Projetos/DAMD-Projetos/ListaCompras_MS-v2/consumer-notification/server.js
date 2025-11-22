const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const EXCHANGE_NAME = 'shopping_events';
const ROUTING_KEY = 'list.checkout.#'; // Escuta todos os eventos de checkout

async function startConsumer() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

        const q = await channel.assertQueue('', { exclusive: true });
        console.log(`Consumer Notification: Aguardando mensagens na fila ${q.queue}`);

        await channel.bindQueue(q.queue, EXCHANGE_NAME, ROUTING_KEY);

        // Log de status periodico para apresentacao
        const statusInterval = setInterval(() => {
            const now = new Date().toLocaleTimeString('pt-BR');
            console.log(`[${now}] Consumer Notification: Ativo e aguardando mensagens na fila ${q.queue.substring(0, 20)}...`);
        }, 5000); // A cada 5 segundos

        channel.consume(q.queue, (msg) => {
            if (msg.content) {
                const event = JSON.parse(msg.content.toString());
                console.log(`Consumer Notification: Recebido evento de checkout para lista ${event.listId}`);
                console.log(`   Enviando comprovante da lista ${event.listId} para o usuário ${event.userId}`);
                console.log(`   Detalhes: ${event.itemCount} itens. Total: R$ ${event.total}`);
                
                setTimeout(() => {
                    channel.ack(msg);
                    console.log(`Consumer Notification: Comprovante para lista ${event.listId} processado.`);
                }, 1000);
            }
        }, { noAck: false });

        // Limpar intervalo ao fechar conexao
        connection.on('close', () => {
            clearInterval(statusInterval);
        });

    } catch (error) {
        console.error('Consumer Notification: Erro ao iniciar consumer:', error);
        // Tentar reconectar após um tempo
        setTimeout(startConsumer, 5000);
    }
}

startConsumer();
