const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/users");

const SALT_ROUNDS = 10;

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );
};

// dki
const register = async ({ email, password, full_name }) => {
  const existingUser = await User.findOne({ email }); //check mail co chua
  if (existingUser) {
    const error = new Error("Email đã tồn tại");
    error.status = 409;
    error.code = "ERR_EMAIL_EXISTS";
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    email,
    password: hashedPassword,
    full_name,
    auth_provider: "local",
  });

  return {
    _id: user._id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    auth_provider: user.auth_provider,
    loyalty_points: user.loyalty_points,
    loyalty_tier: user.loyalty_tier,
    skill_rank: user.skill_rank,
    elo_score: user.elo_score,
    created_at: user.createdAt,
  };
};

// login
const login = async ({ email, password }) => {
  //check email
  const user = await User.findOne({ email });

  if (!user || user.is_deleted) {
    const error = new Error("Email hoặc mật khẩu không đúng");
    error.status = 401;
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  //check provider
  if (user.auth_provider !== "local") {
    const error = new Error("Tài khoản không sử dụng đăng nhập local");
    error.status = 400;
    error.code = "INVALID_PROVIDER";
    throw error;
  }

  // ktra mk
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const error = new Error("Email hoặc mật khẩu không đúng");
    error.status = 401;
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  //gen token
  const token = generateToken(user);

  return {
    access_token: token,
    user: {
      _id: user._id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      branch_id: user.branch_id,
    },
  };
};

module.exports = {
  register,
  login,
};
