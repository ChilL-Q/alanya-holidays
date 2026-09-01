export interface InquiryState {
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
}

interface CreateInquiryStateInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function createInquiryState({
  name,
  email,
  subject,
  message,
}: CreateInquiryStateInput): InquiryState {
  return {
    name,
    email,
    subject,
    message,
    timestamp: new Date().toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  };
}
