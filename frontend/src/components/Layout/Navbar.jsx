import React from 'react';
import { Button } from '../ui/button';
import { 
  Radio, 
  User, 
  LogOut,
  Shield
} from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="bg-blue-900 text-white shadow-lg border-b border-blue-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo y título */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="bg-white p-2 rounded-lg">
                <Radio className="h-6 w-6 text-blue-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Sistema Torres</h1>
                <p className="text-xs text-blue-200">Policía Provincia del Chaco</p>
              </div>
            </div>
          </div>

          {/* Usuario y acciones */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <Shield className="h-4 w-4" />
              <span>Oficial {user?.nombre || 'Admin'}</span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={onLogout}
              className="bg-red-700 border-red-600 text-white hover:bg-red-800 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;