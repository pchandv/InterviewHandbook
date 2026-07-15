/* ═══════════════════════════════════════════════════════════════════
   Cloud Networking: VPC/VNet, Security Groups, Load Balancers, DNS
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('cloud-networking', {
    title: 'Cloud Networking',
    description: 'VPC/VNet architecture, subnets, security groups, NAT gateways, load balancers (L4 vs L7), peering, private endpoints, DNS, VPN, and hybrid connectivity patterns for cloud interviews.',
    sections: [
        {
            title: 'Introduction to Cloud Networking',
            content: `<p>Cloud networking is the foundation every deployed workload sits on. Understanding how virtual networks isolate traffic, how subnets segment tiers, and how gateways control ingress/egress is essential for any cloud architect or senior engineer interview.</p>
            <p>Whether you work with AWS VPC, Azure VNet, or GCP VPC, the concepts are nearly identical: define an address space, carve it into subnets, attach route tables, and layer security controls. The interview focus is on <strong>why</strong> you make certain choices, not just how to click through a console.</p>
            <p>Key topics include: subnet design for security tiers, load balancer selection (L4 vs L7), peering strategies for multi-VPC architectures, private connectivity for PaaS services, and hybrid connectivity to on-premises data centers. These form the backbone of any cloud deployment conversation at the senior engineering or solutions architect level.</p>`
        },
        {
            title: 'VPC/VNet Architecture',
            content: `<p>A <strong>Virtual Private Cloud (VPC)</strong> or <strong>Virtual Network (VNet)</strong> is an isolated, software-defined network within a cloud region. You control the IP address range (CIDR block), subnet placement across availability zones, route tables, and gateways.</p>
            <ul>
                <li><strong>Public Subnet</strong> — has a route to an Internet Gateway (IGW); resources get public IPs and can receive inbound internet traffic.</li>
                <li><strong>Private Subnet</strong> — no direct internet route; resources can only reach the internet via a NAT Gateway in a public subnet.</li>
                <li><strong>Route Tables</strong> — rules that determine where network traffic is directed (local, IGW, NAT, peering, VPN).</li>
                <li><strong>CIDR Planning</strong> — choose non-overlapping ranges (e.g., 10.0.0.0/16) to enable future peering without conflicts.</li>
                <li><strong>Elastic Network Interface (ENI)</strong> — virtual NIC attached to instances. Enables multi-homed instances, secondary IPs, and moving interfaces between instances for HA.</li>
                <li><strong>Availability Zone Placement</strong> — distribute subnets across AZs for resilience. Each AZ is a physically separate data center with independent power, cooling, and networking.</li>
            </ul>
            <p><strong>CIDR planning best practices:</strong> Use /16 for VPCs (65,536 IPs), /24 for subnets (254 usable IPs). Reserve ranges for future growth. Document all allocations in an IPAM (IP Address Management) system. AWS and Azure offer IPAM services to prevent conflicts across the organization.</p>`,
            code: `// Terraform — VPC with public and private subnets
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "production-vpc" }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true
  tags = { Name = "public-subnet-1a" }
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "us-east-1a"
  tags = { Name = "private-subnet-1a" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}`,
            language: 'hcl'
        },
        {
            title: 'VPC Architecture with Subnets and NAT',
            mermaid: `graph TB
    subgraph VPC["VPC 10.0.0.0/16"]
        subgraph AZ1["Availability Zone 1"]
            PUB1["Public Subnet<br/>10.0.1.0/24"]
            PRIV1["Private Subnet<br/>10.0.10.0/24"]
        end
        subgraph AZ2["Availability Zone 2"]
            PUB2["Public Subnet<br/>10.0.2.0/24"]
            PRIV2["Private Subnet<br/>10.0.20.0/24"]
        end
    end

    IGW["Internet Gateway"] --> PUB1
    IGW --> PUB2
    ALB["Application Load Balancer"] --> PUB1
    ALB --> PUB2
    PUB1 --> NAT1["NAT Gateway"]
    NAT1 --> PRIV1
    PUB2 --> NAT2["NAT Gateway"]
    NAT2 --> PRIV2
    PRIV1 --> APP1["App Servers"]
    PRIV2 --> APP2["App Servers"]
    PRIV1 --> DB1["RDS Primary"]
    PRIV2 --> DB2["RDS Replica"]
    INTERNET["Internet"] --> IGW`,
            content: `<p>This diagram shows a typical production VPC layout with multi-AZ redundancy. Public subnets host load balancers and NAT gateways, while private subnets contain application servers and databases that never receive direct internet traffic.</p>`
        },
        {
            title: 'Network Security Groups and Rules',
            content: `<p><strong>Security Groups (AWS)</strong> and <strong>Network Security Groups (Azure)</strong> are stateful firewalls applied at the instance/NIC level. They define allowed inbound and outbound traffic by protocol, port, and source/destination.</p>
            <ul>
                <li><strong>Stateful</strong> — if inbound is allowed, the response is automatically permitted (no explicit outbound rule needed for return traffic).</li>
                <li><strong>Default deny</strong> — all inbound traffic denied unless explicitly allowed; all outbound allowed by default (AWS).</li>
                <li><strong>Chaining</strong> — reference another security group as source, creating trust relationships (e.g., ALB SG → App SG → DB SG).</li>
                <li><strong>NACLs (AWS)</strong> — subnet-level stateless firewalls; evaluated before security groups. Use for broad deny rules.</li>
            </ul>`,
            code: `// Terraform — Security Group chaining pattern
resource "aws_security_group" "alb_sg" {
  vpc_id = aws_vpc.main.id
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  // Public internet
  }
}

resource "aws_security_group" "app_sg" {
  vpc_id = aws_vpc.main.id
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]  // Only from ALB
  }
}

resource "aws_security_group" "db_sg" {
  vpc_id = aws_vpc.main.id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]  // Only from App
  }
}`,
            language: 'hcl'
        },
        {
            title: 'NAT Gateway and Load Balancers',
            content: `<p><strong>NAT Gateway</strong> allows instances in private subnets to initiate outbound internet connections (for updates, API calls) without being reachable from the internet. It performs source NAT using an Elastic IP.</p>
            <p><strong>Load Balancers</strong> distribute traffic across healthy targets:</p>
            <table><thead><tr><th>Type</th><th>Layer</th><th>Use Cases</th><th>Features</th></tr></thead><tbody>
                <tr><td>Network LB (NLB)</td><td>L4 (TCP/UDP)</td><td>High throughput, low latency, static IP needs</td><td>Millions RPS, preserves source IP, TLS passthrough</td></tr>
                <tr><td>Application LB (ALB)</td><td>L7 (HTTP/HTTPS)</td><td>Web apps, path/host routing, WebSocket</td><td>Content-based routing, WAF integration, gRPC support</td></tr>
                <tr><td>Gateway LB (GWLB)</td><td>L3</td><td>Network appliances (firewalls, IDS)</td><td>Transparent inline inspection, GENEVE encapsulation</td></tr>
            </tbody></table>
            <p><strong>When to use NLB vs ALB:</strong> Use NLB when you need raw TCP/UDP performance, static IPs, or TLS passthrough. Use ALB when you need HTTP path-based routing, host-based routing, sticky sessions, or WAF integration.</p>`
        },
        {
            title: 'VPC Peering, Transit Gateway, and Private Endpoints',
            content: `<p><strong>VPC Peering</strong> creates a direct network connection between two VPCs (same or cross-account/region). Traffic stays on the cloud backbone. Limitation: non-transitive (A↔B and B↔C does not mean A↔C).</p>
            <p><strong>Transit Gateway (AWS) / Virtual WAN Hub (Azure)</strong> solves the peering mesh problem by providing a central hub that connects multiple VPCs, VPNs, and Direct Connect in a star topology.</p>
            <p><strong>Private Endpoints / PrivateLink</strong> allow you to access PaaS services (S3, Azure SQL, Key Vault) over a private IP within your VNet, eliminating the need for internet-bound traffic. This is critical for regulated industries.</p>`,
            code: `// Azure Bicep — Private Endpoint for Azure SQL
resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-04-01' = {
  name: 'pe-sqlserver-prod'
  location: resourceGroup().location
  properties: {
    subnet: { id: privateSubnet.id }
    privateLinkServiceConnections: [{
      name: 'sqlConnection'
      properties: {
        privateLinkServiceId: sqlServer.id
        groupIds: ['sqlServer']
      }
    }]
  }
}

// After this, SQL Server is accessible at a private IP
// e.g., 10.0.10.5 instead of myserver.database.windows.net (public)`,
            language: 'hcl'
        },
        {
            title: 'Hub-Spoke Network Topology',
            mermaid: `graph TB
    subgraph Hub["Hub VPC/VNet"]
        TGW["Transit Gateway / Hub"]
        FW["Network Firewall / NVA"]
        VPN_GW["VPN Gateway"]
        DNS_FWD["DNS Forwarder"]
    end

    subgraph Spoke1["Spoke: Production"]
        APP_VPC["App VPC 10.1.0.0/16"]
    end

    subgraph Spoke2["Spoke: Staging"]
        STG_VPC["Staging VPC 10.2.0.0/16"]
    end

    subgraph Spoke3["Spoke: Shared Services"]
        SVC_VPC["Services VPC 10.3.0.0/16"]
    end

    subgraph OnPrem["On-Premises Data Center"]
        DC["Corporate Network 192.168.0.0/16"]
    end

    APP_VPC --> TGW
    STG_VPC --> TGW
    SVC_VPC --> TGW
    TGW --> FW
    TGW --> VPN_GW
    VPN_GW -->|"VPN / Direct Connect"| DC`,
            content: `<p>The <strong>hub-spoke (star) topology</strong> centralizes shared services (firewall, DNS, VPN gateway) in a hub VPC, with application VPCs as spokes connected via Transit Gateway. This avoids full-mesh peering complexity and provides a single inspection point for traffic.</p>
            <p><strong>Key benefits:</strong> centralized security inspection, simplified routing, shared DNS resolution, single connection point to on-premises networks, and isolation between spokes (traffic must transit the hub).</p>`
        },
        {
            title: 'DNS and Hybrid Connectivity',
            content: `<p><strong>Cloud DNS Services:</strong></p>
            <ul>
                <li><strong>Route 53 (AWS)</strong> — authoritative DNS + health checks + routing policies (weighted, latency, failover, geolocation).</li>
                <li><strong>Azure DNS</strong> — zone hosting + Private DNS Zones for VNet name resolution.</li>
                <li><strong>Private DNS Zones</strong> — resolve internal names (e.g., db.internal.company.com) within VPCs/VNets without exposing to the internet.</li>
                <li><strong>Cloud DNS (GCP)</strong> — managed DNS with DNSSEC support and private zones per VPC.</li>
            </ul>
            <p><strong>DNS Resolution Patterns:</strong></p>
            <ul>
                <li><strong>Split-horizon DNS</strong> — same domain resolves to private IP internally, public IP externally. Essential for services with both internal and external consumers.</li>
                <li><strong>Service discovery</strong> — use private DNS zones or service registries (Cloud Map, Consul) for microservice-to-microservice name resolution.</li>
                <li><strong>Conditional forwarding</strong> — cloud DNS forwards queries for on-prem domains to corporate DNS, and vice versa.</li>
            </ul>
            <p><strong>Hybrid Connectivity Options:</strong></p>
            <table><thead><tr><th>Option</th><th>Bandwidth</th><th>Latency</th><th>Use Case</th></tr></thead><tbody>
                <tr><td>Site-to-Site VPN</td><td>Up to ~1.25 Gbps per tunnel</td><td>Variable (internet)</td><td>Quick setup, dev/test, backup path</td></tr>
                <tr><td>AWS Direct Connect</td><td>1–100 Gbps</td><td>Consistent, low</td><td>Production hybrid, large data transfers</td></tr>
                <tr><td>Azure ExpressRoute</td><td>1–100 Gbps</td><td>Consistent, low</td><td>Production hybrid, compliance requirements</td></tr>
                <tr><td>VPN over ExpressRoute</td><td>ExpressRoute BW</td><td>Low</td><td>Encrypted traffic over private connection</td></tr>
            </tbody></table>
            <p><strong>Best practice:</strong> Use Direct Connect / ExpressRoute as primary path for production traffic with VPN as automated failover via BGP route preference. Test failover quarterly to ensure the backup path works when needed.</p>`
        },
        {
            title: 'Network Architecture Patterns',
            content: `<p>Production cloud deployments follow well-established patterns for security, scalability, and compliance:</p>
            <p><strong>Three-Tier Architecture:</strong></p>
            <ul>
                <li><strong>Tier 1 (Web/Public)</strong> — ALB in public subnets, terminates TLS, integrates with WAF and CloudFront/CDN.</li>
                <li><strong>Tier 2 (Application/Private)</strong> — compute (ECS, EKS, EC2) in private subnets, accessible only from ALB.</li>
                <li><strong>Tier 3 (Data/Isolated)</strong> — databases, caches in isolated subnets, accessible only from app tier. No internet route.</li>
            </ul>
            <p><strong>Zero-Trust Network Model:</strong></p>
            <ul>
                <li>Never trust network location alone — authenticate and authorize every request.</li>
                <li>Encrypt all traffic (mTLS between services, TLS to databases).</li>
                <li>Private endpoints for all PaaS services (no public internet exposure).</li>
                <li>Micro-segmentation with security groups per service, not per tier.</li>
                <li>Identity-based access (IAM roles, managed identities) over network-based access.</li>
            </ul>
            <p><strong>Landing Zone Pattern:</strong> Pre-configured, multi-account network architecture with shared networking account (Transit Gateway, DNS), security account (centralized logging), and workload accounts per team/environment.</p>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>Overlapping CIDRs</strong> — using the same IP range in multiple VPCs makes peering impossible. Plan non-overlapping ranges from day one.</li>
                <li><strong>Single NAT Gateway</strong> — a single NAT in one AZ becomes a single point of failure and a cross-AZ data transfer cost. Deploy one per AZ.</li>
                <li><strong>Overly permissive security groups</strong> — allowing 0.0.0.0/0 on non-public ports. Use SG-to-SG references for internal communication.</li>
                <li><strong>No private endpoints for PaaS</strong> — routing traffic to S3/SQL over the internet when PrivateLink keeps it on the backbone.</li>
                <li><strong>Ignoring data transfer costs</strong> — cross-AZ, cross-region, and NAT gateway data charges add up fast at scale.</li>
                <li><strong>Full-mesh peering</strong> — peering every VPC to every other VPC instead of using Transit Gateway creates operational nightmare.</li>
                <li><strong>No DNS strategy</strong> — relying on IP addresses instead of DNS names makes infrastructure rigid and hard to migrate.</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
                    <li><strong>Security-first thinking</strong> — default deny, least privilege, SG chaining, private subnets for data tiers</li>
                    <li><strong>Multi-AZ awareness</strong> — always mention high availability across availability zones</li>
                    <li><strong>Cost consciousness</strong> — NAT gateway costs, data transfer fees, VPN vs Direct Connect trade-offs</li>
                    <li><strong>Explain WHY</strong> — why private subnet for DB (no inbound internet), why ALB over NLB (need path routing)</li>
                    <li><strong>Draw the diagram</strong> — whiteboard a VPC with public/private subnets, NAT, and LB quickly and clearly</li>
                    <li><strong>Know the limits</strong> — max 5 VPCs per region default, SG rules limits, peering is non-transitive</li>
                    <li><strong>Hybrid story</strong> — if asked about on-prem connectivity, compare VPN (quick/cheap) vs Direct Connect (reliable/fast)</li>
                </ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>VPCs provide network isolation; subnets control public vs private exposure; route tables direct traffic flow.</li>
                <li>Security Groups are stateful instance-level firewalls — chain them (ALB→App→DB) for defense in depth.</li>
                <li>NAT Gateway enables private subnet outbound internet without inbound exposure — deploy one per AZ.</li>
                <li>ALB (L7) for HTTP routing and features; NLB (L4) for raw TCP performance and static IPs.</li>
                <li>Transit Gateway replaces mesh peering with a scalable hub-spoke model.</li>
                <li>Private Endpoints keep PaaS traffic off the public internet — mandatory for regulated workloads.</li>
                <li>Plan CIDR ranges carefully — overlaps block peering and cause painful re-addressing.</li>
                <li>Direct Connect/ExpressRoute for production hybrid; VPN for quick setup and backup paths.</li>
                <li>Consider zero-trust networking: authenticate every request regardless of network location.</li>
            </ul>`
        }
    ],
    questions: [
        {
            question: 'Explain the difference between public and private subnets. How does a private subnet access the internet?',
            difficulty: 'easy',
            answer: `<p>A <strong>public subnet</strong> has a route table entry pointing 0.0.0.0/0 to an Internet Gateway, and instances can have public IPs for direct internet communication. A <strong>private subnet</strong> has no IGW route — instances cannot be reached from the internet.</p>
            <p>For outbound internet (package updates, API calls), private subnet traffic routes through a <strong>NAT Gateway</strong> in a public subnet. The NAT Gateway performs source address translation using its Elastic IP, sends traffic to the IGW, and routes responses back to the originating instance.</p>`,
            interviewTip: 'Draw the flow: Private Instance → Route Table (0.0.0.0/0 → NAT) → NAT GW in public subnet → IGW → Internet. Emphasize that NAT only allows outbound-initiated connections.',
            followUp: ['What is the cost implication of NAT Gateways?', 'How do you make NAT highly available?', 'When would you use a NAT Instance instead?'],
            seniorPerspective: 'I deploy a NAT Gateway per AZ for resilience and to avoid cross-AZ data charges. For high-volume outbound, I evaluate VPC endpoints (S3, DynamoDB) to bypass NAT entirely and reduce both cost and latency.',
            architectPerspective: 'The public/private split is the first security boundary. Everything that does not need inbound internet (app servers, databases, workers) belongs in private subnets. This principle should be non-negotiable in any architecture review.'
        },
        {
            question: 'When would you choose an Application Load Balancer (ALB) over a Network Load Balancer (NLB)?',
            difficulty: 'medium',
            answer: `<p>Choose <strong>ALB (Layer 7)</strong> when you need HTTP-aware features: path-based routing (/api/* → service A, /web/* → service B), host-based routing (api.example.com vs web.example.com), WebSocket support, gRPC, WAF integration, authentication (OIDC/Cognito), or sticky sessions.</p>
            <p>Choose <strong>NLB (Layer 4)</strong> when you need: ultra-low latency (no HTTP parsing), millions of requests per second, static IP addresses (needed for allowlisting), TLS passthrough to backend, non-HTTP protocols (TCP/UDP), or PrivateLink service fronting.</p>`,
            interviewTip: 'The deciding question is: "Do I need to inspect HTTP content to make routing decisions?" If yes → ALB. If you need raw TCP performance or static IPs → NLB. Many architectures use both: NLB for external static IP → ALB for internal routing.',
            followUp: ['Can you put an NLB in front of an ALB? Why would you?', 'How does ALB integrate with WAF?', 'What is cross-zone load balancing?'],
            seniorPerspective: 'I default to ALB for all HTTP workloads — the routing flexibility and WAF integration save building that logic in code. I reach for NLB only when I need static IPs for partner allowlisting or am fronting non-HTTP services.',
            architectPerspective: 'The ALB vs NLB choice cascades into the architecture. ALB enables a single entry point with content-based routing to microservices, reducing the need for an API gateway layer. NLB plus PrivateLink enables secure service exposure across accounts without peering.'
        },
        {
            question: 'How do Security Groups differ from NACLs, and how would you design a multi-tier security strategy?',
            difficulty: 'medium',
            answer: `<p><strong>Security Groups</strong> are stateful, instance-level firewalls (allow rules only, return traffic automatic). <strong>NACLs</strong> are stateless, subnet-level firewalls (allow and deny rules, must explicitly allow return traffic). NACLs are evaluated first.</p>
            <p>Multi-tier strategy: NACLs for broad deny rules (block known bad CIDRs, restrict subnet-to-subnet). Security Groups for fine-grained allow rules chained by reference: ALB SG allows 443 from 0.0.0.0/0 → App SG allows 8080 from ALB SG → DB SG allows 5432 from App SG. This creates defense in depth where each tier only talks to its neighbors.</p>`,
            interviewTip: 'Emphasize the stateful vs stateless distinction — it is the most commonly tested difference. Then show you understand the layering: NACLs as a coarse subnet guard, SGs as precise instance-level control.',
            followUp: ['What happens if a NACL denies traffic but a Security Group allows it?', 'How do you audit overly permissive security groups?', 'What is the maximum number of rules per SG?'],
            seniorPerspective: 'I rely primarily on Security Groups with SG-to-SG references — they are self-documenting and auto-scale with instances. I use NACLs sparingly for emergency blocks or compliance requirements that mandate subnet-level controls.',
            architectPerspective: 'The security model should be declarative and auditable. SG chaining creates an explicit trust graph between tiers. Combined with VPC Flow Logs and automated auditing, this provides both security and compliance evidence.'
        },
        {
            question: 'Explain VPC Peering vs Transit Gateway. When would you use each?',
            difficulty: 'hard',
            answer: `<p><strong>VPC Peering</strong> creates a 1:1 connection between two VPCs with no bandwidth bottleneck (uses AWS backbone). It is non-transitive: if VPC-A peers with VPC-B and VPC-B peers with VPC-C, VPC-A cannot reach VPC-C through VPC-B.</p>
            <p><strong>Transit Gateway (TGW)</strong> is a regional hub that connects multiple VPCs, VPNs, and Direct Connect attachments in a star topology. It is transitive — any attached network can route to any other (controlled by TGW route tables). It supports inter-region peering.</p>
            <p><strong>Use peering</strong> for simple 2-3 VPC connections with high bandwidth needs. <strong>Use TGW</strong> when connecting 4+ VPCs, need centralized routing/firewalling, hybrid connectivity, or transitive routing.</p>`,
            interviewTip: 'The key word is "non-transitive" for peering. Mention that at N VPCs, peering requires N*(N-1)/2 connections (mesh), while TGW needs only N attachments (star). This scaling argument sells TGW for enterprise.',
            followUp: ['What are the cost differences between peering and TGW?', 'How does TGW inter-region peering work?', 'Can you isolate spokes from each other in TGW?'],
            seniorPerspective: 'I start with peering for 2-3 VPCs where the bandwidth is free (peering has no per-GB charge vs TGW). Once we hit 4+ VPCs or need centralized inspection, I migrate to TGW and accept the per-GB processing fee for the operational simplicity.',
            architectPerspective: 'Transit Gateway is the enterprise network backbone in the cloud. Combined with a Network Firewall in the hub, it provides centralized security inspection, consistent routing policy, and a single connection point for hybrid. The cost is justified by operational governance.'
        },
        {
            question: 'What are Private Endpoints / PrivateLink, and why are they important for security?',
            difficulty: 'medium',
            answer: `<p><strong>Private Endpoints</strong> (Azure) / <strong>VPC Endpoints</strong> (AWS) create a private IP address within your VNet/VPC that connects directly to a PaaS service (S3, Azure SQL, Key Vault) over the Microsoft/AWS backbone — traffic never traverses the public internet.</p>
            <p><strong>PrivateLink</strong> extends this to expose your own services privately to other VPCs/accounts without peering. The consumer gets a private IP; the provider runs behind a Network Load Balancer.</p>
            <p>Security benefits: eliminates data exfiltration via public endpoints, satisfies compliance (PCI, HIPAA) requirements, removes need for NAT/IGW for PaaS access, enables fine-grained access via private DNS zones.</p>`,
            interviewTip: 'Frame it as "keeping traffic off the internet." Mention that you combine private endpoints with disabling public access on the PaaS service to fully lock it down. This shows defense-in-depth thinking.',
            followUp: ['What is the difference between Gateway and Interface endpoints in AWS?', 'How do private DNS zones work with private endpoints?', 'How does PrivateLink enable SaaS service exposure?'],
            seniorPerspective: 'Every PaaS service in my architectures gets a private endpoint, and I disable public access on the resource. The small per-hour cost is insignificant compared to the security posture improvement and compliance simplification.',
            architectPerspective: 'Private Endpoints are a foundational control for zero-trust networking. They eliminate an entire class of data exfiltration risks and simplify compliance narratives. The architecture principle: no PaaS service should be reachable from the public internet in production.'
        },
        {
            question: 'How would you design hybrid connectivity between on-premises and cloud? Compare VPN vs Direct Connect/ExpressRoute.',
            difficulty: 'hard',
            answer: `<p><strong>Site-to-Site VPN</strong> creates encrypted tunnels over the public internet. Setup in hours, ~1.25 Gbps per tunnel (can aggregate). Latency varies with internet conditions. Cost: low fixed + data transfer.</p>
            <p><strong>Direct Connect / ExpressRoute</strong> provides a dedicated private connection from your data center to the cloud. Consistent low latency, 1–100 Gbps, does not traverse the public internet. Setup takes weeks (physical cross-connect). Higher fixed cost.</p>
            <p><strong>Design pattern:</strong> Use Direct Connect as primary for production traffic (consistent performance) and VPN as failover (automatic via BGP). For non-production or low-bandwidth needs, VPN alone suffices.</p>`,
            interviewTip: 'Compare across three axes: setup time, reliability, and cost model. Mention BGP for dynamic routing and failover between the two. Show you understand this is not either/or — production environments often use both.',
            followUp: ['How does BGP failover between Direct Connect and VPN work?', 'What is a Direct Connect Gateway for multi-region?', 'How do you encrypt traffic over Direct Connect?'],
            seniorPerspective: 'I design with Direct Connect primary + VPN backup with BGP failover. The VPN automatically takes over if DC goes down, and we can shift non-critical traffic to VPN during DC maintenance windows. We test failover quarterly.',
            architectPerspective: 'Hybrid connectivity is a reliability and compliance decision, not just a bandwidth one. Direct Connect provides predictable latency for real-time data sync and meets compliance requirements for private connectivity. The VPN backup ensures business continuity.'
        },
        {
            question: 'Explain DNS resolution in a multi-VPC and hybrid environment. How do private DNS zones work?',
            difficulty: 'hard',
            answer: `<p>In multi-VPC environments, <strong>Private DNS Zones</strong> provide name resolution visible only within linked VPCs/VNets. For example, a private zone "internal.company.com" resolves db.internal.company.com to 10.0.10.5 only within your networks.</p>
            <p><strong>DNS resolution flow:</strong> Instance queries VPC DNS resolver (e.g., AmazonProvidedDNS at VPC CIDR+2) → checks private hosted zones → if no match, forwards to public DNS. For hybrid, Route 53 Resolver endpoints forward queries between cloud and on-premises DNS servers bidirectionally.</p>
            <p><strong>Split-horizon DNS:</strong> Same domain resolves differently internally (private IP) vs externally (public IP). Essential for services accessible both internally and from the internet.</p>`,
            interviewTip: 'Show you understand the resolution chain and that private zones override public ones within linked VPCs. Mention conditional forwarding for hybrid (cloud DNS → on-prem DNS for corp domains, and vice versa).',
            followUp: ['How do Route 53 Resolver inbound/outbound endpoints work?', 'What is split-horizon DNS and when do you need it?', 'How do private endpoints interact with DNS?'],
            seniorPerspective: 'I use private DNS zones for all internal service discovery and configure Route 53 Resolver endpoints for bidirectional forwarding with on-prem DNS. This lets teams use friendly names and makes infrastructure changes transparent to applications.',
            architectPerspective: 'DNS is the service discovery layer of the network. A well-designed DNS architecture (private zones + conditional forwarding + auto-registration) decouples applications from infrastructure topology and enables seamless migration between environments.'
        },
        {
            question: 'How do you minimize data transfer costs in cloud networking?',
            difficulty: 'medium',
            answer: `<p>Cloud data transfer costs are often the surprise on the bill. Key strategies:</p>
            <ul>
                <li><strong>Same-AZ communication</strong> — keep tightly coupled services in the same AZ (free within AZ, ~$0.01/GB cross-AZ).</li>
                <li><strong>VPC Endpoints for S3/DynamoDB</strong> — Gateway endpoints are free and avoid NAT Gateway data processing charges.</li>
                <li><strong>Private Endpoints for PaaS</strong> — avoids NAT Gateway costs for accessing cloud services.</li>
                <li><strong>CloudFront/CDN</strong> — cache at the edge; data transfer from origin to CDN is cheaper than direct to internet.</li>
                <li><strong>VPC Peering over TGW</strong> — peering has no per-GB charge; TGW charges per GB processed.</li>
                <li><strong>Compress data</strong> — gzip/brotli between services reduces bytes transferred.</li>
                <li><strong>Regional services</strong> — avoid cross-region calls in the hot path.</li>
            </ul>`,
            interviewTip: 'Show you think about cost as an architectural constraint. Mention specific numbers ($0.045/GB NAT processing, $0.02/GB TGW) to demonstrate you have optimized real bills. This impresses interviewers more than vague awareness.',
            followUp: ['How much does a NAT Gateway cost at 10 TB/month?', 'When is TGW cost justified despite per-GB charges?', 'How do you monitor data transfer patterns?'],
            seniorPerspective: 'The biggest surprise costs I have seen: NAT Gateway processing fees for S3 access (solved with Gateway endpoints, saving $5K/month), and cross-AZ traffic between microservices (solved by co-locating tightly coupled services in the same AZ).',
            architectPerspective: 'Data transfer cost optimization must be designed in, not bolted on. The network topology (AZ placement, endpoint strategy, peering vs TGW) should reflect both reliability requirements and the data flow cost model.'
        },
        {
            question: 'Design a network architecture for a three-tier web application that needs to be highly available and secure.',
            difficulty: 'advanced',
            answer: `<p><strong>Architecture:</strong></p>
            <ul>
                <li><strong>VPC:</strong> 10.0.0.0/16 spanning 3 AZs for HA.</li>
                <li><strong>Public subnets (3):</strong> ALB, NAT Gateways, bastion host. One per AZ.</li>
                <li><strong>Private app subnets (3):</strong> Application servers (ECS/EKS). Route outbound through NAT.</li>
                <li><strong>Private data subnets (3):</strong> RDS Multi-AZ, ElastiCache. No internet route at all.</li>
                <li><strong>Security:</strong> ALB SG (443 from internet) → App SG (8080 from ALB SG) → DB SG (5432 from App SG). NACLs deny known bad ranges.</li>
                <li><strong>DNS:</strong> Route 53 public zone for external; private hosted zone for internal service discovery.</li>
                <li><strong>Connectivity:</strong> Private endpoints for S3, Secrets Manager, CloudWatch. No PaaS traffic through NAT.</li>
                <li><strong>Monitoring:</strong> VPC Flow Logs to S3/CloudWatch for audit and troubleshooting.</li>
            </ul>`,
            interviewTip: 'Walk through layer by layer: network (VPC/subnets) → compute (where instances live) → security (SGs/NACLs) → connectivity (endpoints/NAT) → observability (flow logs). This structured approach shows architectural thinking.',
            followUp: ['How would you add a bastion/jump host vs Systems Manager Session Manager?', 'Where would you add a WAF?', 'How do you handle secrets rotation?'],
            seniorPerspective: 'I use this exact pattern as my starting template for every new workload. The key additions I always make: VPC Flow Logs from day one (invaluable for debugging), S3 Gateway endpoint (saves NAT costs), and Systems Manager for access instead of a bastion (fewer public-facing resources).',
            architectPerspective: 'This three-tier network is table stakes. The architecture conversation should extend to: how does this integrate with the broader landing zone (Transit Gateway, central inspection), how do we enforce this pattern via IaC modules, and how do we prevent drift from this security posture.'
        },
        {
            question: 'What is a service mesh, and how does it relate to cloud networking?',
            difficulty: 'expert',
            answer: `<p>A <strong>service mesh</strong> (Istio, Linkerd, AWS App Mesh) provides a dedicated infrastructure layer for service-to-service communication. It deploys sidecar proxies (Envoy) alongside each service that handle: mutual TLS encryption, traffic routing, retries, circuit breaking, observability (distributed tracing), and access policies.</p>
            <p><strong>Relationship to cloud networking:</strong> The service mesh operates at L7 on top of the VPC network layer. The underlying VPC provides L3/L4 connectivity and coarse security (security groups), while the mesh adds fine-grained L7 policies, encryption, and observability between microservices without code changes.</p>
            <p><strong>When needed:</strong> Large microservice deployments (50+ services) where consistent security, observability, and traffic management across all services justifies the operational complexity of running a mesh.</p>`,
            interviewTip: 'Position the mesh as L7 overlay on top of VPC L3/L4. Explain that security groups control "can service A talk to service B at the network level" while the mesh controls "can service A call endpoint /api/orders on service B with this JWT role." Show understanding of the complexity trade-off.',
            followUp: ['What is mTLS and how does a mesh implement it transparently?', 'When is a service mesh overkill?', 'How does App Mesh compare to Istio?'],
            seniorPerspective: 'I reach for a service mesh only when I have enough services that the consistent mTLS, traffic shifting, and observability justify the proxy overhead and operational burden. For 5-10 services, ALB with security groups and X-Ray tracing is sufficient.',
            architectPerspective: 'The service mesh decision is about organizational scale. When you have multiple teams deploying independently, the mesh enforces consistent security and observability without relying on each team to implement it correctly in application code. It is governance infrastructure.'
        },
        {
            question: 'Explain how DNS-based routing works for high availability and disaster recovery across regions.',
            difficulty: 'advanced',
            answer: `<p><strong>DNS routing policies</strong> enable traffic distribution and failover across regions:</p>
            <ul>
                <li><strong>Latency-based routing</strong> — Route 53 directs users to the region with the lowest measured latency. Improves UX for global applications.</li>
                <li><strong>Failover routing</strong> — active/passive pattern. Primary region serves all traffic; if health check fails, DNS automatically resolves to the DR region. Recovery Time Objective (RTO) is bounded by DNS TTL + health check interval.</li>
                <li><strong>Weighted routing</strong> — distribute traffic across regions by percentage (90/10 for canary deployments or gradual regional rollout).</li>
                <li><strong>Geolocation routing</strong> — route based on user geographic location (compliance: EU users → EU region).</li>
            </ul>
            <p><strong>Key considerations:</strong> DNS TTL limits how fast failover can occur (low TTL = faster failover, more DNS queries). Clients may cache DNS beyond TTL. Health checks must be fast and accurate to avoid false positives (flapping).</p>`,
            interviewTip: 'Mention that DNS failover has an inherent delay (TTL + propagation + client caching). For sub-second failover, you need a global load balancer (AWS Global Accelerator, Azure Front Door) that uses anycast IP — no DNS change needed, just backend routing.',
            followUp: ['What is the difference between Route 53 failover and Global Accelerator?', 'How do you handle database replication for multi-region?', 'What is the impact of DNS TTL on failover speed?'],
            seniorPerspective: 'For critical services, I combine Route 53 failover routing (coarse, DNS-level) with Global Accelerator (fine, anycast-level). The GA provides sub-second failover for TCP connections, while DNS failover handles the broader routing. Health checks monitor the full stack, not just the load balancer.',
            architectPerspective: 'Multi-region DR architecture is a business continuity decision. The architecture must match the RTO/RPO requirements: DNS failover gives minutes-level RTO; active-active with global load balancing gives seconds-level. The data layer (cross-region replication) is always the hardest part and defines the achievable RPO.'
        },
        {
            question: 'How would you troubleshoot connectivity issues between two services in different VPCs connected via peering?',
            difficulty: 'hard',
            answer: `<p><strong>Systematic troubleshooting approach (layer by layer):</strong></p>
            <ol>
                <li><strong>Route tables</strong> — verify both VPCs have routes pointing the peer CIDR to the peering connection. Most common issue: missing route table entry.</li>
                <li><strong>Security Groups</strong> — check both sides allow the traffic (source SG or CIDR, correct port/protocol). Remember: SGs are stateful, so only inbound needs explicit allow.</li>
                <li><strong>NACLs</strong> — subnet-level stateless rules on BOTH sides. Must allow inbound AND outbound (return traffic) on both source and destination subnets.</li>
                <li><strong>Peering status</strong> — confirm the peering connection is in "Active" state (requires acceptance from both accounts).</li>
                <li><strong>CIDR overlap</strong> — peering requires non-overlapping CIDRs. If VPCs share IP ranges, peering cannot work.</li>
                <li><strong>DNS resolution</strong> — enable DNS resolution across the peering connection (enableDnsHostnames + requester/accepter DNS resolution settings).</li>
                <li><strong>VPC Flow Logs</strong> — capture accepted/rejected packets to identify where traffic is being dropped.</li>
            </ol>
            <p><strong>Tool progression:</strong> VPC Flow Logs (see traffic) → Route table verification → SG/NACL audit → Reachability Analyzer (AWS automated path analysis).</p>`,
            interviewTip: 'Walk through the OSI layers systematically: L3 (routing/reachability) → L4 (security groups/NACLs) → L7 (DNS/application). This structured approach shows you debug methodically, not by guessing. Mention VPC Reachability Analyzer as the automated tool that does this analysis.',
            followUp: ['What is VPC Reachability Analyzer and how does it help?', 'How do VPC Flow Logs help identify security group rejections?', 'What are common DNS resolution issues across peered VPCs?'],
            seniorPerspective: 'My first step is always VPC Flow Logs — they immediately show if traffic is being accepted or rejected at each hop. If logs show REJECT, I check SGs and NACLs. If there is no log entry at all, it is a routing issue. This approach resolves 95% of connectivity issues in minutes.',
            architectPerspective: 'Network troubleshooting in cloud requires observability infrastructure deployed from day one. VPC Flow Logs, DNS query logging, and centralized SIEM should be non-negotiable baseline capabilities. Without them, diagnosing cross-VPC connectivity issues becomes guesswork at 3 AM during an incident.'
        }
    ]
});
