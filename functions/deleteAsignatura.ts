import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { asignaturaId } = await req.json();

        if (!asignaturaId) {
            return Response.json({ error: 'Asignatura ID is required' }, { status: 400 });
        }

        // Verificar si existen inscripciones para esta asignatura
        const inscripciones = await base44.asServiceRole.entities.Inscripcion.filter({ id_asignatura: asignaturaId });
        
        if (inscripciones.length > 0) {
            return Response.json(
                { error: 'No se puede eliminar la asignatura porque tiene inscripciones de alumnos asociadas.' },
                { status: 400 }
            );
        }

        // Verificar si existen asignaciones de profesores
        const profesorAsignaturas = await base44.asServiceRole.entities.ProfesorAsignatura.filter({ id_asignatura: asignaturaId });
        
        // Eliminar las asignaciones de profesores si existen
        for (const pa of profesorAsignaturas) {
            await base44.asServiceRole.entities.ProfesorAsignatura.delete(pa.id);
        }

        // Si no hay inscripciones, proceder con la eliminación
        await base44.asServiceRole.entities.Asignatura.delete(asignaturaId);

        return Response.json({ success: true, message: 'Asignatura eliminada exitosamente' });
    } catch (error) {
        console.error('Error in deleteAsignatura function:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});