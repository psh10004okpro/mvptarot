import { User } from '../models';
import { IRegisterDTO, ILoginDTO } from '../types';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/response';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants';

export const registerUser = async (data: IRegisterDTO) => {
  // Check if user already exists
  const existingUser = await User.findByEmail(data.email);

  if (existingUser) {
    throw new AppError(ERROR_MESSAGES.USER_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
  }

  // Create new user
  const user = await User.create({
    email: data.email,
    password: data.password,
    name: data.name,
    nickname: data.nickname,
    birthDate: data.birthDate ? new Date(data.birthDate) : undefined
  });

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    membershipType: user.membershipType
  });

  const refreshToken = generateRefreshToken({
    userId: user._id.toString(),
    email: user.email
  });

  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      membershipType: user.membershipType
    },
    accessToken,
    refreshToken
  };
};

export const loginUser = async (data: ILoginDTO) => {
  // Find user by email (include password field)
  const user = await User.findOne({ email: data.email }).select('+password');

  if (!user) {
    throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(data.password);

  if (!isPasswordValid) {
    throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    membershipType: user.membershipType
  });

  const refreshToken = generateRefreshToken({
    userId: user._id.toString(),
    email: user.email
  });

  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      membershipType: user.membershipType,
      dailyReadingCount: user.dailyReadingCount
    },
    accessToken,
    refreshToken
  };
};

export const getUserProfile = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return {
    id: user._id,
    email: user.email,
    name: user.name,
    nickname: user.nickname,
    birthDate: user.birthDate,
    membershipType: user.membershipType,
    dailyReadingCount: user.dailyReadingCount,
    lastReadingReset: user.lastReadingReset,
    preferences: user.preferences,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  };
};

export const refreshAccessToken = async (refreshToken: string) => {
  const { verifyRefreshToken } = await import('../utils/jwt');

  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AppError(ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
    }

    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      membershipType: user.membershipType
    });

    return { accessToken: newAccessToken };
  } catch (error) {
    throw new AppError(ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
  }
};
