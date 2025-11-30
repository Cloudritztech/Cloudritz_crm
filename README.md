# Anvi Tiles & Decorhub - CRM System

A comprehensive Customer Relationship Management system built for Anvi Tiles and Decorhub, specializing in tiles, sanitary products, WPC doors, and accessories.

## 🚀 Features

### 📊 Comprehensive Dashboard
- **Real-time Analytics**: Today's, weekly, and monthly sales
- **Customer Insights**: Total customers and purchase history
- **Inventory Management**: Total products, low stock alerts, inventory value
- **Sales Tracking**: Total tiles sold, pending payments, top selling items
- **Recent Activity**: Last 10 invoices with status tracking
- **Quick Actions**: Direct access to create invoices, manage products/customers
- **Auto-refresh**: Dashboard updates every 5 minutes and after invoice creation

### 🔹 Product Management
- Add, update, and delete products
- Store purchase price, selling price, stock quantity, and category
- Maintain full inventory history (every update logged)
- Low-stock alerts with detailed item information
- Support for tiles, sanitary, WPC doors, and accessories categories

### 🔹 Billing & Sales
- Generate GST-compliant invoices with auto calculation (CGST/SGST, discount, total)
- Download bills in PDF format
- Save all bills in database for future reference
- Search bills by customer name, product, date, or invoice number
- Support for multiple payment methods (cash, card, UPI, cheque)
- Pending payment tracking

### 🔹 WhatsApp Integration
- Share bills directly with customers on WhatsApp
- Send promotional messages to customers
- Two-way sharing capabilities

### 🔹 Customer Management
- Store customer details (name, phone, address, past purchases)
- View customer's purchase history
- Search customers by phone number or name
- Quick customer addition during invoice creation

### 🔹 User & Access Control
- Secure login for admin and staff
- Role-based access (admin full rights, staff limited rights)
- JWT-based authentication

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js (localhost development)
- **Vercel Serverless Functions** (production deployment)
- **MongoDB Atlas** with Mongoose
- **JWT** for authentication
- **Puppeteer** for PDF generation
- **WhatsApp Web** for free message sharing
- **bcryptjs** for password hashing

### Frontend
- **React** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **React Hook Form** for form handling
- **Lucide React** for icons

## 📁 Project Structure

```
anvi/
├── api/                          # Vercel serverless functions
│   ├── auth.js                   # Authentication endpoints
│   ├── customers.js              # Customer management
│   ├── invoice.js                # Single invoice operations
│   ├── invoices/
│   │   └── index.js             # Invoice list and creation
│   ├── products.js              # Product management
│   └── reports.js               # Dashboard analytics
├── lib/                         # Shared utilities
│   ├── middleware/
│   │   └── auth.js              # JWT middleware
│   ├── models/                  # Mongoose schemas
│   │   ├── Customer.js
│   │   ├── Invoice.js
│   │   ├── Product.js
│   │   ├── User.js
│   │   └── InventoryHistory.js
│   ├── mongodb.js               # Database connection
│   ├── pdfGenerator.js          # PDF generation
│   └── numberToWords.js         # Number to words conversion
├── src/                         # React frontend
│   ├── components/
│   │   ├── forms/
│   │   ├── ui/
│   │   └── Layout.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx        # Comprehensive CRM dashboard
│   │   ├── Products.jsx
│   │   ├── Customers.jsx
│   │   ├── Invoices.jsx
│   │   ├── AddInvoice.jsx
│   │   └── ViewInvoice.jsx
│   ├── services/
│   │   └── api.js               # API service layer
│   └── context/
│       └── AuthContext.jsx
├── server.js                    # Express server (localhost)
├── vercel.json                  # Vercel deployment config
└── package.json
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Vercel account (for deployment)

### Environment Setup

Create `.env` file in root directory:
```env
VITE_API_URL=/api

# Backend Environment Variables
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/anvi_crm
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7000d
NODE_ENV=development
```

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
# Frontend only
npm run dev

# Backend + Frontend (full stack)
npm run dev:full
```

3. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

### Production Deployment (Vercel)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRE`
   - `NODE_ENV=production`

3. Deploy:
```bash
npm run build
vercel --prod
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth?action=login` - User login
- `POST /api/auth?action=register` - Register new user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `PUT /api/products?id={id}` - Update product
- `DELETE /api/products?id={id}` - Delete product
- `GET /api/products?lowStock=true` - Get low stock products

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `PUT /api/customers?id={id}` - Update customer
- `GET /api/customers?id={id}` - Get customer by ID

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoice?id={id}` - Get invoice by ID
- `GET /api/invoice?id={id}&action=pdf` - Generate PDF

### Reports & Analytics
- `GET /api/reports` - Get dashboard statistics
- `GET /api/reports?action=sales-analytics` - Get sales analytics

## 🎯 Key Features Implemented

### 1. Comprehensive Dashboard
- Integrated all reporting functionality into main dashboard
- Real-time sales tracking (daily, weekly, monthly)
- Customer and product analytics
- Low stock alerts with item details
- Recent invoice tracking
- Auto-refresh functionality

### 2. Vercel Optimization
- Consolidated API endpoints to stay within 12 function limit
- Removed problematic dynamic routes
- Optimized serverless function performance
- Proper CORS and environment variable handling

### 3. Enhanced Invoice Management
- GST-compliant invoice generation
- PDF download functionality
- WhatsApp sharing integration
- Comprehensive invoice search and filtering

### 4. Improved User Experience
- Responsive design for all screen sizes
- Real-time data updates
- Error handling and loading states
- Quick actions for common tasks

## 🔧 Troubleshooting

### Common Issues

1. **Invoice list not loading on Vercel**
   - Ensure all model imports are present in API functions
   - Check MongoDB connection string
   - Verify JWT token is being sent correctly

2. **Dashboard data not updating**
   - Check API endpoint responses in browser console
   - Verify MongoDB aggregation queries
   - Ensure proper error handling

3. **PDF generation failing**
   - Check Puppeteer configuration for serverless
   - Verify invoice data structure
   - Ensure proper error handling in PDF generation

### Environment Variables
Make sure all required environment variables are set in both local `.env` and Vercel dashboard.

## 📈 Performance Optimizations

- **API Consolidation**: Reduced from 13+ to 6 serverless functions
- **Database Queries**: Optimized aggregation pipelines
- **Frontend Caching**: Implemented proper data caching strategies
- **Auto-refresh**: Smart refresh intervals to keep data current

## 🔐 Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Secure password hashing
- CORS protection

## 📱 Mobile Responsiveness

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones
- Various screen sizes and orientations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is proprietary software for Anvi Tiles & Decorhub.

## 📞 Support

For support and queries, contact the development team.

---

**Built with ❤️ for Anvi Tiles & Decorhub**