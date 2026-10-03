import createHttpError from 'http-errors';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';
import { User } from '../models/user.js';

export const updateUserAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createHttpError(400, 'No file'));
    }

    const cloudinaryResult = await saveFileToCloudinary(
      req.file.buffer,
      req.user._id
    );

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: cloudinaryResult.secure_url },
      { new: true }
    );

    res.status(200).json({
      url: user.avatar,
    });
  } catch (error) {
    next(error);
  }
};