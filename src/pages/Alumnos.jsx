import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
import AlumnoForm from '../components/alumnos/AlumnoForm';
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

export default function Alumnos() {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [alumnoToDelete, setAlumnoToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const queryClient = useQueryClient();

  const { data: alumnos = [], isLoading } = useQuery({
    queryKey: ['alumnos'],
    queryFn: () => base44.entities.Alumno.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Alumno.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['alumnos']);
      setFormOpen(false);
      toast.success('Alumno creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear alumno');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Alumno.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['alumnos']);
      setFormOpen(false);
      setSelectedAlumno(null);
      toast.success('Alumno actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar alumno');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await base44.functions.invoke('deleteAlumno', { alumnoId: id });
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alumnos']);
      setDeleteDialogOpen(false);
      setAlumnoToDelete(null);
      toast.success('Alumno eliminado exitosamente');
    },
    onError: (error) => {
      setDeleteDialogOpen(false);
      toast.error(error.message);
    }
  });

  const handleSave = (data) => {
    if (selectedAlumno) {
      updateMutation.mutate({ id: selectedAlumno.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (alumno) => {
    setSelectedAlumno(alumno);
    setFormOpen(true);
  };

  const handleDeleteClick = async (alumno) => {
    setAlumnoToDelete(alumno);
    setDeleteError(null);
    
    // Verificar si se puede eliminar
    try {
      const inscripciones = await base44.entities.Inscripcion.filter({ id_alumno: alumno.id });
      
      if (inscripciones.length > 0) {
        const todasLasNotas = await base44.entities.Nota.list();
        const inscripcionesIds = inscripciones.map(i => i.id);
        const notasAlumno = todasLasNotas.filter(nota => inscripcionesIds.includes(nota.id_inscripcion));
        
        if (notasAlumno.length > 0) {
          setDeleteError(`No se puede eliminar el alumno porque tiene ${inscripciones.length} asignatura(s) inscrita(s) y ${notasAlumno.length} nota(s) asociada(s).`);
        } else {
          setDeleteError(`No se puede eliminar el alumno porque tiene ${inscripciones.length} asignatura(s) inscrita(s).`);
        }
      }
    } catch (error) {
      console.error('Error checking alumno dependencies:', error);
    }
    
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (alumnoToDelete) {
      deleteMutation.mutate(alumnoToDelete.id);
    }
  };

  const filteredAlumnos = alumnos.filter(alumno =>
    alumno.nombres?.toLowerCase().includes(search.toLowerCase()) ||
    alumno.apellidos?.toLowerCase().includes(search.toLowerCase()) ||
    alumno.rut?.toLowerCase().includes(search.toLowerCase()) ||
    alumno.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Alumnos</h1>
          <p className="text-slate-600">Gestión de estudiantes del sistema</p>
        </div>
        <Button
          onClick={() => {
            setSelectedAlumno(null);
            setFormOpen(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Alumno
        </Button>
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="w-6 h-6 text-blue-600" />
              Lista de Alumnos
            </CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre, RUT o email..."
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
                  <TableHead className="font-semibold">RUT</TableHead>
                  <TableHead className="font-semibold">Nombres</TableHead>
                  <TableHead className="font-semibold">Apellidos</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="text-right font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredAlumnos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No se encontraron alumnos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlumnos.map((alumno) => (
                    <TableRow key={alumno.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium">{alumno.rut}</TableCell>
                      <TableCell>{alumno.nombres}</TableCell>
                      <TableCell>{alumno.apellidos}</TableCell>
                      <TableCell className="text-slate-600">{alumno.email}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(alumno)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(alumno)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlumnoForm
        alumno={selectedAlumno}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedAlumno(null);
        }}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
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
                  Esta acción eliminará permanentemente al alumno {alumnoToDelete?.nombres} {alumnoToDelete?.apellidos}.
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