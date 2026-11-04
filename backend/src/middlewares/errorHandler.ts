import { ErrorRequestHandler, Response } from "express";
import { HTTPSTATUS } from "../config/http-config";
import { AppError } from "../utils/appError";
import { z, ZodError } from "zod";
import { ErrorCodeEnum } from "../enums/errorCode";
import { MulterError } from "multer";

const formatZodError = (res: Response, error: z.ZodError) => {

    const errors = error?.issues?.map((err)=>({

        field:err.path.join("."),
        message: err.message,
    }));

    return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Validation failed",
        errors: errors,
        errorCode: ErrorCodeEnum.VALIDATION_ERROR,
    })
};

export const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next
): any => {
  console.error(`Error occured on PATH: ${req.path}`, error);

  if (error instanceof SyntaxError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Invalid json format",
    });
  }

  if (error instanceof ZodError) {
    return formatZodError(res, error);
  }

  if (error instanceof MulterError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "File is too large. The limit is 5 MB."
          : error.message,
      errorCode: ErrorCodeEnum.VALIDATION_ERROR,
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      errorCode: error.errorCode,
    });
  }

  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    message: "Internal Server Error",
    error: error?.message || "Unknown error occured",
  });
};

