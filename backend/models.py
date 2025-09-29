from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Modelos para Torres
class TorreBase(BaseModel):
    nombre: str
    tipo: str  # 'torre', 'torre_arriestrada', 'mastil_amurado', 'torreantena', 'repetidor'
    direccion: str
    latitud: float
    longitud: float
    estado: str  # 'operativa', 'mantenimiento', 'limitada', 'inactiva'
    alcance_km: float
    fecha_ultimo_mantenimiento: Optional[str] = None
    frecuencia_mhz: Optional[str] = None
    notas: Optional[str] = None
    tipo_convenio: str  # 'Policia', 'Ecom', 'De tercero'

class TorreCreate(TorreBase):
    UsuarioCreadorID: int = 1  # Por defecto admin
    UsuarioActualizadorID: int = 1

class TorreUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    direccion: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    estado: Optional[str] = None
    alcance_km: Optional[float] = None
    fecha_ultimo_mantenimiento: Optional[str] = None
    frecuencia_mhz: Optional[str] = None
    notas: Optional[str] = None
    tipo_convenio: Optional[str] = None
    UsuarioActualizadorID: int = 1

class Torre(TorreBase):
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime

# Modelos para Mantenimientos
class MantenimientoBase(BaseModel):
    TorreID: int
    UsuarioTorristaID: int = 1
    fecha_inicio_mantenimiento: datetime
    fecha_fin_mantenimiento: Optional[datetime] = None
    tipo_mantenimiento: Optional[str] = None
    descripcion_trabajo: str
    notas_mantenimiento: Optional[str] = None
    costo: Optional[float] = None
    imagen1_base64: Optional[str] = None
    imagen2_base64: Optional[str] = None
    imagen3_base64: Optional[str] = None
    imagen4_base64: Optional[str] = None

class MantenimientoCreate(MantenimientoBase):
    pass

class Mantenimiento(MantenimientoBase):
    id: int
    fecha_registro: datetime

# Modelos para Técnicos Intervinientes
class TecnicoIntervinienteBase(BaseModel):
    nombre: str
    apellido: str
    dni: int
    TorreID: Optional[int] = None
    tipoPersona: str  # 'POLICIAL', 'CIVIL', 'CONTRATISTA'
    idPersonalPolicial: Optional[int] = None
    idPersonalCivil: Optional[int] = None

class TecnicoIntervinienteCreate(TecnicoIntervinienteBase):
    usuarioAlta: int = 1

class TecnicoInterviniente(TecnicoIntervinienteBase):
    id: int
    fechaAlta: datetime
    usuarioAlta: int
    fechaBaja: Optional[datetime] = None
    usuarioBaja: Optional[int] = None
    activo: bool = True

# Modelos para Usuarios
class UsuarioBase(BaseModel):
    nombre: str
    apellido: str
    norDni: Optional[int] = None
    tipoPersona: Optional[bool] = None
    sistema: Optional[int] = None
    rol: Optional[int] = None

class UsuarioCreate(UsuarioBase):
    password: str
    userCreaRepo: int = 1

class Usuario(UsuarioBase):
    id: int
    fechaAlta: datetime
    activo: bool = True

# Modelos para Autenticación
class Token(BaseModel):
    access_token: str
    token_type: str

class UserLogin(BaseModel):
    username: str
    password: str

# Modelos de respuesta
class EstadisticasResponse(BaseModel):
    total_torres: int
    torres_ecom: int
    torres_policia: int
    torres_de_terceros: int
    torres_visitadas: int
    cobertura_km2: float

class MessageResponse(BaseModel):
    message: str
    success: bool = True