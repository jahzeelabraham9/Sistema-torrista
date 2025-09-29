import pyodbc
from contextlib import contextmanager
import os
from dotenv import load_dotenv

load_dotenv()

DB_SERVER = os.getenv('DB_SERVER')
DB_DATABASE = os.getenv('DB_DATABASE')

# Cadena de conexión con autenticación de Windows
CONNECTION_STRING = (
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={DB_SERVER};"
    f"DATABASE={DB_DATABASE};"
    f"Trusted_Connection=yes;"
)

def get_db_connection():
    """Crear conexión a la base de datos SQL Server"""
    try:
        conn = pyodbc.connect(CONNECTION_STRING)
        return conn
    except pyodbc.Error as ex:
        print(f"Error de conexión a la base de datos: {ex}")
        return None

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
            cursor = conn.cursor()
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            if fetch_one:
                row = cursor.fetchone()
                if row:
                    columns = [column[0] for column in cursor.description]
                    return dict(zip(columns, row))
                return None
            
            elif fetch_all:
                rows = cursor.fetchall()
                if rows:
                    columns = [column[0] for column in cursor.description]
                    return [dict(zip(columns, row)) for row in rows]
                return []
            
            return {"success": True}
            
    except pyodbc.Error as ex:
        print(f"Error ejecutando consulta: {ex}")
        return {"error": str(ex)}