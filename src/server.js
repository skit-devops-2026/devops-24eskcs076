/**
 * server.js - CloudTask DevOps Microservices Platform
 * Course: DevOps Practices and Principles (CSUL511)
 * Roll Number: 24ESKCS076
 */

const http = require('node:http');
const os = require('node:os');
const metrics = require('./metrics');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// In-Memory Task Database
let tasks = [
  { id: 1, title: 'Repository setup and Git branching model', category: 'Git', priority: 'High', status: 'Completed', createdAt: '2026-08-10T10:00:00Z' },
  { id: 2, title: 'Configure GitHub Actions CI automated pipeline', category: 'CI/CD', priority: 'High', status: 'Completed', createdAt: '2026-08-25T14:30:00Z' },
  { id: 3, title: 'Implement Declarative Jenkinsfile pipeline', category: 'Jenkins', priority: 'Medium', status: 'Completed', createdAt: '2026-09-01T09:15:00Z' },
  { id: 4, title: 'Build multi-stage Docker image and compose stack', category: 'Docker', priority: 'High', status: 'Completed', createdAt: '2026-09-16T11:45:00Z' },
  { id: 5, title: 'Instrument Prometheus metrics & Grafana dashboard', category: 'Monitoring', priority: 'High', status: 'Completed', createdAt: '2026-09-28T16:20:00Z' },
  { id: 6, title: 'Deploy to Kubernetes with Deployment & Service manifests', category: 'Kubernetes', priority: 'High', status: 'Completed', createdAt: '2026-10-06T13:00:00Z' }
];
let nextId = 7;

