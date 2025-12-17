import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function InscripcionForm({ inscripcion, open, onClose, onSave, isLoading }) {
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState(inscripcion || {
    id_alumno: '',
    id_asignatura: '',
    id_profesor: '',
    semestre: 1,
    anio: currentYear
  });

  const [alumnoOpen, setAlumnoOpen] = useState(false);
  const [asignaturaOpen, setAsignaturaOpen] = useState(false);
  const [profesorOpen, setProfesorOpen] = useState(false);
  const [alumnoSearch, setAlumnoSearch] = useState('');
  const [asignaturaSearch, setAsignaturaSearch] = useState('');
  const [profesorSearch, setProfesorSearch] = useState('');

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

  const { data: profesorAsignaturas = [] } = useQuery({
    queryKey: ['profesor-asignatura'],
    queryFn: () => base44.entities.ProfesorAsignatura.list()
  });

  const selectedAlumno = useMemo(() => 
    alumnos.find(a => a.id === formData.id_alumno),
    [alumnos, formData.id_alumno]
  );

  const selectedAsignatura = useMemo(() => 
    asignaturas.find(a => a.id === formData.id_asignatura),
    [asignaturas, formData.id_asignatura]
  );

  const selectedProfesor = useMemo(() => 
    profesores.find(p => p.id === formData.id_profesor),
    [profesores, formData.id_profesor]
  );

  const profesoresDisponibles = useMemo(() => {
    if (!formData.id_asignatura) return [];
    const profesoresIds = profesorAsignaturas
      .filter(pa => pa.id_asignatura === formData.id_asignatura)
      .map(pa => pa.id_profesor);
    return profesores.filter(p => profesoresIds.includes(p.id));
  }, [formData.id_asignatura, profesorAsignaturas, profesores]);

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
    if (!asignaturaSearch) return asignaturas;
    const search = asignaturaSearch.toLowerCase();
    return asignaturas.filter(asignatura =>
      asignatura.nombre?.toLowerCase().includes(search) ||
      asignatura.codigo?.toLowerCase().includes(search)
    );
  }, [asignaturas, asignaturaSearch]);

  const filteredProfesores = useMemo(() => {
    if (!profesorSearch) return profesoresDisponibles;
    const search = profesorSearch.toLowerCase();
    return profesoresDisponibles.filter(profesor =>
      profesor.nombres?.toLowerCase().includes(search) ||
      profesor.apellidos?.toLowerCase().includes(search) ||
      profesor.rut?.toLowerCase().includes(search)
    );
  }, [profesoresDisponibles, profesorSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {inscripcion ? 'Editar Inscripción' : 'Nueva Inscripción'}
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
                  disabled={!!inscripcion}
                >
                  {selectedAlumno ? (
                    `${selectedAlumno.nombres} ${selectedAlumno.apellidos} - ${selectedAlumno.rut}`
                  ) : (
                    "Buscar alumno..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
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
                          onSelect={() => {
                            setFormData({...formData, id_alumno: alumno.id});
                            setAlumnoOpen(false);
                            setAlumnoSearch('');
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.id_alumno === alumno.id ? "opacity-100" : "opacity-0"
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
            <Label>Asignatura</Label>
            <Popover open={asignaturaOpen} onOpenChange={setAsignaturaOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={asignaturaOpen}
                  className="w-full justify-between"
                  disabled={!!inscripcion}
                >
                  {selectedAsignatura ? (
                    `${selectedAsignatura.codigo} - ${selectedAsignatura.nombre}`
                  ) : (
                    "Buscar asignatura..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Buscar por código o nombre..." 
                    value={asignaturaSearch}
                    onValueChange={setAsignaturaSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No se encontraron asignaturas.</CommandEmpty>
                    <CommandGroup>
                      {filteredAsignaturas.map((asignatura) => (
                        <CommandItem
                          key={asignatura.id}
                          value={`${asignatura.codigo} ${asignatura.nombre}`}
                          onSelect={() => {
                            setFormData({...formData, id_asignatura: asignatura.id, id_profesor: ''});
                            setAsignaturaOpen(false);
                            setAsignaturaSearch('');
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.id_asignatura === asignatura.id ? "opacity-100" : "opacity-0"
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
          </div>

          <div className="space-y-2">
            <Label>Profesor</Label>
            <Popover open={profesorOpen} onOpenChange={setProfesorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={profesorOpen}
                  className="w-full justify-between"
                  disabled={!formData.id_asignatura || !!inscripcion}
                >
                  {selectedProfesor ? (
                    `${selectedProfesor.nombres} ${selectedProfesor.apellidos} - ${selectedProfesor.rut}`
                  ) : (
                    formData.id_asignatura ? "Buscar profesor..." : "Primero selecciona una asignatura"
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Buscar por nombre o RUT..." 
                    value={profesorSearch}
                    onValueChange={setProfesorSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No se encontraron profesores asignados a esta asignatura.</CommandEmpty>
                    <CommandGroup>
                      {filteredProfesores.map((profesor) => (
                        <CommandItem
                          key={profesor.id}
                          value={`${profesor.nombres} ${profesor.apellidos} ${profesor.rut}`}
                          onSelect={() => {
                            setFormData({...formData, id_profesor: profesor.id});
                            setProfesorOpen(false);
                            setProfesorSearch('');
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.id_profesor === profesor.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {profesor.nombres} {profesor.apellidos} - {profesor.rut}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="semestre">Semestre</Label>
              <Select 
                value={formData.semestre?.toString()} 
                onValueChange={(value) => setFormData({...formData, semestre: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semestre 1</SelectItem>
                  <SelectItem value="2">Semestre 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anio">Año</Label>
              <Input
                id="anio"
                type="number"
                min="2020"
                max="2030"
                value={formData.anio}
                onChange={(e) => setFormData({...formData, anio: parseInt(e.target.value)})}
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
              disabled={isLoading || !formData.id_alumno || !formData.id_asignatura || !formData.id_profesor} 
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                inscripcion ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}