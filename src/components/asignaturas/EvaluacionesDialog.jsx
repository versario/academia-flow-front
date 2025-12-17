import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Percent, Hash } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const TIPOS_EVALUACION = [
  "Prueba",
  "Tarea",
  "Proyecto",
  "Examen",
  "Presentación",
  "Laboratorio"
];

export default function EvaluacionesDialog({ asignatura, open, onClose, onSave, isLoading }) {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [mostrarError, setMostrarError] = useState(false);
  const [nuevaEvaluacion, setNuevaEvaluacion] = useState({
    tipo: '',
    numero: 1,
    porcentaje: ''
  });

  useEffect(() => {
    if (asignatura?.evaluaciones) {
      setEvaluaciones([...asignatura.evaluaciones]);
    } else {
      setEvaluaciones([]);
    }
    setMostrarError(false);
  }, [asignatura, open]);

  const agregarEvaluacion = () => {
    if (!nuevaEvaluacion.tipo || nuevaEvaluacion.porcentaje <= 0) {
      return;
    }
    
    const nuevasEvaluaciones = [...evaluaciones, { ...nuevaEvaluacion }];
    setEvaluaciones(nuevasEvaluaciones);
    
    // Calcular el siguiente número para el mismo tipo
    const siguienteNumero = nuevasEvaluaciones
      .filter(ev => ev.tipo === nuevaEvaluacion.tipo)
      .reduce((max, ev) => Math.max(max, ev.numero), 0) + 1;
    
    setNuevaEvaluacion({
      tipo: nuevaEvaluacion.tipo,
      numero: siguienteNumero,
      porcentaje: ''
    });
  };

  const eliminarEvaluacion = (index) => {
    setEvaluaciones(evaluaciones.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!porcentajeValido) {
      setMostrarError(true);
      return;
    }
    onSave({
      ...asignatura,
      evaluaciones
    });
  };

  const totalPorcentaje = evaluaciones.reduce((sum, e) => sum + e.porcentaje, 0);
  const porcentajeValido = totalPorcentaje === 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Configurar Evaluaciones
          </DialogTitle>
          <p className="text-sm text-slate-600 mt-2">
            Asignatura: <span className="font-semibold">{asignatura?.nombre}</span>
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lista de evaluaciones actuales */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Evaluaciones Configuradas</Label>
              <Badge variant={porcentajeValido ? "success" : "destructive"} className={porcentajeValido ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                Total: {totalPorcentaje}%
              </Badge>
            </div>

            {evaluaciones.length === 0 ? (
              <p className="text-center py-6 text-slate-500 text-sm">
                No hay evaluaciones configuradas
              </p>
            ) : (
              <div className="space-y-2">
                {evaluaciones.map((ev, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-white">
                        {ev.tipo} {ev.numero}
                      </Badge>
                      <span className="text-sm font-medium text-slate-700">
                        {ev.porcentaje}%
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => eliminarEvaluacion(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulario para agregar nueva evaluación */}
          <div className="border-t pt-4">
            <Label className="text-base mb-3 block">Agregar Nueva Evaluación</Label>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-5">
                <Label className="text-xs text-slate-600 mb-1">Tipo</Label>
                <Select
                  value={nuevaEvaluacion.tipo}
                  onValueChange={(value) => {
                    // Calcular el siguiente número para el tipo seleccionado
                    const siguienteNumero = evaluaciones
                      .filter(ev => ev.tipo === value)
                      .reduce((max, ev) => Math.max(max, ev.numero), 0) + 1;

                    setNuevaEvaluacion({
                      ...nuevaEvaluacion, 
                      tipo: value,
                      numero: siguienteNumero
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_EVALUACION.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-3">
                <Label className="text-xs text-slate-600 mb-1">Número</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="number"
                    min="1"
                    value={nuevaEvaluacion.numero}
                    onChange={(e) => setNuevaEvaluacion({...nuevaEvaluacion, numero: parseInt(e.target.value) || 1})}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="col-span-3">
                <Label className="text-xs text-slate-600 mb-1">Porcentaje</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={nuevaEvaluacion.porcentaje}
                    onChange={(e) => setNuevaEvaluacion({...nuevaEvaluacion, porcentaje: parseFloat(e.target.value) || 0})}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="col-span-1 flex items-end">
                <Button
                  type="button"
                  size="icon"
                  onClick={agregarEvaluacion}
                  disabled={!nuevaEvaluacion.tipo || !nuevaEvaluacion.porcentaje || parseFloat(nuevaEvaluacion.porcentaje) <= 0}
                  className="bg-green-600 hover:bg-green-700 w-full"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {mostrarError && !porcentajeValido && evaluaciones.length > 0 && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              ⚠️ La suma de los porcentajes debe ser exactamente 100% para guardar los cambios.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Guardar Configuración
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}