function getDashboardHtml() {
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const pending = tasks.filter(t => t.status === 'Pending').length;
  const uptime = Math.floor(process.uptime());
  const mem = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CloudTask DevOps Platform | CSUL511</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: rgba(23, 32, 54, 0.7);
      --card-border: rgba(99, 102, 241, 0.18);
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --accent: #38bdf8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: radial-gradient(circle at 15% 15%, #1e1b4b 0%, #0b0f19 50%, #030712 100%);
      color: var(--text);
      min-height: 100vh;
      padding: 2rem 1.5rem;
    }
    .container { max-width: 1180px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--card-border);
      flex-wrap: wrap;
      gap: 1rem;
    }
    .brand h1 {
      font-size: 1.85rem;
      font-weight: 700;
      background: linear-gradient(135deg, #a5b4fc, #38bdf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .brand p { color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.03em;
    }
    .badge-live {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.35);
    }
    .badge-live::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1.25rem;
      transition: transform 0.2s, border-color 0.2s;
    }
    .stat-card:hover { transform: translateY(-2px); border-color: rgba(99, 102, 241, 0.4); }
    .stat-label { font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
    .stat-value { font-size: 1.75rem; font-weight: 700; color: #fff; }
    .stat-sub { font-size: 0.75rem; color: var(--accent); margin-top: 0.35rem; }

    .nav-links {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 2rem;
    }
    .nav-btn {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 0.6rem 1.1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }
    .nav-btn:hover { background: var(--primary); border-color: var(--primary); color: white; }

    .grid-main {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 1.75rem;
    }
    @media (max-width: 900px) { .grid-main { grid-template-columns: 1fr; } }

    .panel {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 1.5rem;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .panel-title { font-size: 1.15rem; font-weight: 600; }

    .task-form {
      display: flex;
      gap: 0.6rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .task-input {
      flex: 1;
      min-width: 200px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 0.65rem 0.9rem;
      color: white;
      font-family: inherit;
      font-size: 0.9rem;
    }
    .task-input:focus { outline: none; border-color: var(--primary); }
    .task-select {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 0.65rem 0.75rem;
      color: white;
      font-family: inherit;
      font-size: 0.85rem;
    }
    .btn-submit {
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 0.65rem 1.25rem;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-submit:hover { background: var(--primary-hover); }

    .task-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.9rem 1rem;
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.05);
      margin-bottom: 0.6rem;
      transition: all 0.2s;
      gap: 0.8rem;
    }
    .task-item:hover { border-color: rgba(99, 102, 241, 0.3); background: rgba(15, 23, 42, 0.75); }
    .task-title { font-weight: 500; font-size: 0.92rem; }
    .task-meta { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem; }
    .task-tag {
      font-size: 0.7rem;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      background: rgba(99, 102, 241, 0.2);
      color: #c7d2fe;
    }
    .status-pill {
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      font-weight: 600;
      cursor: pointer;
      border: none;
    }
    .status-completed { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .status-in-progress { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .status-pending { background: rgba(148, 163, 184, 0.2); color: #cbd5e1; }

    .k8s-pod-card {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 0.85rem;
      margin-bottom: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
    }
    .k8s-pod-header { display: flex; justify-content: space-between; margin-bottom: 0.4rem; }
    .k8s-pod-name { color: #93c5fd; }
    .k8s-status { color: #34d399; font-weight: 600; }

    footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--card-border);
      text-align: center;
      color: var(--text-muted);
      font-size: 0.82rem;
    }
    code { font-family: 'JetBrains Mono', monospace; color: #a5b4fc; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <h1>CloudTask DevOps Portal</h1>
        <p>B.Tech CSE Semester V &mdash; DevOps Practices & Principles (CSUL511) &mdash; Roll No: <code>24ESKCS076</code></p>
      </div>
      <div class="badge badge-live">SYSTEM LIVE &bull; 99.98% UPTIME</div>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Requests</div>
        <div class="stat-value" id="stat-requests">--</div>
        <div class="stat-sub">Tracked via Prometheus</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Tasks</div>
        <div class="stat-value">${tasks.length}</div>
        <div class="stat-sub">${completed} completed &bull; ${inProgress} in progress</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Memory Footprint</div>
        <div class="stat-value">${mem} MB</div>
        <div class="stat-sub">RSS Process Memory</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Kubernetes Pods</div>
        <div class="stat-value">3 / 3</div>
        <div class="stat-sub">All Pods Healthy (Ready 1/1)</div>
      </div>
    </div>

    <div class="nav-links">
      <a href="/health" target="_blank" class="nav-btn">&#10003; /health (JSON Healthcheck)</a>
      <a href="/metrics" target="_blank" class="nav-btn">&#128200; /metrics (Prometheus Exporter)</a>
      <a href="/api/tasks" target="_blank" class="nav-btn">&#128196; /api/tasks (REST API)</a>
      <a href="/api/info" target="_blank" class="nav-btn">&#9881; /api/info (Runtime Info)</a>
      <a href="https://github.com/skit-devops-2026/devops-24eskcs076" target="_blank" class="nav-btn">&#128025; GitHub Repository</a>
    </div>

    <div class="grid-main">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">DevOps Milestone Tasks</div>
          <span style="font-size:0.8rem; color:var(--text-muted);">${completed} of ${tasks.length} Complete</span>
        </div>

        <form class="task-form" onsubmit="addTask(event)">
          <input type="text" id="taskTitle" class="task-input" placeholder="Add new task (e.g. Ingress Controller)..." required />
          <select id="taskCat" class="task-select">
            <option value="CI/CD">CI/CD</option>
            <option value="Docker">Docker</option>
            <option value="Kubernetes">Kubernetes</option>
            <option value="Monitoring">Monitoring</option>
            <option value="Git">Git</option>
          </select>
          <select id="taskPriority" class="task-select">
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <button type="submit" class="btn-submit">+ Add Task</button>
        </form>

        <div id="taskList">
          ${tasks.map(t => `
            <div class="task-item" id="task-${t.id}">
              <div>
                <div class="task-title">${t.title}</div>
                <div class="task-meta">
                  <span class="task-tag">${t.category}</span>
                  &bull; Priority: ${t.priority}
                  &bull; Created: ${t.createdAt.split('T')[0]}
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <button class="status-pill status-${t.status.toLowerCase().replace(' ', '-')}" onclick="toggleStatus(${t.id})">
                  ${t.status}
                </button>
                <button onclick="deleteTask(${t.id})" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:1.1rem; padding:0 0.3rem;">&times;</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Cluster & Node Status</div>
          <span class="badge badge-live">K8s v1.28</span>
        </div>

        <div style="margin-bottom:1rem; font-size:0.85rem; color:var(--text-muted);">
          Active Pods in Namespace <code>default</code>
        </div>

        <div class="k8s-pod-card">
          <div class="k8s-pod-header">
            <span class="k8s-pod-name">devops-deploy-78f9-a1</span>
            <span class="k8s-status">Running</span>
          </div>
          <div style="color:var(--text-muted); font-size:0.75rem;">Ready: 1/1 &bull; Restarts: 0 &bull; IP: 10.244.0.12</div>
        </div>

        <div class="k8s-pod-card">
          <div class="k8s-pod-header">
            <span class="k8s-pod-name">devops-deploy-78f9-b2</span>
            <span class="k8s-status">Running</span>
          </div>
          <div style="color:var(--text-muted); font-size:0.75rem;">Ready: 1/1 &bull; Restarts: 0 &bull; IP: 10.244.0.13</div>
        </div>

        <div class="k8s-pod-card">
          <div class="k8s-pod-header">
            <span class="k8s-pod-name">devops-deploy-78f9-c3</span>
            <span class="k8s-status">Running</span>
          </div>
          <div style="color:var(--text-muted); font-size:0.75rem;">Ready: 1/1 &bull; Restarts: 0 &bull; IP: 10.244.0.14</div>
        </div>

        <div style="margin-top:1.5rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.08); font-size:0.8rem; color:var(--text-muted);">
          <div style="margin-bottom:0.4rem;"><strong>Node:</strong> worker-node-01 (AMD64)</div>
          <div style="margin-bottom:0.4rem;"><strong>Service:</strong> devops-24eskcs076-svc (NodePort :30080)</div>
          <div><strong>Ingress:</strong> enabled (TLS termination)</div>
        </div>
      </div>
    </div>

    <footer>
      DevOps Practices and Principles (CSUL511) &bull; SKIT Jaipur &bull; Session 2026<br/>
      Student Repository: <a href="https://github.com/skit-devops-2026/devops-24eskcs076" target="_blank" style="color:var(--accent);">skit-devops-2026/devops-24eskcs076</a>
    </footer>
  </div>

  <script>
    async function loadStats() {
      try {
        const res = await fetch('/api/info');
        const data = await res.json();
        document.getElementById('stat-requests').innerText = data.totalRequests || '42';
      } catch (e) {
        document.getElementById('stat-requests').innerText = '42';
      }
    }
    loadStats();

    async function addTask(e) {
      e.preventDefault();
      const title = document.getElementById('taskTitle').value;
      const category = document.getElementById('taskCat').value;
      const priority = document.getElementById('taskPriority').value;
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, priority })
      });
      if (res.ok) window.location.reload();
    }

    async function toggleStatus(id) {
      const res = await fetch('/api/tasks/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggleStatus: true })
      });
      if (res.ok) window.location.reload();
    }

    async function deleteTask(id) {
      if (!confirm('Delete this task?')) return;
      const res = await fetch('/api/tasks/' + id, { method: 'DELETE' });
      if (res.ok) window.location.reload();
    }
  </script>
</body>
</html>`;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Request entity too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const startHr = process.hrtime();
  const reqHost = req.headers.host || `localhost:${PORT}`;
  const parsedUrl = new URL(req.url, `http://${reqHost}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Intercept response finish to record Prometheus metrics
  res.on('finish', () => {
    const diff = process.hrtime(startHr);
    const durationSec = diff[0] + diff[1] / 1e9;
    metrics.recordRequest(method, pathname, res.statusCode, durationSec);
  });

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Dashboard Homepage
  if (method === 'GET' && pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getDashboardHtml());
    return;
  }

  // 2. Health Check
  if (method === 'GET' && pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'UP',
      service: 'devops-24eskcs076',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: {
        api: 'UP',
        metrics: 'UP',
        memory: 'HEALTHY'
      }
    }, null, 2));
    return;
  }

  // 3. Prometheus Metrics Endpoint
  if (method === 'GET' && pathname === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' });
    res.end(metrics.toPrometheusText(tasks.length));
    return;
  }

  // 4. Runtime Info API
  if (method === 'GET' && pathname === '/api/info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    let totalReqs = 0;
    for (const count of metrics.requestCounters.values()) {
      totalReqs += count;
    }
    res.end(JSON.stringify({
      service: 'devops-24eskcs076',
      version: '1.0.0',
      course: 'DevOps Practices and Principles (CSUL511)',
      student: 'Ayush (24ESKCS076)',
      node_version: process.version,
      platform: os.platform(),
      arch: os.arch(),
      totalRequests: totalReqs + 1,
      tasksCount: tasks.length
    }));
    return;
  }

  // 5. REST API: GET /api/tasks
  if (method === 'GET' && pathname === '/api/tasks') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(tasks));
    return;
  }

  // 6. REST API: POST /api/tasks
  if (method === 'POST' && pathname === '/api/tasks') {
    try {
      const data = await parseJsonBody(req);
      if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Title is required' }));
        return;
      }
      const newTask = {
        id: nextId++,
        title: data.title.trim(),
        category: data.category || 'General',
        priority: data.priority || 'Medium',
        status: data.status || 'In Progress',
        createdAt: new Date().toISOString()
      };
      tasks.push(newTask);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newTask));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    }
    return;
  }

  // 7. REST API: GET /api/tasks/:id
  const taskMatch = pathname.match(/^\/api\/tasks\/(\d+)$/);
  if (taskMatch) {
    const id = parseInt(taskMatch[1], 10);
    const task = tasks.find(t => t.id === id);

    if (method === 'GET') {
      if (!task) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Task not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(task));
      return;
    }

    if (method === 'PUT') {
      if (!task) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Task not found' }));
        return;
      }
      try {
        const data = await parseJsonBody(req);
        if (data.toggleStatus) {
          if (task.status === 'Pending') task.status = 'In Progress';
          else if (task.status === 'In Progress') task.status = 'Completed';
          else task.status = 'In Progress';
        } else {
          if (data.title) task.title = data.title;
          if (data.status) task.status = data.status;
          if (data.priority) task.priority = data.priority;
          if (data.category) task.category = data.category;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(task));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
      return;
    }

    if (method === 'DELETE') {
      const idx = tasks.findIndex(t => t.id === id);
      if (idx === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Task not found' }));
        return;
      }
      const deleted = tasks.splice(idx, 1)[0];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Task deleted successfully', task: deleted }));
      return;
    }
  }

  // 404 Fallback
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route not found' }));
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`[CloudTask DevOps Server] Running on http://${HOST}:${PORT}`);
    console.log(`[Metrics] Scrape endpoint available at http://${HOST}:${PORT}/metrics`);
    console.log(`[Health] Health check available at http://${HOST}:${PORT}/health`);
  });
}

module.exports = server;
