import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function NotaForm({ nota, open, onClose, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    id_inscripcion: nota?.id_inscripcion || '',
    tipo_evaluacion: nota?.tipo_evaluacion || '',
    nota: nota?.nota || '',
    fecha: nota?.fecha || new Date().toISOString().split('T')[0]
  });

  const [alumnoOpen, setAlumnoOpen] = useState(false);
  const [ramoOpen, setRamoOpen] = useState(false);
  const [alumnoSearch, setAlumnoSearch] = useState('');
  const [ramoSearch, setRamoSearch] = useState('');
  const [selectedAlumnoId, setSelectedAlumnoId] = useState('');
  const [duplicateAlertOpen, setDuplicateAlertOpen] = useState(false);

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



  const { data: notas = [] } = useQuery({
    queryKey: ['notas'],
    queryFn: () => base44.entities.Nota.list()
  });

  const selectedAlumno = useMemo(() => 
    alumnos.find(a => a.id === selectedAlumnoId),
    [alumnos, selectedAlumnoId]
  );

  const selectedInscripcion = useMemo(() => 
    inscripciones.find(i => i.id === formData.id_inscripcion),
    [inscripciones, formData.id_inscripcion]
  );

  const selectedAsignatura = useMemo(() => {
    if (!selectedInscripcion) return null;
    return asignaturas.find(a => a.id === selectedInscripcion.id_asignatura);
  }, [selectedInscripcion, asignaturas]);

  const evaluacionesDisponibles = useMemo(() => {
    if (!selectedAsignatura?.evaluaciones) return [];
    
    // Contar cuántas evaluaciones hay de cada tipo
    const conteoTipos = {};
    selectedAsignatura.evaluaciones.forEach(ev => {
      conteoTipos[ev.tipo] = (conteoTipos[ev.tipo] || 0) + 1;
    });
    
    return selectedAsignatura.evaluaciones.map(ev => {
      // Si solo hay una evaluación de este tipo, mostrar sin número
      const label = conteoTipos[ev.tipo] === 1 ? ev.tipo : `${ev.tipo} ${ev.numero}`;
      return {
        label,
        value: `${ev.tipo} ${ev.numero}` // El value siempre incluye el número para la base de datos
      };
    });
  }, [selectedAsignatura]);



  // Inscripciones del alumno seleccionado
  const inscripcionesAlumno = useMemo(() => {
    if (!selectedAlumnoId) return [];
    return inscripciones.filter(i => i.id_alumno === selectedAlumnoId);
  }, [inscripciones, selectedAlumnoId]);

  // Asignaturas disponibles para el alumno
  const asignaturasDisponibles = useMemo(() => {
    return inscripcionesAlumno
      .map(i => asignaturas.find(a => a.id === i.id_asignatura))
      .filter(Boolean);
  }, [inscripcionesAlumno, asignaturas]);

  const filteredAlumnos = useMemo(() => {
    if (!alumnoSearch) return alumnos;
    const search = alumnoSearch.toLowerCase();
    return alumnos.filter(alumno =>
      alumno.nombres?.toLowerCase().includes(search) ||
      alumno.apellidos?.toLowerCase().includes(search) ||
      alumno.rut?.toLowerCase().includes(search)
    );
  }, [alumnos, alumnoSearch]);

  const filteredAsignaturas = useMemo(() => {
    if (!ramoSearch) return asignaturasDisponibles;
    const search = ramoSearch.toLowerCase();
    return asignaturasDisponibles.filter(asignatura =>
      asignatura.nombre?.toLowerCase().includes(search) ||
      asignatura.codigo?.toLowerCase().includes(search)
    );
  }, [asignaturasDisponibles, ramoSearch]);



  // Calcular fechas límite basadas en el período de inscripción
  const fechaLimites = useMemo(() => {
    if (!selectedInscripcion) return { min: '', max: '' };
    
    const { semestre, anio } = selectedInscripcion;
    let fechaInicio, fechaFin;
    
    if (semestre === 1) {
      fechaInicio = `${anio}-03-01`;
      fechaFin = `${anio}-07-31`;
    } else {
      fechaInicio = `${anio}-08-01`;
      fechaFin = `${anio}-12-31`;
    }
    
    return { min: fechaInicio, max: fechaFin };
  }, [selectedInscripcion]);

  // Inicializar valores cuando se abre el formulario para editar
  useEffect(() => {
    if (open) {
      if (nota) {
        setFormData({
          id_inscripcion: nota.id_inscripcion || '',
          id_profesor: nota.id_profesor || '',
          tipo_evaluacion: nota.tipo_evaluacion || '',
          nota: nota.nota || '',
          fecha: nota.fecha || new Date().toISOString().split('T')[0]
        });
        if (inscripciones.length > 0) {
          const inscripcion = inscripciones.find(i => i.id === nota.id_inscripcion);
          if (inscripcion) {
            setSelectedAlumnoId(inscripcion.id_alumno);
          }
        }
      } else {
        setFormData({
          id_inscripcion: '',
          tipo_evaluacion: '',
          nota: '',
          fecha: new Date().toISOString().split('T')[0]
        });
        setSelectedAlumnoId('');
      }
    }
  }, [open, nota, inscripciones]);

  // Validar y ajustar fecha cuando cambia la inscripción
  useEffect(() => {
    if (selectedInscripcion && formData.fecha) {
      const { min, max } = fechaLimites;
      if (formData.fecha < min || formData.fecha > max) {
        setFormData(prev => ({ ...prev, fecha: min }));
      }
    }
  }, [selectedInscripcion, fechaLimites]);

  // Cuando se selecciona una asignatura, buscar la inscripción correspondiente
  const handleAsignaturaSelect = (asignaturaId) => {
    const inscripcion = inscripcionesAlumno.find(i => i.id_asignatura === asignaturaId);
    if (inscripcion) {
      setFormData(prev => ({
        ...prev,
        id_inscripcion: inscripcion.id,
        tipo_evaluacion: ''
      }));
    }
    setRamoOpen(false);
    setRamoSearch('');
  };

  // Resetear ramo cuando cambia alumno
  const handleAlumnoSelect = (alumnoId) => {
    setSelectedAlumnoId(alumnoId);
    setFormData(prev => ({
      ...prev,
      id_inscripcion: ''
    }));
    setAlumnoOpen(false);
    setAlumnoSearch('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar que no exista ya una nota para esta inscripción y tipo de evaluación
    if (!nota) { // Solo validar al crear, no al editar
      const notaDuplicada = notas.find(n => 
        n.id_inscripcion === formData.id_inscripcion && 
        n.tipo_evaluacion === formData.tipo_evaluacion
      );
      
      if (notaDuplicada) {
        setDuplicateAlertOpen(true);
        return;
      }
    }
    
    onSave({
      ...formData,
      nota: parseFloat(formData.nota)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {nota ? 'Editar Nota' : 'Nueva Nota'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Alumno</Label>
            <Popover open={alumnoOpen} onOpenChange={setAlumnoOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={alumnoOpen}
                  className="w-full justify-between"
                >
                  {selectedAlumno ? (
                    `${selectedAlumno.nombres} ${selectedAlumno.apellidos} - ${selectedAlumno.rut}`
                  ) : (
                    "Buscar alumno..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[450px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Buscar por nombre o RUT..." 
                    value={alumnoSearch}
                    onValueChange={setAlumnoSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No se encontraron alumnos.</CommandEmpty>
                    <CommandGroup>
                      {filteredAlumnos.map((alumno) => (
                        <CommandItem
                          key={alumno.id}
                          value={`${alumno.nombres} ${alumno.apellidos} ${alumno.rut}`}
                          onSelect={() => handleAlumnoSelect(alumno.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedAlumnoId === alumno.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {alumno.nombres} {alumno.apellidos} - {alumno.rut}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Ramo</Label>
            <Popover open={ramoOpen} onOpenChange={setRamoOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={ramoOpen}
                  className="w-full justify-between"
                  disabled={!selectedAlumnoId}
                >
                  {selectedAsignatura ? (
                    `${selectedAsignatura.codigo} - ${selectedAsignatura.nombre}`
                  ) : (
                    selectedAlumnoId ? "Buscar ramo..." : "Primero selecciona un alumno"
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[450px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Buscar por código o nombre..." 
                    value={ramoSearch}
                    onValueChange={setRamoSearch}
                  />
                  <CommandList>
                    <CommandEmpty>El alumno no tiene inscripciones en asignaturas.</CommandEmpty>
                    <CommandGroup>
                      {filteredAsignaturas.map((asignatura) => (
                        <CommandItem
                          key={asignatura.id}
                          value={`${asignatura.codigo} ${asignatura.nombre}`}
                          onSelect={() => handleAsignaturaSelect(asignatura.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedAsignatura?.id === asignatura.id ? "opacity-100" : "opacity-0"
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
            {selectedInscripcion && (
              <p className="text-xs text-slate-500">
                Período: {selectedInscripcion.semestre === 1 ? 'Marzo-Julio' : 'Agosto-Diciembre'} {selectedInscripcion.anio}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tipo_evaluacion">Tipo de Evaluación</Label>
            <Select 
              value={formData.tipo_evaluacion} 
              onValueChange={(value) => setFormData({...formData, tipo_evaluacion: value})}
              disabled={!selectedAsignatura}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedAsignatura ? "Seleccionar evaluación" : "Primero selecciona un ramo"} />
              </SelectTrigger>
              <SelectContent>
                {evaluacionesDisponibles.length === 0 ? (
                  <div className="p-2 text-sm text-slate-500">
                    No hay evaluaciones configuradas para esta asignatura
                  </div>
                ) : (
                  evaluacionesDisponibles.map((ev) => (
                    <SelectItem key={ev.value} value={ev.value}>
                      {ev.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nota">Nota (1.0 - 7.0)</Label>
              <Input
                id="nota"
                type="number"
                step="0.1"
                min="1.0"
                max="7.0"
                value={formData.nota}
                onChange={(e) => setFormData({...formData, nota: e.target.value})}
                placeholder="5.5"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                min={fechaLimites.min}
                max={fechaLimites.max}
                disabled={!selectedInscripcion}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.id_inscripcion} 
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                nota ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <AlertDialog open={duplicateAlertOpen} onOpenChange={setDuplicateAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nota Duplicada</AlertDialogTitle>
            <AlertDialogDescription>
              Ya existe una nota para este alumno, asignatura y tipo de evaluación.
              No se puede crear una nota duplicada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setDuplicateAlertOpen(false)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}