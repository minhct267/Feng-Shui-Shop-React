import hmac
import html
import json
import os
import re
from datetime import date, datetime, timezone, timedelta

import jwt
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from database import get_db_connection
from models import (
    ProductCard, Category, Promotion, ProductCreateResponse, ProductUpdateResponse,
    AdminProductListItem, AdminProductListResponse, ProductImage, AdminProductDetail,
    ProductListResponse,
)
from blob_storage import blob_url_for_image, upload_image, delete_blob, move_blob_to_bin

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "fallback-dev-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24
COOKIE_NAME = "access_token"

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "!HAIdrone123"

app = FastAPI(title="Feng Shui Shop API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/api/login")
def login(body: LoginRequest, response: Response):
    username_ok = hmac.compare_digest(body.username, ADMIN_USERNAME)
    password_ok = hmac.compare_digest(body.password, ADMIN_PASSWORD)
    if not (username_ok and password_ok):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    payload = {
        "sub": ADMIN_USERNAME,
        "role": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        path="/",
        max_age=JWT_EXPIRY_HOURS * 3600,
    )
    return {"username": ADMIN_USERNAME, "role": "admin"}


@app.get("/api/me")
def get_current_user(request: Request):
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {"username": payload["sub"], "role": payload["role"]}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.post("/api/logout")
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/", httponly=True, samesite="lax")
    return {"message": "Logged out"}


def require_admin(request: Request):
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload


