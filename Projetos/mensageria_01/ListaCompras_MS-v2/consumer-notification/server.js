const amqp = require('amqplib');

class NotificationConsumer {
    constructor() {
        this.rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
        this.exchangeName = 'shopping_events';
        this.queueName = 'notification_queue';
        this.routingKey = 'list.checkout.#';
    }

    async start() {
        try {
            console.log('🔄 Iniciando Consumer de Notificações...');

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

            console.log('🎧 Aguardando mensagens de checkout...');

            // Consumir mensagens
            channel.consume(queueName, async (msg) => {
                if (msg) {
                    try {
                        const messageData = JSON.parse(msg.content.toString());
                        console.log('📨 Mensagem recebida:', messageData);

                        // Processar notificação
                        await this.processNotification(messageData);

                        // Confirmar processamento da mensagem
                        channel.ack(msg);
                        console.log(`✅ Mensagem processada para lista ${messageData.listId}`);

                    } catch (error) {
                        console.error('❌ Erro ao processar mensagem:', error);
                        // Em caso de erro, rejeitar a mensagem
                        channel.nack(msg, false, false);
                    }
                }
            });

            console.log('🚀 Consumer de Notificações iniciado com sucesso!');
            console.log(`📧 Escutando eventos: ${this.routingKey}`);
            console.log(`🏠 Exchange: ${this.exchangeName}`);

            // Manter o processo rodando
            process.on('SIGINT', async () => {
                console.log('🛑 Encerrando consumer...');
                await channel.close();
                await connection.close();
                process.exit(0);
            });

        } catch (error) {
            console.error('❌ Erro ao iniciar consumer:', error);
            process.exit(1);
        }
    }

    async processNotification(messageData) {
        try {
            const { listId, userId, total, itemCount, timestamp } = messageData;

            // Simular envio de notificação/email
            console.log(`📧 Enviando comprovante da lista ${listId} para o usuário ${userId}`);
            console.log(`📊 Total: R$ ${total.toFixed(2)} (${itemCount} itens)`);
            console.log(`🕒 Checkout realizado em: ${new Date(timestamp).toLocaleString('pt-BR')}`);

            // Simular tempo de processamento
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log(`✅ Comprovante enviado com sucesso para lista ${listId}!`);

        } catch (error) {
            console.error('❌ Erro ao processar notificação:', error);
            throw error;
        }
    }
}

// Iniciar consumer se executado diretamente
if (require.main === module) {
    const consumer = new NotificationConsumer();
    consumer.start();
}

module.exports = NotificationConsumer;
