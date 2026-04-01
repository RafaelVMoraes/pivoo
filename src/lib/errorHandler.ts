/**
 * User-friendly error message handler for database errors.
 * Maps Supabase/PostgreSQL error codes to safe, generic messages.
 * Full error details are logged to console for debugging.
 */
export const getUserFriendlyError = (error: unknown): string => {
  // Log full error for debugging (only visible in dev tools, not to users)
  console.error('Database error:', error);

  // Handle null/undefined
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  // Type guard for Supabase/Postgres errors
  const err = error as { code?: string; message?: string };

  // Map PostgreSQL error codes to user-friendly messages
  if (err.code) {
    switch (err.code) {
      // Unique violation
      case '23505':
        return 'This item already exists.';
      
      // Foreign key violation
      case '23503':
        return 'Unable to complete operation due to related data.';
      
      // Not null violation
      case '23502':
        return 'Required information is missing.';
      
      // Check constraint violation
      case '23514':
        return 'The provided data does not meet the requirements.';
      
      // Invalid text representation
      case '22P02':
        return 'Invalid data format provided.';
      
      // Permission denied
      case '42501':
        return 'You do not have permission to perform this action.';
      
      // RLS violation
      case '42000':
      case 'PGRST301':
        return 'Access denied. Please ensure you are logged in.';
      
      // Connection issues
      case '08000':
      case '08003':
      case '08006':
        return 'Connection error. Please check your internet and try again.';
      
      // Timeout
      case '57014':
        return 'The operation took too long. Please try again.';
      
      default:
        // Don't expose unknown error codes
        return 'An unexpected error occurred. Please try again.';
    }
  }

  // Handle network errors
  if (err.message?.includes('fetch') || err.message?.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Default safe message
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Helper to check if an error is a specific type
 */
export const isAuthError = (error: unknown): boolean => {
  const err = error as { code?: string; message?: string };
  return err.code === '42501' || 
         err.code === 'PGRST301' || 
         err.message?.toLowerCase().includes('auth') ||
         err.message?.toLowerCase().includes('unauthorized');
};

/**
 * Helper to check if error is a duplicate entry
 */
export const isDuplicateError = (error: unknown): boolean => {
  const err = error as { code?: string };
  return err.code === '23505';
};