@app.get("/api/products", response_model=ProductListResponse)
def get_products(page: int = 1, page_size: int = 30):
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 60:
        page_size = 30

    offset = (page - 1) * page_size

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM Products")
        total = cursor.fetchone()[0]

        cursor.execute("""
            SELECT p.ProductId, p.ProductName, p.Price, p.OldPrice,
                   p.ShortDescription, c.CategoryName, pi.ImageName
            FROM Products p
            JOIN ProductCategories c ON p.CategoryId = c.CategoryId
            LEFT JOIN ProductImages pi ON p.ProductId = pi.ProductId
                 AND pi.ImageName LIKE '%[_]1.%'
            ORDER BY p.UpdatedDate DESC
            OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
        """, (offset, page_size))

        columns = [col[0] for col in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
        conn.close()

        for row in rows:
            row["ImageUrl"] = blob_url_for_image(row.get("ImageName"))

        return ProductListResponse(items=rows, total=total, page=page, page_size=page_size)
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


@app.get("/api/promotions", response_model=list[Promotion])
def get_promotions():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT PromotionId, PromotionName, Details,
                   CONVERT(VARCHAR(10), StartDate, 120) AS StartDate,
                   CONVERT(VARCHAR(10), EndDate, 120) AS EndDate
            FROM Promotions
            ORDER BY StartDate DESC
        """)
        columns = [col[0] for col in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
        conn.close()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_IMAGES = 10

CATEGORY_SLUG = {
    "Bracelets": "bracelet",
    "Necklaces": "necklace",
    "Pendants": "pendant",
    "Brooches": "brooch",
    "Rings": "ring",
    "Earrings": "earring",
    "Hair Accessories": "hair",
    "Keychains": "keychain",
    "Cabochons": "cabochon",
    "Decorative Bottles": "bottle",
    "Cosmetics": "cosmetic",
    "Mirrors": "mirror",
}


def _sanitize_text(value: str) -> str:
    return html.escape(value.strip())


def _safe_filename(name: str) -> str:
    name = name.lower().strip()
    name = re.sub(r"[^\w\s-]", "", name)
    name = re.sub(r"[\s-]+", "_", name)
    return name


@app.get("/api/admin/products/check-name")
def check_product_name(name: str, exclude_id: int | None = None, admin=Depends(require_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        if exclude_id is not None:
            cursor.execute(
                "SELECT ProductId FROM Products WHERE LOWER(ProductName) = LOWER(?) AND ProductId != ?",
                (name.strip(), exclude_id),
            )
        else:
            cursor.execute(
                "SELECT ProductId FROM Products WHERE LOWER(ProductName) = LOWER(?)",
                (name.strip(),),
            )
        row = cursor.fetchone()
        return {"exists": row is not None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/api/admin/products", response_model=ProductCreateResponse)
async def create_product(
    admin=Depends(require_admin),
    product_name: str = Form(...),
    price: float = Form(...),
    old_price: float | None = Form(None),
    short_description: str | None = Form(None),
    detailed_description: str | None = Form(None),
    quantity: int = Form(...),
    category_id: int = Form(...),
    promotion_id: int | None = Form(None),
    image_descriptions: str | None = Form(None),
    images: list[UploadFile] = File(...),
):
    product_name = _sanitize_text(product_name)
    if not product_name or len(product_name) > 100:
        raise HTTPException(status_code=422, detail="Product name is required and must be at most 100 characters.")

    if price is None or price <= 0:
        raise HTTPException(status_code=422, detail="Price must be a positive number.")

    if old_price is not None and old_price <= price:
        raise HTTPException(status_code=422, detail="Old price must be greater than the current price.")

    if quantity is None or quantity < 0:
        raise HTTPException(status_code=422, detail="Quantity must be zero or a positive integer.")

    if short_description is not None:
        short_description = _sanitize_text(short_description)
        if len(short_description) > 255:
            raise HTTPException(status_code=422, detail="Short description must be at most 255 characters.")

    if detailed_description is not None:
        detailed_description = _sanitize_text(detailed_description)

    if not images or len(images) == 0:
        raise HTTPException(status_code=422, detail="At least one product image is required.")

    if len(images) > MAX_IMAGES:
        raise HTTPException(status_code=422, detail=f"Maximum {MAX_IMAGES} images allowed per product.")

    desc_list: list[str] = []
    if image_descriptions:
        try:
            desc_list = json.loads(image_descriptions)
        except json.JSONDecodeError:
            desc_list = []

    image_data_list: list[tuple[bytes, str, str]] = []
    for i, img in enumerate(images):
        if img.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=422,
                detail=f"Image '{img.filename}' has unsupported type '{img.content_type}'. Allowed: JPEG, PNG, WebP.",
            )
        data = await img.read()
        if len(data) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=422,
                detail=f"Image '{img.filename}' exceeds 5 MB limit.",
            )
        ext = img.filename.rsplit(".", 1)[-1].lower() if "." in img.filename else "jpg"
        if ext not in ("jpg", "jpeg", "png", "webp"):
            ext = "jpg"
        image_data_list.append((data, ext, img.content_type))

    conn = get_db_connection()
    cursor = conn.cursor()
    uploaded_blobs: list[str] = []

    try:
        cursor.execute("SELECT CategoryName FROM ProductCategories WHERE CategoryId = ?", (category_id,))
        cat_row = cursor.fetchone()
        if not cat_row:
            raise HTTPException(status_code=422, detail="Selected category does not exist.")
        category_slug = CATEGORY_SLUG.get(cat_row[0], _safe_filename(cat_row[0]))

        if promotion_id is not None:
            cursor.execute("SELECT 1 FROM Promotions WHERE PromotionId = ?", (promotion_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=422, detail="Selected promotion does not exist.")

        cursor.execute(
            """
            INSERT INTO Products
                (ProductName, Price, OldPrice, ShortDescription, DetailedDescription,
                 Quantity, UpdatedDate, CategoryId, PromotionId)
            OUTPUT INSERTED.ProductId
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                product_name,
                price,
                old_price,
                short_description,
                detailed_description,
                quantity,
                date.today().isoformat(),
                category_id,
                promotion_id,
            ),
        )
        row = cursor.fetchone()
        product_id = row[0]

        safe_name = _safe_filename(product_name)

        for i, (data, ext, content_type) in enumerate(image_data_list, start=1):
            blob_name = f"{safe_name}_{category_slug}_{i}.{ext}"
            upload_image(blob_name, data, content_type)
            uploaded_blobs.append(blob_name)

            img_desc = desc_list[i - 1] if (i - 1) < len(desc_list) and desc_list[i - 1] else f"{product_name} - image {i}"
            if img_desc:
                img_desc = _sanitize_text(img_desc)

            cursor.execute(
                """
                INSERT INTO ProductImages (ImageName, ImageDescription, ProductId)
                VALUES (?, ?, ?)
                """,
                (blob_name, img_desc, product_id),
            )

        conn.commit()
        return ProductCreateResponse(ProductId=product_id, message="Product created successfully.")

    except HTTPException:
        conn.rollback()
        for blob_name in uploaded_blobs:
            try:
                delete_blob(blob_name)
            except Exception:
                pass
        raise
    except Exception as e:
        conn.rollback()
        for blob_name in uploaded_blobs:
            try:
                delete_blob(blob_name)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/admin/products/list", response_model=AdminProductListResponse)
