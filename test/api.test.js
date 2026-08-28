/**
 * api.test.js - Automated Test Suite for CloudTask DevOps Platform
 * Course: DevOps Practices and Principles (CSUL511)
 * Evaluates: Healthcheck, Prometheus Metrics, and REST CRUD API
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const server = require('../src/server');

const TEST_PORT = 3099;
let baseUrl = `http://127.0.0.1:${TEST_PORT}`;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {}
    };

    let payload = null;
    if (body) {
      payload = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          // Plain text response (like /metrics or /)
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          json: json
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

describe('CloudTask DevOps Platform Test Suite (CSUL511)', () => {
  before(async () => {
    await new Promise((resolve) => {
      server.listen(TEST_PORT, '127.0.0.1', () => resolve());
    });
  });

  after(async () => {
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
  });

  // 1. Healthcheck Endpoint
  describe('GET /health', () => {
    it('should return HTTP 200 with status UP and healthy checks', async () => {
      const res = await makeRequest('GET', '/health');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.json);
      assert.strictEqual(res.json.status, 'UP');
      assert.strictEqual(res.json.service, 'devops-24eskcs076');
      assert.strictEqual(res.json.version, '1.0.0');
      assert.strictEqual(res.json.checks.api, 'UP');
    });
  });

  // 2. Prometheus Metrics Endpoint
  describe('GET /metrics', () => {
    it('should return HTTP 200 and standard Prometheus exposition format', async () => {
      const res = await makeRequest('GET', '/metrics');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.headers['content-type'].includes('text/plain'));
      assert.ok(res.data.includes('http_requests_total'));
      assert.ok(res.data.includes('http_request_duration_seconds'));
      assert.ok(res.data.includes('process_resident_memory_bytes'));
      assert.ok(res.data.includes('devops-24eskcs076'));
    });
  });

  // 3. Web Dashboard Homepage
  describe('GET /', () => {
    it('should return HTTP 200 with responsive HTML dashboard', async () => {
      const res = await makeRequest('GET', '/');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.headers['content-type'].includes('text/html'));
      assert.ok(res.data.includes('CloudTask DevOps Portal'));
      assert.ok(res.data.includes('24ESKCS076'));
    });
  });

  // 4. Runtime Info API
  describe('GET /api/info', () => {
    it('should return system and node runtime metadata', async () => {
      const res = await makeRequest('GET', '/api/info');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.json.service, 'devops-24eskcs076');
      assert.strictEqual(res.json.student, 'Ayush (24ESKCS076)');
      assert.ok(res.json.node_version);
    });
  });

  // 5. REST API: Tasks CRUD
  describe('REST API /api/tasks', () => {
    let createdTaskId = null;

    it('GET /api/tasks should return list of existing tasks', async () => {
      const res = await makeRequest('GET', '/api/tasks');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(Array.isArray(res.json));
      assert.ok(res.json.length >= 1);
    });

    it('POST /api/tasks should create a new task successfully', async () => {
      const newTask = {
        title: 'Setup Kubernetes Ingress Controller',
        category: 'Kubernetes',
        priority: 'High',
        status: 'In Progress'
      };
      const res = await makeRequest('POST', '/api/tasks', newTask);
      assert.strictEqual(res.statusCode, 201);
      assert.ok(res.json.id);
      assert.strictEqual(res.json.title, newTask.title);
      assert.strictEqual(res.json.category, newTask.category);
      createdTaskId = res.json.id;
    });

    it('POST /api/tasks with empty title should return 400 Bad Request', async () => {
      const res = await makeRequest('POST', '/api/tasks', { title: '   ' });
      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.json.error);
    });

    it('GET /api/tasks/:id should return created task', async () => {
      const res = await makeRequest('GET', `/api/tasks/${createdTaskId}`);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.json.id, createdTaskId);
      assert.strictEqual(res.json.title, 'Setup Kubernetes Ingress Controller');
    });

    it('PUT /api/tasks/:id should toggle status or update fields', async () => {
      const res = await makeRequest('PUT', `/api/tasks/${createdTaskId}`, {
        toggleStatus: true
      });
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.json.status, 'Completed');
    });

    it('DELETE /api/tasks/:id should delete task', async () => {
      const res = await makeRequest('DELETE', `/api/tasks/${createdTaskId}`);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.json.task.id, createdTaskId);

      // Verify it is gone
      const verifyRes = await makeRequest('GET', `/api/tasks/${createdTaskId}`);
      assert.strictEqual(verifyRes.statusCode, 404);
    });
  });

  // 6. Error handling
  describe('Error Handling', () => {
    it('GET non-existent route should return 404', async () => {
      const res = await makeRequest('GET', '/unknown/route/xyz');
      assert.strictEqual(res.statusCode, 404);
      assert.strictEqual(res.json.error, 'Route not found');
    });
  });
});

// Test edge-case boundary check for task validation
