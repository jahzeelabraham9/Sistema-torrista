import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MapPin, Search, Filter, RotateCcw } from 'lucide-react';

// Simulamos el mapa con leaflet (en un entorno real incluiríamos la librería)
const MapComponent = ({ torres = [], onTorreSelect, selectedTorre, filters, onFiltersChange }) => {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Simular carga del mapa
    const timer = setTimeout(() => setMapLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const getConvenioColor = (tipoConvenio) => {
    const colors = {
      'Policia': '#3b82f6',     // azul
      'Ecom': '#ef4444',        // rojo  
      'De tercero': '#eab308'   // amarillo
    };
    return colors[tipoConvenio] || '#6b7280';
  };

  const filteredTorres = torres.filter(torre => {
    const searchMatch = !filters.search || 
      torre.nombre?.toLowerCase().includes(filters.search.toLowerCase()) ||
      torre.direccion?.toLowerCase().includes(filters.search.toLowerCase()) ||
      torre.id?.toString().includes(filters.search);
    
    const convenioMatch = !filters.convenio || filters.convenio === 'all' || torre.tipo_convenio === filters.convenio;
    
    return searchMatch && convenioMatch;
  });

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      convenio: 'all',
      maintenance: ''
    });
  };

  if (!mapLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Torres - Provincia del Chaco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando mapa...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros del Mapa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros del Mapa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Búsqueda
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Nombre, dirección o ID..."
                  value={filters.search}
                  onChange={(e) => onFiltersChange({...filters, search: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Convenio
              </label>
              <Select value={filters.convenio} onValueChange={(value) => onFiltersChange({...filters, convenio: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los convenios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Policia">Policía</SelectItem>
                  <SelectItem value="Ecom">ECOM</SelectItem>
                  <SelectItem value="De tercero">De Tercero</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Torres - Provincia del Chaco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-50 rounded-lg relative overflow-hidden border-2 border-dashed border-gray-300">
            {/* Mapa simulado */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
              {/* Título del mapa */}
              <div className="absolute top-4 left-4 bg-white p-2 rounded shadow">
                <h3 className="font-semibold text-sm">Chaco - Argentina</h3>
              </div>
              
              {/* Marcadores simulados */}
              {filteredTorres.map((torre, index) => {
                const x = 20 + (index * 15) % 60;
                const y = 20 + Math.floor(index / 4) * 20;
                const color = getConvenioColor(torre.tipo_convenio);
                
                return (
                  <div
                    key={torre.id}
                    className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer transform hover:scale-110 transition-transform ${
                      selectedTorre?.id === torre.id ? 'ring-4 ring-blue-400' : ''
                    }`}
                    style={{ 
                      left: `${x}%`, 
                      top: `${y}%`,
                      backgroundColor: color
                    }}
                    onClick={() => onTorreSelect(torre)}
                    title={torre.nombre}
                  />
                );
              })}
              
              {/* Información si no hay torres */}
              {filteredTorres.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron torres con los filtros aplicados</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Controles del mapa */}
            <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow">
              <div className="text-xs text-gray-600">
                Torres mostradas: {filteredTorres.length} de {torres.length}
              </div>
            </div>
          </div>
          
          {/* Leyenda */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Policía</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>ECOM</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>De Tercero</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span>Otro/Sin Definir</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de torre seleccionada */}
      {selectedTorre && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Torre Seleccionada: {selectedTorre.nombre}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Dirección</p>
                <p className="font-medium">{selectedTorre.direccion}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo</p>
                <p className="font-medium capitalize">{selectedTorre.tipo?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Convenio</p>
                <p className="font-medium">{selectedTorre.tipo_convenio}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Alcance</p>
                <p className="font-medium">{selectedTorre.alcance_km} km</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <p className="font-medium capitalize">{selectedTorre.estado}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Coordenadas</p>
                <p className="font-medium text-sm">
                  {selectedTorre.latitud?.toFixed(6)}, {selectedTorre.longitud?.toFixed(6)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MapComponent;