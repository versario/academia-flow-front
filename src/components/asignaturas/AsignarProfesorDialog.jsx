import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from "@/lib/utils";

import { fetchProfesores } from '@/api/profesoresApi';
import { fetchProfesorAsignaturas } from '@/api/profesorAsignaturasApi';

export default function AsignarProfesorDialog({ asignatura, open, onClose, onSave, isLoading }) {
  const [selectedProfesorId, setSelectedProfesorId] = useState('');
  const [profesorPopoverOpen, setProfesorPopoverOpen] = useState(false);
  const [profesorSearch, setProfesorSearch] = useState('');

  const { data: profesores = [] } = useQuery({
    queryKey: ['profesores'],
    queryFn: fetchProfesores
  });

  const { data: asignaciones = [] } = useQuery({
    queryKey: ['profesor-asignaturas'],
    queryFn: fetchProfesorAsignaturas,
    enabled: !!asignatura
  });

  const profesoresAsignados = asignaciones
    .filter(a => a.id_asignatura === asignatura?.id)
    .map(a => a.id_profesor);

  const profesoresDisponibles = profesores.filter(
    p => !profesoresAsignados.includes(p.id)
  );

  const selectedProfesor = useMemo(() => 
    profesores.find(p => p.id === selectedProfesorId),
    [profesores, selectedProfesorId]
  );

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
    if (selectedProfesorId && asignatura) {
      onSave({
        id_profesor: selectedProfesorId,
        id_asignatura: asignatura.id
      });
      setSelectedProfesorId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Asignar Profesor
          </DialogTitle>
          <p className="text-sm text-slate-600 mt-2">
            Asignatura: <span className="font-semibold">{asignatura?.nombre}</span>
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Seleccionar Profesor</Label>
            <Popover open={profesorPopoverOpen} onOpenChange={setProfesorPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={profesorPopoverOpen}
                  className="w-full justify-between"
                  disabled={profesoresDisponibles.length === 0}
                >
                  {selectedProfesor ? (
                    `${selectedProfesor.nombres} ${selectedProfesor.apellidos}`
                  ) : (
                    profesoresDisponibles.length === 0 
                      ? "No hay profesores disponibles"
                      : "Buscar profesor..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[450px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Buscar por nombre o RUT..." 
                    value={profesorSearch}
                    onValueChange={setProfesorSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No se encontraron profesores.</CommandEmpty>
                    <CommandGroup>
                      {filteredProfesores.map((profesor) => (
                        <CommandItem
                          key={profesor.id}
                          value={`${profesor.nombres} ${profesor.apellidos} ${profesor.rut}`}
                          onSelect={() => {
                            setSelectedProfesorId(profesor.id);
                            setProfesorPopoverOpen(false);
                            setProfesorSearch('');
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedProfesorId === profesor.id ? "opacity-100" : "opacity-0"
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !selectedProfesorId} 
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Asignando...
                </>
              ) : (
                'Asignar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}