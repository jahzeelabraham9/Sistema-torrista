import sqlite3
import os
from contextlib import contextmanager
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

# Para desarrollo usamos SQLite, para producción SQL Server
USE_SQLITE = os.getenv('USE_SQLITE', 'true').lower() == 'true'
DB_PATH = Path(__file__).parent / "torres.db"

def init_sqlite_db():
    """Inicializar base de datos SQLite con el schema completo"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Crear tablas basadas en el schema de SQL Server
    cursor.executescript("""
        -- Tabla de Roles
        CREATE TABLE IF NOT EXISTS ROL (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombreRol VARCHAR(100) NOT NULL UNIQUE,
            descripcion TEXT NULL
        );

        -- Tabla de Unidades del Sistema
        CREATE TABLE IF NOT EXISTS UNIDADSISTEMA (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombreUnidad VARCHAR(150) NOT NULL UNIQUE,
            codigoUnidad VARCHAR(50) NULL
        );

        -- Tabla de Usuarios Torristas
        CREATE TABLE IF NOT EXISTS USUARIOTORRISTA (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userCreaRepo INTEGER NOT NULL,
            usuarioRepo INTEGER NULL,
            fechaAlta DATETIME NOT NULL,
            persona INTEGER NULL,
            civil INTEGER NULL,
            norDni INTEGER NULL,
            nombre VARCHAR(50) NULL,
            apellido VARCHAR(50) NULL,
            tipoPersona BOOLEAN NULL,
            fechaBaja DATETIME NULL,
            usuarioBaja INTEGER NULL,
            baja BOOLEAN NULL DEFAULT 0,
            sistema INTEGER NULL,
            cifrado VARCHAR(250) NULL,
            fechaVinculacion DATETIME NULL,
            rol INTEGER NULL,
            activo BOOLEAN NOT NULL DEFAULT 1,
            FOREIGN KEY (sistema) REFERENCES UNIDADSISTEMA(id),
            FOREIGN KEY (rol) REFERENCES ROL(id),
            FOREIGN KEY (usuarioBaja) REFERENCES USUARIOTORRISTA(id)
        );

        -- Tabla principal de Torres
        CREATE TABLE IF NOT EXISTS Torres (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre VARCHAR(255) NOT NULL,
            tipo VARCHAR(50) NOT NULL,
            direccion VARCHAR(255) NOT NULL,
            latitud DECIMAL(10, 8) NOT NULL, 
            longitud DECIMAL(11, 8) NOT NULL,
            estado VARCHAR(50) NOT NULL,
            alcance_km DECIMAL(8, 2) NOT NULL,
            fecha_ultimo_mantenimiento DATE NULL,
            frecuencia_mhz VARCHAR(50) NULL, 
            notas TEXT NULL,
            tipo_convenio VARCHAR(50) NULL,
            UsuarioCreadorID INTEGER NULL,
            UsuarioActualizadorID INTEGER NULL,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (UsuarioCreadorID) REFERENCES USUARIOTORRISTA(id),
            FOREIGN KEY (UsuarioActualizadorID) REFERENCES USUARIOTORRISTA(id)
        );

        -- Tabla de Mantenimientos
        CREATE TABLE IF NOT EXISTS Mantenimientos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            TorreID INTEGER NOT NULL,
            UsuarioTorristaID INTEGER NOT NULL,
            fecha_inicio_mantenimiento DATETIME NOT NULL,
            fecha_fin_mantenimiento DATETIME NULL,
            tipo_mantenimiento VARCHAR(100) NULL,
            descripcion_trabajo TEXT NOT NULL,
            notas_mantenimiento TEXT NULL,
            costo DECIMAL(10,2) NULL,
            imagen1_base64 TEXT NULL,
            imagen2_base64 TEXT NULL,
            imagen3_base64 TEXT NULL,
            imagen4_base64 TEXT NULL,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (TorreID) REFERENCES Torres(id) ON DELETE CASCADE,
            FOREIGN KEY (UsuarioTorristaID) REFERENCES USUARIOTORRISTA(id)
        );

        -- Tabla de Técnicos Intervinientes
        CREATE TABLE IF NOT EXISTS TECNICOINTERVINIENTE (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre VARCHAR(50) NOT NULL,
            apellido VARCHAR(50) NOT NULL,
            dni INTEGER NOT NULL UNIQUE,
            TorreID INTEGER NULL,
            tipoPersona VARCHAR(25) NOT NULL,
            idPersonalPolicial INTEGER NULL,
            idPersonalCivil INTEGER NULL,
            fechaAlta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            usuarioAlta INTEGER NOT NULL,
            fechaBaja DATETIME NULL,
            usuarioBaja INTEGER NULL,
            activo BOOLEAN NOT NULL DEFAULT 1,
            FOREIGN KEY (TorreID) REFERENCES Torres(id) ON DELETE SET NULL,
            FOREIGN KEY (usuarioAlta) REFERENCES USUARIOTORRISTA(id),
            FOREIGN KEY (usuarioBaja) REFERENCES USUARIOTORRISTA(id)
        );
    """)
    
    # Insertar datos de ejemplo si no existen
    cursor.execute("SELECT COUNT(*) FROM ROL")
    if cursor.fetchone()[0] == 0:
        cursor.executescript("""
            INSERT INTO ROL (nombreRol, descripcion) VALUES
            ('Administrador', 'Acceso total al sistema'),
            ('Técnico Torrista', 'Gestión y mantenimiento de torres'),
            ('Operador', 'Visualización y reportes básicos');

            INSERT INTO UNIDADSISTEMA (nombreUnidad, codigoUnidad) VALUES
            ('División Comunicaciones Resistencia', 'DCR01'),
            ('División Comunicaciones Sáenz Peña', 'DCSP02'),
            ('Soporte Técnico Central', 'STC99');

            INSERT INTO USUARIOTORRISTA (userCreaRepo, fechaAlta, nombre, apellido, norDni, sistema, rol, activo) VALUES
            (1, datetime('now'), 'Admin', 'Sistema', 12345678, 3, 1, 1),
            (1, datetime('now'), 'Juan', 'Perez', 87654321, 1, 2, 1),
            (1, datetime('now'), 'Ana', 'Gomez', 11223344, 2, 2, 1);

            INSERT INTO Torres (nombre, tipo, direccion, latitud, longitud, estado, alcance_km, tipo_convenio, UsuarioCreadorID, UsuarioActualizadorID) VALUES 
            ('Torre Norte Ciudad', 'torre', 'Ruta 11 Km 1010, Resistencia', -27.400000, -58.950000, 'operativa', 25.00, 'Policia', 2, 2),
            ('Antena Rural Oeste', 'antena', 'Camino Vecinal S/N, Sáenz Peña', -27.450000, -59.050000, 'mantenimiento', 10.00, 'Ecom', 3, 3),
            ('Torre Central ECOM', 'torreantena', 'Av. 25 de Mayo 1234, Resistencia', -27.451958, -58.986347, 'operativa', 35.00, 'Ecom', 2, 2),
            ('Repetidor Villa Ángela', 'repetidor', 'Ruta 89 Km 45, Villa Ángela', -27.573813, -60.715000, 'limitada', 15.00, 'De tercero', 3, 3);
        """)
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Crear conexión a la base de datos"""
    if USE_SQLITE:
        if not DB_PATH.exists():
            init_sqlite_db()
        return sqlite3.connect(DB_PATH)
    else:
        # Para SQL Server (cuando esté disponible)
        try:
            import pyodbc
            DB_SERVER = os.getenv('DB_SERVER')
            DB_DATABASE = os.getenv('DB_DATABASE')
            CONNECTION_STRING = (
                f"DRIVER={{ODBC Driver 17 for SQL Server}};"
                f"SERVER={DB_SERVER};"
                f"DATABASE={DB_DATABASE};"
                f"Trusted_Connection=yes;"
            )
            return pyodbc.connect(CONNECTION_STRING)
        except ImportError:
            print("pyodbc no disponible, usando SQLite")
            if not DB_PATH.exists():
                init_sqlite_db()
            return sqlite3.connect(DB_PATH)

