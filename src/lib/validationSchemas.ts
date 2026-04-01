import { z } from 'zod';

/**
 * validationSchemas.ts
 * -------------------------------------------------------------------------
 * Centralized Zod schemas for all user input types within the app.
 * 
 * - Ensures data integrity before storage (e.g., prior to Supabase insert/update)
 * - Prevents accepted invalid input from bypassing client-side validation
 * - Defines types derived from schemas for TypeScript runtime and static safety
 *
 * For each resource (goal, activity, check-in, profile, etc.), a Zod schema
 * describes the required fields, validations, and type inferences.
 * 
 * NOTE: Do not modify schema logic in this file without additional review,
 * as these schemas gatekeep DB integrity and user/account safety.
 */

/* --------------------------------------------------------------------------
 * Goal Validation
 * ------------------------------------------------------------------------ */
/**
 * Schema for validating user goal inputs.
 * Used for creation and editing flows.
 */
export const GoalSchema = z.object({
  // Main text for the goal (required, limited length)
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),

  // Optional goal description
  description: z.string()
    .trim()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable(),

  // Short category label for user organization/filtering
  category: z.string()
    .trim()
    .max(100)
    .optional()
    .nullable(),

  // Goal type: execution structure (default 'outcome')
  type: z.enum(['outcome', 'process']).default('outcome'),

  // Lifecycle status of goal
  status: z.enum(['active', 'in_progress', 'on_hold', 'completed', 'archived']).default('active'),

  // Priority level: gold/silver/bronze
  priority: z.enum(['gold', 'silver', 'bronze']),

  // Optional date/target for anticipated completion or milestone
  target_date: z.string()
    .optional()
    .nullable(),

  // Related "life wheel" area(s) (single or array)
  life_wheel_area: z.union([
    z.string().max(100),
    z.array(z.string().max(100))
  ]).optional().nullable(),

  // Array of value tags/ids related to this goal
  related_values: z.array(z.string().max(100)).optional().nullable(),

  // Optional parent goal relationship (for subgoals)
  parent_goal_id: z.string().uuid().optional().nullable(),

  // Multi-level motivation fields
  surface_motivation: z.string()
    .trim()
    .max(1000, 'Motivation must be less than 1000 characters')
    .optional()
    .nullable(),
  deeper_motivation: z.string()
    .trim()
    .max(1000, 'Motivation must be less than 1000 characters')
    .optional()
    .nullable(),
  identity_motivation: z.string()
    .trim()
    .max(1000, 'Motivation must be less than 1000 characters')
    .optional()
    .nullable(),
});

/** Inferred TS input type for goal forms. */
export type GoalInput = z.infer<typeof GoalSchema>;


/* --------------------------------------------------------------------------
 * Activity Validation
 * ------------------------------------------------------------------------ */
/**
 * Schema for activities (recurring tasks/habits linked to a goal).
 * Captures frequency, schedule, and descriptive settings.
 */
export const ActivitySchema = z.object({
  // Reference to parent goal (required, must be a valid UUID)
  goal_id: z.string().uuid('Invalid goal reference'),

  // Short description of action required
  description: z.string()
    .trim()
    .min(1, 'Description is required')
    .max(500, 'Description must be less than 500 characters'),

  // Flexible string for custom frequency expression (optional)
  frequency: z.string()
    .max(50)
    .optional()
    .nullable(),

  // Frequency type classification
  frequency_type: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional().nullable(),

  // Number value for frequency interval (e.g., every 2 days)
  frequency_value: z.number().int().min(1).max(365).optional().nullable(),

  // General time-of-day suggestion
  time_of_day: z.enum(['morning', 'afternoon', 'night']).optional().nullable(),

  // Days of the week when activity occurs (optional array)
  days_of_week: z.array(z.string().max(20)).optional().nullable(),

  // Day of the month for monthly-type activities (e.g., 15th)
  day_of_month: z.number().int().min(1).max(31).optional().nullable(),

  // Activity status (active/completed)
  status: z.enum(['active', 'completed']).default('active'),
});

/** Inferred TS input type for activity forms. */
export type ActivityInput = z.infer<typeof ActivitySchema>;


/* --------------------------------------------------------------------------
 * Check-In Validation
 * ------------------------------------------------------------------------ */
/**
 * Schema for single check-in records (logs of execution for activities/goals).
 * Used to validate all tracked completions/progress values.
 */
