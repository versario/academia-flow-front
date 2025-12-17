import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, BookOpen, UserPlus, Users, ListChecks } from 'lucide-react';
import AsignaturaForm from '../components/asignaturas/AsignaturaForm';
import AsignarProfesorDialog from '../components/asignaturas/AsignarProfesorDialog';
import EvaluacionesDialog from '../components/asignaturas/EvaluacionesDialog';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Asignaturas() {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAsignatura, setSelectedAsignatura] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [asignaturaToDelete, setAsignaturaToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [asignarProfesorOpen, setAsignarProfesorOpen] = useState(false);
  const [verProfesoresOpen, setVerProfesoresOpen] = useState(false);
  const [evaluacionesOpen, setEvaluacionesOpen] = useState(false);
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState(null);
  const [searchProfesores, setSearchProfesores] = useState('');

  const queryClient = useQueryClient();

  const { data: asignaturas = [], isLoading } = useQuery({
    queryKey: ['asignaturas'],
    queryFn: () => base44.entities.Asignatura.list()
  });

  const { data: profesores = [] } = useQuery({
    queryKey: ['profesores'],
    queryFn: () => base44.entities.Profesor.list()
  });

  const { data: asignaciones = [] } = useQuery({
    queryKey: ['profesor-asignatura'],
    queryFn: () => base44.entities.ProfesorAsignatura.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Asignatura.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['asignaturas']);
      setFormOpen(false);
      toast.success('Asignatura creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear asignatura');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Asignatura.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['asignaturas']);
      setFormOpen(false);
      setSelectedAsignatura(null);
      toast.success('Asignatura actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar asignatura');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await base44.functions.invoke('deleteAsignatura', { asignaturaId: id });
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['asignaturas']);
      queryClient.invalidateQueries(['profesor-asignatura']);
      setDeleteDialogOpen(false);
      setAsignaturaToDelete(null);
      toast.success('Asignatura eliminada exitosamente');
    },
    onError: (error) => {
      setDeleteDialogOpen(false);
      toast.error(error.message);
    }
  });

  const asignarProfesorMutation = useMutation({
    mutationFn: (data) => base44.entities.ProfesorAsignatura.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['profesor-asignatura']);
      setAsignarProfesorOpen(false);
      toast.success('Profesor asignado exitosamente');
    },
    onError: () => {
      toast.error('Error al asignar profesor');
    }
  });

  const desasignarProfesorMutation = useMutation({
    mutationFn: (id) => base44.entities.ProfesorAsignatura.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['profesor-asignatura']);
      toast.success('Profesor desasignado exitosamente');
    },
    onError: () => {
      toast.error('Error al desasignar profesor');
    }
  });

  const handleSave = (data) => {
    if (selectedAsignatura) {
      updateMutation.mutate({ id: selectedAsignatura.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (asignatura) => {
    setSelectedAsignatura(asignatura);
    setFormOpen(true);
  };

  const handleDeleteClick = async (asignatura) => {
    setAsignaturaToDelete(asignatura);
    setDeleteError(null);
    
    // Verificar si se puede eliminar
    try {
      const inscripciones = await base44.entities.Inscripcion.filter({ id_asignatura: asignatura.id });
      
      if (inscripciones.length > 0) {
        setDeleteError(`No se puede eliminar la asignatura porque tiene ${inscripciones.length} inscripción(es) de alumno(s) asociada(s).`);
      }
    } catch (error) {
      console.error('Error checking asignatura dependencies:', error);
    }
    
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (asignaturaToDelete) {
      deleteMutation.mutate(asignaturaToDelete.id);
    }
  };

  const handleAsignarProfesor = (asignatura) => {
    setAsignaturaSeleccionada(asignatura);
    setAsignarProfesorOpen(true);
  };

  const handleVerProfesores = (asignatura) => {
    setAsignaturaSeleccionada(asignatura);
    setVerProfesoresOpen(true);
  };

  const handleConfigEvaluaciones = (asignatura) => {
    setAsignaturaSeleccionada(asignatura);
    setEvaluacionesOpen(true);
  };

  const handleSaveEvaluaciones = (data) => {
    updateMutation.mutate({ id: data.id, data });
    setEvaluacionesOpen(false);
  };

  const getProfesoresAsignados = (asignaturaId) => {
    return asignaciones
      .filter(a => a.id_asignatura === asignaturaId)
      .map(a => profesores.find(p => p.id === a.id_profesor))
      .filter(Boolean);
  };

  const profesoresAsignadosFiltrados = React.useMemo(() => {
    const profesoresAsig = getProfesoresAsignados(asignaturaSeleccionada?.id);
    if (!searchProfesores.trim()) return profesoresAsig;
    
    const searchLower = searchProfesores.toLowerCase();
    return profesoresAsig.filter(profesor =>
      profesor.nombres?.toLowerCase().includes(searchLower) ||
      profesor.apellidos?.toLowerCase().includes(searchLower) ||
      profesor.rut?.toLowerCase().includes(searchLower)
    );
  }, [asignaturaSeleccionada, searchProfesores, asignaciones, profesores]);

  const filteredAsignaturas = asignaturas.filter(asignatura =>
    asignatura.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    asignatura.codigo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Asignaturas</h1>
          <p className="text-slate-600">Gestión de asignaturas y asignación de profesores</p>
        </div>
        <Button
          onClick={() => {
            setSelectedAsignatura(null);
            setFormOpen(true);
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva Asignatura
        </Button>
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-purple-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="w-6 h-6 text-purple-600" />
              Lista de Asignaturas
            </CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre o código..."
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
                  <TableHead className="font-semibold">Código</TableHead>
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">Créditos</TableHead>
                  <TableHead className="font-semibold">Evaluaciones</TableHead>
                  <TableHead className="font-semibold">Profesores</TableHead>
                  <TableHead className="text-right font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredAsignaturas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No se encontraron asignaturas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAsignaturas.map((asignatura) => {
                    const profesoresAsignados = getProfesoresAsignados(asignatura.id);
                    return (
                      <TableRow key={asignatura.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium">{asignatura.codigo}</TableCell>
                        <TableCell className="font-medium">{asignatura.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            {asignatura.creditos} créditos
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConfigEvaluaciones(asignatura)}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <ListChecks className="w-4 h-4 mr-1" />
                            {asignatura.evaluaciones?.length || 0}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVerProfesores(asignatura)}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          >
                            <Users className="w-4 h-4 mr-1" />
                            {profesoresAsignados.length}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAsignarProfesor(asignatura)}
                              className="hover:bg-green-50 hover:text-green-600"
                              title="Asignar profesor"
                            >
                              <UserPlus className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(asignatura)}
                              className="hover:bg-purple-50 hover:text-purple-600"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(asignatura)}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AsignaturaForm
        asignatura={selectedAsignatura}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedAsignatura(null);
        }}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AsignarProfesorDialog
        asignatura={asignaturaSeleccionada}
        open={asignarProfesorOpen}
        onClose={() => {
          setAsignarProfesorOpen(false);
          setAsignaturaSeleccionada(null);
        }}
        onSave={(data) => asignarProfesorMutation.mutate(data)}
        isLoading={asignarProfesorMutation.isPending}
      />

      <Dialog open={verProfesoresOpen} onOpenChange={(open) => {
        setVerProfesoresOpen(open);
        if (!open) setSearchProfesores('');
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Profesores Asignados
            </DialogTitle>
            <p className="text-sm text-slate-600 mt-2">
              Asignatura: <span className="font-semibold">{asignaturaSeleccionada?.nombre}</span>
            </p>
          </DialogHeader>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre o RUT..."
                value={searchProfesores}
                onChange={(e) => setSearchProfesores(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-3">
            {getProfesoresAsignados(asignaturaSeleccionada?.id).length === 0 ? (
              <p className="text-center py-8 text-slate-500">
                No hay profesores asignados a esta asignatura
              </p>
              ) : profesoresAsignadosFiltrados.length === 0 ? (
              <p className="text-center py-8 text-slate-500">
                No se encontraron profesores con ese criterio de búsqueda
              </p>
              ) : (
              profesoresAsignadosFiltrados.map((profesor) => {
                const asignacion = asignaciones.find(
                  a => a.id_profesor === profesor.id && a.id_asignatura === asignaturaSeleccionada?.id
                );
                return (
                  <div
                    key={profesor.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-800">
                        {profesor.nombres} {profesor.apellidos}
                      </p>
                      <p className="text-sm text-slate-500">{profesor.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => desasignarProfesorMutation.mutate(asignacion.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Desasignar
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <EvaluacionesDialog
        asignatura={asignaturaSeleccionada}
        open={evaluacionesOpen}
        onClose={() => {
          setEvaluacionesOpen(false);
          setAsignaturaSeleccionada(null);
        }}
        onSave={handleSaveEvaluaciones}
        isLoading={updateMutation.isPending}
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
                  Esta acción eliminará permanentemente la asignatura {asignaturaToDelete?.nombre}.
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