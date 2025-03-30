//routes/api.js

const express = require('express');
const router = express.Router();

router.use(require('./content_api'));
router.use(require('./file_tree_api'));
router.use(require('./login_api'));
router.use(require('./password_api'));
router.use(require('./registration_api'));
router.use(require('./temporary_content_api'));

module.exports = router;
