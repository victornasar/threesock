// Maps misconfiguration checks (Checkov, Trivy) to criteria by topic (decision 41).
const TOPICS: [RegExp, string][] = [
  [/in[- ]transit|\btls\b|\bssl\b|https|certificate|cipher/i, 'CC6.7'],
  [/encrypt|\bkms\b|\bcmk\b|at[- ]rest|\bsse\b|customer[- ]managed key/i, 'C1.1'],
  [
    /public|ingress|0\.0\.0\.0|security group|\bnetwork\b|\bports?\b|firewall|\bssh\b|\brdp\b|internet|exposed|\bcidr\b|\bvpc\b|subnet/i,
    'CC6.6',
  ],
  [
    /\biam\b|polic(?:y|ies)|\broles?\b|privilege|\badmin\b|permission|wildcard|\bmfa\b|password|access key|root user|least/i,
    'CC6.1',
  ],
  [/\blog(?:s|ging)?\b|audit|trail|monitor/i, 'CC7.2'],
  [
    /backup|snapshot|replication|point[- ]in[- ]time|versioning|deletion protection|retention|multi[- ]?az/i,
    'A1.2',
  ],
];

export function topicCriterion(text: string): string {
  return TOPICS.find(([re]) => re.test(text))?.[1] ?? 'CC7.1';
}
