const express = require('express');
const cors = require('cors');
const { PGlite } = require('@electric-sql/pglite');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Initialize PGlite with local persistence
const db = new PGlite(path.join(__dirname, 'pgdata'));

// Simple ID Generator
let idCounter = Date.now();
const nextId = (prefix) => `${prefix}_${idCounter++}`;

async function initDb() {
  console.log('Initializing database schema...');
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      email VARCHAR UNIQUE NOT NULL,
      phone VARCHAR,
      role VARCHAR NOT NULL,
      active BOOLEAN DEFAULT TRUE,
      password_hash VARCHAR,
      is_blocked BOOLEAN DEFAULT FALSE,
      subscription_status VARCHAR DEFAULT 'active',
      subscription_expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS properties (
      id VARCHAR PRIMARY KEY,
      title VARCHAR NOT NULL,
      location VARCHAR NOT NULL,
      type VARCHAR NOT NULL,
      asking_price BIGINT NOT NULL,
      final_price BIGINT,
      status VARCHAR NOT NULL DEFAULT 'available',
      assigned_employee_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deals (
      id VARCHAR PRIMARY KEY,
      property_id VARCHAR NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      employee_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source VARCHAR NOT NULL,
      agent_name VARCHAR,
      negotiated_price BIGINT NOT NULL,
      final_price BIGINT NOT NULL,
      commission_rate FLOAT NOT NULL,
      commission_amount BIGINT NOT NULL,
      payment_status VARCHAR NOT NULL DEFAULT 'pending',
      approval_status VARCHAR NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id VARCHAR PRIMARY KEY,
      title VARCHAR NOT NULL,
      type VARCHAR NOT NULL,
      assigned_to VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_by VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      property_id VARCHAR REFERENCES properties(id) ON DELETE SET NULL,
      due_date TIMESTAMP NOT NULL,
      status VARCHAR NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR PRIMARY KEY,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR NOT NULL,
      message VARCHAR NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS status_changes (
      id VARCHAR PRIMARY KEY,
      property_id VARCHAR NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      requested_status VARCHAR NOT NULL,
      requested_by VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if users exist. If not, seed the initial data
  const usersCheck = await db.query('SELECT COUNT(*) as count FROM users');
  if (parseInt(usersCheck.rows[0].count) === 0) {
    console.log('Seeding initial data...');
    const demoHash = await bcrypt.hash('demo1234', 10);

    // Seed Users
    await db.query(
      `INSERT INTO users (id, name, email, phone, role, active, password_hash) VALUES
      ('u_owner', 'Kaarim Baig', 'owner@demo.pk', '0300-1112223', 'owner', true, $1),
      ('u_ali', 'Ali Raza', 'ali@demo.pk', '0301-4445556', 'employee', true, NULL),
      ('u_sana', 'Sana Khan', 'sana@demo.pk', '0302-7778889', 'employee', true, NULL),
      ('u_bilal', 'Bilal Ahmed', 'bilal@demo.pk', '0303-1234567', 'employee', true, NULL)`,
      [demoHash]
    );

    // Seed Properties
    await db.query(`
      INSERT INTO properties (id, title, location, type, asking_price, final_price, status, assigned_employee_id) VALUES
      ('p1', '3-Bed Apartment, Clifton Block 2', 'Clifton, Karachi', 'rent', 150000, NULL, 'available', 'u_ali'),
      ('p2', '240 sq yd House, Gulshan-e-Iqbal', 'Gulshan-e-Iqbal, Karachi', 'sale', 45000000, 43500000, 'sold', 'u_sana'),
      ('p3', 'Office Floor, Shahrah-e-Faisal', 'PECHS, Karachi', 'rent', 350000, 325000, 'rented', 'u_ali'),
      ('p4', '500 sq yd Bungalow, DHA Phase 6', 'DHA, Karachi', 'sale', 120000000, NULL, 'available', 'u_bilal'),
      ('p5', '2-Bed Flat, Bahadurabad', 'Bahadurabad, Karachi', 'rent', 90000, NULL, 'available', NULL);
    `);

    // Seed Deals
    await db.query(`
      INSERT INTO deals (id, property_id, employee_id, source, agent_name, negotiated_price, final_price, commission_rate, commission_amount, payment_status, approval_status) VALUES
      ('d1', 'p2', 'u_sana', 'agent', 'Faisal Estate', 44000000, 43500000, 1.0, 435000, 'partial', 'approved'),
      ('d2', 'p3', 'u_ali', 'direct_owner', NULL, 350000, 325000, 50.0, 162500, 'paid', 'approved'),
      ('d3', 'p1', 'u_ali', 'agent', 'Home Finders', 145000, 140000, 50.0, 70000, 'pending', 'pending');
    `);

    // Seed Tasks
    await db.query(`
      INSERT INTO tasks (id, title, type, assigned_to, assigned_by, property_id, due_date, status) VALUES
      ('t1', 'Client visit — Clifton apartment', 'visit', 'u_ali', 'u_owner', 'p1', NOW() + INTERVAL '1 day', 'in_progress'),
      ('t2', 'Follow up with DHA bungalow lead', 'follow_up', 'u_bilal', 'u_owner', 'p4', NOW() + INTERVAL '2 day', 'pending'),
      ('t3', 'Collect rent agreement copies', 'other', 'u_sana', 'u_owner', 'p3', NOW() - INTERVAL '1 day', 'completed'),
      ('t4', 'Photograph Bahadurabad flat', 'visit', 'u_sana', 'u_owner', 'p5', NOW() + INTERVAL '3 day', 'pending');
    `);
  }
}

// Helper to notify a user
async function notify(userId, type, message) {
  const nid = nextId('n');
  await db.query(
    'INSERT INTO notifications (id, user_id, type, message) VALUES ($1, $2, $3, $4)',
    [nid, userId, type, message]
  );
}

// ---- Helpers ----

function generatePassword(len = 12) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function adminAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ---- Admin routes ----

app.post('/admin/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim();
  const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();
  if (!adminEmail || !adminPassword) {
    return res.status(500).json({ error: 'Admin credentials not configured on server' });
  }
  if (email?.trim() !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '24h' });
  res.json({ token });
});

app.get('/admin/api/owners', adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, phone, role, active, is_blocked, subscription_status, subscription_expires_at, created_at
       FROM users WHERE role = 'owner' ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/admin/api/owners', adminAuth, async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  const id = nextId('owner');
  const plainPassword = generatePassword();
  try {
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    await db.query(
      `INSERT INTO users (id, name, email, phone, role, active, password_hash)
       VALUES ($1, $2, $3, $4, 'owner', true, $5)`,
      [id, name, email.trim().toLowerCase(), phone || null, passwordHash]
    );
    const result = await db.query(
      `SELECT id, name, email, phone, role, active, is_blocked, subscription_status, subscription_expires_at, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    res.json({ owner: result.rows[0], generatedPassword: plainPassword });
  } catch (err) {
    if (err.message.includes('unique')) return res.status(409).json({ error: 'Email already in use' });
    res.status(500).json({ error: err.message });
  }
});

app.put('/admin/api/owners/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  try {
    await db.query(
      'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone) WHERE id = $4',
      [name || null, email ? email.trim().toLowerCase() : null, phone || null, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/admin/api/owners/:id/subscription', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { subscription_status, subscription_expires_at } = req.body;
  try {
    await db.query(
      'UPDATE users SET subscription_status = $1, subscription_expires_at = $2 WHERE id = $3',
      [subscription_status, subscription_expires_at || null, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/admin/api/owners/:id/block', adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const current = await db.query('SELECT is_blocked FROM users WHERE id = $1', [id]);
    if (current.rows.length === 0) return res.status(404).json({ error: 'Owner not found' });
    const newBlocked = !current.rows[0].is_blocked;
    await db.query('UPDATE users SET is_blocked = $1 WHERE id = $2', [newBlocked, id]);
    res.json({ success: true, is_blocked: newBlocked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/admin/api/owners/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- API routes ----

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND active = true',
      [email.trim()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const user = result.rows[0];
    if (user.is_blocked) {
      return res.status(403).json({ error: 'Account suspended. Please contact Syntrix support.' });
    }
    if (user.password_hash) {
      const match = await bcrypt.compare(password || '', user.password_hash);
      if (!match) return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const { password_hash, ...safeUser } = user;
    const sessionToken = jwt.sign(
      { userId: safeUser.id, email: safeUser.email, role: 'user' },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '30d' }
    );
    res.json({ ...safeUser, sessionToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Session verify — restores session on app startup without re-entering password
app.post('/api/auth/verify', async (req, res) => {
  const { sessionToken } = req.body;
  try {
    const payload = jwt.verify(sessionToken, process.env.JWT_SECRET || 'dev_secret');
    if (payload.role !== 'user') return res.status(401).json({ error: 'Invalid session' });
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1 AND active = true',
      [payload.userId]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Session expired' });
    const user = result.rows[0];
    if (user.is_blocked) return res.status(403).json({ error: 'Account suspended. Please contact Syntrix support.' });
    const { password_hash, ...safeUser } = user;
    res.json(safeUser);
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
});

// GET users
app.get('/api/users', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET properties
app.get('/api/properties', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM properties ORDER BY created_at DESC');
    // Format bigints to numbers for JSON compatibility
    const properties = result.rows.map(r => ({
      ...r,
      askingPrice: Number(r.asking_price),
      finalPrice: r.final_price ? Number(r.final_price) : undefined,
      assignedEmployeeId: r.assigned_employee_id
    }));
    res.json(properties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST property (Owner only)
app.post('/api/properties', async (req, res) => {
  const { title, location, type, askingPrice, assignedEmployeeId } = req.body;
  const id = nextId('p');
  try {
    await db.query(
      `INSERT INTO properties (id, title, location, type, asking_price, assigned_employee_id) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, title, location, type, askingPrice, assignedEmployeeId || null]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT property (Owner or Employee status change)
app.put('/api/properties/:id', async (req, res) => {
  const { id } = req.params;
  const { title, location, type, askingPrice, assignedEmployeeId, status, byUserId, requireApproval } = req.body;
  
  try {
    if (status && requireApproval) {
      // Check if user is owner
      const userResult = await db.query('SELECT role FROM users WHERE id = $1', [byUserId]);
      const isOwner = userResult.rows[0]?.role === 'owner';
      
      if (!isOwner) {
        // Queue status change request
        const scid = nextId('sc');
        await db.query(
          'INSERT INTO status_changes (id, property_id, requested_status, requested_by) VALUES ($1, $2, $3, $4)',
          [scid, id, status, byUserId]
        );
        const propResult = await db.query('SELECT title FROM properties WHERE id = $1', [id]);
        await notify('u_owner', 'approval', `Status change requested: ${propResult.rows[0]?.title} → ${status}`);
        return res.json({ queued: true });
      }
    }

    // Direct update
    const updates = [];
    const params = [];
    let idx = 1;
    
    if (title !== undefined) { updates.push(`title = $${idx++}`); params.push(title); }
    if (location !== undefined) { updates.push(`location = $${idx++}`); params.push(location); }
    if (type !== undefined) { updates.push(`type = $${idx++}`); params.push(type); }
    if (askingPrice !== undefined) { updates.push(`asking_price = $${idx++}`); params.push(askingPrice); }
    if (assignedEmployeeId !== undefined) { updates.push(`assigned_employee_id = $${idx++}`); params.push(assignedEmployeeId || null); }
    if (status !== undefined) { updates.push(`status = $${idx++}`); params.push(status); }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    const query = `UPDATE properties SET ${updates.join(', ')} WHERE id = $${idx}`;
    params.push(id);
    
    await db.query(query, params);
    res.json({ queued: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE property
app.delete('/api/properties/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM properties WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET status changes
app.get('/api/status-changes', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM status_changes ORDER BY created_at DESC');
    res.json(result.rows.map(r => ({
      _id: r.id,
      propertyId: r.property_id,
      requestedStatus: r.requested_status,
      requestedBy: r.requested_by,
      createdAt: r.created_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resolve status change
app.post('/api/status-changes/:id/resolve', async (req, res) => {
  const { id } = req.params;
  const { approve } = req.body;
  try {
    const changeResult = await db.query('SELECT * FROM status_changes WHERE id = $1', [id]);
    if (changeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Change request not found' });
    }
    const change = changeResult.rows[0];
    
    await db.query('DELETE FROM status_changes WHERE id = $1', [id]);
    
    if (approve) {
      await db.query('UPDATE properties SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [change.requested_status, change.property_id]);
    }
    
    await notify(change.requested_by, 'approval', `Your status change was ${approve ? 'approved' : 'rejected'}.`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET deals
app.get('/api/deals', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM deals ORDER BY created_at DESC');
    const deals = result.rows.map(r => ({
      _id: r.id,
      propertyId: r.property_id,
      employeeId: r.employee_id,
      source: r.source,
      agentName: r.agent_name,
      negotiatedPrice: Number(r.negotiated_price),
      finalPrice: Number(r.final_price),
      commissionRate: r.commission_rate,
      commissionAmount: Number(r.commission_amount),
      paymentStatus: r.payment_status,
      approvalStatus: r.approval_status,
      createdAt: r.created_at
    }));
    res.json(deals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST deal
app.post('/api/deals', async (req, res) => {
  const { propertyId, employeeId, source, agentName, negotiatedPrice, finalPrice, commissionRate, requireApproval } = req.body;
  const id = nextId('d');
  const rate = commissionRate || 1.5;
  const amount = Math.round((finalPrice * rate) / 100);
  const approvalStatus = requireApproval ? 'pending' : 'approved';
  
  try {
    await db.query(
      `INSERT INTO deals (id, property_id, employee_id, source, agent_name, negotiated_price, final_price, commission_rate, commission_amount, approval_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, propertyId, employeeId, source, agentName || null, negotiatedPrice, finalPrice, rate, amount, approvalStatus]
    );
    if (approvalStatus === 'pending') {
      await notify('u_owner', 'deal', `New deal logged for approval (PKR ${finalPrice.toLocaleString()}).`);
    }
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resolve deal (Approve/Reject)
app.put('/api/deals/:id/resolve', async (req, res) => {
  const { id } = req.params;
  const { approve } = req.body;
  try {
    const dealResult = await db.query('SELECT employee_id FROM deals WHERE id = $1', [id]);
    if (dealResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    const deal = dealResult.rows[0];
    const status = approve ? 'approved' : 'rejected';
    
    await db.query('UPDATE deals SET approval_status = $1 WHERE id = $2', [status, id]);
    await notify(deal.employee_id, 'deal', `Your deal was ${approve ? 'approved — commission credited' : 'rejected'}.`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update deal payment status
app.put('/api/deals/:id/payment', async (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;
  try {
    const dealResult = await db.query('SELECT employee_id, commission_amount FROM deals WHERE id = $1', [id]);
    if (dealResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    const deal = dealResult.rows[0];
    
    await db.query('UPDATE deals SET payment_status = $1 WHERE id = $2', [paymentStatus, id]);
    if (paymentStatus === 'paid') {
      await notify(deal.employee_id, 'commission', `Commission credited: PKR ${Number(deal.commission_amount).toLocaleString()}.`);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(result.rows.map(r => ({
      _id: r.id,
      title: r.title,
      type: r.type,
      assignedTo: r.assigned_to,
      assignedBy: r.assigned_by,
      propertyId: r.property_id || undefined,
      dueDate: r.due_date,
      status: r.status,
      createdAt: r.created_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST task
app.post('/api/tasks', async (req, res) => {
  const { title, type, assignedTo, assignedBy, propertyId, dueDate } = req.body;
  const id = nextId('t');
  try {
    await db.query(
      `INSERT INTO tasks (id, title, type, assigned_to, assigned_by, property_id, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, title, type, assignedTo, assignedBy, propertyId || null, dueDate]
    );
    await notify(assignedTo, 'task', `New task assigned: ${title}`);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT task (status)
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const taskResult = await db.query('SELECT title, assigned_by FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const task = taskResult.rows[0];
    
    await db.query('UPDATE tasks SET status = $1 WHERE id = $2', [status, id]);
    if (status === 'completed') {
      await notify(task.assigned_by, 'task', `Task completed: ${task.title}`);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET notifications
app.get('/api/notifications/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows.map(r => ({
      _id: r.id,
      userId: r.user_id,
      type: r.type,
      message: r.message,
      read: r.read,
      createdAt: r.created_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT notifications (mark read)
app.put('/api/notifications/:userId/read', async (req, res) => {
  const { userId } = req.params;
  try {
    await db.query(
      'UPDATE notifications SET read = true WHERE user_id = $1',
      [userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Express Server
app.listen(PORT, async () => {
  try {
    await initDb();
    console.log(`Server running on http://localhost:${PORT}`);
  } catch (err) {
    console.error('Failed to start server:', err);
  }
});
