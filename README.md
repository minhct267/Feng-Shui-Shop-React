# The Crystal Shroom - a Feng Shui eCommerce Shop

## Introduction

At The Crystal Shroom, we believe that every stone holds a unique story and a distinct energy. Born from a deep passion for nature's hidden treasures, our shop offers a hand-selected range of authentic feng shui crystals designed to elevate your space and spirit. Whether you are seeking tranquility, prosperity, or simply a beautiful piece of the earth, The Crystal Shroom is here to guide you on your journey to inner harmony.

## Project Title

An eCommerce Website for a jewelry shop that allows:

- Client side: Look and add product(s) to the shopping cart; proceed to the payment page; track for the shipping status, etc.
- Admin side: Manage all the products in the Admin Portal, including Add/Update/Delete products, etc.

## Techstack

- **Frontend:** React 19, Vite 8; HTML, CSS, JavaScript (general design), and Tailwind CSS (advanced design).
- **Styling:** Custom CSS in `src/styles/` and `src/index.css` (layout, home, header/footer, admin forms, modals, etc.).
- **Routing:** React Router with `createBrowserRouter` — public home and login; nested admin routes under `/admin/products` (list, add, update by `productId`).
- **Backend:** Python, FastAPI.
- **Database:** Azure SQL Database (Data Warehouse) and Azure Blob Storage (Data Lake).
- **Deployment:** Backend ships with a **Dockerfile** (Python 3.12, ODBC Driver 18 for SQL Server, Uvicorn; port from `PORT`), deployed with **Render**. Frontend is deployed with **Vercel**.

## Design

### Architecture

```mermaid
flowchart TB
  subgraph deployment["Deployment"]
    direction TB
    Vercel[Vercel — static Vite build, frontend hosting]
    RenderStack[Render — Docker · Python 3.12 · Uvicorn · Microsoft ODBC Driver 18 for SQL Server]
  end

  subgraph frontend["Frontend — React UI"]
    direction TB
    UI[UI — React 19 + Vite 8]
    Styling[Styling — Tailwind CSS + custom CSS in src/styles and src/index.css]
    Routing[Routing — React Router createBrowserRouter — storefront, login, nested /admin/products CRUD]
    DataClient[Data access — src/services/api.js · fetch with credentials include]
    UI --> Styling
    UI --> Routing
    UI --> DataClient
  end

  subgraph backend["Backend — FastAPI"]
    API["FastAPI REST API · JWT in HTTP-only cookies · CORS and SameSite for split frontend and API"]
  end

  subgraph datalayer["Data layer — warehouse + lake pattern"]
    direction TB
    AzureSQL[(Azure SQL Database — structured transactional data, DW-style)]
    AzureBlob[(Azure Blob Storage — product images and time-limited SAS URLs, lake-style)]
  end

  Vercel --> frontend
  RenderStack --> backend
  DataClient -->|HTTPS REST| API
  API -->|pyodbc| AzureSQL
  API -->|Azure Blob SDK| AzureBlob
```

### Database

![A capture of Azure SQL Database design](demo/db_design.png)

## Features

- Responsive layout UI (not much).
- Paginated product grid on the Homepage with loading and error states.
- Admin authentication.
- Admin product list with **debounced search**, pagination, and detail view.
- **Create / update / delete** products with multi-image upload, validation, and confirmation modals; optional navigation guard when leaving with unsaved changes. A preview card shown in Add Product and Update Product pages.
- Categories and promotions loaded from the API; product cards show category labels.

## Project structure

```text
.
├── backend/
│   ├── .env
│   ├── blob_storage.py
│   ├── database.py
│   ├── Dockerfile
│   ├── main.py
│   ├── models.py
│   └── requirements.txt
├── src/
│   ├── assets/
│   ├── components/        # Reusable UI (layout, catalog, admin, modals)
│   ├── context/           # Auth and shared client state
│   ├── pages/             # Route-level pages (home, login, admin CRUD)
│   ├── services/          # API helpers (fetch, credentials)
│   ├── styles/            # CSS files
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── database.sql           # Schema design
├── eslint.config.js
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Challenges

Shipping a split frontend and API required careful **CORS** and **cookie** settings (`SameSite` / `Secure`) so authenticated admin requests work in production as well as on localhost. Storing **JWTs in HTTP-only cookies** improves security versus localStorage but needs consistent `credentials: "include"` and allowed origins. **Azure Blob** uploads and time-limited **SAS** URLs add complexity compared to local file storage while keeping images scalable. The **Docker** image installs the **Microsoft ODBC driver** on Debian so **pyodbc** can reach SQL Server reliably in containers. Large admin forms with live preview, duplicate-name checks, and multi-step confirmation demanded a clear UX flow without blocking the main CRUD APIs.

## Demo

**Website:** [The Crystal Shroom](https://feng-shui-shop-react.vercel.app/)
API may

Please be aware that the API might be down, preventing the website from loading data from the Data Warehouse.
