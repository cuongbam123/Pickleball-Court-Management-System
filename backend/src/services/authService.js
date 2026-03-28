const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/users");
const RefreshToken = require('../models/token');
const crypto = require('crypto');
const SALT_ROUNDS = 10;

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  )
}

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
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const hashedToken = hashToken(refreshToken); // hash trước khi lưu
  await RefreshToken.create({
    user_id: user._id,
    token: hashedToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      _id: user._id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      branch_id: user.branch_id,
    },
  };
};

// refreshToken

const refreshToken = async (oldRefreshToken) => {
  if (!oldRefreshToken) {
    throw { status: 401, message: "Không tìm thấy Refresh Token" };
  }

  const hashedToken = hashToken(oldRefreshToken);
  const storedToken = await RefreshToken.findOneAndDelete({ token: hashedToken });

  if (!storedToken) {
    throw { status: 403, message: "Token không hợp lệ hoặc đã hết hạn" };
  }

  try {
    const decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) throw new Error();

    await storedToken.deleteOne();

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await RefreshToken.create({
      user_id: user._id,
      token: hashToken(newRefreshToken),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { access_token: newAccessToken, refresh_token: newRefreshToken };
  } catch (err) {
    throw { status: 403, message: "Phiên đăng nhập hết hạn" };
  }
};

//logout
const logout = async (refreshToken, userId) => {
  if (!refreshToken) {
    throw { status: 400, message: "Refresh Token là bắt buộc" };
  }

  const hashedToken = hashToken(refreshToken);
  
  const result = await RefreshToken.deleteOne({ 
    token: hashedToken,
    user_id: userId,
  });

  if (!result.deletedCount) {
    throw { status: 404, message: "Phiên đăng nhập không tồn tại hoặc đã hết hạn" };
  }

  return true;
};


module.exports = {
  register,
  login,
  refreshToken,
  logout,
};
