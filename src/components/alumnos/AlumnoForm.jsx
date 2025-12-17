import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

export default function AlumnoForm({ alumno, open, onClose, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    rut: '',
    nombres: '',
    apellidos: '',
    email: ''
  });

  useEffect(() => {
    if (open) {
      if (alumno) {
        setFormData({
          rut: alumno.rut || '',
          nombres: alumno.nombres || '',
          apellidos: alumno.apellidos || '',
          email: alumno.email || ''
        });
      } else {
        setFormData({
          rut: '',
          nombres: '',
          apellidos: '',
          email: ''
        });
      }
    }
  }, [alumno, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {alumno ? 'Editar Alumno' : 'Nuevo Alumno'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="rut">RUT</Label>
            <Input
              id="rut"
              value={formData.rut}
              onChange={(e) => setFormData({...formData, rut: e.target.value})}
              placeholder="12.345.678-9"
              required
              disabled={!!alumno}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombres">Nombres</Label>
            <Input
              id="nombres"
              value={formData.nombres}
              onChange={(e) => setFormData({...formData, nombres: e.target.value})}
              placeholder="Juan Carlos"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apellidos">Apellidos</Label>
            <Input
              id="apellidos"
              value={formData.apellidos}
              onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
              placeholder="Pérez González"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="alumno@universidad.cl"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                alumno ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}