export const CheckInSchema = z.object({
  // Parent goal association (required)
  goal_id: z.string().uuid('Invalid goal reference'),

  // Reference to activity, if relevant (not all check-ins are for activities)
  activity_id: z.string().uuid().optional().nullable(),

  // Date string in ISO format (required)
  date: z.string(),

  // Progress mark/value (eg. 'done', '7', 'yes', etc)
  progress_value: z.string()
    .trim()
    .min(1, 'Progress value is required')
    .max(100, 'Progress value too long'),

  // How was input entered (UI control type/signal)
  input_type: z.enum(['numeric', 'checkbox', 'percentage']).default('checkbox'),
});

/** Inferred TS input type for check-in forms/logs. */
export type CheckInInput = z.infer<typeof CheckInSchema>;


/* --------------------------------------------------------------------------
 * Profile Validation
 * ------------------------------------------------------------------------ */
/**
 * Schema for user profile properties.
 * Covers display info, optional avatar, and notification flag.
 */
export const ProfileSchema = z.object({
  name: z.string()
    .trim()
    .max(100, 'Name must be less than 100 characters')
    .optional()
    .nullable(),

  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .nullable(),

  avatar_url: z.string()
    .url('Invalid URL')
    .max(500, 'URL too long')
    .optional()
    .nullable(),

  language: z.string()
    .max(10)
    .optional()
    .nullable(),

  notifications_enabled: z.boolean().optional().nullable(),
});

/** Inferred TS input type for editing the user profile. */
export type ProfileInput = z.infer<typeof ProfileSchema>;


/* --------------------------------------------------------------------------
 * Life Wheel Area Validation
 * ------------------------------------------------------------------------ */
/**
 * Schema for life wheel area/scoring input (personal development axis).
 */
export const LifeWheelSchema = z.object({
  // Name of the area (required, e.g. "Health")
  area_name: z.string()
    .trim()
    .min(1, 'Area name is required')
    .max(100, 'Area name must be less than 100 characters'),

  // User's current score for the area (typically 1-10)
  current_score: z.number()
    .int()
    .min(1, 'Score must be at least 1')
    .max(10, 'Score must be at most 10'),

  // Target/desire score (1-10, required)
  desired_score: z.number()
    .int()
    .min(1, 'Score must be at least 1')
    .max(10, 'Score must be at most 10'),

  // Is this a current area of focus? (optional)
  is_focus_area: z.boolean().optional(),
});

/** Inferred TS input type for life wheel forms. */
export type LifeWheelInput = z.infer<typeof LifeWheelSchema>;


/* --------------------------------------------------------------------------
 * Vision/Theme Validation
 * ------------------------------------------------------------------------ */
/**
 * Schema for user "vision" statements, annual word/phrase, and time-horizon snapshot.
 */
export const VisionSchema = z.object({
  // 1-year vision statement (optional)
  vision_1y: z.string()
    .trim()
    .max(2000, 'Vision must be less than 2000 characters')
    .optional()
    .nullable(),

  // 3-year vision statement (optional)
  vision_3y: z.string()
    .trim()
    .max(2000, 'Vision must be less than 2000 characters')
    .optional()
    .nullable(),

  // Annual "theme word" (e.g. "Growth")
  word_year: z.string()
    .trim()
    .max(50, 'Word must be less than 50 characters')
    .optional()
    .nullable(),

  // Annual guiding phrase (motto, optional)
  phrase_year: z.string()
    .trim()
    .max(200, 'Phrase must be less than 200 characters')
    .optional()
    .nullable(),
});

/** Inferred TS input type for vision/theme forms. */
export type VisionInput = z.infer<typeof VisionSchema>;


/* --------------------------------------------------------------------------
 * Chatbot Prompt Validation
 * ------------------------------------------------------------------------ */
/**
 * Simple schema for validating prompts sent to the chatbot modules.
 */
export const ChatbotPromptSchema = z.object({
  prompt: z.string()
    .trim()
    .min(1, 'Prompt cannot be empty')
    .max(4000, 'Prompt must be less than 4000 characters'),
});

/** Inferred TS input type for chatbot prompt submission. */
export type ChatbotPromptInput = z.infer<typeof ChatbotPromptSchema>;


/* --------------------------------------------------------------------------
 * General Utilities
 * ------------------------------------------------------------------------ */
/**
 * Safe validation helper
 * ---------------------
 * Attempts schema validation and returns result without throwing.
 * Returns:
 *   - { success: true, data }      on valid input
 *   - { success: false, error }    with user-facing error message if invalid
 * Useful for API/server-side code or advanced form handling.
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // Pull the first error message from the Zod error structure.
  const firstError = result.error.errors[0];
  return { 
    success: false, 
    error: firstError?.message || 'Validation failed' 
  };
}
