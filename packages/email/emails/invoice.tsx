import {
  Body,
  Container,
  Heading,
  Hr,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { format, parseISO } from "date-fns";
import { InvoiceSchema } from "../components/invoice-schema";
import { Logo } from "../components/logo";
import {
  Button,
  EmailThemeProvider,
  getEmailInlineStyles,
  getEmailThemeClasses,
} from "../components/theme";

interface Props {
  customerName: string;
  teamName: string;
  link: string;
  // Gmail structured data fields
  invoiceNumber?: string;
  amount?: number;
  currency?: string;
  dueDate?: string;
  customerId?: string;
}

function formatCurrencyForEmail(
  amount: number,
  currency: string,
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function formatDueDateForEmail(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "MMMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export const InvoiceEmail = ({
  customerName = "Customer",
  teamName = "VendCFO",
  link = "https://vendcfo.vercel.app/i/1234567890",
  invoiceNumber,
  amount,
  currency,
  dueDate,
  customerId,
}: Props) => {
  const text = invoiceNumber
    ? `Invoice ${invoiceNumber} from ${teamName}`
    : `You've received an invoice from ${teamName}`;
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  // Only render Gmail schema if we have all required data
  const hasSchemaData =
    invoiceNumber && amount !== undefined && currency && dueDate;

  const hasInvoiceDetails =
    amount !== undefined && amount > 0 && currency;

  return (
    <EmailThemeProvider preview={<Preview>{text}</Preview>}>
      {/* Gmail structured data - placed in body as some ESPs strip head scripts */}
      {hasSchemaData && (
        <InvoiceSchema
          invoiceNumber={invoiceNumber}
          teamName={teamName}
          amount={amount}
          currency={currency}
          dueDate={dueDate}
          link={link}
          customerId={customerId}
        />
      )}
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
          <Heading
            className={`text-[21px] font-normal text-center p-0 my-[30px] mx-0 ${themeClasses.heading}`}
            style={{ color: lightStyles.text.color }}
          >
            Invoice from {teamName}
          </Heading>

          <br />

          <span
            className={`font-medium ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Hi {customerName},
          </span>
          <Text
            className={themeClasses.text}
            style={{ color: lightStyles.text.color }}
          >
            {teamName} has sent you an invoice. Please review and pay it by
            the due date.
          </Text>

          {/* Invoice summary block */}
          {hasInvoiceDetails && (
            <Section
              className="email-highlight"
              style={{
                backgroundColor: "#f9f9f8",
                border: "1px solid #e5e7eb",
                padding: "20px 24px",
                marginTop: "24px",
                marginBottom: "24px",
              }}
            >
              {invoiceNumber && (
                <Text
                  className={`text-[13px] m-0 mb-[4px] ${themeClasses.mutedText}`}
                  style={{ color: lightStyles.mutedText.color }}
                >
                  Invoice {invoiceNumber}
                </Text>
              )}
              <Text
                className={`text-[28px] font-semibold m-0 mb-[4px] email-highlight-text ${themeClasses.text}`}
                style={{ color: lightStyles.text.color, lineHeight: "1.2" }}
              >
                {formatCurrencyForEmail(amount!, currency!)}
              </Text>
              {dueDate && (
                <Text
                  className={`text-[13px] m-0 ${themeClasses.mutedText}`}
                  style={{ color: lightStyles.mutedText.color }}
                >
                  Due {formatDueDateForEmail(dueDate)}
                </Text>
              )}
            </Section>
          )}

          <Section className="text-center mt-[32px] mb-[50px]">
            <Button href={link}>View and pay invoice</Button>
          </Section>

          <Hr
            className={themeClasses.border}
            style={{ borderColor: lightStyles.container.borderColor }}
          />

          <Text
            className={`text-[12px] ${themeClasses.mutedText}`}
            style={{ color: lightStyles.mutedText.color }}
          >
            If you have any questions about this invoice, reply directly to
            this email to contact {teamName}.
          </Text>
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default InvoiceEmail;
