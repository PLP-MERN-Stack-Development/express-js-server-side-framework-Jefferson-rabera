// server.js - Starter Express server for Week 2 assignment

// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { error } = require('console');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json());

// Sample in-memory products database
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 1200,
    category: 'electronics',
    inStock: true
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800,
    category: 'electronics',
    inStock: true
  },
  {
    id: '3',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer',
    price: 50,
    category: 'kitchen',
    inStock: false
  }
];

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Product API! Go to /api/products to see all products.');
});

// TODO: Implement the following routes:
// implementing the "Hello world" at the root 
app.get(`/`, (req, res) => {
  res.send("Hello World!")
})

// router for endpoints
const apiRouter = express.Router();
app.use(`/api`, apiRouter);


//authentication middleware to all /products routes
apiRouter.use(`/products`, authMiddleware);

//impemplementing filtering by category and pagination
apiRouter.get(`/products`, (req, res) => {
  let results = [...products];

  //filtering by category
  if (req.query.category){
    results = results.filter(p => p.category.toLowerCase() === req.query.category.toLocaleLowerCase());
  }

  //pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedResults = results.slice(startIndex, endIndex);
  res.json({
    total: results.length,
    page,
    limit,
    data: paginatedResults
  });
   
});


// GET /api/products - Get all products
apiRouter.get(`/products/search`, (req, res) => {
  const query = (req.query.q || ``).toString().toLowerCase();
  if (!query){
    return res.status(400).json({error: `Query parameter 'q' is required.`});
  }
  const results = products.filter(p => 
    p.name.toLowerCase().includes(query) ||
    p.description.toLowerCase().includes(query)
  );
  res.json(results);
});


// GET /api/products/:id - Get a specific product
apiRouter.get(`/products/:id`, (req, res, next) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return next(new NotFoundError(`Product with ID ${req.params.id} not found.`));
  }
  res.json(product);
});

// POST /api/products - Create a new product
apiRouter.post(`/products`, (req, res) => {
  const newProduct = {
    id: uuidv4(),
    ...req.body
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT /api/products/:id - Update a product
apiRouter.put(`/products/:id`, (req, res, next) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return next(new NotFoundError(`Product with ID ${req.params.id} not found.`));
  }
  Object.assign(product, req.body);
  res.json(product);
});

// DELETE /api/products/:id - Delete a product
apiRouter.delete(`/products/:id`, (req, res, next) => {
  const productIndex = products.findIndex(p => p.id === req.params.id);
  if (productIndex === -1) {
    return next(new NotFoundError(`Product with ID ${req.params.id} not found.`));
  }
  products.splice(productIndex, 1);
  res.status(204).send();
});

// Example route implementation for GET /api/products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// TODO: Implement custom middleware for:
// - Request logging

const loggger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  //passing control to the next middleware
  next();
};
app.use(loggger);


// - Authentication
const authMiddleware = (req, res, next) => {
  const apiKey = req.headers[`x-api-key`];
  if (apiKey && apiKey === `my-secret-api-key`){
    next();
  }
  else{
    res.status(401).json({error: `Unauthorized. API key is missing or invalid.`});
  }
};
// - Error handling
class NotFoundError extends Error{
  constructor (message){
    super(message);
    this.name = `NotFoundError`;
    this.statusCode = 404;
  }
}

class ValidationError extends Error{
  constructor(message){
    super(message);
    this.name = `ValidationError`;
    this.statusCode = 400; 
  }
}
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing purposes
module.exports = app; 