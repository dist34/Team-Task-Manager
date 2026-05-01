const supabase = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', user.id)
      .single();

    if (userData) {
      req.user = userData;
    } else {
      
      req.user = {
        id: user.id,
        email: user.email,
        role: 'member'
      };
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = authMiddleware;