from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import get_db_connection
from models import ProductCard, Category
from blob_storage import blob_url_for_image

app = FastAPI(title="Feng Shui Shop API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/products", response_model=list[ProductCard])
def get_products():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.ProductId, p.ProductName, p.Price, p.OldPrice,
                   p.ShortDescription, c.CategoryName, pi.ImageName
            FROM Products p
            JOIN ProductCategories c ON p.CategoryId = c.CategoryId
            LEFT JOIN ProductImages pi ON p.ProductId = pi.ProductId
                 AND pi.ImageName LIKE '%[_]1.%'
            ORDER BY p.ProductId
        """)
        columns = [col[0] for col in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
        conn.close()
        for row in rows:
            row["ImageUrl"] = blob_url_for_image(row.get("ImageName"))
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/categories", response_model=list[Category])
def get_categories():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT CategoryId, CategoryName, [Description]
            FROM ProductCategories
            ORDER BY CategoryId
        """)
        columns = [col[0] for col in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
        conn.close()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
