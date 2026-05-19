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


class DashboardTopProduct(BaseModel):
    ProductId: int
    ProductName: str
    ImageUrl: Optional[str] = None
    units_sold: int
    revenue: float


class DashboardRecentOrder(BaseModel):
    OrderId: int
    OrderDate: str
    CustomerFullName: str
    total: float
    PaymentStatus: bool


class DashboardRecentFeedback(BaseModel):
    FeedbackId: int
    FullName: str
    TopicName: str
    FeedbackDate: str
    Snippet: str


class AdminOrderListItem(BaseModel):
    OrderId: int
    OrderDate: str
    DeliveryDate: str
    CustomerId: int
    CustomerFullName: str
    PaymentMethodName: Optional[str] = None
    PaymentStatus: bool
    item_count: int
    total: float


class AdminOrderListResponse(BaseModel):
    items: list[AdminOrderListItem] = []
    total: int
    page: int
    page_size: int


class AdminOrderItem(BaseModel):
    ProductId: int
    ProductName: str
    CategoryName: Optional[str] = None
    ImageUrl: Optional[str] = None
    UnitPrice: float
    Quantity: int
    LineTotal: float


class AdminOrderCustomer(BaseModel):
    CustomerId: int
    FullName: str
    Gender: Optional[str] = None
    Email: Optional[str] = None
    Phone: Optional[str] = None
    Address: Optional[str] = None


class AdminOrderDetail(BaseModel):
    OrderId: int
    OrderDate: str
    DeliveryDate: str
    DeliveryAddress: str
    PaymentStatus: bool
    PaymentMethodId: int
    PaymentMethodName: Optional[str] = None
    customer: AdminOrderCustomer
    items: list[AdminOrderItem] = []
    item_count: int
    subtotal: float
    shipping_fee: float
    tax_amount: float
    total: float


class UpdatePaymentStatusRequest(BaseModel):
    paid: bool


class AdminPromotion(BaseModel):
    PromotionId: int
    PromotionName: str
    Details: str
    StartDate: str
    EndDate: str
    status: str  # 'upcoming' | 'active' | 'expired'
    linked_product_count: int


class PromotionPayload(BaseModel):
    PromotionName: str
    Details: str
    StartDate: str  # ISO yyyy-mm-dd
    EndDate: str    # ISO yyyy-mm-dd


class AdminCategory(BaseModel):
    CategoryId: int
    CategoryName: str
    Description: Optional[str] = None
    product_count: int


class CategoryDescriptionPayload(BaseModel):
    Description: Optional[str] = None


class AdminCustomerListItem(BaseModel):
    CustomerId: int
    AccountId: int
    Username: Optional[str] = None
    FullName: str
    Gender: Optional[str] = None
    Email: Optional[str] = None
    Phone: Optional[str] = None
    DateOfBirth: Optional[str] = None
    order_count: int
    total_spend: float


class AdminCustomerListResponse(BaseModel):
    items: list[AdminCustomerListItem] = []
    total: int
    page: int
    page_size: int


class AdminCustomerOrderSummary(BaseModel):
    OrderId: int
    OrderDate: str
    DeliveryDate: str
    PaymentStatus: bool
    item_count: int
    total: float


class AdminCustomerDetail(BaseModel):
    CustomerId: int
    AccountId: int
    Username: Optional[str] = None
    AvatarUrl: Optional[str] = None
    FullName: str
    Gender: Optional[str] = None
    Email: Optional[str] = None
    Phone: Optional[str] = None
    Address: Optional[str] = None
    DateOfBirth: Optional[str] = None
    order_count: int
    total_spend: float
    orders: list[AdminCustomerOrderSummary] = []


class AdminFeedbackTopic(BaseModel):
    TopicId: int
    TopicName: str


class AdminFeedbackItem(BaseModel):
    FeedbackId: int
    FullName: str
    Address: Optional[str] = None
    Phone: Optional[str] = None
    Email: Optional[str] = None
    ReferralSource: Optional[str] = None
    HasTransaction: bool
    Content: str
    FeedbackDate: str
    TopicId: int
    TopicName: str


class AdminFeedbackResponse(BaseModel):
    items: list[AdminFeedbackItem] = []
    total: int
    page: int
    page_size: int


class DashboardResponse(BaseModel):
    revenue_30d: float
    revenue_total: float
    orders_30d: int
    orders_total: int
    aov: float
    low_stock_count: int
    unpaid_orders_count: int
    top_products: list[DashboardTopProduct] = []
    recent_orders: list[DashboardRecentOrder] = []
    recent_feedback: list[DashboardRecentFeedback] = []
