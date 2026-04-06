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
