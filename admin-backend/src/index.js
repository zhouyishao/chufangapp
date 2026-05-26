import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import bcrypt from 'bcryptjs';

import { createPool } from './db.js';
import { requireAdminAuth, signAdminToken } from './auth.js';
import { fail, ok } from './response.js';
import {
  categoryCreateSchema,
  ingredientCreateSchema,
  loginSchema,
  pageQuerySchema,
  recipeCreateSchema
} from './validators.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '1mb' }));

const env = process.env;
const port = Number.parseInt(env.PORT ?? '3001', 10);
const jwtSecret = env.JWT_SECRET ?? 'change-me';
const corsOrigin = env.CORS_ORIGIN ?? '*';
const pool = createPool(env);

app.use(
  cors({
    origin: corsOrigin === '*' ? true : corsOrigin,
    credentials: true
  })
);

app.get('/api/admin/health', async (_req, res) => {
  res.json(ok({ status: 'ok' }));
});

app.post('/api/admin/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(fail(400, 'invalid payload'));
    return;
  }

  const { username, password } = parsed.data;
  const [rows] = await pool.query(
    'SELECT id, username, nickname, password_hash FROM admin_users WHERE username = ? LIMIT 1',
    [username]
  );
  const admin = Array.isArray(rows) ? rows[0] : null;
  if (!admin) {
    res.status(400).json(fail(400, 'invalid username or password'));
    return;
  }

  const okPassword = await bcrypt.compare(password, admin.password_hash);
  if (!okPassword) {
    res.status(400).json(fail(400, 'invalid username or password'));
    return;
  }

  const token = signAdminToken({ sub: String(admin.id), username: admin.username }, jwtSecret);
  res.json(
    ok({
      token,
      admin: { id: admin.id, username: admin.username, nickname: admin.nickname ?? null }
    })
  );
});

const auth = requireAdminAuth(jwtSecret);

app.get('/api/admin/categories', auth, async (req, res) => {
  const parsed = pageQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json(fail(400, 'invalid query'));
    return;
  }
  const { page, page_size: pageSize } = parsed.data;
  const offset = (page - 1) * pageSize;
  const [items] = await pool.query(
    'SELECT id, name, sort_order, created_at, updated_at FROM ingredient_categories ORDER BY sort_order DESC, id DESC LIMIT ? OFFSET ?',
    [pageSize, offset]
  );
  const [countRows] = await pool.query('SELECT COUNT(1) as total FROM ingredient_categories');
  const total = Array.isArray(countRows) ? Number(countRows[0]?.total ?? 0) : 0;
  res.json(ok({ items, page, page_size: pageSize, total }));
});

app.post('/api/admin/categories', auth, async (req, res) => {
  const parsed = categoryCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(fail(400, 'invalid payload'));
    return;
  }
  const { name, sort_order: sortOrder } = parsed.data;
  try {
    const [result] = await pool.query(
      'INSERT INTO ingredient_categories (name, sort_order) VALUES (?, ?)',
      [name, sortOrder]
    );
    const id = result.insertId;
    const [rows] = await pool.query(
      'SELECT id, name, sort_order, created_at, updated_at FROM ingredient_categories WHERE id = ?',
      [id]
    );
    res.json(ok(rows[0]));
  } catch (err) {
    if (String(err?.code) === 'ER_DUP_ENTRY') {
      res.status(400).json(fail(400, 'category name already exists'));
      return;
    }
    throw err;
  }
});

app.put('/api/admin/categories/:id', auth, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json(fail(400, 'invalid id'));
    return;
  }
  const parsed = categoryCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(fail(400, 'invalid payload'));
    return;
  }
  const { name, sort_order: sortOrder } = parsed.data;
  await pool.query('UPDATE ingredient_categories SET name = ?, sort_order = ? WHERE id = ?', [
    name,
    sortOrder,
    id
  ]);
  const [rows] = await pool.query(
    'SELECT id, name, sort_order, created_at, updated_at FROM ingredient_categories WHERE id = ?',
    [id]
  );
  if (!rows[0]) {
    res.status(404).json(fail(404, 'not found'));
    return;
  }
  res.json(ok(rows[0]));
});

