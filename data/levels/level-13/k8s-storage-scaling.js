/* Level 13 - Cloud-Native: Kubernetes Storage and Scaling */
'use strict';
PageData.register('k8s-storage-scaling', {
    "title": "Kubernetes Storage and Scaling",
    "description": "PersistentVolumes, PVCs, StorageClasses, HPA, VPA, Cluster Autoscaler, resource management",
    "level": 13,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>K8s storage provides persistent data for stateful workloads. Scaling ensures applications handle varying load. Together they enable production-grade stateful and elastic systems.</p>"
        },
        {
            "title": "PersistentVolumes and PVCs",
            "content": "<p>PV: cluster-level storage resource. PVC: namespace-level storage request. Binding: PVC requests storage, K8s matches to PV. Access modes: ReadWriteOnce, ReadOnlyMany, ReadWriteMany.</p>",
            "code": "apiVersion: v1\nkind: PersistentVolumeClaim\nmetadata:\n name: data-pvc\nspec:\n accessModes: [ReadWriteOnce]\n storageClassName: fast-ssd\n resources:\n requests:\n storage: 10Gi\n---\n# Mount in pod\nspec:\n containers:\n - name: app\n volumeMounts:\n - name: data\n mountPath: /data\n volumes:\n - name: data\n persistentVolumeClaim:\n claimName: data-pvc",
            "language": "yaml"
        },
        {
            "title": "StorageClasses",
            "content": "<p>Define storage tiers: fast SSD, standard HDD, network-attached. Dynamic provisioning creates PVs automatically when PVC is created. Reclaim policies: Retain, Delete.</p>"
        },
        {
            "title": "Horizontal Pod Autoscaler",
            "content": "<p>Scales pod replicas based on metrics: CPU, memory, custom metrics. Target utilization percentage. Cooldown periods prevent thrashing.</p>",
            "code": "apiVersion: autoscaling/v2\nkind: HorizontalPodAutoscaler\nmetadata:\n name: web-hpa\nspec:\n scaleTargetRef:\n apiVersion: apps/v1\n kind: Deployment\n name: web-app\n minReplicas: 2\n maxReplicas: 20\n metrics:\n - type: Resource\n resource:\n name: cpu\n target:\n type: Utilization\n averageUtilization: 70",
            "language": "yaml",
            "mermaid": "graph LR\n Metrics[Metrics Server] --> HPA\n HPA --> Scale{CPU > 70%?}\n Scale -->|Yes| Up[Scale Up]\n Scale -->|No| Check{CPU < 30%?}\n Check -->|Yes| Down[Scale Down]"
        },
        {
            "title": "Vertical Pod Autoscaler",
            "content": "<p>Adjusts resource requests/limits per container. Modes: Off (recommendations only), Auto (applies changes). Helps right-size containers without manual tuning.</p>"
        },
        {
            "title": "Cluster Autoscaler",
            "content": "<p>Adds/removes nodes based on pending pods (cant schedule = scale up) and underutilized nodes (scale down). Works with cloud provider node groups/pools.</p>",
            "mermaid": "graph TD\n Pod[Pending Pod] --> CA[Cluster Autoscaler]\n CA --> Node[New Node Added]\n Node --> Pod2[Pod Scheduled]\n Empty[Underutilized Node] --> CA\n CA --> Remove[Node Removed]"
        },
        {
            "title": "Resource Requests and Limits",
            "content": "<p>Requests: guaranteed resources for scheduling. Limits: maximum allowed. QoS classes: Guaranteed (requests=limits), Burstable (requests < limits), BestEffort (no requests/limits).</p>"
        },
        {
            "title": "Common Mistakes",
            "content": "",
            "callout": {
                "type": "warning",
                "title": "Pitfalls",
                "text": "<ul><li>No requests = BestEffort (first to be evicted)</li><li>Limits too low = OOMKilled</li><li>HPA on CPU only (misses real bottlenecks)</li><li>No PDB with HPA (scale-down kills too many)</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Topics",
                "text": "<ul><li>PV lifecycle and reclaim policies</li><li>HPA vs VPA use cases</li><li>Resource requests vs limits</li><li>Scaling strategies for stateful apps</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "PV vs PVC?",
            "answer": "<p>PV: cluster storage resource (admin creates). PVC: pod storage request (developer creates). PVC binds to matching PV.</p>"
        },
        {
            "id": "q2",
            "level": "junior",
            "title": "What does HPA do?",
            "answer": "<p>Automatically scales pod replicas based on CPU/memory/custom metrics. Scales up when load increases, down when it decreases.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "StorageClass purpose?",
            "answer": "<p>Defines storage tiers with provisioner and parameters. Enables dynamic PV provisioning - PVC creation auto-creates matching PV. No manual PV management needed.</p>"
        },
        {
            "id": "q4",
            "level": "mid",
            "title": "Resource requests vs limits?",
            "answer": "<p>Requests: guaranteed minimum for scheduling. Limits: max allowed (OOMKilled if exceeded). Requests affect scheduling; limits affect runtime enforcement.</p>"
        },
        {
            "id": "q5",
            "level": "mid",
            "title": "QoS classes?",
            "answer": "<p>Guaranteed (requests=limits): last evicted. Burstable (requests<limits): middle priority. BestEffort (no resources): first evicted under pressure.</p>"
        },
        {
            "id": "q6",
            "level": "senior",
            "title": "HPA with custom metrics?",
            "answer": "<p>Scale on queue depth, request rate, business KPIs. Requires metrics adapter (Prometheus adapter). Better than CPU alone for real demand signals.</p>"
        },
        {
            "id": "q7",
            "level": "senior",
            "title": "Scale stateful applications?",
            "answer": "<p>StatefulSets scale carefully: ordered creation/deletion, stable network IDs. Storage auto-provisioned per replica. Consider read-replicas for DB scaling.</p>"
        },
        {
            "id": "q8",
            "level": "lead",
            "title": "Cluster autoscaler design?",
            "answer": "<p>Multiple node pools (CPU-optimized, memory-optimized, GPU). Priorities for scaling. Mixed on-demand + spot instances. Pod priority for scheduling order during scale-up lag.</p>"
        },
        {
            "id": "q9",
            "level": "architect",
            "title": "Cost optimization for elastic workloads?",
            "answer": "<p>Right-size via VPA recommendations, spot/preemptible for stateless, reserved for baseline, HPA for elastic, scale-to-zero for dev/staging, cluster autoscaler for infra elasticity.</p>"
        }
    ]
});
