/**
 * metrics.js - CloudTask DevOps Platform Prometheus Metrics Collector
 * Complies with Prometheus Exposition Format (0.0.4)
 * Course: DevOps Practices and Principles (CSUL511)
 */

const os = require('node:os');
const process = require('node:process');

class PrometheusRegistry {
  constructor() {
    this.requestCounters = new Map(); // key: method|path|status -> count
    this.requestDurations = [];       // array of duration numbers in seconds
    this.durationBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
    this.bucketCounts = new Map();
    this.startTime = Date.now();

    // Initialize buckets
    for (const b of this.durationBuckets) {
      this.bucketCounts.set(b, 0);
    }
    this.bucketCounts.set('+Inf', 0);
  }

  recordRequest(method, path, status, durationSec) {
    const normPath = this._normalizePath(path);
    const key = `${method}|${normPath}|${status}`;
    const cur = this.requestCounters.get(key) || 0;
    this.requestCounters.set(key, cur + 1);

    // Keep last 1000 durations for memory efficiency
    if (this.requestDurations.length > 1000) {
      this.requestDurations.shift();
    }
    this.requestDurations.push(durationSec);

    // Update histogram buckets
    for (const b of this.durationBuckets) {
      if (durationSec <= b) {
        this.bucketCounts.set(b, (this.bucketCounts.get(b) || 0) + 1);
      }
    }
    this.bucketCounts.set('+Inf', (this.bucketCounts.get('+Inf') || 0) + 1);
  }

  _normalizePath(p) {
    if (!p) return '/';
    if (p.startsWith('/api/tasks/')) return '/api/tasks/:id';
    const clean = p.split('?')[0];
    return clean || '/';
  }

  toPrometheusText(taskCount = 0) {
    const lines = [];
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    const uptimeSec = (Date.now() - this.startTime) / 1000;

    // Help & Type comments
    lines.push('# HELP app_info Application metadata and version info.');
    lines.push('# TYPE app_info gauge');
    lines.push(`app_info{service="devops-24eskcs076",version="1.0.0",node_version="${process.version}",course="CSUL511"} 1`);
    lines.push('');

    lines.push('# HELP http_requests_total Total number of HTTP requests processed.');
    lines.push('# TYPE http_requests_total counter');
    if (this.requestCounters.size === 0) {
      lines.push('http_requests_total{method="GET",path="/",status="200"} 0');
    } else {
      for (const [key, count] of this.requestCounters.entries()) {
        const [method, path, status] = key.split('|');
        lines.push(`http_requests_total{method="${method}",path="${path}",status="${status}"} ${count}`);
      }
    }
    lines.push('');

    // Histogram
    lines.push('# HELP http_request_duration_seconds HTTP request latency in seconds.');
    lines.push('# TYPE http_request_duration_seconds histogram');
    for (const b of this.durationBuckets) {
      lines.push(`http_request_duration_seconds_bucket{le="${b}"} ${this.bucketCounts.get(b) || 0}`);
    }
    lines.push(`http_request_duration_seconds_bucket{le="+Inf"} ${this.bucketCounts.get('+Inf') || 0}`);
    const sum = this.requestDurations.reduce((a, b) => a + b, 0);
    lines.push(`http_request_duration_seconds_sum ${sum.toFixed(6)}`);
    lines.push(`http_request_duration_seconds_count ${this.requestDurations.length}`);
    lines.push('');

    // Process & Memory Metrics
    lines.push('# HELP process_uptime_seconds The total uptime of the application in seconds.');
    lines.push('# TYPE process_uptime_seconds counter');
    lines.push(`process_uptime_seconds ${uptimeSec.toFixed(2)}`);
    lines.push('');

    lines.push('# HELP process_resident_memory_bytes Resident memory size in bytes.');
    lines.push('# TYPE process_resident_memory_bytes gauge');
    lines.push(`process_resident_memory_bytes ${mem.rss}`);
    lines.push('');

    lines.push('# HELP nodejs_heap_size_total_bytes Process heap size in bytes.');
    lines.push('# TYPE nodejs_heap_size_total_bytes gauge');
    lines.push(`nodejs_heap_size_total_bytes ${mem.heapTotal}`);
    lines.push('');

    lines.push('# HELP nodejs_heap_size_used_bytes Process heap size used in bytes.');
    lines.push('# TYPE nodejs_heap_size_used_bytes gauge');
    lines.push(`nodejs_heap_size_used_bytes ${mem.heapUsed}`);
    lines.push('');

    lines.push('# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.');
    lines.push('# TYPE process_cpu_user_seconds_total counter');
    lines.push(`process_cpu_user_seconds_total ${(cpu.user / 1e6).toFixed(6)}`);
    lines.push('');

    lines.push('# HELP process_cpu_system_seconds_total Total system CPU time spent in seconds.');
    lines.push('# TYPE process_cpu_system_seconds_total counter');
    lines.push(`process_cpu_system_seconds_total ${(cpu.system / 1e6).toFixed(6)}`);
    lines.push('');

    // Business Metric: Task Count
    lines.push('# HELP devops_tasks_total Current number of tracked DevOps tasks in the system.');
    lines.push('# TYPE devops_tasks_total gauge');
    lines.push(`devops_tasks_total ${taskCount}`);
    lines.push('');

    return lines.join('\n');
  }
}

const metrics = new PrometheusRegistry();
module.exports = metrics;
