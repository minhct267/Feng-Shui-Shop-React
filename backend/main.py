import hmac
import html
import json
import os
import re
from datetime import date, datetime, timezone, timedelta

import bcrypt
import jwt
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from database import get_db_connection
from models import (
    ProductCard, Category, Promotion, ProductCreateResponse, ProductUpdateResponse,
    AdminProductListItem, AdminProductListResponse, ProductImage, AdminProductDetail,
    ProductListResponse, RegisterRequest, AuthUser,
    CustomerProductDetail, PaymentMethod, CartLineItem, CartResponse,
    AddToCartRequest, UpdateCartItemRequest, CheckoutRequest, OrderConfirmationResponse,
)
from blob_storage import blob_url_for_image, upload_image, delete_blob, move_blob_to_bin

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "fallback-dev-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24
COOKIE_NAME = "access_token"

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "!HAIdrone123")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT == "production"

COOKIE_SAMESITE = "none" if IS_PRODUCTION else "lax"
COOKIE_SECURE = IS_PRODUCTION

# Usernames that cannot be registered through the public flow.
# 'admin' is reserved for the env-based admin login.
RESERVED_USERNAMES = {"admin"}

ALLOWED_GENDERS = {"Female", "Male", "Unidentified"}

USERNAME_RE = re.compile(r"^[A-Za-z0-9._-]+$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

app = FastAPI(title="Feng Shui Shop API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    username: str
    password: str


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def _issue_auth_cookie(response: Response, username: str, role: str, account_id: int | None) -> None:
    payload = {
        "sub": username,
        "role": role,
        "account_id": account_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite=COOKIE_SAMESITE,
        secure=COOKIE_SECURE,
        path="/",
        max_age=JWT_EXPIRY_HOURS * 3600,
    )


def _lookup_customer(account_id: int) -> tuple[str | None, str | None, str | None, str | None]:
    """Return (full_name, email, phone, address) for the given AccountId."""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT FullName, Email, Phone, Address FROM Customers WHERE AccountId = ?",
                (account_id,),
            )
            row = cursor.fetchone()
            if not row:
                return None, None, None, None
            return row[0], row[1], row[2], row[3]
        finally:
            conn.close()
    except Exception:
        return None, None, None, None


@app.post("/api/login", response_model=AuthUser)
def login(body: LoginRequest, response: Response):
    username = (body.username or "").strip()
    password = body.password or ""

    if not username or not password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    username_ok = hmac.compare_digest(username, ADMIN_USERNAME)
    password_ok = hmac.compare_digest(password, ADMIN_PASSWORD)
    if username_ok and password_ok:
        _issue_auth_cookie(response, ADMIN_USERNAME, "admin", None)
        return AuthUser(username=ADMIN_USERNAME, role="admin")

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT a.AccountId, a.Username, a.PasswordHash,
                   c.FullName, c.Email, c.Phone, c.Address
            FROM Accounts a
            LEFT JOIN Customers c ON c.AccountId = a.AccountId
            WHERE LOWER(a.Username) = LOWER(?)
            """,
            (username,),
        )
        row = cursor.fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

    if not row or not verify_password(password, row[2]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    account_id = row[0]
    stored_username = row[1]
    full_name = row[3]
    email = row[4]
    phone = row[5]
    address = row[6]

    _issue_auth_cookie(response, stored_username, "customer", account_id)
    return AuthUser(
        username=stored_username,
        role="customer",
        account_id=account_id,
        full_name=full_name,
        email=email,
        phone=phone,
        address=address,
    )


@app.get("/api/me", response_model=AuthUser)
def get_current_user(request: Request):
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    username = payload.get("sub")
    role = payload.get("role")
    account_id = payload.get("account_id")

    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    if role == "customer" and account_id is not None:
        full_name, email, phone, address = _lookup_customer(account_id)

    return AuthUser(
        username=username,
        role=role,
        account_id=account_id,
        full_name=full_name,
        email=email,
        phone=phone,
        address=address,
    )


@app.post("/api/logout")
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/", httponly=True, samesite=COOKIE_SAMESITE, secure=COOKIE_SECURE)
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


def require_customer(request: Request):
    """Auth guard: only authenticated customers may proceed.

    Admins are blocked with 403 because admin should not own carts/orders."""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("role") != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")
    if payload.get("account_id") is None:
        raise HTTPException(status_code=401, detail="Invalid customer token")
    return payload


def _get_customer_id(cursor, account_id: int) -> int:
    """Resolve a CustomerId from the JWT's AccountId; raise 404 if missing."""
    cursor.execute("SELECT CustomerId FROM Customers WHERE AccountId = ?", (account_id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    return row[0]


def _get_or_create_cart(cursor, customer_id: int) -> int:
    """Return the customer's CartId, creating a new Cart row on first call."""
    cursor.execute("SELECT CartId FROM Carts WHERE CustomerId = ?", (customer_id,))
    row = cursor.fetchone()
    if row:
        return row[0]
    cursor.execute(
        """
        INSERT INTO Carts (CustomerId)
        OUTPUT INSERTED.CartId
        VALUES (?)
        """,
        (customer_id,),
    )
    return cursor.fetchone()[0]


def _touch_cart(cursor, cart_id: int) -> None:
    cursor.execute(
        "UPDATE Carts SET UpdatedDate = SYSUTCDATETIME() WHERE CartId = ?",
        (cart_id,),
    )


SHIPPING_FEE = 12.00
TAX_RATE = 0.08


def _money(value: float) -> float:
    return round(float(value or 0.0), 2)


def _build_cart_response(cursor, cart_id: int) -> CartResponse:
    """Load cart line items + totals for the given CartId."""
    cursor.execute(
        """
        SELECT ci.ProductId, p.ProductName, p.Price, p.OldPrice,
               p.Quantity AS StockAvailable, ci.Quantity,
               c.CategoryId, c.CategoryName, pi.ImageName
        FROM CartItems ci
        JOIN Products p ON p.ProductId = ci.ProductId
        JOIN ProductCategories c ON c.CategoryId = p.CategoryId
        OUTER APPLY (
            SELECT TOP 1 ImageName
            FROM ProductImages
            WHERE ProductId = ci.ProductId
            ORDER BY ImageId
        ) pi
        WHERE ci.CartId = ?
        ORDER BY ci.AddedDate
        """,
        (cart_id,),
    )
    rows = cursor.fetchall()

    items: list[CartLineItem] = []
    subtotal = 0.0
    item_count = 0
    has_stock_issue = False

    for row in rows:
        unit_price = float(row[2] or 0.0)
        qty = int(row[5])
        stock = int(row[4])
        line_total = _money(unit_price * qty)
        subtotal += line_total
        item_count += qty
        if qty > stock:
            has_stock_issue = True
        items.append(CartLineItem(
            ProductId=row[0],
            ProductName=row[1],
            UnitPrice=unit_price,
            OldPrice=float(row[3]) if row[3] is not None else None,
            StockAvailable=stock,
            Quantity=qty,
            CategoryId=row[6],
            CategoryName=row[7],
            ImageUrl=blob_url_for_image(row[8]),
            LineTotal=line_total,
        ))

    subtotal = _money(subtotal)
    shipping = _money(SHIPPING_FEE) if subtotal > 0 else 0.0
    tax = _money(subtotal * TAX_RATE)
    total = _money(subtotal + shipping + tax)

    return CartResponse(
        items=items,
        item_count=item_count,
        subtotal=subtotal,
        shipping_fee=shipping,
        tax_amount=tax,
        total=total,
        has_stock_issue=has_stock_issue,
    )


@app.post("/api/register", response_model=AuthUser)
def register(body: RegisterRequest, response: Response):
    username = (body.username or "").strip()
    password = body.password or ""
    full_name = (body.full_name or "").strip()
    email = (body.email or "").strip() or None
    phone = (body.phone or "").strip()
    gender = (body.gender or "").strip()
    address = (body.address or "").strip()

    if not (3 <= len(username) <= 50):
        raise HTTPException(status_code=422, detail="Username must be between 3 and 50 characters.")
    if not USERNAME_RE.match(username):
        raise HTTPException(status_code=422, detail="Username may only contain letters, numbers, '.', '_' or '-'.")
    if username.lower() in RESERVED_USERNAMES:
        raise HTTPException(status_code=400, detail="This username is reserved. Please choose another.")

    if len(password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters long.")
    if len(password) > 128:
        raise HTTPException(status_code=422, detail="Password must be at most 128 characters long.")

    if not full_name:
        raise HTTPException(status_code=422, detail="Full name is required.")
    if len(full_name) > 250:
        raise HTTPException(status_code=422, detail="Full name must be at most 250 characters.")
    full_name = _sanitize_text(full_name)

    if email is not None:
        if len(email) > 255 or not EMAIL_RE.match(email):
            raise HTTPException(status_code=422, detail="Email address is invalid.")

    if not phone:
        raise HTTPException(status_code=422, detail="Phone number is required.")
    if len(phone) > 50:
        raise HTTPException(status_code=422, detail="Phone number must be at most 50 characters.")
    phone = _sanitize_text(phone)

    if gender not in ALLOWED_GENDERS:
        raise HTTPException(status_code=422, detail="Gender must be Female, Male, or Unidentified.")

    if not address:
        raise HTTPException(status_code=422, detail="Address is required.")
    address = _sanitize_text(address)

    password_hash = hash_password(password)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT 1 FROM Accounts WHERE LOWER(Username) = LOWER(?)",
            (username,),
        )
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="Username already exists.")

        cursor.execute(
            """
            INSERT INTO Accounts (Username, PasswordHash)
            OUTPUT INSERTED.AccountId
            VALUES (?, ?)
            """,
            (username, password_hash),
        )
        account_id = cursor.fetchone()[0]

        cursor.execute(
            """
            INSERT INTO Customers (FullName, Gender, Address, Phone, Email, AccountId)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (full_name, gender, address, phone, email, account_id),
        )

        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

    _issue_auth_cookie(response, username, "customer", account_id)
    return AuthUser(
        username=username,
        role="customer",
        account_id=account_id,
        full_name=full_name,
        email=email,
        phone=phone,
        address=address,
    )


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


@app.get("/api/products/{product_id}", response_model=CustomerProductDetail)
def get_product_detail(product_id: int):
    """Public product detail used by the customer-facing /products/:id page."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.ProductId, p.ProductName, p.Price, p.OldPrice,
                   p.ShortDescription, p.DetailedDescription, p.Quantity,
                   CONVERT(VARCHAR(10), p.UpdatedDate, 120) AS UpdatedDate,
                   c.CategoryId, c.CategoryName,
                   pr.PromotionId, pr.PromotionName, pr.Details AS PromotionDetails,
                   CONVERT(VARCHAR(10), pr.StartDate, 120) AS PromotionStartDate,
                   CONVERT(VARCHAR(10), pr.EndDate,   120) AS PromotionEndDate
            FROM Products p
            JOIN ProductCategories c ON c.CategoryId = p.CategoryId
            LEFT JOIN Promotions pr ON pr.PromotionId = p.PromotionId
            WHERE p.ProductId = ?
        """, (product_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Product not found")

        cursor.execute("""
            SELECT ImageId, ImageName, ImageDescription
            FROM ProductImages
            WHERE ProductId = ?
            ORDER BY ImageId
        """, (product_id,))
        img_rows = cursor.fetchall()
        images = [
            ProductImage(
                ImageId=r[0],
                ImageName=r[1],
                ImageDescription=r[2],
                ImageUrl=blob_url_for_image(r[1]),
            )
            for r in img_rows
        ]

        promotion_active = False
        promo_start = row[13]
        promo_end = row[14]
        if row[10] is not None and promo_start and promo_end:
            today_iso = date.today().isoformat()
            promotion_active = promo_start <= today_iso <= promo_end

        return CustomerProductDetail(
            ProductId=row[0],
            ProductName=row[1],
            Price=row[2],
            OldPrice=row[3],
            ShortDescription=row[4],
            DetailedDescription=row[5],
            Quantity=int(row[6]),
            UpdatedDate=row[7],
            CategoryId=row[8],
            CategoryName=row[9],
            PromotionId=row[10],
            PromotionName=row[11],
            PromotionDetails=row[12],
            PromotionStartDate=promo_start,
            PromotionEndDate=promo_end,
            PromotionActive=promotion_active,
            Images=images,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/payment-methods", response_model=list[PaymentMethod])
def get_payment_methods():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT PaymentMethodId, MethodName FROM PaymentMethods ORDER BY PaymentMethodId"
        )
        return [PaymentMethod(PaymentMethodId=r[0], MethodName=r[1]) for r in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


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

        cursor.execute("DELETE FROM CartItems WHERE ProductId = ?", (product_id,))
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


# ==================================================================
# Customer cart endpoints (require_customer)
# ==================================================================


@app.get("/api/cart", response_model=CartResponse)
def get_cart(auth=Depends(require_customer)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        customer_id = _get_customer_id(cursor, auth["account_id"])
        cart_id = _get_or_create_cart(cursor, customer_id)
        conn.commit()
        return _build_cart_response(cursor, cart_id)
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/api/cart/items", response_model=CartResponse)
def add_cart_item(body: AddToCartRequest, auth=Depends(require_customer)):
    if body.quantity < 1:
        raise HTTPException(status_code=422, detail="Quantity must be at least 1.")

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        customer_id = _get_customer_id(cursor, auth["account_id"])
        cart_id = _get_or_create_cart(cursor, customer_id)

        cursor.execute(
            "SELECT Quantity FROM Products WHERE ProductId = ?",
            (body.product_id,),
        )
        prod_row = cursor.fetchone()
        if not prod_row:
            raise HTTPException(status_code=404, detail="Product not found.")
        stock = int(prod_row[0])

        cursor.execute(
            "SELECT CartItemId, Quantity FROM CartItems WHERE CartId = ? AND ProductId = ?",
            (cart_id, body.product_id),
        )
        existing = cursor.fetchone()
        existing_qty = int(existing[1]) if existing else 0
        new_qty = existing_qty + body.quantity

        if new_qty > stock:
            available = max(stock - existing_qty, 0)
            if available <= 0:
                raise HTTPException(
                    status_code=409,
                    detail=f"Only {stock} in stock; you already have {existing_qty} in your cart.",
                )
            raise HTTPException(
                status_code=409,
                detail=f"Only {stock} in stock. You can add up to {available} more.",
            )

        if existing:
            cursor.execute(
                "UPDATE CartItems SET Quantity = ? WHERE CartItemId = ?",
                (new_qty, existing[0]),
            )
        else:
            cursor.execute(
                """
                INSERT INTO CartItems (CartId, ProductId, Quantity)
                VALUES (?, ?, ?)
                """,
                (cart_id, body.product_id, body.quantity),
            )

        _touch_cart(cursor, cart_id)
        cart = _build_cart_response(cursor, cart_id)
        conn.commit()
        return cart
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.put("/api/cart/items/{product_id}", response_model=CartResponse)
def update_cart_item(product_id: int, body: UpdateCartItemRequest, auth=Depends(require_customer)):
    if body.quantity < 1:
        raise HTTPException(status_code=422, detail="Quantity must be at least 1.")

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        customer_id = _get_customer_id(cursor, auth["account_id"])
        cart_id = _get_or_create_cart(cursor, customer_id)

        cursor.execute(
            "SELECT Quantity FROM Products WHERE ProductId = ?",
            (product_id,),
        )
        prod_row = cursor.fetchone()
        if not prod_row:
            raise HTTPException(status_code=404, detail="Product not found.")
        stock = int(prod_row[0])
        if body.quantity > stock:
            raise HTTPException(
                status_code=409,
                detail=f"Only {stock} in stock for this item.",
            )

        cursor.execute(
            "SELECT CartItemId FROM CartItems WHERE CartId = ? AND ProductId = ?",
            (cart_id, product_id),
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="This item is not in your cart.")

        cursor.execute(
            "UPDATE CartItems SET Quantity = ? WHERE CartItemId = ?",
            (body.quantity, existing[0]),
        )
        _touch_cart(cursor, cart_id)
        cart = _build_cart_response(cursor, cart_id)
        conn.commit()
        return cart
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.delete("/api/cart/items/{product_id}", response_model=CartResponse)
def remove_cart_item(product_id: int, auth=Depends(require_customer)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        customer_id = _get_customer_id(cursor, auth["account_id"])
        cart_id = _get_or_create_cart(cursor, customer_id)

        cursor.execute(
            "DELETE FROM CartItems WHERE CartId = ? AND ProductId = ?",
            (cart_id, product_id),
        )
        _touch_cart(cursor, cart_id)
        cart = _build_cart_response(cursor, cart_id)
        conn.commit()
        return cart
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.delete("/api/cart", response_model=CartResponse)
def clear_cart(auth=Depends(require_customer)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        customer_id = _get_customer_id(cursor, auth["account_id"])
        cart_id = _get_or_create_cart(cursor, customer_id)
        cursor.execute("DELETE FROM CartItems WHERE CartId = ?", (cart_id,))
        _touch_cart(cursor, cart_id)
        cart = _build_cart_response(cursor, cart_id)
        conn.commit()
        return cart
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/api/checkout", response_model=OrderConfirmationResponse)
def checkout(body: CheckoutRequest, auth=Depends(require_customer)):
    """Atomic checkout: re-validate stock, create Order + OrderDetails,
    decrement Products.Quantity, clear CartItems."""

    delivery_address = _sanitize_text(body.delivery_address or "")
    if not delivery_address:
        raise HTTPException(status_code=422, detail="Delivery address is required.")
    if len(delivery_address) > 255:
        raise HTTPException(status_code=422, detail="Delivery address must be at most 255 characters.")

    try:
        delivery_date = datetime.strptime(body.delivery_date, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        raise HTTPException(status_code=422, detail="Delivery date must be in YYYY-MM-DD format.")

    today = date.today()
    if delivery_date < today:
        raise HTTPException(status_code=422, detail="Delivery date cannot be in the past.")

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE")

        customer_id = _get_customer_id(cursor, auth["account_id"])
        cart_id = _get_or_create_cart(cursor, customer_id)

        cursor.execute(
            "SELECT MethodName FROM PaymentMethods WHERE PaymentMethodId = ?",
            (body.payment_method_id,),
        )
        pm_row = cursor.fetchone()
        if not pm_row:
            raise HTTPException(status_code=422, detail="Selected payment method does not exist.")
        payment_method_name = pm_row[0] or "Payment"

        cursor.execute(
            """
            SELECT ci.ProductId, ci.Quantity, p.Quantity AS Stock, p.Price, p.ProductName
            FROM CartItems ci WITH (UPDLOCK, HOLDLOCK)
            JOIN Products  p WITH (UPDLOCK, HOLDLOCK) ON p.ProductId = ci.ProductId
            WHERE ci.CartId = ?
            """,
            (cart_id,),
        )
        rows = cursor.fetchall()
        if not rows:
            raise HTTPException(status_code=400, detail="Your cart is empty.")

        out_of_stock: list[str] = []
        for r in rows:
            qty = int(r[1])
            stock = int(r[2])
            if qty > stock:
                out_of_stock.append(f"{r[4]} (requested {qty}, only {stock} left)")
        if out_of_stock:
            raise HTTPException(
                status_code=409,
                detail="Some items are no longer in stock: " + "; ".join(out_of_stock),
            )

        subtotal = 0.0
        item_count = 0
        for r in rows:
            qty = int(r[1])
            price = float(r[3] or 0.0)
            subtotal += price * qty
            item_count += qty
        subtotal = _money(subtotal)
        shipping = _money(SHIPPING_FEE) if subtotal > 0 else 0.0
        tax = _money(subtotal * TAX_RATE)
        total = _money(subtotal + shipping + tax)

        cursor.execute(
            """
            INSERT INTO Orders
                (OrderDate, PaymentStatus, DeliveryAddress, DeliveryDate,
                 CustomerId, PaymentMethodId)
            OUTPUT INSERTED.OrderId
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                today.isoformat(),
                0,
                delivery_address,
                delivery_date.isoformat(),
                customer_id,
                body.payment_method_id,
            ),
        )
        order_id = cursor.fetchone()[0]

        for r in rows:
            product_id = int(r[0])
            qty = int(r[1])
            unit_price = float(r[3] or 0.0)

            cursor.execute(
                """
                INSERT INTO OrderDetails (ProductId, OrderId, Quantity, UnitPrice)
                VALUES (?, ?, ?, ?)
                """,
                (product_id, order_id, qty, unit_price),
            )
            cursor.execute(
                "UPDATE Products SET Quantity = Quantity - ? WHERE ProductId = ?",
                (qty, product_id),
            )

        cursor.execute("DELETE FROM CartItems WHERE CartId = ?", (cart_id,))
        _touch_cart(cursor, cart_id)
        conn.commit()

        return OrderConfirmationResponse(
            order_id=order_id,
            order_date=today.isoformat(),
            delivery_date=delivery_date.isoformat(),
            payment_method=payment_method_name,
            item_count=item_count,
            subtotal=subtotal,
            shipping_fee=shipping,
            tax_amount=tax,
            total=total,
            message="Order placed successfully.",
        )
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
