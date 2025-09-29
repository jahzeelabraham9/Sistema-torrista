from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta
import math

from models import *
from database import execute_query, get_db
from auth import verify_token, get_current_user, create_access_token, verify_password, get_password_hash

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(title="Sistema de Gestión de Torres", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# =================== RUTAS DE AUTENTICACIÓN ===================

@api_router.post("/auth/login", response_model=Token)
async def login_for_access_token(user_data: UserLogin):
    """Autenticar usuario y generar token"""
    try:
        # Buscar usuario por DNI (como username)
        query = "SELECT id, nombre, apellido, norDni, cifrado FROM USUARIOTORRISTA WHERE norDni = ? AND activo = 1"
        user = execute_query(query, (int(user_data.username),), fetch_one=True)
        
        if not user or not verify_password(user_data.password, user.get('cifrado', '')):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": str(user['norDni']), "user_id": user['id']},
            expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DNI debe ser un número"
        )
    except Exception as e:
        logger.error(f"Error en login: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@api_router.post("/auth/register", response_model=MessageResponse)
async def register_user(user_data: UsuarioCreate):
    """Registrar nuevo usuario"""
    try:
        # Verificar si el usuario ya existe
        existing_user = execute_query(
            "SELECT id FROM USUARIOTORRISTA WHERE norDni = ?",
            (user_data.norDni,), 
            fetch_one=True
        )
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario ya existe"
            )
        
        # Crear hash de la contraseña
        hashed_password = get_password_hash(user_data.password)
        
        # Insertar nuevo usuario
        query = """
            INSERT INTO USUARIOTORRISTA 
            (userCreaRepo, fechaAlta, nombre, apellido, norDni, tipoPersona, 
             sistema, rol, cifrado, activo)
            VALUES (?, GETDATE(), ?, ?, ?, ?, ?, ?, ?, 1)
        """
        
        result = execute_query(query, (
            user_data.userCreaRepo,
            user_data.nombre,
            user_data.apellido,
            user_data.norDni,
            user_data.tipoPersona,
            user_data.sistema,
            user_data.rol,
            hashed_password
        ))
        
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        
        return MessageResponse(message="Usuario registrado exitosamente")
    
    except Exception as e:
        logger.error(f"Error registrando usuario: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# =================== RUTAS DE TORRES ===================

@api_router.get("/torres", response_model=List[dict])
async def get_torres():
    """Obtener todas las torres"""
    try:
        query = """
            SELECT id, nombre, tipo, direccion, latitud, longitud, estado, 
                   alcance_km, fecha_ultimo_mantenimiento, frecuencia_mhz, 
                   notas, tipo_convenio, UsuarioCreadorID, UsuarioActualizadorID,
                   fecha_creacion, fecha_actualizacion
            FROM Torres
            ORDER BY id
        """
        torres = execute_query(query, fetch_all=True)
        return torres or []
    except Exception as e:
        logger.error(f"Error obteniendo torres: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@api_router.get("/torres/{torre_id}")
async def get_torre(torre_id: int):
    """Obtener una torre específica"""
    try:
        query = """
            SELECT id, nombre, tipo, direccion, latitud, longitud, estado, 
                   alcance_km, fecha_ultimo_mantenimiento, frecuencia_mhz, 
                   notas, tipo_convenio, UsuarioCreadorID, UsuarioActualizadorID,
                   fecha_creacion, fecha_actualizacion
            FROM Torres WHERE id = ?
        """
        torre = execute_query(query, (torre_id,), fetch_one=True)
        
        if not torre:
            raise HTTPException(status_code=404, detail="Torre no encontrada")
        
        return torre
    except Exception as e:
        logger.error(f"Error obteniendo torre {torre_id}: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@api_router.post("/torres", response_model=MessageResponse)
async def create_torre(torre: TorreCreate):
    """Crear nueva torre"""
    try:
        query = """
            INSERT INTO Torres 
            (nombre, tipo, direccion, latitud, longitud, estado, alcance_km,
             fecha_ultimo_mantenimiento, frecuencia_mhz, notas, tipo_convenio,
             UsuarioCreadorID, UsuarioActualizadorID, fecha_creacion, fecha_actualizacion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
        """
        
        result = execute_query(query, (
            torre.nombre, torre.tipo, torre.direccion, torre.latitud, 
            torre.longitud, torre.estado, torre.alcance_km,
            torre.fecha_ultimo_mantenimiento, torre.frecuencia_mhz,
            torre.notas, torre.tipo_convenio, torre.UsuarioCreadorID,
            torre.UsuarioActualizadorID
        ))
        
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        
        return MessageResponse(message="Torre creada exitosamente")
    
    except Exception as e:
        logger.error(f"Error creando torre: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@api_router.put("/torres/{torre_id}", response_model=MessageResponse)
async def update_torre(torre_id: int, torre: TorreUpdate):
    """Actualizar torre existente"""
    try:
        # Verificar que la torre existe
        existing_torre = execute_query(
            "SELECT id FROM Torres WHERE id = ?", 
            (torre_id,), 
            fetch_one=True
        )
        
        if not existing_torre:
            raise HTTPException(status_code=404, detail="Torre no encontrada")
        
        # Construir consulta dinámica solo con campos proporcionados
        update_fields = []
        params = []
        
        for field, value in torre.dict(exclude_unset=True).items():
            if field != 'UsuarioActualizadorID':
                update_fields.append(f"{field} = ?")
                params.append(value)
        
        if update_fields:
            update_fields.append("fecha_actualizacion = GETDATE()")
            update_fields.append("UsuarioActualizadorID = ?")
            params.append(torre.UsuarioActualizadorID)
            params.append(torre_id)
            
            query = f"UPDATE Torres SET {', '.join(update_fields)} WHERE id = ?"
            result = execute_query(query, params)
            
            if 'error' in result:
                raise HTTPException(status_code=500, detail=result['error'])
        
        return MessageResponse(message="Torre actualizada exitosamente")
    
    except Exception as e:
        logger.error(f"Error actualizando torre {torre_id}: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@api_router.delete("/torres/{torre_id}", response_model=MessageResponse)
async def delete_torre(torre_id: int):
    """Eliminar torre"""
    try:
        # Verificar que la torre existe
        existing_torre = execute_query(
            "SELECT id FROM Torres WHERE id = ?", 
            (torre_id,), 
            fetch_one=True
        )
        
        if not existing_torre:
            raise HTTPException(status_code=404, detail="Torre no encontrada")
        
        # Eliminar torre (CASCADE eliminará mantenimientos relacionados)
        query = "DELETE FROM Torres WHERE id = ?"
        result = execute_query(query, (torre_id,))
        
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        
        return MessageResponse(message="Torre eliminada exitosamente")
    
    except Exception as e:
        logger.error(f"Error eliminando torre {torre_id}: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# =================== RUTAS DE MANTENIMIENTOS ===================

@api_router.get("/mantenimientos")
async def get_mantenimientos(torre_id: Optional[int] = None):
    """Obtener mantenimientos, opcionalmente filtrados por torre"""
    try:
        if torre_id:
            query = """
                SELECT m.*, t.nombre as torre_nombre 
                FROM Mantenimientos m
                JOIN Torres t ON m.TorreID = t.id
                WHERE m.TorreID = ?
                ORDER BY m.fecha_inicio_mantenimiento DESC
            """
            mantenimientos = execute_query(query, (torre_id,), fetch_all=True)
        else:
            query = """
                SELECT m.*, t.nombre as torre_nombre 
                FROM Mantenimientos m
                JOIN Torres t ON m.TorreID = t.id
                ORDER BY m.fecha_inicio_mantenimiento DESC
            """
            mantenimientos = execute_query(query, fetch_all=True)
        
        return mantenimientos or []
    except Exception as e:
        logger.error(f"Error obteniendo mantenimientos: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@api_router.post("/mantenimientos", response_model=MessageResponse)
async def create_mantenimiento(mantenimiento: MantenimientoCreate):
    """Crear nuevo mantenimiento"""
    try:
        query = """
            INSERT INTO Mantenimientos 
            (TorreID, UsuarioTorristaID, fecha_inicio_mantenimiento, 
             fecha_fin_mantenimiento, tipo_mantenimiento, descripcion_trabajo,
             notas_mantenimiento, costo, imagen1_base64, imagen2_base64,
             imagen3_base64, imagen4_base64, fecha_registro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())
        """
        
        result = execute_query(query, (
            mantenimiento.TorreID, mantenimiento.UsuarioTorristaID,
            mantenimiento.fecha_inicio_mantenimiento, 
            mantenimiento.fecha_fin_mantenimiento,
            mantenimiento.tipo_mantenimiento, mantenimiento.descripcion_trabajo,
            mantenimiento.notas_mantenimiento, mantenimiento.costo,
            mantenimiento.imagen1_base64, mantenimiento.imagen2_base64,
            mantenimiento.imagen3_base64, mantenimiento.imagen4_base64
        ))
        
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        
        return MessageResponse(message="Mantenimiento registrado exitosamente")
    
    except Exception as e:
        logger.error(f"Error creando mantenimiento: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# =================== RUTAS DE TÉCNICOS ===================

@api_router.get("/tecnicos")
async def get_tecnicos(torre_id: Optional[int] = None):
    """Obtener técnicos intervinientes"""
    try:
        if torre_id:
            query = """
                SELECT t.*, tor.nombre as torre_nombre 
                FROM TECNICOINTERVINIENTE t
                LEFT JOIN Torres tor ON t.TorreID = tor.id
                WHERE t.TorreID = ? AND t.activo = 1
                ORDER BY t.fechaAlta DESC
            """
            tecnicos = execute_query(query, (torre_id,), fetch_all=True)
        else:
            query = """
                SELECT t.*, tor.nombre as torre_nombre 
                FROM TECNICOINTERVINIENTE t
                LEFT JOIN Torres tor ON t.TorreID = tor.id
                WHERE t.activo = 1
                ORDER BY t.fechaAlta DESC
            """
            tecnicos = execute_query(query, fetch_all=True)
        
        return tecnicos or []
    except Exception as e:
        logger.error(f"Error obteniendo técnicos: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@api_router.post("/tecnicos", response_model=MessageResponse)
async def create_tecnico(tecnico: TecnicoIntervinienteCreate):
    """Crear nuevo técnico interviniente"""
    try:
        query = """
            INSERT INTO TECNICOINTERVINIENTE 
            (nombre, apellido, dni, TorreID, tipoPersona, idPersonalPolicial,
             idPersonalCivil, fechaAlta, usuarioAlta, activo)
            VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE(), ?, 1)
        """
        
        result = execute_query(query, (
            tecnico.nombre, tecnico.apellido, tecnico.dni, tecnico.TorreID,
            tecnico.tipoPersona, tecnico.idPersonalPolicial, 
            tecnico.idPersonalCivil, tecnico.usuarioAlta
        ))
        
        if 'error' in result:
            if 'duplicate key' in result['error'].lower():
                raise HTTPException(
                    status_code=400, 
                    detail="Ya existe un técnico con ese DNI"
                )
            raise HTTPException(status_code=500, detail=result['error'])
        
        return MessageResponse(message="Técnico registrado exitosamente")
    
    except Exception as e:
        logger.error(f"Error creando técnico: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# =================== RUTAS DE ESTADÍSTICAS ===================

@api_router.get("/estadisticas", response_model=EstadisticasResponse)
async def get_estadisticas():
    """Obtener estadísticas del sistema"""
    try:
        # Total de torres
        total_torres = execute_query(
            "SELECT COUNT(*) as total FROM Torres", 
            fetch_one=True
        )
        total_torres = total_torres.get('total', 0) if total_torres else 0
        
        # Torres por tipo de convenio
        torres_por_convenio = execute_query("""
            SELECT tipo_convenio, COUNT(*) as count 
            FROM Torres 
            GROUP BY tipo_convenio
        """, fetch_all=True)
        
        torres_ecom = 0
        torres_policia = 0
        torres_terceros = 0
        
        if torres_por_convenio:
            for row in torres_por_convenio:
                if row['tipo_convenio'] == 'Ecom':
                    torres_ecom = row['count']
                elif row['tipo_convenio'] == 'Policia':
                    torres_policia = row['count']
                elif row['tipo_convenio'] == 'De tercero':
                    torres_terceros = row['count']
        
        # Torres con mantenimientos (visitadas)
        torres_visitadas = execute_query(
            "SELECT COUNT(DISTINCT TorreID) as visitadas FROM Mantenimientos",
            fetch_one=True
        )
        torres_visitadas = torres_visitadas.get('visitadas', 0) if torres_visitadas else 0
        
        # Cobertura total (suma de áreas de cobertura)
        alcances = execute_query(
            "SELECT alcance_km FROM Torres WHERE alcance_km IS NOT NULL AND alcance_km > 0",
            fetch_all=True
        )
        
        cobertura_km2 = 0.0
        if alcances:
            for torre in alcances:
                cobertura_km2 += math.pi * (torre['alcance_km'] ** 2)
        
        return EstadisticasResponse(
            total_torres=total_torres,
            torres_ecom=torres_ecom,
            torres_policia=torres_policia,
            torres_de_terceros=torres_terceros,
            torres_visitadas=torres_visitadas,
            cobertura_km2=round(cobertura_km2, 2)
        )
    
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# =================== RUTAS GENERALES ===================

@api_router.get("/")
async def root():
    """Endpoint de salud"""
    return {"message": "Sistema de Gestión de Torres - API funcionando correctamente"}

@api_router.get("/health")
async def health_check():
    """Check de salud del sistema"""
    try:
        # Probar conexión a la base de datos
        result = execute_query("SELECT 1 as test", fetch_one=True)
        if result and result.get('test') == 1:
            return {"status": "healthy", "database": "connected"}
        else:
            return {"status": "unhealthy", "database": "disconnected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# Include the router in the main app
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)