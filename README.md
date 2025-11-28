# Anvi Tiles & Decorhub - CRM System

A comprehensive Customer Relationship Management system built for Anvi Tiles and Decorhub, specializing in tiles, sanitary products, WPC doors, and accessories.

## Features

### 🔹 Product Management
- Add, update, and delete products
- Store purchase price, selling price, stock quantity, and category
- Maintain full inventory history (every update logged)
- Low-stock alerts

### 🔹 Billing & Sales
- Generate bills/invoices with auto calculation (tax, discount, total)
- Download bills in PDF format
- Save all bills in database for future reference
- Search bills by customer name, product, date, or invoice number

### 🔹 WhatsApp Integration
- Share bills directly with customers on WhatsApp
- Send promotional messages to customers
- Two-way sharing capabilities

### 🔹 Customer Management
- Store customer details (name, phone, address, past purchases)
- View customer's purchase history
- Search customers by phone number or name

### 🔹 Reporting & Analytics
- Daily, weekly, and monthly sales reports
- Profit/loss calculations based on purchase vs. selling price
- Inventory movement reports
- Dashboard with quick insights

### 🔹 User & Access Control
- Secure login for admin and staff
- Role-based access (admin full rights, staff limited rights)

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Puppeteer** for PDF generation
- **WhatsApp Web** for free message sharing
- **bcryptjs** for password hashing

### Frontend
- **React** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching
- **Axios** for API calls
- **React Hook Form** for form handling

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)


### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file and configure:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/anvi_crm
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Frontend URL for sharing
FRONTEND_URL=http://localhost:3000
```

4. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

### Database Setup

1. Make sure MongoDB is running
2. The application will automatically create the database and collections
3. Create an admin user by registering through the frontend

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/low-stock` - Get low stock products

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `GET /api/customers/:id/purchases` - Get customer purchase history

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/:id` - Get invoice by ID
- `GET /api/invoices/:id/pdf` - Generate PDF
- `GET /api/invoices/:id/whatsapp-link` - Get WhatsApp share link

### Reports
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/profit` - Profit reports
- `GET /api/reports/top-products` - Top selling products
- `GET /api/reports/dashboard` - Dashboard statistics

## Usage

1. **Login/Register**: Create an admin account or login with existing credentials
2. **Add Products**: Navigate to Products section and add your inventory
3. **Add Customers**: Register customers with their contact details
4. **Create Invoices**: Generate bills for sales transactions
5. **View Reports**: Monitor sales performance and inventory
6. **WhatsApp Integration**: Share invoices directly with customers

## WhatsApp Integration

The system uses free WhatsApp Web links:
- Click "Share via WhatsApp" on any invoice
- Opens WhatsApp Web with pre-filled message
- No paid API required

## Deployment

### Backend (AWS EC2)
1. Launch an EC2 instance
2. Install Node.js and MongoDB
3. Clone the repository
4. Install dependencies and configure environment
5. Use PM2 for process management

### Frontend (AWS S3 + CloudFront)
1. Build the React app: `npm run build`
2. Upload to S3 bucket
3. Configure CloudFront for distribution

### Database (MongoDB Atlas)
1. Create a MongoDB Atlas cluster
2. Update the connection string in `.env`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is proprietary software for Anvi Tiles & Decorhub.

## Support

For support and queries, contact the development team.