import os
import pyodbc
from dotenv import load_dotenv

load_dotenv()

CONNECTION_STRING = os.getenv("DB_CONNECTION_STRING", "")


def get_db_connection():
    return pyodbc.connect(CONNECTION_STRING)
