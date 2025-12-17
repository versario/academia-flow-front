import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { profesorId } = await req.json();

        if (!profesorId) {
            return Response.json({ error: 'Profesor ID is required' }, { status: 400 });
        }

        // Verificar si existen asignaciones (ProfesorAsignatura) para este profesor
        const asignaciones = await base44.asServiceRole.entities.ProfesorAsignatura.filter({ id_profesor: profesorId });
        if (asignaciones.length > 0) {
            return Response.json(
                { error: 'No se puede eliminar el profesor porque tiene asignaturas asignadas.' },
                { status: 400 }
            );
        }

        // Verificar si existen notas (Nota) creadas por este profesor
        const notas = await base44.asServiceRole.entities.Nota.filter({ id_profesor: profesorId });
        if (notas.length > 0) {
            return Response.json(
                { error: 'No se puede eliminar el profesor porque tiene notas asociadas.' },
                { status: 400 }
            );
        }

        // Si no hay asignaciones ni notas, proceder con la eliminación
        await base44.asServiceRole.entities.Profesor.delete(profesorId);

        return Response.json({ success: true, message: 'Profesor eliminado exitosamente' });
    } catch (error) {
        console.error('Error in deleteProfesor function:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});