@contextmanager
def get_db():
    """Context manager para manejo automático de conexiones"""
    conn = get_db_connection()
    if not conn:
        raise Exception("No se pudo conectar a la base de datos")
    
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def execute_query(query, params=None, fetch_one=False, fetch_all=False):
    """Ejecutar consulta SQL de manera segura"""
    try:
        with get_db() as conn:
            if USE_SQLITE:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
            else:
                cursor = conn.cursor()
            
            if params:
                # Convertir query de SQL Server a SQLite si es necesario
                if USE_SQLITE:
                    query = query.replace('GETDATE()', 'datetime("now")')
                    query = query.replace('IDENTITY(1,1)', 'INTEGER PRIMARY KEY AUTOINCREMENT')
                cursor.execute(query, params)
            else:
                if USE_SQLITE:
                    query = query.replace('GETDATE()', 'datetime("now")')
                cursor.execute(query)
            
            if fetch_one:
                row = cursor.fetchone()
                if row:
                    if USE_SQLITE:
                        return dict(row)
                    else:
                        columns = [column[0] for column in cursor.description]
                        return dict(zip(columns, row))
                return None
            
            elif fetch_all:
                rows = cursor.fetchall()
                if rows:
                    if USE_SQLITE:
                        return [dict(row) for row in rows]
                    else:
                        columns = [column[0] for column in cursor.description]
                        return [dict(zip(columns, row)) for row in rows]
                return []
            
            return {"success": True}
            
    except Exception as ex:
        print(f"Error ejecutando consulta: {ex}")
        return {"error": str(ex)}