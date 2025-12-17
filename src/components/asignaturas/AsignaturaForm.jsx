import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

export default function AsignaturaForm({ asignatura, open, onClose, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    creditos: ''
  });

  useEffect(() => {
    if (open) {
      if (asignatura) {
        setFormData({
          codigo: asignatura.codigo || '',
          nombre: asignatura.nombre || '',
          creditos: asignatura.creditos || ''
        });
      } else {
        setFormData({
          codigo: '',
          nombre: '',
          creditos: ''
        });
      }
    }
  }, [asignatura, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      creditos: parseInt(formData.creditos)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {asignatura ? 'Editar Asignatura' : 'Nueva Asignatura'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              value={formData.codigo}
              onChange={(e) => setFormData({...formData, codigo: e.target.value})}
              placeholder="MAT101"
              required
              disabled={!!asignatura}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              placeholder="Cálculo I"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="creditos">Créditos</Label>
            <Input
              id="creditos"
              type="number"
              min="1"
              max="20"
              value={formData.creditos}
              onChange={(e) => setFormData({...formData, creditos: e.target.value})}
              placeholder="6"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                asignatura ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}