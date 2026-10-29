# CloudTask DevOps Architecture
- **Application Tier**: Node.js microservice serving web UI, REST API, and /metrics
- **Observability Tier**: Prometheus scraping metrics at 15s intervals, Grafana dashboard
- **Orchestration Tier**: Kubernetes Deployment (3 replicas) + Service (NodePort 30080)
