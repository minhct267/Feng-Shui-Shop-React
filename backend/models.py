from pydantic import BaseModel, Field
from typing import Optional


class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    email: Optional[str] = None
    phone: str
    gender: str
    address: str


class AuthUser(BaseModel):
    username: str
    role: str
    account_id: Optional[int] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class ProductCard(BaseModel):
    ProductId: int
    ProductName: str
    Price: Optional[float] = None
    OldPrice: Optional[float] = None
    ShortDescription: Optional[str] = None
    CategoryName: str
    ImageName: Optional[str] = None
    ImageUrl: Optional[str] = None


class ProductListResponse(BaseModel):
    items: list[ProductCard]
    total: int
    page: int
    page_size: int


class Category(BaseModel):
    CategoryId: int
    CategoryName: str
    Description: Optional[str] = None


class Promotion(BaseModel):
    PromotionId: int
    PromotionName: str
    Details: str
    StartDate: str
    EndDate: str


class ProductCreateResponse(BaseModel):
    ProductId: int
    message: str


class AdminProductListItem(BaseModel):
    ProductId: int
    ProductName: str
    Price: Optional[float] = None
    Quantity: int
    CategoryName: str
    ImageUrl: Optional[str] = None


class AdminProductListResponse(BaseModel):
    items: list[AdminProductListItem]
    total: int
    page: int
    page_size: int


class ProductImage(BaseModel):
    ImageId: int
    ImageName: str
    ImageDescription: Optional[str] = None
    ImageUrl: Optional[str] = None


class AdminProductDetail(BaseModel):
    ProductId: int
    ProductName: str
    Price: Optional[float] = None
    OldPrice: Optional[float] = None
    ShortDescription: Optional[str] = None
    DetailedDescription: Optional[str] = None
    Quantity: int
    UpdatedDate: Optional[str] = None
    CategoryName: str
    CategoryId: int
    PromotionId: Optional[int] = None
    PromotionName: Optional[str] = None
    Images: list[ProductImage] = []


class ProductUpdateResponse(BaseModel):
    ProductId: int
    message: str


class CustomerProductDetail(BaseModel):
    ProductId: int
    ProductName: str
    Price: Optional[float] = None
    OldPrice: Optional[float] = None
    ShortDescription: Optional[str] = None
    DetailedDescription: Optional[str] = None
    Quantity: int
    UpdatedDate: Optional[str] = None
    CategoryId: int
    CategoryName: str
    PromotionId: Optional[int] = None
    PromotionName: Optional[str] = None
    PromotionDetails: Optional[str] = None
    PromotionStartDate: Optional[str] = None
    PromotionEndDate: Optional[str] = None
    PromotionActive: bool = False
    Images: list[ProductImage] = []


class PaymentMethod(BaseModel):
    PaymentMethodId: int
    MethodName: Optional[str] = None


class CartLineItem(BaseModel):
    ProductId: int
    ProductName: str
    CategoryId: int
    CategoryName: str
    ImageUrl: Optional[str] = None
    UnitPrice: float
    OldPrice: Optional[float] = None
    Quantity: int
    StockAvailable: int
    LineTotal: float


class CartResponse(BaseModel):
    items: list[CartLineItem] = []
    item_count: int = 0
    subtotal: float = 0.0
    shipping_fee: float = 0.0
    tax_amount: float = 0.0
    total: float = 0.0
    has_stock_issue: bool = False


class AddToCartRequest(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)


class UpdateCartItemRequest(BaseModel):
    quantity: int = Field(..., gt=0)


class CheckoutRequest(BaseModel):
    delivery_address: str
    delivery_date: str  # ISO yyyy-mm-dd
    payment_method_id: int = Field(..., gt=0)


class OrderConfirmationResponse(BaseModel):
    order_id: int
    order_date: str
    delivery_date: str
    payment_method: str
    item_count: int
    subtotal: float
    shipping_fee: float
    tax_amount: float
    total: float
    message: str
