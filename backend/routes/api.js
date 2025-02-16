const express = require('express');
const router = express.Router();

router.use(require('./content_api'));
router.use(require('./file_tree_api'));
router.use(require('./login_api'));
router.use(require('./testing_api'));

module.exports = router;