app.delete('/api/admin/categories/:id', auth, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json(fail(400, 'invalid id'));
    return;
  }
  const [rows] = await pool.query(
    'SELECT id, name, sort_order, created_at, updated_at FROM ingredient_categories WHERE id = ?',
    [id]
  );
  if (!rows[0]) {
    res.status(404).json(fail(404, 'not found'));
    return;
  }
  await pool.query('DELETE FROM ingredient_categories WHERE id = ?', [id]);
  res.json(ok(rows[0]));
});

app.get('/api/admin/ingredients', auth, async (req, res) => {
  const parsed = pageQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json(fail(400, 'invalid query'));
    return;
  }
  const { page, page_size: pageSize } = parsed.data;
  const offset = (page - 1) * pageSize;
  const [items] = await pool.query(
    `SELECT i.id, i.name, i.category_id, c.name as category_name, i.image_url, i.description, i.season_months_json, i.created_at, i.updated_at
     FROM ingredients i
     LEFT JOIN ingredient_categories c ON c.id = i.category_id
     ORDER BY i.id DESC
     LIMIT ? OFFSET ?`,
    [pageSize, offset]
  );
  const normalized = (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    season_months:
      typeof item.season_months_json === 'string' && item.season_months_json.trim()
        ? JSON.parse(item.season_months_json)
        : []
  }));
  const [countRows] = await pool.query('SELECT COUNT(1) as total FROM ingredients');
  const total = Array.isArray(countRows) ? Number(countRows[0]?.total ?? 0) : 0;
  res.json(ok({ items: normalized, page, page_size: pageSize, total }));
});

app.post('/api/admin/ingredients', auth, async (req, res) => {
  const parsed = ingredientCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(fail(400, 'invalid payload'));
    return;
  }

  const { name, category_id: categoryId, image_url: imageUrl, description, season_months } =
    parsed.data;
  try {
    const [result] = await pool.query(
      'INSERT INTO ingredients (name, category_id, image_url, description, season_months_json) VALUES (?, ?, ?, ?, ?)',
      [
        name,
        categoryId ?? null,
        imageUrl ?? null,
        description ?? null,
        JSON.stringify(season_months ?? [])
      ]
    );
    const id = result.insertId;
    const [rows] = await pool.query('SELECT * FROM ingredients WHERE id = ?', [id]);
    const item = rows[0];
    res.json(
      ok({
        id: item.id,
        name: item.name,
        category_id: item.category_id,
        image_url: item.image_url,
        description: item.description,
        season_months: item.season_months_json ? JSON.parse(item.season_months_json) : [],
        created_at: item.created_at,
        updated_at: item.updated_at
      })
    );
  } catch (err) {
    if (String(err?.code) === 'ER_DUP_ENTRY') {
      res.status(400).json(fail(400, 'ingredient name already exists'));
      return;
    }
    throw err;
  }
});

app.put('/api/admin/ingredients/:id', auth, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json(fail(400, 'invalid id'));
    return;
  }
  const parsed = ingredientCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(fail(400, 'invalid payload'));
    return;
  }
  const { name, category_id: categoryId, image_url: imageUrl, description, season_months } =
    parsed.data;
  await pool.query(
    'UPDATE ingredients SET name = ?, category_id = ?, image_url = ?, description = ?, season_months_json = ? WHERE id = ?',
    [
      name,
      categoryId ?? null,
      imageUrl ?? null,
      description ?? null,
      JSON.stringify(season_months ?? []),
      id
    ]
  );
  const [rows] = await pool.query('SELECT * FROM ingredients WHERE id = ?', [id]);
  if (!rows[0]) {
    res.status(404).json(fail(404, 'not found'));
    return;
  }
  const item = rows[0];
  res.json(
    ok({
      id: item.id,
      name: item.name,
      category_id: item.category_id,
      image_url: item.image_url,
      description: item.description,
      season_months: item.season_months_json ? JSON.parse(item.season_months_json) : [],
      created_at: item.created_at,
      updated_at: item.updated_at
    })
  );
});

app.delete('/api/admin/ingredients/:id', auth, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json(fail(400, 'invalid id'));
    return;
  }
  const [rows] = await pool.query('SELECT * FROM ingredients WHERE id = ?', [id]);
  if (!rows[0]) {
    res.status(404).json(fail(404, 'not found'));
    return;
  }
  await pool.query('DELETE FROM ingredients WHERE id = ?', [id]);
  res.json(ok(rows[0]));
});

