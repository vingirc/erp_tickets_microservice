import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../services/supabase.js';
import { createResponse } from '../utils/response.js';

interface TicketParams {
    id: string;
}

interface GrupoParams {
    grupoId: string;
}

interface CreateTicketBody {
    grupo_id: string;
    titulo: string;
    descripcion?: string;
    autor_id: string;
    asignado_id?: string;
    estado_id: string;
    priority_id: string;
}

interface UpdateTicketBody {
    titulo?: string;
    descripcion?: string;
    asignado_id?: string;
    estado_id?: string;
    priority_id?: string;
    fecha_final?: string;
}

interface CreateCommentBody {
    ticket_id: string;
    autor_id: string;
    contenido: string;
}

interface UpdateStateBody {
    estado_id: string;
    usuario_id: string;
}

export async function ticketRoutes(fastify: FastifyInstance) {

    // Rutas específicas primero (más específicas = antes)

    // Tickets por grupo
    fastify.get('/tickets/group/:grupoId', async (request: FastifyRequest<GrupoParams>, reply: FastifyReply) => {
        try {
            const { grupoId } = request.params;

            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('grupo_id', grupoId)
                .order('creado_en', { ascending: false });

            if (error) {
                return reply.send(createResponse(500, 'SxER091', [{ error: 'Error de base de datos' }]));
            }

            return reply.send(createResponse(200, 'SxTK035', data || []));
        } catch (error) {
            return reply.send(createResponse(500, 'SxER092', [{ error: 'Error interno del servidor' }]));
        }
    });

    // Comentarios de un ticket
    fastify.get('/tickets/:id/comments', async (request: FastifyRequest<TicketParams>, reply: FastifyReply) => {
        try {
            const { id } = request.params;

            const { data, error } = await supabase
                .from('comentarios')
                .select('*')
                .eq('ticket_id', id)
                .order('creado_en', { ascending: true });

            if (error) {
                return reply.send(createResponse(500, 'SxER091', [{ error: 'Error de base de datos' }]));
            }

            return reply.send(createResponse(200, 'SxTK035', data || []));
        } catch (error) {
            return reply.send(createResponse(500, 'SxER092', [{ error: 'Error interno del servidor' }]));
        }
    });

    // Historial de un ticket
    fastify.get('/tickets/:id/history', async (request: FastifyRequest<TicketParams>, reply: FastifyReply) => {
        try {
            const { id } = request.params;

            const { data, error } = await supabase
                .from('historial_tickets')
                .select('*')
                .eq('ticket_id', id)
                .order('creado_en', { ascending: false });

            if (error) {
                return reply.send(createResponse(500, 'SxER091', [{ error: 'Error de base de datos' }]));
            }

            return reply.send(createResponse(200, 'SxTK035', data || []));
        } catch (error) {
            return reply.send(createResponse(500, 'SxER092', [{ error: 'Error interno del servidor' }]));
        }
    });

    // Cambiar estado del ticket
    fastify.patch('/tickets/:id/state', async (request: FastifyRequest<TicketParams & {body: UpdateStateBody}>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const { estado_id, usuario_id } = request.body;

            if (!estado_id || !usuario_id) {
                return reply.send(createResponse(400, 'SxER090', [{ error: 'estado_id y usuario_id son requeridos' }]));
            }

            const { data: oldTicket } = await supabase
                .from('tickets')
                .select('estado_id')
                .eq('id', id)
                .single();

            const { data, error } = await supabase
                .from('tickets')
                .update({ estado_id })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return reply.send(createResponse(500, 'SxER091', [{ error: error.message }]));
            }

            await supabase.from('historial_tickets').insert({
                ticket_id: id,
                usuario_id,
                accion: 'cambiar_estado',
                detalles: { estado_anterior: oldTicket?.estado_id, estado_nuevo: estado_id },
                creado_en: new Date().toISOString()
            });

            return reply.send(createResponse(200, 'SxTK032', data));
        } catch (error) {
            return reply.send(createResponse(500, 'SxER092', [{ error: 'Error interno del servidor' }]));
        }
    });

    // Actualizar ticket
    fastify.patch('/tickets/:id', async (request: FastifyRequest<TicketParams & {body: UpdateTicketBody}>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const updateData = request.body;

            const { data: oldTicket } = await supabase
                .from('tickets')
                .select('*')
                .eq('id', id)
                .single();

            const { data, error } = await supabase
                .from('tickets')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return reply.send(createResponse(500, 'SxER091', [{ error: error.message }]));
            }

            await supabase.from('historial_tickets').insert({
                ticket_id: id,
                usuario_id: oldTicket?.autor_id || 'unknown',
                accion: 'actualizar',
                detalles: { cambios: updateData, anterior: oldTicket },
                creado_en: new Date().toISOString()
            });

            return reply.send(createResponse(200, 'SxTK032', data));
        } catch (error) {
            return reply.send(createResponse(500, 'SxER092', [{ error: 'Error interno del servidor' }]));
        }
    });

    // Obtener ticket por ID
    fastify.get('/tickets/:id', async (request: FastifyRequest<TicketParams>, reply: FastifyReply) => {
        try {
            const { id } = request.params;

            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) {
                return reply.send(createResponse(404, 'SxTK034', [{ error: 'Ticket no encontrado' }]));
            }

            return reply.send(createResponse(200, 'SxTK035', data));
        } catch (error) {
            return reply.send(createResponse(500, 'SxER092', [{ error: 'Error interno del servidor' }]));
        }
    });

    // Eliminar ticket
    fastify.delete('/tickets/:id', async (request: FastifyRequest<TicketParams>, reply: FastifyReply) => {
        try {
            const { id } = request.params;

            const { data: ticket } = await supabase
                .from('tickets')
                .select('autor_id')
                .eq('id', id)
                .single();

            const { error } = await supabase
                .from('tickets')
                .delete()
                .eq('id', id);

            if (error) {
                return reply.send(createResponse(500, 'SxER091', [{ error: error.message }]));
            }

            if (ticket) {
                await supabase.from('historial_tickets').insert({
                    ticket_id: id,
                    usuario_id: ticket.autor_id,
                    accion: 'eliminar',
                    detalles: {},
                    creado_en: new Date().toISOString()
                });
            }

            return reply.send(createResponse(200, 'SxTK033', [{ message: 'Ticket eliminado exitosamente' }]));
        } catch (error) {
            return reply.send(createResponse(500, 'SxER092', [{ error: 'Error interno del servidor' }]));
        }
    });

    // Crear nuevo ticket
    fastify.post('/tickets', async (request: FastifyRequest<{body: CreateTicketBody}>, reply: FastifyReply) => {
        try {
            const { grupo_id, titulo, descripcion, autor_id, asignado_id, estado_id, priority_id } = request.body;

            if (!grupo_id || !titulo || !autor_id || !estado_id || !priority_id) {
                return reply.send(createResponse(400, 'SxER090', [{ error: 'Faltan campos requeridos: grupo_id, titulo, autor_id, estado_id, priority_id' }]));
            }

            const { data, error } = await supabase
                .from('tickets')
                .insert({
                    grupo_id,
                    titulo,
                    descripcion,
                    autor_id,
                    asignado_id,
                    estado_id,
                    priority_id,
                    creado_en: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                return reply.send(createResponse(500, 'SxER091', [{ error: error.message }]));
            }

            await supabase.from('historial_tickets').insert({
                ticket_id: data.id,
                usuario_id: autor_id,
                accion: 'crear',
                detalles: { titulo, descripcion },
                creado_en: new Date().toISOString()
            });

            return reply.send(createResponse(201, 'SxTK031', data));
        } catch (error) {
            return reply.send(createResponse(500, 'SxER092', [{ error: 'Error interno del servidor' }]));
        }
    });

    // Agregar comentario
    fastify.post('/tickets/comments', async (request: FastifyRequest<{body: CreateCommentBody}>, reply: FastifyReply) => {
        try {
            const { ticket_id, autor_id, contenido } = request.body;

            if (!ticket_id || !autor_id || !contenido) {
                return reply.send(createResponse(400, 'SxER090', [{ error: 'Faltan campos requeridos: ticket_id, autor_id, contenido' }]));
            }

            const { data, error } = await supabase
                .from('comentarios')
                .insert({
                    ticket_id,
                    autor_id,
                    contenido,
                    creado_en: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                return reply.send(createResponse(500, 'SxER091', [{ error: error.message }]));
            }

            await supabase.from('historial_tickets').insert({
                ticket_id,
                usuario_id: autor_id,
                accion: 'agregar_comentario',
                detalles: { contenido },
                creado_en: new Date().toISOString()
            });

            return reply.send(createResponse(201, 'SxTK031', data));
        } catch (error) {
            return reply.send(createResponse(500, 'SxER092', [{ error: 'Error interno del servidor' }]));
        }
    });

    // Listar todos los tickets (debe ser la última)
    fastify.get('/tickets', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .order('creado_en', { ascending: false });

            if (error) {
                return reply.send(createResponse(500, 'SxER091', [{ error: 'Error de base de datos' }]));
            }

            return reply.send(createResponse(200, 'SxTK035', data || []));
        } catch (error) {
            return reply.send(createResponse(500, 'SxER092', [{ error: 'Error interno del servidor' }]));
        }
    });
}