import { z } from 'zod';

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20)
});

export const loginSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(6).max(72)
});

export const categoryCreateSchema = z.object({
  name: z.string().min(1).max(50),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0)
});

export const ingredientCreateSchema = z.object({
  name: z.string().min(1).max(50),
  category_id: z.coerce.number().int().positive().nullable().optional(),
  image_url: z.string().url().max(255).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  season_months: z.array(z.number().int().min(1).max(12)).max(12).default([])
});

export const recipeCreateSchema = z.object({
  title: z.string().min(1).max(80),
  cover_url: z.string().url().max(255).nullable().optional(),
  description: z.string().max(3000).nullable().optional(),
  ingredients: z.array(z.string().min(1).max(200)).max(200).default([]),
  steps: z.array(z.string().min(1).max(500)).max(500).default([])
});

