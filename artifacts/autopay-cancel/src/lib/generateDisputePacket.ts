type TimelineItem = {
  date: string;
  type: string;
  amount?: string;
};

export function generateDisputePacket(data: {
  merchantName: string;
  timeline: TimelineItem[];
  evidenceSummary: string;
}) {
  return `DISPUTE PACKET

Merchant:
${data.merchantName}

Summary:
Customer canceled services but continued charges occurred afterward.

Timeline:
${data.timeline.map((item) => `${item.date} - ${item.type}${item.amount ? ` - ${item.amount}` : ""}`).join("\n")}

Evidence:
${data.evidenceSummary}

Requested Resolution:
- Stop future charges
- Refund continued charges
- Revoke authorization
`;
}
