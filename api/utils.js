function requireUser(req, res, next) {
  if (!req.user) {
    next({
      success: false,
      name: 'MissingUserError',
      message: 'You must be logged in to perform this action',
    });
  }

  next();
}

function requireActiveUser(req, res, next) {
  if (!req.user.active) {
    next({
      success: false,
      name: 'DeactivatedUser',
      message:
        'Your account is deactivated, please reactivate before completing this action',
    });
  }
  next();
}

module.exports = { requireUser, requireActiveUser };
