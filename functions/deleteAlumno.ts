import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { alumnoId } = await req.json();

        if (!alumnoId) {
            return Response.json({ error: 'Alumno ID is required' }, { status: 400 });
        }

        // Verificar si existen inscripciones para este alumno
        const inscripciones = await base44.asServiceRole.entities.Inscripcion.filter({ id_alumno: alumnoId });
        
        if (inscripciones.length > 0) {
            // Verificar si existen notas asociadas a las inscripciones de este alumno
            const todasLasNotas = await base44.asServiceRole.entities.Nota.list();
            const inscripcionesIds = inscripciones.map(i => i.id);
            const notasAlumno = todasLasNotas.filter(nota => inscripcionesIds.includes(nota.id_inscripcion));
            
            if (notasAlumno.length > 0) {
                return Response.json(
                    { error: 'No se puede eliminar el alumno porque tiene notas asociadas.' },
                    { status: 400 }
                );
            }
            
            return Response.json(
                { error: 'No se puede eliminar el alumno porque tiene inscripciones en asignaturas.' },
                { status: 400 }
            );
        }

        // Si no hay inscripciones ni notas, proceder con la eliminación
        await base44.asServiceRole.entities.Alumno.delete(alumnoId);

        return Response.json({ success: true, message: 'Alumno eliminado exitosamente' });
    } catch (error) {
        console.error('Error in deleteAlumno function:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});