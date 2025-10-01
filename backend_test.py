#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Sistema de Gestión de Torres
Tests all backend endpoints as specified in the review request
"""

import requests
import json
from datetime import datetime, timedelta
import sys
import os

# Base URL from frontend/.env
BASE_URL = "https://radio-tower.preview.emergentagent.com/api"

class TorresAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        self.created_torre_id = None
        self.created_mantenimiento_id = None
        self.created_tecnico_id = None
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_health_check(self):
        """Test GET /api/health endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy" and data.get("database") == "connected":
                    self.log_result("Health Check", True, "Sistema y BD funcionando correctamente", data)
                else:
                    self.log_result("Health Check", False, "Sistema reporta problemas", data)
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}", {"response": response.text})
                
        except Exception as e:
            self.log_result("Health Check", False, f"Error de conexión: {str(e)}")
    
    def test_torres_get_all(self):
        """Test GET /api/torres - listar todas las torres"""
        try:
            response = self.session.get(f"{self.base_url}/torres", timeout=10)
            
            if response.status_code == 200:
                torres = response.json()
                if isinstance(torres, list):
                    self.log_result("GET Torres", True, f"Obtenidas {len(torres)} torres", {"count": len(torres)})
                    return torres
                else:
                    self.log_result("GET Torres", False, "Respuesta no es una lista", {"response": torres})
            else:
                self.log_result("GET Torres", False, f"HTTP {response.status_code}", {"response": response.text})
                
        except Exception as e:
            self.log_result("GET Torres", False, f"Error: {str(e)}")
        return []
    
    def test_torres_create(self):
        """Test POST /api/torres - crear nueva torre"""
        torre_data = {
            "nombre": "Torre Prueba Testing",
            "tipo": "torre",
            "direccion": "Av. Test 123, Resistencia, Chaco",
            "latitud": -27.4606,
            "longitud": -58.9534,
            "estado": "operativa",
            "alcance_km": 15.0,
            "tipo_convenio": "Policia",
            "frecuencia_mhz": "450.125",
            "notas": "Torre creada durante testing automatizado",
            "UsuarioCreadorID": 1,
            "UsuarioActualizadorID": 1
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/torres", 
                json=torre_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("message") and "exitosamente" in result.get("message", ""):
                    self.log_result("POST Torres", True, "Torre creada exitosamente", torre_data)
                    # Get the created torre ID by searching for it
                    torres = self.test_torres_get_all()
                    for torre in torres:
                        if torre.get("nombre") == torre_data["nombre"]:
                            self.created_torre_id = torre.get("id")
                            break
                    return True
                else:
                    self.log_result("POST Torres", False, "Respuesta inesperada", result)
            else:
                self.log_result("POST Torres", False, f"HTTP {response.status_code}", {"response": response.text})
                
        except Exception as e:
            self.log_result("POST Torres", False, f"Error: {str(e)}")
        return False
    
    def test_torres_get_by_id(self):
        """Test GET /api/torres/{id} - obtener torre específica"""
        if not self.created_torre_id:
            # Try to get any existing torre
            torres = self.test_torres_get_all()
            if torres:
                self.created_torre_id = torres[0].get("id")
        
        if not self.created_torre_id:
            self.log_result("GET Torre by ID", False, "No hay torre ID disponible para testing")
            return
            
        try:
            response = self.session.get(f"{self.base_url}/torres/{self.created_torre_id}", timeout=10)
            
            if response.status_code == 200:
                torre = response.json()
                if torre.get("id") == self.created_torre_id:
                    self.log_result("GET Torre by ID", True, f"Torre {self.created_torre_id} obtenida correctamente", {"torre_id": self.created_torre_id})
                else:
                    self.log_result("GET Torre by ID", False, "ID de torre no coincide", torre)
            elif response.status_code == 404:
                self.log_result("GET Torre by ID", False, "Torre no encontrada (404)", {"torre_id": self.created_torre_id})
            else:
                self.log_result("GET Torre by ID", False, f"HTTP {response.status_code}", {"response": response.text})
                
        except Exception as e:
            self.log_result("GET Torre by ID", False, f"Error: {str(e)}")
    
    def test_torres_update(self):
        """Test PUT /api/torres/{id} - actualizar torre"""
        if not self.created_torre_id:
            self.log_result("PUT Torre", False, "No hay torre ID disponible para testing")
            return
            
        update_data = {
            "nombre": "Torre Prueba Testing ACTUALIZADA",
            "estado": "mantenimiento",
            "notas": "Torre actualizada durante testing automatizado",
            "UsuarioActualizadorID": 1
        }
        
        try:
            response = self.session.put(
                f"{self.base_url}/torres/{self.created_torre_id}",
                json=update_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("message") and "actualizada" in result.get("message", ""):
                    self.log_result("PUT Torre", True, f"Torre {self.created_torre_id} actualizada exitosamente", update_data)
                else:
                    self.log_result("PUT Torre", False, "Respuesta inesperada", result)
            elif response.status_code == 404:
                self.log_result("PUT Torre", False, "Torre no encontrada (404)", {"torre_id": self.created_torre_id})
            else:
                self.log_result("PUT Torre", False, f"HTTP {response.status_code}", {"response": response.text})
                
        except Exception as e:
            self.log_result("PUT Torre", False, f"Error: {str(e)}")
    
    def test_estadisticas(self):
        """Test GET /api/estadisticas - métricas del sistema"""
        try:
            response = self.session.get(f"{self.base_url}/estadisticas", timeout=10)
            
            if response.status_code == 200:
                stats = response.json()
                required_fields = ["total_torres", "torres_ecom", "torres_policia", "torres_de_terceros", "torres_visitadas", "cobertura_km2"]
                
                missing_fields = [field for field in required_fields if field not in stats]
                if not missing_fields:
                    self.log_result("GET Estadísticas", True, "Estadísticas obtenidas correctamente", stats)
                else:
                    self.log_result("GET Estadísticas", False, f"Campos faltantes: {missing_fields}", stats)
            else:
                self.log_result("GET Estadísticas", False, f"HTTP {response.status_code}", {"response": response.text})
                
        except Exception as e:
            self.log_result("GET Estadísticas", False, f"Error: {str(e)}")
    
    def test_mantenimientos_get(self):
        """Test GET /api/mantenimientos - listar mantenimientos"""
        try:
            response = self.session.get(f"{self.base_url}/mantenimientos", timeout=10)
            
            if response.status_code == 200:
                mantenimientos = response.json()
                if isinstance(mantenimientos, list):
                    self.log_result("GET Mantenimientos", True, f"Obtenidos {len(mantenimientos)} mantenimientos", {"count": len(mantenimientos)})
                    return mantenimientos
                else:
                    self.log_result("GET Mantenimientos", False, "Respuesta no es una lista", {"response": mantenimientos})
            else:
                self.log_result("GET Mantenimientos", False, f"HTTP {response.status_code}", {"response": response.text})
                
        except Exception as e:
            self.log_result("GET Mantenimientos", False, f"Error: {str(e)}")
        return []
    
    def test_mantenimientos_create(self):
        """Test POST /api/mantenimientos - crear mantenimiento"""
        if not self.created_torre_id:
            # Try to get any existing torre
            torres = self.test_torres_get_all()
            if torres:
                self.created_torre_id = torres[0].get("id")
        
        if not self.created_torre_id:
            self.log_result("POST Mantenimientos", False, "No hay torre ID disponible para crear mantenimiento")
            return
            
        mantenimiento_data = {
            "TorreID": self.created_torre_id,
            "UsuarioTorristaID": 1,
            "fecha_inicio_mantenimiento": datetime.now().isoformat(),
            "fecha_fin_mantenimiento": (datetime.now() + timedelta(hours=4)).isoformat(),
            "tipo_mantenimiento": "Preventivo",
            "descripcion_trabajo": "Mantenimiento de testing automatizado - verificación de equipos",
            "notas_mantenimiento": "Mantenimiento creado durante testing del sistema",
            "costo": 1500.50
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/mantenimientos",
                json=mantenimiento_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("message") and "exitosamente" in result.get("message", ""):
                    self.log_result("POST Mantenimientos", True, "Mantenimiento creado exitosamente", mantenimiento_data)
                    return True
                else:
                    self.log_result("POST Mantenimientos", False, "Respuesta inesperada", result)
            else:
                self.log_result("POST Mantenimientos", False, f"HTTP {response.status_code}", {"response": response.text})
                
        except Exception as e:
            self.log_result("POST Mantenimientos", False, f"Error: {str(e)}")
        return False
    
    def test_tecnicos_get(self):
        """Test GET /api/tecnicos - listar técnicos"""
        try:
            response = self.session.get(f"{self.base_url}/tecnicos", timeout=10)
            
            if response.status_code == 200:
                tecnicos = response.json()
                if isinstance(tecnicos, list):
                    self.log_result("GET Técnicos", True, f"Obtenidos {len(tecnicos)} técnicos", {"count": len(tecnicos)})
                    return tecnicos
                else:
                    self.log_result("GET Técnicos", False, "Respuesta no es una lista", {"response": tecnicos})
            else:
                self.log_result("GET Técnicos", False, f"HTTP {response.status_code}", {"response": response.text})
                
        except Exception as e:
            self.log_result("GET Técnicos", False, f"Error: {str(e)}")
        return []
    
    def test_tecnicos_create(self):
        """Test POST /api/tecnicos - crear técnico"""
        if not self.created_torre_id:
            # Try to get any existing torre
            torres = self.test_torres_get_all()
            if torres:
                self.created_torre_id = torres[0].get("id")
        
        tecnico_data = {
            "nombre": "Juan Carlos",
            "apellido": "Pérez Testing",
            "dni": 12345678,
            "TorreID": self.created_torre_id,
            "tipoPersona": "POLICIAL",
            "idPersonalPolicial": 9876,
            "usuarioAlta": 1
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/tecnicos",
                json=tecnico_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("message") and "exitosamente" in result.get("message", ""):
                    self.log_result("POST Técnicos", True, "Técnico creado exitosamente", tecnico_data)
                    return True
                else:
                    self.log_result("POST Técnicos", False, "Respuesta inesperada", result)
            else:
                self.log_result("POST Técnicos", False, f"HTTP {response.status_code}", {"response": response.text})
                
        except Exception as e:
            self.log_result("POST Técnicos", False, f"Error: {str(e)}")
        return False
    
    def test_torres_delete(self):
        """Test DELETE /api/torres/{id} - eliminar torre (al final para cleanup)"""
        if not self.created_torre_id:
            self.log_result("DELETE Torre", False, "No hay torre ID disponible para eliminar")
            return
            
        try:
            response = self.session.delete(f"{self.base_url}/torres/{self.created_torre_id}", timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("message") and "eliminada" in result.get("message", ""):
                    self.log_result("DELETE Torre", True, f"Torre {self.created_torre_id} eliminada exitosamente")
                else:
                    self.log_result("DELETE Torre", False, "Respuesta inesperada", result)
            elif response.status_code == 404:
                self.log_result("DELETE Torre", False, "Torre no encontrada (404)", {"torre_id": self.created_torre_id})
            else:
                self.log_result("DELETE Torre", False, f"HTTP {response.status_code}", {"response": response.text})
                
        except Exception as e:
            self.log_result("DELETE Torre", False, f"Error: {str(e)}")
    
    def test_data_validation(self):
        """Test validaciones de datos"""
        print("\n=== TESTING DATA VALIDATION ===")
        
        # Test coordenadas inválidas
        invalid_torre = {
            "nombre": "Torre Inválida",
            "tipo": "torre",
            "direccion": "Test",
            "latitud": 200.0,  # Inválida
            "longitud": -300.0,  # Inválida
            "estado": "operativa",
            "alcance_km": -5.0,  # Inválido
            "tipo_convenio": "Policia"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/torres", json=invalid_torre, timeout=10)
            if response.status_code == 422:
                self.log_result("Validación Coordenadas", True, "Validación de coordenadas funcionando (422)")
            elif response.status_code == 200:
                self.log_result("Validación Coordenadas", False, "Sistema acepta coordenadas inválidas")
            else:
                self.log_result("Validación Coordenadas", False, f"Respuesta inesperada: {response.status_code}")
        except Exception as e:
            self.log_result("Validación Coordenadas", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Ejecutar todos los tests"""
        print("=== INICIANDO TESTING COMPLETO DEL BACKEND ===")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Tests básicos de conectividad
        self.test_health_check()
        
        # Tests de Torres CRUD
        print("\n=== TESTING TORRES CRUD ===")
        self.test_torres_get_all()
        self.test_torres_create()
        self.test_torres_get_by_id()
        self.test_torres_update()
        
        # Tests de otros endpoints
        print("\n=== TESTING OTROS ENDPOINTS ===")
        self.test_estadisticas()
        self.test_mantenimientos_get()
        self.test_mantenimientos_create()
        self.test_tecnicos_get()
        self.test_tecnicos_create()
        
        # Tests de validación
        self.test_data_validation()
        
        # Cleanup - eliminar torre de prueba
        print("\n=== CLEANUP ===")
        self.test_torres_delete()
        
        # Resumen final
        self.print_summary()
    
    def print_summary(self):
        """Imprimir resumen de resultados"""
        print("\n" + "=" * 60)
        print("RESUMEN DE TESTING")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"Total tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n❌ TESTS FALLIDOS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)
        return failed == 0

if __name__ == "__main__":
    tester = TorresAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("🎉 TODOS LOS TESTS PASARON EXITOSAMENTE")
        sys.exit(0)
    else:
        print("⚠️  ALGUNOS TESTS FALLARON - REVISAR LOGS")
        sys.exit(1)