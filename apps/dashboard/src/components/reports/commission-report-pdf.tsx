import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RevenueShareLineItem {
  locationId: string;
  locationName: string;
  grossRevenue: number;
  processingFees: number;
  netDeposited: number;
  sharePercentage: number;
  commissionAmount: number;
}

export interface CommissionReportData {
  lineItems: RevenueShareLineItem[];
  totalGrossRevenue: number;
  totalCommission: number;
  periodLabel: string;
  generatedAt: string;
  businessName: string;
  contactName?: string;
  contactEmail?: string;
}

// ---------------------------------------------------------------------------
// Font Registration
// ---------------------------------------------------------------------------

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fMZhrib2Bg-4.ttf",
      fontWeight: 500,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf",
      fontWeight: 600,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf",
      fontWeight: 700,
    },
  ],
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function pct(n: number): string {
  return `${n.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const ACCENT = "#1a1a1a";
const BORDER = "#e0e0e0";
const MUTED = "#666666";
const BG_ALT = "#f7f7f7";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Inter",
    fontWeight: 400,
    fontSize: 10,
    color: "#111111",
  },

  // Header
  headerBar: {
    backgroundColor: ACCENT,
    padding: 20,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 10,
    color: "#999999",
    marginTop: 4,
  },

  // Metadata row
  metaRow: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 12,
  },
  metaBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
  },
  metaLabel: {
    fontSize: 8,
    fontWeight: 600,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: 600,
    color: ACCENT,
  },

  // Summary cards
  summaryRow: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: BG_ALT,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: 600,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 700,
    color: ACCENT,
  },

  // Table
  table: {
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: BG_ALT,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableRowLast: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableTotalsRow: {
    flexDirection: "row",
    backgroundColor: BG_ALT,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  colLocation: {
    flex: 2,
  },
  colNumber: {
    flex: 1,
    textAlign: "right",
  },
  headerText: {
    fontSize: 8,
    fontWeight: 600,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  cellText: {
    fontSize: 9,
    color: "#111111",
  },
  cellTextMuted: {
    fontSize: 9,
    color: MUTED,
  },
  cellTextBold: {
    fontSize: 9,
    fontWeight: 600,
    color: "#111111",
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: ACCENT,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 700,
    color: ACCENT,
    textAlign: "right",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: "#999999",
  },

  // Contact
  contactSection: {
    marginBottom: 20,
  },
  contactLabel: {
    fontSize: 8,
    fontWeight: 600,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 9,
    color: "#333333",
  },
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommissionReportPdf({
  lineItems,
  totalGrossRevenue,
  totalCommission,
  periodLabel,
  generatedAt,
  businessName,
  contactName,
  contactEmail,
}: CommissionReportData) {
  const totalProcessingFees = lineItems.reduce(
    (sum, item) => sum + item.processingFees,
    0,
  );
  const totalNetDeposited = lineItems.reduce(
    (sum, item) => sum + item.netDeposited,
    0,
  );

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>VendCFO</Text>
          <Text style={styles.headerSubtitle}>
            Revenue Share Report — {periodLabel}
          </Text>
        </View>

        {/* Metadata row */}
        <View style={styles.metaRow}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Period</Text>
            <Text style={styles.metaValue}>{periodLabel}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Generated</Text>
            <Text style={styles.metaValue}>{generatedAt}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Business</Text>
            <Text style={styles.metaValue}>{businessName}</Text>
          </View>
        </View>

        {/* Contact info */}
        {(contactName || contactEmail) && (
          <View style={styles.contactSection}>
            <Text style={styles.contactLabel}>Prepared For</Text>
            {contactName && (
              <Text style={styles.contactValue}>{contactName}</Text>
            )}
            {contactEmail && (
              <Text style={styles.contactValue}>{contactEmail}</Text>
            )}
          </View>
        )}

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Gross Revenue</Text>
            <Text style={styles.summaryValue}>{fmt(totalGrossRevenue)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Processing Fees</Text>
            <Text style={styles.summaryValue}>{fmt(totalProcessingFees)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Net Revenue</Text>
            <Text style={styles.summaryValue}>{fmt(totalNetDeposited)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Commission Due</Text>
            <Text style={styles.summaryValue}>{fmt(totalCommission)}</Text>
          </View>
        </View>

        {/* Detail Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeaderRow}>
            <View style={styles.colLocation}>
              <Text style={styles.headerText}>Location</Text>
            </View>
            <View style={styles.colNumber}>
              <Text style={{ ...styles.headerText, textAlign: "right" }}>
                Gross Revenue
              </Text>
            </View>
            <View style={styles.colNumber}>
              <Text style={{ ...styles.headerText, textAlign: "right" }}>
                Processing Fees
              </Text>
            </View>
            <View style={styles.colNumber}>
              <Text style={{ ...styles.headerText, textAlign: "right" }}>
                Net Revenue
              </Text>
            </View>
            <View style={styles.colNumber}>
              <Text style={{ ...styles.headerText, textAlign: "right" }}>
                Rev Share %
              </Text>
            </View>
            <View style={styles.colNumber}>
              <Text style={{ ...styles.headerText, textAlign: "right" }}>
                Commission
              </Text>
            </View>
          </View>

          {/* Data Rows */}
          {lineItems.map((item, index) => {
            const isLast = index === lineItems.length - 1;
            return (
              <View
                key={item.locationId}
                style={isLast ? styles.tableRowLast : styles.tableRow}
              >
                <View style={styles.colLocation}>
                  <Text style={styles.cellTextBold}>{item.locationName}</Text>
                </View>
                <View style={styles.colNumber}>
                  <Text style={{ ...styles.cellText, textAlign: "right" }}>
                    {fmt(item.grossRevenue)}
                  </Text>
                </View>
                <View style={styles.colNumber}>
                  <Text style={{ ...styles.cellTextMuted, textAlign: "right" }}>
                    {item.processingFees > 0
                      ? `(${fmt(item.processingFees)})`
                      : fmt(0)}
                  </Text>
                </View>
                <View style={styles.colNumber}>
                  <Text style={{ ...styles.cellText, textAlign: "right" }}>
                    {fmt(item.netDeposited)}
                  </Text>
                </View>
                <View style={styles.colNumber}>
                  <Text style={{ ...styles.cellTextMuted, textAlign: "right" }}>
                    {pct(item.sharePercentage)}
                  </Text>
                </View>
                <View style={styles.colNumber}>
                  <Text style={{ ...styles.cellTextBold, textAlign: "right" }}>
                    {fmt(item.commissionAmount)}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Totals Row */}
          <View style={styles.tableTotalsRow}>
            <View style={styles.colLocation}>
              <Text style={styles.totalLabel}>Total</Text>
            </View>
            <View style={styles.colNumber}>
              <Text style={styles.totalValue}>{fmt(totalGrossRevenue)}</Text>
            </View>
            <View style={styles.colNumber}>
              <Text style={styles.totalValue}>{fmt(totalProcessingFees)}</Text>
            </View>
            <View style={styles.colNumber}>
              <Text style={styles.totalValue}>{fmt(totalNetDeposited)}</Text>
            </View>
            <View style={styles.colNumber}>
              <Text style={styles.totalValue} />
            </View>
            <View style={styles.colNumber}>
              <Text style={styles.totalValue}>{fmt(totalCommission)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated by VendCFO — vendcfo.vercel.app
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
