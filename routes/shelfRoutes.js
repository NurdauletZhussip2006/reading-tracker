const express = require('express');
const router = express.Router();
const shelfController = require('../controllers/shelfController');

router.post('/', shelfController.createShelf);
router.get('/', shelfController.getShelves);
router.get('/:id', shelfController.getShelfById);
router.put('/:id', shelfController.updateShelf);
router.delete('/:id', shelfController.deleteShelf);

module.exports = router;