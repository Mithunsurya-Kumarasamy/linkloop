import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///linkloop.db')
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE rooms ADD COLUMN code VARCHAR(10) UNIQUE;"))
        conn.commit()
        print("Column 'code' added successfully.")
    except Exception as e:
        print(f"Error or column already exists: {e}")
