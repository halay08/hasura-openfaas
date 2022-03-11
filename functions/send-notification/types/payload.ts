import { NotificationType } from '@halay08/hasura-common/dist/graphql';

type TEmailOptionPayload = {
  cc?: string | string[];
  bcc?: string | string[];
  attachments: Object[] | null;
}

type TRequestPayload = TEmailOptionPayload & {
  type: NotificationType;
  emails: string | string[];
  sms_text?: string;
  phones?: string | string [] | number | number[];
  template_id?: string;
  template_body?: string;
  email_subject?: string;
  email_custom_message?: string;
};

export type { TRequestPayload, TEmailOptionPayload };
