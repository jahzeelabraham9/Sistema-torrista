import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { X, Save, MapPin } from 'lucide-react';

const TorreForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: '',
    direccion: '',
    latitud: '',
    longitud: '',
    estado: '',
    alcance_km: '',
    fecha_ultimo_mantenimiento: '',
    frecuencia_mhz: '',
    notas: '',
    tipo_convenio: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        tipo: initialData.tipo || '',
        direccion: initialData.direccion || '',
        latitud: initialData.latitud?.toString() || '',
        longitud: initialData.longitud?.toString() || '',
        estado: initialData.estado || '',
        alcance_km: initialData.alcance_km?.toString() || '',
        fecha_ultimo_mantenimiento: initialData.fecha_ultimo_mantenimiento || '',
        frecuencia_mhz: initialData.frecuencia_mhz || '',
        notas: initialData.notas || '',
        tipo_convenio: initialData.tipo_convenio || ''
      });
    } else {
      setFormData({
        nombre: '',
        tipo: '',
        direccion: '',
        latitud: '',
        longitud: '',
        estado: '',
        alcance_km: '',
        fecha_ultimo_mantenimiento: '',
        frecuencia_mhz: '',
        notas: '',
        tipo_convenio: ''
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) newErrors.nombre = 'Nombre es requerido';
    if (!formData.tipo) newErrors.tipo = 'Tipo es requerido';
    if (!formData.direccion.trim()) newErrors.direccion = 'Dirección es requerida';
    if (!formData.latitud) newErrors.latitud = 'Latitud es requerida';
    if (!formData.longitud) newErrors.longitud = 'Longitud es requerida';
    if (!formData.estado) newErrors.estado = 'Estado es requerido';
    if (!formData.alcance_km) newErrors.alcance_km = 'Alcance es requerido';
    if (!formData.tipo_convenio) newErrors.tipo_convenio = 'Tipo de convenio es requerido';

    // Validar coordenadas
    const lat = parseFloat(formData.latitud);
    const lng = parseFloat(formData.longitud);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.latitud = 'Latitud debe estar entre -90 y 90';
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.longitud = 'Longitud debe estar entre -180 y 180';
    }

    // Validar alcance
    const alcance = parseFloat(formData.alcance_km);
    if (isNaN(alcance) || alcance <= 0) {
      newErrors.alcance_km = 'Alcance debe ser mayor que 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitData = {
      ...formData,
      latitud: parseFloat(formData.latitud),
      longitud: parseFloat(formData.longitud),
      alcance_km: parseFloat(formData.alcance_km),
      frecuencia_mhz: formData.frecuencia_mhz || null,
      fecha_ultimo_mantenimiento: formData.fecha_ultimo_mantenimiento || null,
      notas: formData.notas || null
    };

    onSubmit(submitData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error si existe
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {initialData ? 'Editar Torre/Antena' : 'Nueva Torre/Antena'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="Ej: Torre Norte Ciudad"
                  className={errors.nombre ? 'border-red-500' : ''}
                />
                {errors.nombre && (
                  <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
                )}
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Instalación *
                </label>
                <Select value={formData.tipo} onValueChange={(value) => handleChange('tipo', value)}>
                  <SelectTrigger className={errors.tipo ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="torre">Torre</SelectItem>
                    <SelectItem value="torre_arriestrada">Torre Arriestrada</SelectItem>
                    <SelectItem value="mastil_amurado">Mástil Amurado</SelectItem>
                    <SelectItem value="torreantena">Torre-Antena</SelectItem>
                    <SelectItem value="repetidor">Repetidor</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tipo && (
                  <p className="text-red-500 text-sm mt-1">{errors.tipo}</p>
                )}
              </div>

              {/* Tipo de Convenio */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Convenio *
                </label>
                <Select value={formData.tipo_convenio} onValueChange={(value) => handleChange('tipo_convenio', value)}>
                  <SelectTrigger className={errors.tipo_convenio ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar convenio..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Policia">Policía</SelectItem>
                    <SelectItem value="Ecom">ECOM</SelectItem>
                    <SelectItem value="De tercero">De Tercero</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tipo_convenio && (
                  <p className="text-red-500 text-sm mt-1">{errors.tipo_convenio}</p>
                )}
              </div>

              {/* Dirección */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección *
                </label>
                <Input
                  value={formData.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  placeholder="Ej: Ruta 11 Km 1010, Resistencia"
                  className={errors.direccion ? 'border-red-500' : ''}
                />
                {errors.direccion && (
                  <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>
                )}
              </div>

              {/* Coordenadas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitud *
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.latitud}
                  onChange={(e) => handleChange('latitud', e.target.value)}
                  placeholder="Ej: -27.451958"
                  className={errors.latitud ? 'border-red-500' : ''}
                />
                {errors.latitud && (
                  <p className="text-red-500 text-sm mt-1">{errors.latitud}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitud *
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.longitud}
                  onChange={(e) => handleChange('longitud', e.target.value)}
                  placeholder="Ej: -58.986347"
                  className={errors.longitud ? 'border-red-500' : ''}
                />
                {errors.longitud && (
                  <p className="text-red-500 text-sm mt-1">{errors.longitud}</p>
                )}
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                <Select value={formData.estado} onValueChange={(value) => handleChange('estado', value)}>
                  <SelectTrigger className={errors.estado ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar estado..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operativa">Operativa</SelectItem>
                    <SelectItem value="mantenimiento">En Mantenimiento</SelectItem>
                    <SelectItem value="limitada">Función Limitada</SelectItem>
                    <SelectItem value="inactiva">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
                {errors.estado && (
                  <p className="text-red-500 text-sm mt-1">{errors.estado}</p>
                )}
              </div>

              {/* Alcance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alcance (km) *
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="200"
                  value={formData.alcance_km}
                  onChange={(e) => handleChange('alcance_km', e.target.value)}
                  placeholder="Ej: 25.5"
                  className={errors.alcance_km ? 'border-red-500' : ''}
                />
                {errors.alcance_km && (
                  <p className="text-red-500 text-sm mt-1">{errors.alcance_km}</p>
                )}
              </div>

              {/* Último Mantenimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Último Mantenimiento
                </label>
                <Input
                  type="date"
                  value={formData.fecha_ultimo_mantenimiento}
                  onChange={(e) => handleChange('fecha_ultimo_mantenimiento', e.target.value)}
                />
              </div>

              {/* Frecuencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frecuencia (MHz)
                </label>
                <Input
                  value={formData.frecuencia_mhz}
                  onChange={(e) => handleChange('frecuencia_mhz', e.target.value)}
                  placeholder="Ej: 156.7"
                />
              </div>

              {/* Notas */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas/Observaciones
                </label>
                <textarea
                  rows={3}
                  value={formData.notas}
                  onChange={(e) => handleChange('notas', e.target.value)}
                  placeholder="Observaciones adicionales..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Guardando...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TorreForm;