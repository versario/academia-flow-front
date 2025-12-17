import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, FileText, X, Filter } from 'lucide-react';
import NotaForm from '../components/notas/NotaForm';
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from 'date-fns';
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function Notas() {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedNota, setSelectedNota] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notaToDelete, setNotaToDelete] = useState(null);
  const [filtroAlumno, setFiltroAlumno] = useState('');
  const [filtroAsignatura, setFiltroAsignatura] = useState('');
  const [alumnoPopoverOpen, setAlumnoPopoverOpen] = useState(false);
  const [asignaturaPopoverOpen, setAsignaturaPopoverOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: notas = [], isLoading } = useQuery({
    queryKey: ['notas'],
    queryFn: () => base44.entities.Nota.list()
  });

  const { data: inscripciones = [] } = useQuery({
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

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Nota.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['notas']);
      setFormOpen(false);
      toast.success('Nota creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear nota');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Nota.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['notas']);
      setFormOpen(false);
      setSelectedNota(null);
      toast.success('Nota actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar nota');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Nota.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notas']);
      setDeleteDialogOpen(false);
      setNotaToDelete(null);
      toast.success('Nota eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar nota');
    }
  });

  const handleSave = (data) => {
    if (selectedNota) {
      updateMutation.mutate({ id: selectedNota.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (nota) => {
    setSelectedNota(nota);
    setFormOpen(true);
  };

  const handleDeleteClick = (nota) => {
    setNotaToDelete(nota);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (notaToDelete) {
      deleteMutation.mutate(notaToDelete.id);
    }
  };

  const { data: profesores = [] } = useQuery({
    queryKey: ['profesores'],
    queryFn: () => base44.entities.Profesor.list()
  });

  // Alumnos disponibles según filtro de asignatura
  const alumnosDisponibles = React.useMemo(() => {
    if (!filtroAsignatura) return alumnos;
    
    const inscripcionesAsignatura = inscripciones.filter(i => i.id_asignatura === filtroAsignatura);
    const alumnosIds = inscripcionesAsignatura.map(i => i.id_alumno);
    return alumnos.filter(a => alumnosIds.includes(a.id));
  }, [filtroAsignatura, inscripciones, alumnos]);

  // Asignaturas disponibles según filtro de alumno
  const asignaturasDisponibles = React.useMemo(() => {
    if (!filtroAlumno) return asignaturas;
    
    const inscripcionesAlumno = inscripciones.filter(i => i.id_alumno === filtroAlumno);
    const asignaturasIds = inscripcionesAlumno.map(i => i.id_asignatura);
    return asignaturas.filter(a => asignaturasIds.includes(a.id));
  }, [filtroAlumno, inscripciones, asignaturas]);

  const getInscripcionInfo = (idInscripcion) => {
    const inscripcion = inscripciones.find(i => i.id === idInscripcion);
    if (!inscripcion) return { alumno: 'Desconocido', asignatura: 'Desconocida' };
    
    const alumno = alumnos.find(a => a.id === inscripcion.id_alumno);
    const asignatura = asignaturas.find(a => a.id === inscripcion.id_asignatura);
    
    return {
      alumno: alumno ? `${alumno.nombres} ${alumno.apellidos}` : 'Desconocido',
      asignatura: asignatura ? `${asignatura.codigo} - ${asignatura.nombre}` : 'Desconocida'
    };
  };

  const getProfesorNombre = (idInscripcion) => {
    const inscripcion = inscripciones.find(i => i.id === idInscripcion);
    if (!inscripcion) return 'No asignado';
    
    const profesor = profesores.find(p => p.id === inscripcion.id_profesor);
    return profesor ? `${profesor.nombres} ${profesor.apellidos}` : 'No asignado';
  };

  const getNotaColor = (nota) => {
    if (nota >= 6.0) return 'bg-green-100 text-green-700 border-green-200';
    if (nota >= 4.0) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getPorcentajeEvaluacion = (nota) => {
    const inscripcion = inscripciones.find(i => i.id === nota.id_inscripcion);
    if (!inscripcion) return null;
    
    const asignatura = asignaturas.find(a => a.id === inscripcion.id_asignatura);
    if (!asignatura?.evaluaciones) return null;
    
    const evaluacion = asignatura.evaluaciones.find(ev => 
      `${ev.tipo} ${ev.numero}` === nota.tipo_evaluacion
    );
    
    return evaluacion?.porcentaje || null;
  };

  const formatTipoEvaluacion = (tipoEvaluacion, idInscripcion) => {
    const inscripcion = inscripciones.find(i => i.id === idInscripcion);
    if (!inscripcion) return tipoEvaluacion;
    
    const asignatura = asignaturas.find(a => a.id === inscripcion.id_asignatura);
    if (!asignatura?.evaluaciones) return tipoEvaluacion;
    
    // Extraer el tipo (sin número)
    const match = tipoEvaluacion.match(/^(.+)\s+(\d+)$/);
    if (!match) return tipoEvaluacion;
    
    const tipo = match[1];
    const numero = match[2];
    
    // Contar cuántas evaluaciones del mismo tipo hay
    const cantidadMismoTipo = asignatura.evaluaciones.filter(ev => ev.tipo === tipo).length;
    
    // Si solo hay una evaluación de este tipo, mostrar sin número
    if (cantidadMismoTipo === 1) {
      return tipo;
    }
    
    // Si hay más de una, mostrar con número
    return tipoEvaluacion;
  };

  const filteredNotas = notas.filter(nota => {
    const inscripcion = inscripciones.find(i => i.id === nota.id_inscripcion);
    if (!inscripcion) return false;
    
    // Si no hay ningún filtro activo, no mostrar nada
    if (!filtroAlumno && !filtroAsignatura && search.trim() === '') {
      return false;
    }
    
    // Filtro por alumno
    if (filtroAlumno && inscripcion.id_alumno !== filtroAlumno) {
      return false;
    }
    
    // Filtro por asignatura
    if (filtroAsignatura && inscripcion.id_asignatura !== filtroAsignatura) {
      return false;
    }
    
    // Búsqueda de texto general
    if (search.trim() !== '') {
      const alumno = alumnos.find(a => a.id === inscripcion.id_alumno);
      const asignatura = asignaturas.find(a => a.id === inscripcion.id_asignatura);
      
      const searchLower = search.toLowerCase();
      
      const nombreAlumno = alumno ? `${alumno.nombres} ${alumno.apellidos}`.toLowerCase() : '';
      const rutAlumno = alumno?.rut?.toLowerCase() || '';
      const nombreAsignatura = asignatura ? `${asignatura.codigo} ${asignatura.nombre}`.toLowerCase() : '';
      
      return nombreAlumno.includes(searchLower) || 
             rutAlumno.includes(searchLower) || 
             nombreAsignatura.includes(searchLower);
    }
    
    return true;
  });

  // Agrupar notas por inscripción para calcular notas finales
  const notasConFinales = [];
  
  // Agrupar notas por inscripción
  const notasPorInscripcion = {};
  filteredNotas.forEach(nota => {
    if (!notasPorInscripcion[nota.id_inscripcion]) {
      notasPorInscripcion[nota.id_inscripcion] = [];
    }
    notasPorInscripcion[nota.id_inscripcion].push(nota);
  });

  // Para cada inscripción, agregar sus notas y luego la nota final si corresponde
  Object.entries(notasPorInscripcion).forEach(([idInscripcion, notasDeInscripcion]) => {
    // Ordenar notas por número de evaluación
    const notasOrdenadas = notasDeInscripcion.sort((a, b) => {
      const numA = parseInt(a.tipo_evaluacion.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.tipo_evaluacion.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });
    
    // Agregar todas las notas regulares ordenadas
    notasOrdenadas.forEach(nota => {
      notasConFinales.push({ ...nota, esFinal: false });
    });

    // Verificar si se debe calcular nota final
    const inscripcion = inscripciones.find(i => i.id === idInscripcion);
    if (!inscripcion) return;

    const asignatura = asignaturas.find(a => a.id === inscripcion.id_asignatura);
    if (!asignatura?.evaluaciones || asignatura.evaluaciones.length === 0) return;

    // Obtener todas las notas de esta inscripción
    const notasInscripcion = notas.filter(n => n.id_inscripcion === idInscripcion);

    // Verificar si todas las evaluaciones están completadas
    const evaluacionesCompletas = asignatura.evaluaciones.every(ev => {
      const tipoEvaluacion = `${ev.tipo} ${ev.numero}`;
      return notasInscripcion.some(n => n.tipo_evaluacion === tipoEvaluacion);
    });

    if (evaluacionesCompletas) {
      // Calcular nota final
      let notaFinal = 0;
      asignatura.evaluaciones.forEach(ev => {
        const tipoEvaluacion = `${ev.tipo} ${ev.numero}`;
        const notaEv = notasInscripcion.find(n => n.tipo_evaluacion === tipoEvaluacion);
        if (notaEv) {
          notaFinal += (notaEv.nota * ev.porcentaje) / 100;
        }
      });

      // Agregar fila de nota final al final del grupo
      notasConFinales.push({
        id: `final-${idInscripcion}`,
        id_inscripcion: idInscripcion,
        id_profesor: '',
        tipo_evaluacion: 'NOTA FINAL',
        nota: notaFinal,
        fecha: '',
        esFinal: true
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Notas</h1>
          <p className="text-slate-600">Gestión de evaluaciones y calificaciones</p>
        </div>
        <Button
          onClick={() => {
            setSelectedNota(null);
            setFormOpen(true);
          }}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva Nota
        </Button>
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-amber-50">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-6 h-6 text-amber-600" />
                Lista de Notas
              </CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Filtrar por:</span>
              </div>

              <Popover open={alumnoPopoverOpen} onOpenChange={setAlumnoPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={alumnoPopoverOpen}
                    className="w-[250px] justify-between"
                  >
                    {filtroAlumno ? (
                      (() => {
                        const alumno = alumnos.find(a => a.id === filtroAlumno);
                        return alumno ? `${alumno.nombres} ${alumno.apellidos}` : "Seleccionar alumno";
                      })()
                    ) : (
                      "Seleccionar alumno"
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar alumno..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron alumnos.</CommandEmpty>
                      <CommandGroup>
                        {alumnosDisponibles.map((alumno) => (
                          <CommandItem
                            key={alumno.id}
                            value={`${alumno.nombres} ${alumno.apellidos} ${alumno.rut}`}
                            onSelect={() => {
                              setFiltroAlumno(alumno.id);
                              setAlumnoPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filtroAlumno === alumno.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {alumno.nombres} {alumno.apellidos}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {filtroAlumno && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiltroAlumno('')}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}

              <Popover open={asignaturaPopoverOpen} onOpenChange={setAsignaturaPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={asignaturaPopoverOpen}
                    className="w-[250px] justify-between"
                  >
                    {filtroAsignatura ? (
                      (() => {
                        const asignatura = asignaturas.find(a => a.id === filtroAsignatura);
                        return asignatura ? `${asignatura.codigo} - ${asignatura.nombre}` : "Seleccionar asignatura";
                      })()
                    ) : (
                      "Seleccionar asignatura"
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar asignatura..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron asignaturas.</CommandEmpty>
                      <CommandGroup>
                        {asignaturasDisponibles.map((asignatura) => (
                          <CommandItem
                            key={asignatura.id}
                            value={`${asignatura.codigo} ${asignatura.nombre}`}
                            onSelect={() => {
                              setFiltroAsignatura(asignatura.id);
                              setAsignaturaPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filtroAsignatura === asignatura.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {asignatura.codigo} - {asignatura.nombre}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {filtroAsignatura && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiltroAsignatura('')}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
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
                  <TableHead className="font-semibold">Tipo Evaluación</TableHead>
                  <TableHead className="font-semibold">Porcentaje</TableHead>
                  <TableHead className="font-semibold">Nota</TableHead>
                  <TableHead className="font-semibold">Fecha</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : notasConFinales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      {!filtroAlumno && !filtroAsignatura && search.trim() === '' 
                        ? 'Selecciona un filtro para ver las notas'
                        : 'No se encontraron notas'}
                    </TableCell>
                  </TableRow>
                ) : (
                  notasConFinales.map((nota, index) => {
                    const info = getInscripcionInfo(nota.id_inscripcion);
                    const porcentaje = getPorcentajeEvaluacion(nota);
                    
                    // Determinar si cambió la inscripción (y por lo tanto la asignatura)
                    const prevNota = index > 0 ? notasConFinales[index - 1] : null;
                    const cambioInscripcion = !prevNota || prevNota.id_inscripcion !== nota.id_inscripcion;
                    
                    // Determinar el índice del grupo actual basado en cambios de inscripción
                    let grupoIndex = 0;
                    for (let i = 1; i <= index; i++) {
                      if (notasConFinales[i].id_inscripcion !== notasConFinales[i - 1].id_inscripcion) {
                        grupoIndex++;
                      }
                    }
                    
                    const bgColor = grupoIndex % 2 === 0 ? 'bg-amber-50/30' : 'bg-blue-50/30';
                    const hoverColor = grupoIndex % 2 === 0 ? 'hover:bg-amber-100/40' : 'hover:bg-blue-100/40';
                    
                    if (nota.esFinal) {
                      return (
                        <TableRow key={nota.id} className={`${bgColor} font-bold`}>
                          <TableCell className="font-bold text-indigo-900">{info.alumno}</TableCell>
                          <TableCell className="font-bold text-indigo-900">{info.asignatura}</TableCell>
                          <TableCell colSpan={2} className="text-center">
                            <Badge className="bg-indigo-600 text-white text-sm px-3 py-1">
                              NOTA FINAL
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-bold text-indigo-900">100%</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`${getNotaColor(nota.nota)} border font-bold text-base`}>
                              {nota.nota.toFixed(1)}
                            </Badge>
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                      );
                    }

                    return (
                      <TableRow 
                        key={nota.id} 
                        className={`${bgColor} ${hoverColor} transition-colors ${cambioInscripcion ? 'border-t-4 border-slate-300' : ''}`}
                      >
                        <TableCell className="font-medium">{info.alumno}</TableCell>
                        <TableCell className="text-slate-600">{info.asignatura}</TableCell>
                        <TableCell className="text-slate-600">{getProfesorNombre(nota.id_inscripcion)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-slate-300">
                            {formatTipoEvaluacion(nota.tipo_evaluacion, nota.id_inscripcion)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {porcentaje ? (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              {porcentaje}%
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${getNotaColor(nota.nota)} border font-semibold`}>
                            {nota.nota.toFixed(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {format(parseISO(nota.fecha), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(nota)}
                              className="hover:bg-amber-50 hover:text-amber-600"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(nota)}
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

      <NotaForm
        nota={selectedNota}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedNota(null);
        }}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente esta nota.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}