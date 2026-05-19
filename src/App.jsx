import { Outlet, createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import AddProductPage from './pages/AddProductPage'
import UpdateProductPage from './pages/UpdateProductPage'
import ManageProducts from './components/ManageProducts'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage'
import AdminPromotionsPage from './pages/admin/AdminPromotionsPage'
import AdminPromotionFormPage from './pages/admin/AdminPromotionFormPage'
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage'
import AdminCustomersPage from './pages/admin/AdminCustomersPage'
import AdminCustomerDetailPage from './pages/admin/AdminCustomerDetailPage'
import AdminFeedbackPage from './pages/admin/AdminFeedbackPage'

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
          { index: true, element: <AdminDashboardPage /> },
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
