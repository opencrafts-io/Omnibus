export const paginate = (req, res, next) => {
  const page = req.query.page !== undefined ? parseInt(req.query.page) : 1;
  const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : 10;

  if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
    return res.status(400).json({ message: 'Page and limit must be positive integers.' });
  }

  const offset = (page - 1) * limit;

  // Attach pagination info to the request object
  req.pagination = {
    page,
    limit,
    offset,
    limitPlusOne: limit + 1,
  };

  next(); // pass control to the controller
};