app.get('/api/admin/recipes', auth, async (req, res) => {
  const parsed = pageQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json(fail(400, 'invalid query'));
    return;
  }
  const { page, page_size: pageSize } = parsed.data;
  const offset = (page - 1) * pageSize;
  const [items] = await pool.query(
    'SELECT id, title, cover_url, description, created_at, updated_at FROM recipes ORDER BY id DESC LIMIT ? OFFSET ?',
    [pageSize, offset]
  );
  const [countRows] = await pool.query('SELECT COUNT(1) as total FROM recipes');
  const total = Array.isArray(countRows) ? Number(countRows[0]?.total ?? 0) : 0;
  res.json(ok({ items, page, page_size: pageSize, total }));
});

app.get('/api/admin/recipes/:id', auth, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json(fail(400, 'invalid id'));
    return;
  }
  const [rows] = await pool.query('SELECT * FROM recipes WHERE id = ?', [id]);
  if (!rows[0]) {
    res.status(404).json(fail(404, 'not found'));
    return;
  }
  const item = rows[0];
  res.json(
    ok({
      id: item.id,
      title: item.title,
      cover_url: item.cover_url,
      description: item.description,
      ingredients: item.ingredients_json ? JSON.parse(item.ingredients_json) : [],
      steps: item.steps_json ? JSON.parse(item.steps_json) : [],
      created_at: item.created_at,
      updated_at: item.updated_at
    })
  );
});

app.post('/api/admin/recipes', auth, async (req, res) => {
  const parsed = recipeCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(fail(400, 'invalid payload'));
    return;
  }
  const { title, cover_url: coverUrl, description, ingredients, steps } = parsed.data;
  const [result] = await pool.query(
    'INSERT INTO recipes (title, cover_url, description, ingredients_json, steps_json) VALUES (?, ?, ?, ?, ?)',
    [title, coverUrl ?? null, description ?? null, JSON.stringify(ingredients), JSON.stringify(steps)]
  );
  const id = result.insertId;
  const [rows] = await pool.query('SELECT * FROM recipes WHERE id = ?', [id]);
  const item = rows[0];
  res.json(
    ok({
      id: item.id,
      title: item.title,
      cover_url: item.cover_url,
      description: item.description,
      ingredients: item.ingredients_json ? JSON.parse(item.ingredients_json) : [],
      steps: item.steps_json ? JSON.parse(item.steps_json) : [],
      created_at: item.created_at,
      updated_at: item.updated_at
    })
  );
});

app.put('/api/admin/recipes/:id', auth, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json(fail(400, 'invalid id'));
    return;
  }
  const parsed = recipeCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(fail(400, 'invalid payload'));
    return;
  }
  const { title, cover_url: coverUrl, description, ingredients, steps } = parsed.data;
  await pool.query(
    'UPDATE recipes SET title = ?, cover_url = ?, description = ?, ingredients_json = ?, steps_json = ? WHERE id = ?',
    [title, coverUrl ?? null, description ?? null, JSON.stringify(ingredients), JSON.stringify(steps), id]
  );
  const [rows] = await pool.query('SELECT * FROM recipes WHERE id = ?', [id]);
  if (!rows[0]) {
    res.status(404).json(fail(404, 'not found'));
    return;
  }
  const item = rows[0];
  res.json(
    ok({
      id: item.id,
      title: item.title,
      cover_url: item.cover_url,
      description: item.description,
      ingredients: item.ingredients_json ? JSON.parse(item.ingredients_json) : [],
      steps: item.steps_json ? JSON.parse(item.steps_json) : [],
      created_at: item.created_at,
      updated_at: item.updated_at
    })
  );
});

app.delete('/api/admin/recipes/:id', auth, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json(fail(400, 'invalid id'));
    return;
  }
  const [rows] = await pool.query('SELECT * FROM recipes WHERE id = ?', [id]);
  if (!rows[0]) {
    res.status(404).json(fail(404, 'not found'));
    return;
  }
  await pool.query('DELETE FROM recipes WHERE id = ?', [id]);
  res.json(ok(rows[0]));
});

app.use((_req, res) => {
  res.status(404).json(fail(404, 'not found'));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[admin-backend] listening on http://localhost:${port}`);
});

