const express = require('express');
const router = express.Router();
const { addItem, getItems, updateItem, deleteItem, claimItem, unclaimItem, getWishlistSummary } = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');

// Host routes (protected)
router.post('/events/:id/wishlist', authenticate, addItem);

// Protected - host dashboard summary
router.get('/events/:id/wishlist/summary', authenticate, getWishlistSummary);

router.get('/events/:id/wishlist', getItems); // Public - guests need to see
router.put('/wishlist/:itemId', authenticate, updateItem);
router.delete('/wishlist/:itemId', authenticate, deleteItem);

// Guest routes (public - uses guest_token in body)
router.post('/wishlist/:itemId/claim', claimItem);
router.delete('/wishlist/:itemId/claim', unclaimItem);

module.exports = router;
