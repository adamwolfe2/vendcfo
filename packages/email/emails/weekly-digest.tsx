import { getAppUrl } from "@vendcfo/utils/envs";
import {
  Body,
  Column,
  Container,
  Heading,
  Hr,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { Footer } from "../components/footer";
import { Logo } from "../components/logo";
import {
  EmailThemeProvider,
  getEmailInlineStyles,
  getEmailThemeClasses,
} from "../components/theme";

interface LocationRevenue {
  locationName: string;
  revenue: number;
}

interface Props {
  teamName: string;
  weekLabel: string;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  topLocations: LocationRevenue[];
  bottomLocations: LocationRevenue[];
  overdueInvoiceCount: number;
  overdueInvoiceAmount: number;
  upcomingServiceStops: number;
  capacityAlertCount: number;
  newCustomerCount: number;
  currency?: string;
}

const baseAppUrl = getAppUrl();

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export const WeeklyDigestEmail = ({
  teamName = "Your Company",
  weekLabel = "March 17 - March 23, 2026",
  totalRevenue = 12450.0,
  totalExpenses = -4320.0,
  netIncome = 8130.0,
  topLocations = [
    { locationName: "Downtown Office", revenue: 3200 },
    { locationName: "University Center", revenue: 2800 },
    { locationName: "Tech Park", revenue: 2100 },
    { locationName: "Hospital Lobby", revenue: 1950 },
    { locationName: "Airport Terminal", revenue: 1400 },
  ],
  bottomLocations = [
    { locationName: "Community Center", revenue: 120 },
    { locationName: "Library Entrance", revenue: 85 },
    { locationName: "Gas Station", revenue: 45 },
  ],
  overdueInvoiceCount = 2,
  overdueInvoiceAmount = 1850.0,
  upcomingServiceStops = 14,
  capacityAlertCount = 1,
  newCustomerCount = 3,
  currency = "USD",
}: Props) => {
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  const previewText = `Weekly Digest for ${teamName} - Week of ${weekLabel}`;
  const isNetPositive = netIncome >= 0;

  return (
    <EmailThemeProvider preview={<Preview>{previewText}</Preview>}>
      <Body
        className={`my-auto mx-auto font-sans ${themeClasses.body}`}
        style={lightStyles.body}
      >
        <Container
          className={`my-[40px] mx-auto p-[20px] max-w-[600px] ${themeClasses.container}`}
          style={{
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: lightStyles.container.borderColor,
          }}
        >
          <Logo />

          {/* Header */}
          <Heading
            className={`text-[21px] font-normal text-center p-0 my-[30px] mx-0 ${themeClasses.heading}`}
            style={{ color: lightStyles.text.color }}
          >
            Your Weekly VendCFO Digest
          </Heading>

          <Text
            className={`text-[14px] text-center leading-[24px] ${themeClasses.mutedText}`}
            style={{ color: lightStyles.mutedText.color }}
          >
            Week of {weekLabel}
          </Text>

          {/* Revenue Summary */}
          <Hr
            className={themeClasses.border}
            style={{ borderColor: lightStyles.container.borderColor }}
          />

          <Text
            className={`text-[16px] font-medium mt-[24px] mb-[16px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Revenue Summary
          </Text>

          <Section>
            <table
              width="100%"
              cellPadding={0}
              cellSpacing={0}
              role="presentation"
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <tr style={{ backgroundColor: "#f9fafb" }}>
                <td
                  style={{
                    padding: "10px 16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6b7280",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  Metric
                </td>
                <td
                  style={{
                    padding: "10px 16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textAlign: "right",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  Amount
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    color: "#166534",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  Revenue
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    color: "#166534",
                    textAlign: "right",
                    fontWeight: 500,
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  {formatCurrency(totalRevenue, currency)}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    color: "#991b1b",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  Expenses
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    color: "#991b1b",
                    textAlign: "right",
                    fontWeight: 500,
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  {formatCurrency(totalExpenses, currency)}
                </td>
              </tr>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                <td
                  style={{
                    padding: "14px 16px",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: isNetPositive ? "#166534" : "#991b1b",
                  }}
                >
                  Net Income
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: isNetPositive ? "#166534" : "#991b1b",
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(netIncome, currency)}
                </td>
              </tr>
            </table>
          </Section>

          {/* Top Performing Locations */}
          {topLocations.length > 0 && (
            <>
              <Text
                className={`text-[16px] font-medium mt-[32px] mb-[16px] ${themeClasses.text}`}
                style={{ color: lightStyles.text.color }}
              >
                Top Performing Locations
              </Text>

              <Section>
                <table
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  role="presentation"
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    overflow: "hidden",
                  }}
                >
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    <td
                      style={{
                        padding: "10px 16px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      #
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      Location
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        textAlign: "right",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      Revenue
                    </td>
                  </tr>
                  {topLocations.map((loc, i) => (
                    <tr key={loc.locationName}>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: "13px",
                          color: "#6b7280",
                          borderBottom: "1px solid #f0f0f0",
                          width: "30px",
                        }}
                      >
                        {i + 1}
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: "13px",
                          color: lightStyles.text.color,
                          borderBottom: "1px solid #f0f0f0",
                        }}
                      >
                        {loc.locationName}
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: "13px",
                          color: "#166534",
                          textAlign: "right",
                          fontWeight: 500,
                          borderBottom: "1px solid #f0f0f0",
                        }}
                      >
                        {formatCurrency(loc.revenue, currency)}
                      </td>
                    </tr>
                  ))}
                </table>
              </Section>
            </>
          )}

          {/* Attention Needed */}
          {(overdueInvoiceCount > 0 || bottomLocations.length > 0) && (
            <>
              <Text
                className={`text-[16px] font-medium mt-[32px] mb-[16px] ${themeClasses.text}`}
                style={{ color: lightStyles.text.color }}
              >
                Attention Needed
              </Text>

              {overdueInvoiceCount > 0 && (
                <Text
                  className={`text-[14px] leading-[24px] ${themeClasses.text}`}
                  style={{ color: lightStyles.text.color }}
                >
                  You have{" "}
                  <span style={{ fontWeight: 600, color: "#991b1b" }}>
                    {overdueInvoiceCount} overdue{" "}
                    {overdueInvoiceCount === 1 ? "invoice" : "invoices"}
                  </span>{" "}
                  totaling{" "}
                  <span style={{ fontWeight: 600, color: "#991b1b" }}>
                    {formatCurrency(overdueInvoiceAmount, currency)}
                  </span>
                  .
                </Text>
              )}

              {bottomLocations.length > 0 && (
                <>
                  <Text
                    className={`text-[13px] mt-[12px] mb-[8px] ${themeClasses.mutedText}`}
                    style={{ color: lightStyles.mutedText.color }}
                  >
                    Lowest performing locations this week:
                  </Text>
                  <Section>
                    <table
                      width="100%"
                      cellPadding={0}
                      cellSpacing={0}
                      role="presentation"
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        overflow: "hidden",
                      }}
                    >
                      {bottomLocations.map((loc) => (
                        <tr key={loc.locationName}>
                          <td
                            style={{
                              padding: "8px 16px",
                              fontSize: "13px",
                              color: lightStyles.text.color,
                              borderBottom: "1px solid #f0f0f0",
                            }}
                          >
                            {loc.locationName}
                          </td>
                          <td
                            style={{
                              padding: "8px 16px",
                              fontSize: "13px",
                              color: "#991b1b",
                              textAlign: "right",
                              fontWeight: 500,
                              borderBottom: "1px solid #f0f0f0",
                            }}
                          >
                            {formatCurrency(loc.revenue, currency)}
                          </td>
                        </tr>
                      ))}
                    </table>
                  </Section>
                </>
              )}
            </>
          )}

          {/* This Week's Schedule */}
          <Text
            className={`text-[16px] font-medium mt-[32px] mb-[16px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            This Week
          </Text>

          <Section>
            <table
              width="100%"
              cellPadding={0}
              cellSpacing={0}
              role="presentation"
            >
              <tr>
                <td
                  style={{
                    padding: "8px 0",
                    fontSize: "14px",
                    color: lightStyles.text.color,
                  }}
                >
                  Scheduled service stops
                </td>
                <td
                  style={{
                    padding: "8px 0",
                    fontSize: "14px",
                    color: lightStyles.text.color,
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  {upcomingServiceStops}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "8px 0",
                    fontSize: "14px",
                    color: lightStyles.text.color,
                  }}
                >
                  New customers
                </td>
                <td
                  style={{
                    padding: "8px 0",
                    fontSize: "14px",
                    color: lightStyles.text.color,
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  {newCustomerCount}
                </td>
              </tr>
            </table>
          </Section>

          {/* Capacity Alerts */}
          {capacityAlertCount > 0 && (
            <>
              <Hr
                className={themeClasses.border}
                style={{
                  borderColor: lightStyles.container.borderColor,
                  marginTop: "24px",
                }}
              />
              <Text
                className={`text-[14px] leading-[24px] mt-[16px] ${themeClasses.text}`}
                style={{ color: "#991b1b" }}
              >
                {capacityAlertCount} active capacity{" "}
                {capacityAlertCount === 1 ? "alert" : "alerts"} require your
                attention.{" "}
                <Link
                  href={`${baseAppUrl}/capacity`}
                  style={{ color: "#991b1b", textDecoration: "underline" }}
                >
                  View details
                </Link>
              </Text>
            </>
          )}

          {/* Footer CTA */}
          <Hr
            className={themeClasses.border}
            style={{
              borderColor: lightStyles.container.borderColor,
              marginTop: "32px",
            }}
          />
          <Text
            className={`text-[12px] text-center mt-[16px] ${themeClasses.mutedText}`}
            style={{ color: lightStyles.mutedText.color }}
          >
            Manage your settings at{" "}
            <Link
              href={`${baseAppUrl}/settings/notifications`}
              style={{ color: lightStyles.mutedText.color }}
            >
              vendcfo.vercel.app
            </Link>
          </Text>

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default WeeklyDigestEmail;