def list_admin_products(
    search: str = "",
    page: int = 1,
    page_size: int = 10,
    admin=Depends(require_admin),
):
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 50:
        page_size = 10

    search = search.strip()
    offset = (page - 1) * page_size

    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        if search:
            count_sql = """
                SELECT COUNT(*) FROM Products p
                JOIN ProductCategories c ON p.CategoryId = c.CategoryId
                WHERE p.ProductName LIKE ?
            """
            cursor.execute(count_sql, (f"%{search}%",))
        else:
            cursor.execute("SELECT COUNT(*) FROM Products")

        total = cursor.fetchone()[0]

        if search:
            data_sql = """
                SELECT p.ProductId, p.ProductName, p.Price, p.Quantity,
                       c.CategoryName, pi.ImageName
                FROM Products p
                JOIN ProductCategories c ON p.CategoryId = c.CategoryId
                LEFT JOIN ProductImages pi ON p.ProductId = pi.ProductId
                     AND pi.ImageName LIKE '%[_]1.%'
                WHERE p.ProductName LIKE ?
                ORDER BY p.ProductId
                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
            """
            cursor.execute(data_sql, (f"%{search}%", offset, page_size))
        else:
            data_sql = """
                SELECT p.ProductId, p.ProductName, p.Price, p.Quantity,
                       c.CategoryName, pi.ImageName
                FROM Products p
                JOIN ProductCategories c ON p.CategoryId = c.CategoryId
                LEFT JOIN ProductImages pi ON p.ProductId = pi.ProductId
                     AND pi.ImageName LIKE '%[_]1.%'
                ORDER BY p.ProductId
                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
            """
            cursor.execute(data_sql, (offset, page_size))

        columns = [col[0] for col in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

        items = []
        for row in rows:
            items.append(AdminProductListItem(
                ProductId=row["ProductId"],
                ProductName=row["ProductName"],
                Price=row["Price"],
                Quantity=row["Quantity"],
                CategoryName=row["CategoryName"],
                ImageUrl=blob_url_for_image(row.get("ImageName")),
            ))

        return AdminProductListResponse(items=items, total=total, page=page, page_size=page_size)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/admin/products/{product_id}", response_model=AdminProductDetail)
def get_admin_product_detail(product_id: int, admin=Depends(require_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.ProductId, p.ProductName, p.Price, p.OldPrice,
                   p.ShortDescription, p.DetailedDescription, p.Quantity,
                   CONVERT(VARCHAR(10), p.UpdatedDate, 120) AS UpdatedDate,
                   c.CategoryName, p.CategoryId,
                   p.PromotionId, pr.PromotionName
            FROM Products p
            JOIN ProductCategories c ON p.CategoryId = c.CategoryId
            LEFT JOIN Promotions pr ON p.PromotionId = pr.PromotionId
            WHERE p.ProductId = ?
        """, (product_id,))

        columns = [col[0] for col in cursor.description]
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Product not found")

        product = dict(zip(columns, row))

        cursor.execute("""
            SELECT ImageId, ImageName, ImageDescription
            FROM ProductImages
            WHERE ProductId = ?
            ORDER BY ImageId
        """, (product_id,))

        img_columns = [col[0] for col in cursor.description]
        img_rows = [dict(zip(img_columns, r)) for r in cursor.fetchall()]

        images = [
            ProductImage(
                ImageId=img["ImageId"],
                ImageName=img["ImageName"],
                ImageDescription=img.get("ImageDescription"),
                ImageUrl=blob_url_for_image(img["ImageName"]),
            )
            for img in img_rows
        ]

        return AdminProductDetail(
            ProductId=product["ProductId"],
            ProductName=product["ProductName"],
            Price=product["Price"],
            OldPrice=product["OldPrice"],
            ShortDescription=product["ShortDescription"],
            DetailedDescription=product["DetailedDescription"],
            Quantity=product["Quantity"],
            UpdatedDate=product["UpdatedDate"],
            CategoryName=product["CategoryName"],
            CategoryId=product["CategoryId"],
            PromotionId=product.get("PromotionId"),
            PromotionName=product.get("PromotionName"),
            Images=images,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


def _extract_max_sequence(image_names: list[str]) -> int:
    max_seq = 0
    for name in image_names:
        m = re.search(r"_(\d+)\.\w+$", name)
        if m:
            max_seq = max(max_seq, int(m.group(1)))
    return max_seq


@app.put("/api/admin/products/{product_id}", response_model=ProductUpdateResponse)
async def update_product(
    product_id: int,
    admin=Depends(require_admin),
    product_name: str = Form(...),
    price: float = Form(...),
    old_price: float | None = Form(None),
    short_description: str | None = Form(None),
    detailed_description: str | None = Form(None),
    quantity: int = Form(...),
    category_id: int = Form(...),
    promotion_id: int | None = Form(None),
    deleted_image_ids: str | None = Form(None),
    new_image_descriptions: str | None = Form(None),
    images: list[UploadFile] | None = File(None),
):
    product_name = _sanitize_text(product_name)
    if not product_name or len(product_name) > 100:
        raise HTTPException(status_code=422, detail="Product name is required and must be at most 100 characters.")

    if price is None or price <= 0:
        raise HTTPException(status_code=422, detail="Price must be a positive number.")

    if old_price is not None and old_price <= price:
        raise HTTPException(status_code=422, detail="Old price must be greater than the current price.")

    if quantity is None or quantity < 0:
        raise HTTPException(status_code=422, detail="Quantity must be zero or a positive integer.")

    if short_description is not None:
        short_description = _sanitize_text(short_description)
        if len(short_description) > 255:
            raise HTTPException(status_code=422, detail="Short description must be at most 255 characters.")

    if detailed_description is not None:
        detailed_description = _sanitize_text(detailed_description)

    del_ids: list[int] = []
    if deleted_image_ids:
        try:
            del_ids = json.loads(deleted_image_ids)
        except json.JSONDecodeError:
            del_ids = []

    new_descs: list[str] = []
    if new_image_descriptions:
        try:
            new_descs = json.loads(new_image_descriptions)
        except json.JSONDecodeError:
            new_descs = []

    new_image_files = images or []

    image_data_list: list[tuple[bytes, str, str]] = []
    for img in new_image_files:
        if img.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=422,
                detail=f"Image '{img.filename}' has unsupported type '{img.content_type}'. Allowed: JPEG, PNG, WebP.",
            )
        data = await img.read()
        if len(data) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=422,
                detail=f"Image '{img.filename}' exceeds 5 MB limit.",
            )
        ext = img.filename.rsplit(".", 1)[-1].lower() if "." in img.filename else "jpg"
        if ext not in ("jpg", "jpeg", "png", "webp"):
            ext = "jpg"
        image_data_list.append((data, ext, img.content_type))

    conn = get_db_connection()
    cursor = conn.cursor()
    uploaded_blobs: list[str] = []
    moved_blobs: list[tuple[str, str]] = []

    try:
        cursor.execute("SELECT ProductId FROM Products WHERE ProductId = ?", (product_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Product not found")

        cursor.execute("SELECT CategoryName FROM ProductCategories WHERE CategoryId = ?", (category_id,))
        cat_row = cursor.fetchone()
        if not cat_row:
            raise HTTPException(status_code=422, detail="Selected category does not exist.")
        category_slug = CATEGORY_SLUG.get(cat_row[0], _safe_filename(cat_row[0]))

        if promotion_id is not None:
            cursor.execute("SELECT 1 FROM Promotions WHERE PromotionId = ?", (promotion_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=422, detail="Selected promotion does not exist.")

        cursor.execute("SELECT ImageName FROM ProductImages WHERE ProductId = ?", (product_id,))
        all_existing_names = [r[0] for r in cursor.fetchall()]
        max_seq = _extract_max_sequence(all_existing_names)

        remaining_count = len(all_existing_names) - len(del_ids)
        total_after = remaining_count + len(image_data_list)
        if total_after == 0:
            raise HTTPException(status_code=422, detail="Product must have at least one image.")
        if total_after > MAX_IMAGES:
            raise HTTPException(status_code=422, detail=f"Maximum {MAX_IMAGES} images allowed per product.")

        cursor.execute(
            """
            UPDATE Products
            SET ProductName = ?, Price = ?, OldPrice = ?, ShortDescription = ?,
                DetailedDescription = ?, Quantity = ?, UpdatedDate = ?,
                CategoryId = ?, PromotionId = ?
            WHERE ProductId = ?
            """,
            (
                product_name, price, old_price, short_description,
                detailed_description, quantity, date.today().isoformat(),
                category_id, promotion_id, product_id,
            ),
        )

        blobs_to_move: list[str] = []
        for image_id in del_ids:
            cursor.execute(
                "SELECT ImageName FROM ProductImages WHERE ImageId = ? AND ProductId = ?",
                (image_id, product_id),
            )
            row = cursor.fetchone()
            if row:
                blobs_to_move.append(row[0])
                cursor.execute("DELETE FROM ProductImages WHERE ImageId = ?", (image_id,))

        safe_name = _safe_filename(product_name)

        for i, (data, ext, content_type) in enumerate(image_data_list):
            seq = max_seq + 1 + i
            blob_name = f"{safe_name}_{category_slug}_{seq}.{ext}"
            upload_image(blob_name, data, content_type)
            uploaded_blobs.append(blob_name)

            img_desc = new_descs[i] if i < len(new_descs) and new_descs[i] else f"{product_name} - image {seq}"
            if img_desc:
                img_desc = _sanitize_text(img_desc)

            cursor.execute(
                "INSERT INTO ProductImages (ImageName, ImageDescription, ProductId) VALUES (?, ?, ?)",
                (blob_name, img_desc, product_id),
            )

        conn.commit()

        for blob_name in blobs_to_move:
            try:
                move_blob_to_bin(blob_name)
            except Exception:
                pass

        return ProductUpdateResponse(ProductId=product_id, message="Product updated successfully.")

    except HTTPException:
        conn.rollback()
        for blob_name in uploaded_blobs:
            try:
                delete_blob(blob_name)
            except Exception:
                pass
        raise
    except Exception as e:
        conn.rollback()
        for blob_name in uploaded_blobs:
            try:
                delete_blob(blob_name)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.delete("/api/admin/products/{product_id}")
def delete_admin_product(product_id: int, admin=Depends(require_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        cursor.execute("SELECT ProductId FROM Products WHERE ProductId = ?", (product_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Product not found")

        cursor.execute("SELECT ImageName FROM ProductImages WHERE ProductId = ?", (product_id,))
        blob_names = [r[0] for r in cursor.fetchall()]

        cursor.execute("DELETE FROM OrderDetails WHERE ProductId = ?", (product_id,))
        cursor.execute("DELETE FROM ProductImages WHERE ProductId = ?", (product_id,))
        cursor.execute("DELETE FROM Products WHERE ProductId = ?", (product_id,))

        conn.commit()

        for blob_name in blob_names:
            try:
                move_blob_to_bin(blob_name)
            except Exception:
                pass

        return {"message": "Product deleted successfully"}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
