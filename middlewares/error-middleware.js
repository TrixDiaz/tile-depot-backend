const errorMiddleware = (err, req, res, next) => {
  try {
    let error = {...err};

    error.message = err.message;

    console.error(err);

    // PostgreSQL duplicate key error (unique constraint violation)
    if (err.code === "23505") {
      const message = "Email already exists";
      error = new Error(message);
      error.statusCode = 409;
    }

    // PostgreSQL not null constraint violation
    if (err.code === "23502") {
      const message = "Missing required fields";
      error = new Error(message);
      error.statusCode = 400;
    }

    // PostgreSQL foreign key constraint violation
    if (err.code === "23503") {
      const message = "Referenced record not found";
      error = new Error(message);
      error.statusCode = 400;
    }

    // PostgreSQL check constraint violation
    if (err.code === "23514") {
      const message = "Invalid data provided";
      error = new Error(message);
      error.statusCode = 400;
    }

    // PostgreSQL connection errors
    if (err.code === "ECONNREFUSED") {
      const message = "Database connection failed";
      error = new Error(message);
      error.statusCode = 503;
    }

    // PostgreSQL syntax errors
    if (err.code === "42601") {
      const message = "Database query error";
      error = new Error(message);
      error.statusCode = 500;
    }

    // Multer file upload errors
    if (err.code === "LIMIT_FILE_SIZE") {
      const message = "File too large. Maximum size is 10MB per file.";
      error = new Error(message);
      error.statusCode = 400;
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      const message =
        "Too many files. Maximum 11 files allowed (1 thumbnail + 10 images).";
      error = new Error(message);
      error.statusCode = 400;
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      const message =
        "Unexpected file field. Only 'thumbnail' and 'images' fields are allowed.";
      error = new Error(message);
      error.statusCode = 400;
    }

    // Handle custom errors with statusCode
    if (err.statusCode) {
      error.statusCode = err.statusCode;
    }

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  } catch (error) {
    next(error);
  }
};

export default errorMiddleware;
