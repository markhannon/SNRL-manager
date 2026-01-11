/**
 * Validation utilities for content management
 * Enforces business rules for content title length and body size limits
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Content validation constants
export const VALIDATION_RULES = {
  SERIES_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
  CONTENT_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 500,
  },
  CONTENT_BODY: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100000, // 100k characters (~50k words)
  },
  SERIES_DESCRIPTION: {
    MAX_LENGTH: 5000,
  },
};

/**
 * Validate series title
 */
export function validateSeriesTitle(title: string): void {
  if (!title || title.trim().length === 0) {
    throw new ValidationError('Series title is required');
  }

  if (title.length < VALIDATION_RULES.SERIES_TITLE.MIN_LENGTH) {
    throw new ValidationError(`Series title must be at least ${VALIDATION_RULES.SERIES_TITLE.MIN_LENGTH} character`);
  }

  if (title.length > VALIDATION_RULES.SERIES_TITLE.MAX_LENGTH) {
    throw new ValidationError(`Series title cannot exceed ${VALIDATION_RULES.SERIES_TITLE.MAX_LENGTH} characters`);
  }
}

/**
 * Validate series description
 */
export function validateSeriesDescription(description: string | null | undefined): void {
  if (description && description.length > VALIDATION_RULES.SERIES_DESCRIPTION.MAX_LENGTH) {
    throw new ValidationError(`Series description cannot exceed ${VALIDATION_RULES.SERIES_DESCRIPTION.MAX_LENGTH} characters`);
  }
}

/**
 * Validate content title
 */
export function validateContentTitle(title: string): void {
  if (!title || title.trim().length === 0) {
    throw new ValidationError('Content title is required');
  }

  if (title.length < VALIDATION_RULES.CONTENT_TITLE.MIN_LENGTH) {
    throw new ValidationError(`Content title must be at least ${VALIDATION_RULES.CONTENT_TITLE.MIN_LENGTH} character`);
  }

  if (title.length > VALIDATION_RULES.CONTENT_TITLE.MAX_LENGTH) {
    throw new ValidationError(`Content title cannot exceed ${VALIDATION_RULES.CONTENT_TITLE.MAX_LENGTH} characters`);
  }
}

/**
 * Validate content body
 */
export function validateContentBody(body: string): void {
  if (!body || body.trim().length === 0) {
    throw new ValidationError('Content body is required');
  }

  if (body.length < VALIDATION_RULES.CONTENT_BODY.MIN_LENGTH) {
    throw new ValidationError(`Content body must be at least ${VALIDATION_RULES.CONTENT_BODY.MIN_LENGTH} character`);
  }

  if (body.length > VALIDATION_RULES.CONTENT_BODY.MAX_LENGTH) {
    throw new ValidationError(`Content body cannot exceed ${VALIDATION_RULES.CONTENT_BODY.MAX_LENGTH} characters (currently ${body.length})`);
  }
}

/**
 * Validate series creation DTO
 */
export function validateCreateSeries(data: { title: string; description?: string }): void {
  validateSeriesTitle(data.title);
  if (data.description !== undefined && data.description !== null) {
    validateSeriesDescription(data.description);
  }
}

/**
 * Validate content creation DTO
 */
export function validateCreateContent(data: { title: string; body: string }): void {
  validateContentTitle(data.title);
  validateContentBody(data.body);
}

/**
 * Validate content update DTO
 */
export function validateUpdateContent(data: { title?: string; body?: string }): void {
  if (data.title !== undefined) {
    validateContentTitle(data.title);
  }
  if (data.body !== undefined) {
    validateContentBody(data.body);
  }
}
