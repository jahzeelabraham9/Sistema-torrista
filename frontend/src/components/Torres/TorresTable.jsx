import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter,
  MapPin,
  Download,
  Printer
} from 'lucide-react';

const StatusBadge = ({ estado }) => {
  const statusColors = {
    operativa: 'bg-green-100 text-green-800 border-green-200',
    mantenimiento: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    limitada: 'bg-orange-100 text-orange-800 border-orange-200',
    inactiva: 'bg-red-100 text-red-800 border-red-200'
  };

  const statusLabels = {
    operativa: 'Operativa',
    mantenimiento: 'Mantenimiento',
    limitada: 'Limitada',
    inactiva: 'Inactiva'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[estado] || statusColors.inactiva}`}>
      {statusLabels[estado] || 'Desconocido'}
    </span>
  );
};

const ConvenioBadge = ({ tipoConvenio }) => {
  const convenioColors = {
    'Policia': 'bg-blue-100 text-blue-800 border-blue-200',
    'Ecom': 'bg-red-100 text-red-800 border-red-200',
    'De tercero': 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${convenioColors[tipoConvenio] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
      {tipoConvenio || 'N/A'}
    </span>
  );
};

const TorresTable = ({ 
  torres = [], 
  loading, 
  onEdit, 
  onDelete, 
  onAdd,
  onViewOnMap 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtrar torres basado en búsqueda
  const filteredTorres = torres.filter(torre => 
    torre.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    torre.direccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    torre.id?.toString().includes(searchTerm)
  );

  // Paginación
  const totalPages = Math.ceil(filteredTorres.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTorres = filteredTorres.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Gestión de Torres y Antenas
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Administra todas las torres de comunicación
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={onAdd} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Torre
            </Button>
          </div>
        </div>

        {/* Búsqueda y filtros */}
        <div className="mt-4 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, dirección o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Torre/Antena
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ubicación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Convenio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Alcance
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedTorres.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <Radio className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-lg font-medium">No se encontraron torres</p>
                  <p className="text-sm">Intenta ajustar tu búsqueda o agregar una nueva torre</p>
                </td>
              </tr>
            ) : (
              paginatedTorres.map((torre) => (
                <tr key={torre.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    #{torre.id}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {torre.nombre}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {torre.tipo?.replace('_', ' ')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {torre.direccion}
                    </div>
                    <div className="text-sm text-gray-500">
                      {torre.latitud?.toFixed(6)}, {torre.longitud?.toFixed(6)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ConvenioBadge tipoConvenio={torre.tipo_convenio} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge estado={torre.estado} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {torre.alcance_km} km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewOnMap(torre)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(torre)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(torre)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredTorres.length)} de {filteredTorres.length} resultados
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TorresTable;