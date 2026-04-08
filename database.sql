USE FengShuiStoneShop;
GO

CREATE TABLE FeedbackTopics (
    TopicId INT NOT NULL IDENTITY(1,1),
    TopicName NVARCHAR(MAX) NOT NULL,
    CONSTRAINT PK_FeedbackTopics PRIMARY KEY (TopicId)
);
GO

CREATE TABLE Accounts (
    AccountId INT NOT NULL IDENTITY(1,1),
    Username NVARCHAR(MAX) NOT NULL,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    AvatarUrl NVARCHAR(MAX) NULL,
    CONSTRAINT PK_Accounts PRIMARY KEY (AccountId)
);
GO

CREATE TABLE PaymentMethods (
    PaymentMethodId INT NOT NULL IDENTITY(1,1),
    MethodName NVARCHAR(MAX) NULL,
    CONSTRAINT PK_PaymentMethods PRIMARY KEY (PaymentMethodId)
);
GO

CREATE TABLE Promotions (
    PromotionId INT NOT NULL IDENTITY(1,1),
    PromotionName NVARCHAR(255) NOT NULL DEFAULT '',
    Details NVARCHAR(MAX) NOT NULL,
    StartDate DATETIME2 NOT NULL,
    EndDate DATETIME2 NOT NULL,
    CONSTRAINT PK_Promotions PRIMARY KEY (PromotionId)
);
GO

CREATE TABLE ProductCategories (
    CategoryId INT NOT NULL IDENTITY(1,1),
    CategoryName NVARCHAR(255) NOT NULL DEFAULT '',
    Description NVARCHAR(MAX) NULL,
    CONSTRAINT PK_ProductCategories PRIMARY KEY (CategoryId)
);
GO

CREATE TABLE Customers (
    CustomerId INT NOT NULL IDENTITY(1,1),
    FullName NVARCHAR(250) NOT NULL DEFAULT '',
    Gender NVARCHAR(20) NOT NULL,
    Address NVARCHAR(MAX) NOT NULL,
    Phone NVARCHAR(50) NOT NULL DEFAULT '',
    Email NVARCHAR(MAX) NULL,
    DateOfBirth DATE NULL,
    AccountId INT NOT NULL,
    CONSTRAINT PK_Customers PRIMARY KEY (CustomerId),
    CONSTRAINT FK_Customers_Accounts FOREIGN KEY (AccountId) REFERENCES Accounts (AccountId)
);
GO

CREATE TABLE Products (
    ProductId INT NOT NULL IDENTITY(1,1),
    ProductName NVARCHAR(100) NOT NULL,
    Price FLOAT NULL DEFAULT 0,
    OldPrice FLOAT NULL,
    ShortDescription NVARCHAR(255) NULL,
    DetailedDescription NVARCHAR(MAX) NULL,
    Quantity INT NOT NULL,
    UpdatedDate DATE NULL,
    CategoryId INT NOT NULL,
    PromotionId INT NULL,
    CONSTRAINT PK_Products PRIMARY KEY (ProductId),
    CONSTRAINT FK_Products_ProductCategories FOREIGN KEY (CategoryId) REFERENCES ProductCategories (CategoryId),
    CONSTRAINT FK_Products_Promotions FOREIGN KEY (PromotionId) REFERENCES Promotions (PromotionId)
);
GO

CREATE TABLE ProductImages (
    ImageId INT NOT NULL IDENTITY(1,1),
    ImageName NVARCHAR(MAX) NOT NULL,
    ImageDescription NVARCHAR(MAX) NULL,
    ProductId INT NOT NULL,
    CONSTRAINT PK_ProductImages PRIMARY KEY (ImageId),
    CONSTRAINT FK_ProductImages_Products FOREIGN KEY (ProductId) REFERENCES Products (ProductId)
);
GO

CREATE TABLE Orders (
    OrderId INT NOT NULL IDENTITY(1,1),
    OrderDate DATE NOT NULL,
    PaymentStatus BIT NOT NULL DEFAULT 0,
    DeliveryAddress NVARCHAR(255) NOT NULL DEFAULT '',
    DeliveryDate DATE NOT NULL,
    CustomerId INT NOT NULL,
    PaymentMethodId INT NOT NULL,
    CONSTRAINT PK_Orders PRIMARY KEY (OrderId),
    CONSTRAINT FK_Orders_Customers FOREIGN KEY (CustomerId) REFERENCES Customers (CustomerId),
    CONSTRAINT FK_Orders_PaymentMethods FOREIGN KEY (PaymentMethodId) REFERENCES PaymentMethods (PaymentMethodId)
);
GO

CREATE TABLE OrderDetails (
    ProductId INT NOT NULL,
    OrderId INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice FLOAT NOT NULL DEFAULT 0,
    CONSTRAINT FK_OrderDetails_Products FOREIGN KEY (ProductId) REFERENCES Products (ProductId),
    CONSTRAINT FK_OrderDetails_Orders FOREIGN KEY (OrderId) REFERENCES Orders (OrderId)
);
GO

CREATE TABLE Feedbacks (
    FeedbackId INT NOT NULL,
    FullName NVARCHAR(100) NOT NULL DEFAULT '',
    Address NVARCHAR(MAX) NOT NULL,
    Phone INT NULL,
    Email NVARCHAR(MAX) NULL,
    ReferralSource NVARCHAR(MAX) NULL,
    HasTransaction BIT NOT NULL DEFAULT 0,
    Content NVARCHAR(MAX) NOT NULL,
    FeedbackDate DATE NOT NULL,
    TopicId INT NOT NULL,
    CONSTRAINT PK_Feedbacks PRIMARY KEY (FeedbackId),
    CONSTRAINT FK_Feedbacks_FeedbackTopics FOREIGN KEY (TopicId) REFERENCES FeedbackTopics (TopicId)
);
GO
