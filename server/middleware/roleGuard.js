/**
 * Role-based access control middleware
 * Usage: roleGuard('admin') or roleGuard('doctor', 'admin')
 */
const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — please log in',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied — requires ${allowedRoles.join(' or ')} role`,
      });
    }

    next();
  };
};

export default roleGuard;
