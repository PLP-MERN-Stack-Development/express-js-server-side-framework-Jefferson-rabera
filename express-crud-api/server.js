// server.js - Corrected and Refactored

// SECTION 1: IMPORTS AND INITIAL SETUP

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory "database"
let products = [
    { id: '1', name: 'Laptop', description: 'High-performance laptop with 16GB RAM', price: 1200, category: 'electronics', inStock: true },
    { id: '2', name: 'Smartphone', description: 'Latest model with 128GB storage', price: 800, category: 'electronics', inStock: true },
    { id: '3', name: 'Coffee Maker', description: 'Programmable coffee maker with timer', price: 50, category: 'kitchen', inStock: false }
];

//CUSTOM ERROR CLASSES

class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
    }
}

// SECTION 3: MIDDLEWARE DEFINITIONS & SETUP

// Use Express's built-in JSON parser (replaces body-parser)
app.use(express.json());

// Request logging middleware (must be defined and used early)
const logger = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next(); // Pass control to the next middleware
};
app.use(logger);

// Authentication middleware (must be defined before it's used in routes)
const authMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === 'my-secret-api-key') {
        next(); // API key is valid, proceed
    } else {
        res.status(401).json({ error: 'Unauthorized. API key is missing or invalid.' });
    }
};

// SECTION 4: ROUTE DEFINITIONS

// Root route (only one is needed)
app.get('/', (req, res) => {
    res.send("Hello World! Welcome to the Product API.");
});

// Create a router for all API endpoints
const apiRouter = express.Router();
app.use('/api', apiRouter);

// Apply authentication middleware to all /products routes
apiRouter.use('/products', authMiddleware);

// GET /api/products - List all products with filtering and pagination
apiRouter.get('/products', (req, res) => {
    let results = [...products];

    // Filtering by category
    if (req.query.category) {
        results = results.filter(p => p.category.toLowerCase() === req.query.category.toLowerCase());
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedResults = results.slice(startIndex, endIndex);

    res.json({
        totalItems: results.length,
        currentPage: page,
        itemsPerPage: limit,
        data: paginatedResults
    });
});

// GET /api/products/search - Search products 
apiRouter.get('/products/search', (req, res) => {
    const query = (req.query.q || '').toString().toLowerCase();
    if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required." });
    }
    const results = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
    res.json(results);
});

// GET /api/products/:id - Get a specific product by ID
apiRouter.get('/products/:id', (req, res, next) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
        return next(new NotFoundError(`Product with ID ${req.params.id} not found.`));
    }
    res.json(product);
});

// POST /api/products - Create a new product
apiRouter.post('/products', (req, res) => {
    // Basic validation
    if (!req.body.name || !req.body.price) {
        return next(new ValidationError('Product name and price are required.'));
    }
    const newProduct = {
        id: uuidv4(),
        ...req.body
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// PUT /api/products/:id - Update an existing product
apiRouter.put('/products/:id', (req, res, next) => {
    const productIndex = products.findIndex(p => p.id === req.params.id);
    if (productIndex === -1) {
        return next(new NotFoundError(`Product with ID ${req.params.id} not found.`));
    }
    // Update the product, but keep its original ID
    products[productIndex] = { ...products[productIndex], ...req.body };
    res.json(products[productIndex]);
});

// DELETE /api/products/:id - Delete a product
apiRouter.delete('/products/:id', (req, res, next) => {
    const productIndex = products.findIndex(p => p.id === req.params.id);
    if (productIndex === -1) {
        return next(new NotFoundError(`Product with ID ${req.params.id} not found.`));
    }
    products.splice(productIndex, 1);
    res.status(204).send(); // No Content
});

// SECTION 5: GLOBAL ERROR HANDLING MIDDLEWARE

// This middleware catches all errors passed by next()
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error for debugging

    // Use the status code from the custom error or default to 500
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: {
            message: message,
            type: err.name || 'Error'
        }
    });
});


// SECTION 6: SERVER INITIALIZATION

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing purposes
module.exports = app;