from pydantic import BaseModel
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
