import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import Footer from './components/Footer'
import Header from './components/Header'
import ManageProducts from './components/ManageProducts'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import AddProductPage from './pages/AddProductPage'
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage'
import AdminCustomerDetailPage from './pages/admin/AdminCustomerDetailPage'
import AdminCustomersPage from './pages/admin/AdminCustomersPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminFeedbackPage from './pages/admin/AdminFeedbackPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminPromotionFormPage from './pages/admin/AdminPromotionFormPage'
import AdminPromotionsPage from './pages/admin/AdminPromotionsPage'
import CartPage from './pages/CartPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProductDetailPage from './pages/ProductDetailPage'
import RegisterPage from './pages/RegisterPage'
import UpdateProductPage from './pages/UpdateProductPage'

function Layout() {
  return (
    <AuthProvider>
      <CartProvider>
        <Header />
        <Outlet />
        <Footer />
      </CartProvider>
    </AuthProvider>
  )
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <main className="pt-20"><HomePage /></main> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/products/:productId', element: <main className="pt-20"><ProductDetailPage /></main> },
      { path: '/cart', element: <main className="pt-20"><CartPage /></main> },
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminCustomersPage /> },
          { path: 'dashboard', element: <AdminDashboardPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'orders/:orderId', element: <AdminOrderDetailPage /> },
          { path: 'products', element: <ManageProducts /> },
          { path: 'products/add', element: <AddProductPage /> },
          { path: 'products/update/:productId', element: <UpdateProductPage /> },
          { path: 'promotions', element: <AdminPromotionsPage /> },
          { path: 'promotions/new', element: <AdminPromotionFormPage /> },
          { path: 'promotions/:promotionId', element: <AdminPromotionFormPage /> },
          { path: 'categories', element: <AdminCategoriesPage /> },
          { path: 'customers', element: <AdminCustomersPage /> },
          { path: 'customers/:customerId', element: <AdminCustomerDetailPage /> },
          { path: 'feedback', element: <AdminFeedbackPage /> },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
