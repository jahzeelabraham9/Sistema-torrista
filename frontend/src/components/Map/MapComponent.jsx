import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MapPin, Search, Filter, RotateCcw, Edit } from 'lucide-react';

// Configurar íconos de leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Crear íconos personalizados para diferentes tipos de convenio
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      background-color: ${color}; 
      width: 20px; 
      height: 20px; 
      border-radius: 50%; 
      border: 3px solid white; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const MapComponent = ({ torres = [], onTorreSelect, selectedTorre, filters, onFiltersChange }) => {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(true);

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

  // Obtener ícono según tipo de convenio
  const getMarkerIcon = (tipoConvenio) => {
    const colors = {
      'Policia': '#3b82f6',     // azul
      'Ecom': '#ef4444',        // rojo  
      'De tercero': '#eab308'   // amarillo
    };
    return createCustomIcon(colors[tipoConvenio] || '#6b7280');
  };

  // Centro del mapa en Chaco
  const chacoCenter = [-26.3864, -60.7658];

  const handleEditTorre = (torre, e) => {
    e.stopPropagation();
    // Aquí podrías llamar una función de edición si la necesitas
    console.log('Editar torre:', torre.nombre);
  };

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
              <Select value={filters.convenio || 'all'} onValueChange={(value) => onFiltersChange({...filters, convenio: value})}>
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

      {/* Mapa Real */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Torres - Provincia del Chaco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 rounded-lg overflow-hidden border border-gray-300">
            <MapContainer
              center={chacoCenter}
              zoom={7}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={18}
              />
              
              {/* Marcadores de torres */}
              {filteredTorres.map((torre) => {
                if (!torre.latitud || !torre.longitud) return null;
                
                return (
                  <React.Fragment key={torre.id}>
                    <Marker
                      position={[torre.latitud, torre.longitud]}
                      icon={getMarkerIcon(torre.tipo_convenio)}
                      eventHandlers={{
                        click: () => onTorreSelect(torre)
                      }}
                    >
                      <Popup>
                        <div className="text-sm p-2 min-w-[200px]">
                          <h3 className="font-bold text-base mb-2 text-center border-b pb-1">
                            {torre.nombre}
                          </h3>
                          <div className="space-y-1">
                            <p><strong>📍 Dirección:</strong> {torre.direccion}</p>
                            <p><strong>🏗️ Tipo:</strong> {torre.tipo?.replace('_', ' ')}</p>
                            <p><strong>📋 Convenio:</strong> {torre.tipo_convenio || 'N/A'}</p>
                            <p><strong>📡 Alcance:</strong> {torre.alcance_km} km</p>
                            <p><strong>🔴 Estado:</strong> 
                              <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                torre.estado === 'operativa' ? 'bg-green-100 text-green-800' :
                                torre.estado === 'mantenimiento' ? 'bg-yellow-100 text-yellow-800' :
                                torre.estado === 'limitada' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {torre.estado}
                              </span>
                            </p>
                            {torre.frecuencia_mhz && (
                              <p><strong>📻 Frecuencia:</strong> {torre.frecuencia_mhz} MHz</p>
                            )}
                          </div>
                          <div className="mt-3 pt-2 border-t text-center">
                            <button 
                              onClick={(e) => handleEditTorre(torre, e)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1 mx-auto"
                            >
                              <Edit className="h-3 w-3" />
                              Editar Torre
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                    
                    {/* Círculo de cobertura */}
                    {torre.alcance_km && (
                      <Circle
                        center={[torre.latitud, torre.longitud]}
                        radius={torre.alcance_km * 1000} // convertir km a metros
                        pathOptions={{
                          fillColor: getConvenioColor(torre.tipo_convenio),
                          fillOpacity: 0.1,
                          color: getConvenioColor(torre.tipo_convenio),
                          weight: 1,
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </MapContainer>
          </div>
          
          {/* Información del mapa */}
          <div className="mt-4 flex justify-between items-center">
            {/* Leyenda */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow"></div>
                <span>Policía</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow"></div>
                <span>ECOM</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 border border-white shadow"></div>
                <span>De Tercero</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400 border border-white shadow"></div>
                <span>Otro/Sin Definir</span>
              </div>
            </div>
            
            {/* Contador */}
            <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded shadow">
              Torres mostradas: <span className="font-semibold">{filteredTorres.length}</span> de {torres.length}
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