import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, UserCheck } from 'lucide-react';
import ProfesorForm from '../components/profesores/ProfesorForm';
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
import { fetchProfesores, createProfesor, updateProfesor, deleteProfesor } from '../api/profesoresApi';

export default function Profesores() {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProfesor, setSelectedProfesor] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profesorToDelete, setProfesorToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const queryClient = useQueryClient();

  const { data: profesores = [], isLoading } = useQuery({
    queryKey: ['profesores', search],
    queryFn: () => fetchProfesores(search),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: createProfesor,
    onSuccess: () => {
      queryClient.invalidateQueries(['profesores']);
      setFormOpen(false);
      toast.success('Profesor creado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProfesor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['profesores']);
      setFormOpen(false);
      setSelectedProfesor(null);
      toast.success('Profesor actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await deleteProfesor(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profesores']);
      setDeleteDialogOpen(false);
      setProfesorToDelete(null);
      toast.success('Profesor eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });


  const handleSave = (data) => {
    if (selectedProfesor) {
      updateMutation.mutate({ id: selectedProfesor.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (profesor) => {
    setSelectedProfesor(profesor);
    setFormOpen(true);
  };

  const handleDeleteClick = async (profesor) => {
    setProfesorToDelete(profesor);
    setDeleteError(null);
    
    // Verificar si se puede eliminar
    try {
      const asignaciones = await base44.entities.ProfesorAsignatura.filter({ id_profesor: profesor.id });
      const notas = await base44.entities.Nota.filter({ id_profesor: profesor.id });
      
      if (asignaciones.length > 0 && notas.length > 0) {
        setDeleteError(`No se puede eliminar el profesor porque tiene ${asignaciones.length} asignatura(s) asignada(s) y ${notas.length} nota(s) asociada(s).`);
      } else if (asignaciones.length > 0) {
        setDeleteError(`No se puede eliminar el profesor porque tiene ${asignaciones.length} asignatura(s) asignada(s).`);
      } else if (notas.length > 0) {
        setDeleteError(`No se puede eliminar el profesor porque tiene ${notas.length} nota(s) asociada(s).`);
      }
    } catch (error) {
      console.error('Error checking profesor dependencies:', error);
    }
    
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (profesorToDelete) {
      deleteMutation.mutate(profesorToDelete.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Profesores</h1>
          <p className="text-slate-600">Gestión de docentes del sistema</p>
        </div>
        <Button
          onClick={() => {
            setSelectedProfesor(null);
            setFormOpen(true);
          }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Profesor
        </Button>
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <UserCheck className="w-6 h-6 text-indigo-600" />
              Lista de Profesores
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
                ) : profesores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No se encontraron profesores
                    </TableCell>
                  </TableRow>
                ) : (
                  profesores.map((profesor) => (
                    <TableRow key={profesor.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium">{profesor.rut}</TableCell>
                      <TableCell>{profesor.nombres}</TableCell>
                      <TableCell>{profesor.apellidos}</TableCell>
                      <TableCell className="text-slate-600">{profesor.email}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(profesor)}
                            className="hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(profesor)}
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

      <ProfesorForm
        profesor={selectedProfesor}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedProfesor(null);
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
                  Esta acción eliminará permanentemente al profesor {profesorToDelete?.nombres} {profesorToDelete?.apellidos}.
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