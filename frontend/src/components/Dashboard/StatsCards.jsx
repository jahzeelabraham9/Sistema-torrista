import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Radio, 
  Shield, 
  Building2, 
  Users, 
  MapPin, 
  Activity 
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  };

  return (
    <Card className={`border-l-4 ${colorClasses[color]} hover:shadow-md transition-shadow`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
};

const StatsCards = ({ estadisticas, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <StatCard
        title="Total de Torres"
        value={estadisticas?.total_torres || 0}
        icon={Radio}
        color="blue"
        subtitle="Torres registradas"
      />
      
      <StatCard
        title="Torres Visitadas"
        value={estadisticas?.torres_visitadas || 0}
        icon={Activity}
        color="green"
        subtitle="Con mantenimientos"
      />
      
      <StatCard
        title="Convenio Policía"
        value={estadisticas?.torres_policia || 0}
        icon={Shield}
        color="cyan"
        subtitle="Gestión policial"
      />
      
      <StatCard
        title="Convenio ECOM"
        value={estadisticas?.torres_ecom || 0}
        icon={Building2}
        color="red"
        subtitle="Empresa ECOM"
      />
      
      <StatCard
        title="Convenio Terceros"
        value={estadisticas?.torres_de_terceros || 0}
        icon={Users}
        color="yellow"
        subtitle="Terceras partes"
      />
      
      <StatCard
        title="Cobertura"
        value={`${estadisticas?.cobertura_km2 || 0} km²`}
        icon={MapPin}
        color="purple"
        subtitle="Área de cobertura"
      />
    </div>
  );
};

export default StatsCards;