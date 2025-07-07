import { ApiResponse } from "../types/response";
import { Response } from "express";

export const sendSuccessResponse = <T = any>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
  };

  return res.status(statusCode).json(response);
};

export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  error?: string
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    ...(error && { error }),
  };

  return res.status(statusCode).json(response);
};

export const sendValidationError = (
  res: Response,
  message: string,
  error?: string
): Response => {
  return sendErrorResponse(res, 400, message, error);
};

export const sendNotFoundError = (res: Response, message: string): Response => {
  return sendErrorResponse(res, 404, message);
};

export const sendUnauthorizedError = (
  res: Response,
  message: string = "Unauthorized access"
): Response => {
  return sendErrorResponse(res, 401, message);
};

export const sendForbiddenError = (
  res: Response,
  message: string = "Forbidden access"
): Response => {
  return sendErrorResponse(res, 403, message);
};

export const sendInternalServerError = (
  res: Response,
  message: string = "Internal server error",
  error?: string
): Response => {
  return sendErrorResponse(res, 500, message, error);
};

export const handleAsyncError = (
  res: Response,
  error: unknown,
  customMessage?: string
): Response => {
  console.error("Async error:", error);

  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const message = customMessage || "Internal server error";

  return sendInternalServerError(res, message, errorMessage);
};

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}
