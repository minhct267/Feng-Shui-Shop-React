from pydantic import BaseModel, Field
from typing import Optional


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
    PromotionName: Optional[str] = None
    Images: list[ProductImage] = []
