import React, { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Componentes
import Navbar from "@/components/Layout/Navbar";
import StatsCards from "@/components/Dashboard/StatsCards";
import TorresTable from "@/components/Torres/TorresTable";
import MapComponent from "@/components/Map/MapComponent";
import TorreForm from "@/components/Torres/TorreForm";

// Servicios
import { torresAPI, estadisticasAPI } from "@/services/api";

// Hooks para notificaciones
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "sonner";

const Dashboard = () => {
  // Estados principales
  const [torres, setTorres] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTorre, setSelectedTorre] = useState(null);
  
  // Estados de formulario
  const [showForm, setShowForm] = useState(false);
  const [editingTorre, setEditingTorre] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // Estados de filtros del mapa
  const [mapFilters, setMapFilters] = useState({
    search: '',
    convenio: 'all',
    maintenance: ''
  });

  // Usuario simulado (en producción vendría del auth)
  const [user] = useState({ nombre: 'Admin', apellido: 'Sistema' });

  const { toast } = useToast();

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [torresResponse, statsResponse] = await Promise.allSettled([
        torresAPI.getAll(),
        estadisticasAPI.get()
      ]);

      if (torresResponse.status === 'fulfilled') {
        setTorres(torresResponse.value.data || []);
      } else {
        console.error('Error cargando torres:', torresResponse.reason);
        toast({
          title: "Error",
          description: "No se pudieron cargar las torres",
          variant: "destructive"
        });
      }

      if (statsResponse.status === 'fulfilled') {
        setEstadisticas(statsResponse.value.data || {});
      } else {
        console.error('Error cargando estadísticas:', statsResponse.reason);
        // Las estadísticas no son críticas, no mostramos error
      }

    } catch (error) {
      console.error('Error en loadInitialData:', error);
      toast({
        title: "Error",
        description: "Error conectando con el servidor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers para torres
  const handleAddTorre = () => {
    setEditingTorre(null);
    setShowForm(true);
  };

  const handleEditTorre = (torre) => {
    setEditingTorre(torre);
    setShowForm(true);
  };

  const handleDeleteTorre = async (torre) => {
    if (window.confirm(`¿Estás seguro de eliminar la torre "${torre.nombre}"?`)) {
      try {
        await torresAPI.delete(torre.id);
        setTorres(prev => prev.filter(t => t.id !== torre.id));
        
        toast({
          title: "Éxito",
          description: "Torre eliminada correctamente"
        });

        // Recargar estadísticas
        try {
          const statsResponse = await estadisticasAPI.get();
          setEstadisticas(statsResponse.data);
        } catch (error) {
          console.error('Error recargando estadísticas:', error);
        }

      } catch (error) {
        console.error('Error eliminando torre:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la torre",
          variant: "destructive"
        });
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    try {
      let response;
      
      if (editingTorre) {
        // Actualizar torre existente
        response = await torresAPI.update(editingTorre.id, formData);
        
        // Actualizar en el estado local
        setTorres(prev => prev.map(t => 
          t.id === editingTorre.id 
            ? { ...t, ...formData, id: editingTorre.id }
            : t
        ));
        
        toast({
          title: "Éxito",
          description: "Torre actualizada correctamente"
        });
      } else {
        // Crear nueva torre
        response = await torresAPI.create(formData);
        
        // Recargar todas las torres para obtener la nueva con su ID
        const torresResponse = await torresAPI.getAll();
        setTorres(torresResponse.data || []);
        
        toast({
          title: "Éxito",
          description: "Torre creada correctamente"
        });
      }

      setShowForm(false);
      setEditingTorre(null);

      // Recargar estadísticas
      try {
        const statsResponse = await estadisticasAPI.get();
        setEstadisticas(statsResponse.data);
      } catch (error) {
        console.error('Error recargando estadísticas:', error);
      }

    } catch (error) {
      console.error('Error guardando torre:', error);
      toast({
        title: "Error",
        description: editingTorre 
          ? "No se pudo actualizar la torre" 
          : "No se pudo crear la torre",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewOnMap = (torre) => {
    setSelectedTorre(torre);
    // Scroll hacia el mapa
    const mapElement = document.getElementById('map-section');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de cerrar sesión?')) {
      localStorage.removeItem('authToken');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Estadísticas */}
        <StatsCards estadisticas={estadisticas} loading={loading} />

        {/* Layout principal */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Mapa - 2/3 del ancho en pantallas grandes */}
          <div className="xl:col-span-2" id="map-section">
            <MapComponent
              torres={torres}
              selectedTorre={selectedTorre}
              onTorreSelect={setSelectedTorre}
              filters={mapFilters}
              onFiltersChange={setMapFilters}
            />
          </div>

          {/* Panel lateral - 1/3 del ancho */}
          <div className="space-y-6">
            {/* Información de torre seleccionada */}
            {selectedTorre && (
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                <h3 className="font-semibold text-lg mb-2">Torre Seleccionada</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Nombre:</span> {selectedTorre.nombre}</p>
                  <p><span className="font-medium">Tipo:</span> {selectedTorre.tipo}</p>
                  <p><span className="font-medium">Estado:</span> {selectedTorre.estado}</p>
                  <p><span className="font-medium">Convenio:</span> {selectedTorre.tipo_convenio}</p>
                </div>
              </div>
            )}

            {/* Resumen rápido */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-3">Resumen Rápido</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Torres Totales:</span>
                  <span className="font-medium">{torres.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Operativas:</span>
                  <span className="font-medium text-green-600">
                    {torres.filter(t => t.estado === 'operativa').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>En Mantenimiento:</span>
                  <span className="font-medium text-yellow-600">
                    {torres.filter(t => t.estado === 'mantenimiento').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Inactivas:</span>
                  <span className="font-medium text-red-600">
                    {torres.filter(t => t.estado === 'inactiva').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de torres */}
        <TorresTable
          torres={torres}
          loading={loading}
          onAdd={handleAddTorre}
          onEdit={handleEditTorre}
          onDelete={handleDeleteTorre}
          onViewOnMap={handleViewOnMap}
        />
      </main>

      {/* Formulario Modal */}
      <TorreForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTorre(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingTorre}
        loading={formLoading}
      />

      {/* Toaster para notificaciones */}
      <Toaster position="top-right" />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
