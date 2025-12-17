import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, ClipboardList } from 'lucide-react';
import InscripcionForm from '../components/inscripciones/InscripcionForm';
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Inscripciones() {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inscripcionToDelete, setInscripcionToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const queryClient = useQueryClient();

  const { data: inscripciones = [], isLoading } = useQuery({
    queryKey: ['inscripciones'],
    queryFn: () => base44.entities.Inscripcion.list()
  });

  const { data: alumnos = [] } = useQuery({
    queryKey: ['alumnos'],
    queryFn: () => base44.entities.Alumno.list()
  });

  const { data: asignaturas = [] } = useQuery({
    queryKey: ['asignaturas'],
    queryFn: () => base44.entities.Asignatura.list()
  });

  const { data: profesores = [] } = useQuery({
    queryKey: ['profesores'],
    queryFn: () => base44.entities.Profesor.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Inscripcion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['inscripciones']);
      setFormOpen(false);
      toast.success('Inscripción creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear inscripción');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Inscripcion.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['inscripciones']);
      setDeleteDialogOpen(false);
      setInscripcionToDelete(null);
      toast.success('Inscripción eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar inscripción');
    }
  });

  const handleSave = (data) => {
    createMutation.mutate(data);
  };

  const handleDeleteClick = async (inscripcion) => {
    setInscripcionToDelete(inscripcion);
    setDeleteError(null);
    
    // Verificar si se puede eliminar
    try {
      const notas = await base44.entities.Nota.filter({ id_inscripcion: inscripcion.id });
      
      if (notas.length > 0) {
        setDeleteError(`No se puede eliminar la inscripción porque tiene ${notas.length} nota(s) asociada(s).`);
      }
    } catch (error) {
      console.error('Error checking inscripcion dependencies:', error);
    }
    
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (inscripcionToDelete) {
      deleteMutation.mutate(inscripcionToDelete.id);
    }
  };

  const getAlumnoNombre = (id) => {
    const alumno = alumnos.find(a => a.id === id);
    return alumno ? `${alumno.nombres} ${alumno.apellidos}` : 'Desconocido';
  };

  const getAsignaturaNombre = (id) => {
    const asignatura = asignaturas.find(a => a.id === id);
    return asignatura ? `${asignatura.codigo} - ${asignatura.nombre}` : 'Desconocida';
  };

  const getProfesorNombre = (id) => {
    const profesor = profesores.find(p => p.id === id);
    return profesor ? `${profesor.nombres} ${profesor.apellidos}` : 'Desconocido';
  };

  const filteredInscripciones = inscripciones.filter(inscripcion => {
    const alumnoNombre = getAlumnoNombre(inscripcion.id_alumno).toLowerCase();
    const asignaturaNombre = getAsignaturaNombre(inscripcion.id_asignatura).toLowerCase();
    const searchLower = search.toLowerCase();
    return alumnoNombre.includes(searchLower) || asignaturaNombre.includes(searchLower);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Inscripciones</h1>
          <p className="text-slate-600">Gestión de inscripciones de alumnos en asignaturas</p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva Inscripción
        </Button>
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-green-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ClipboardList className="w-6 h-6 text-green-600" />
              Lista de Inscripciones
            </CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por alumno o asignatura..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Alumno</TableHead>
                  <TableHead className="font-semibold">Asignatura</TableHead>
                  <TableHead className="font-semibold">Profesor</TableHead>
                  <TableHead className="font-semibold">Período</TableHead>
                  <TableHead className="text-right font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-12 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredInscripciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No se encontraron inscripciones
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInscripciones.map((inscripcion) => (
                    <TableRow key={inscripcion.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium">
                        {getAlumnoNombre(inscripcion.id_alumno)}
                      </TableCell>
                      <TableCell>
                        {getAsignaturaNombre(inscripcion.id_asignatura)}
                      </TableCell>
                      <TableCell>
                        {getProfesorNombre(inscripcion.id_profesor)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {inscripcion.semestre}° Sem. {inscripcion.anio}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(inscripcion)}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <InscripcionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        isLoading={createMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteError ? 'No se puede eliminar' : '¿Estás seguro?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError ? (
                deleteError
              ) : (
                <>
                  Esta acción eliminará permanentemente esta inscripción.
                  Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {!deleteError && (
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}