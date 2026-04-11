import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ticketRoutes } from './routes/tickets.js';
import { supabase } from './services/supabase.js';
import { createResponse } from './utils/response.js';

const fastify = Fastify({
    logger: true
});

async function start() {
    try {
        await fastify.register(cors, {
            origin: true,
            methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        });

        fastify.register(ticketRoutes);

        fastify.get('/estados', async (request, reply) => {
            try {
                const { data, error } = await supabase
                    .from('estados')
                    .select('*')
                    .order('nombre');

                if (error) {
                    return reply.send(createResponse(500, 'SxER091', [{ error: 'Error de base de datos' }]));
                }

                return reply.send(createResponse(200, 'SxTK035', data || []));
            } catch (error) {
                return reply.send(createResponse(500, 'SxER092', [{ error: 'Error interno del servidor' }]));
            }
        });

        fastify.get('/prioridades', async (request, reply) => {
            try {
                const { data, error } = await supabase
                    .from('prioridades')
                    .select('*')
                    .order('orden');

                if (error) {
                    return reply.send(createResponse(500, 'SxER091', [{ error: 'Error de base de datos' }]));
                }

                return reply.send(createResponse(200, 'SxTK035', data || []));
            } catch (error) {
                return reply.send(createResponse(500, 'SxER092', [{ error: 'Error interno del servidor' }]));
            }
        });

        await fastify.listen({ port: 3002, host: '0.0.0.0' });
        console.log('Tickets Microservice running on port 3002');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();