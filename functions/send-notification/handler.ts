import { FunctionContext, FunctionEvent, ErrorHandler } from '@halay08/hasura-common/dist/middleware';
import { InvalidPayloadError } from '@halay08/hasura-common/dist/exceptions';
import { NotificationService } from '@halay08/hasura-common/dist/modules/notification';
import { NotificationType } from '@halay08/hasura-common/dist/graphql'; 
import { TRequestPayload, TEmailOptionPayload } from './types';

export async function handler(event: FunctionEvent, context: FunctionContext) {
  const requestPayload: TRequestPayload = event.body.input;
  const {
    type,
    cc,
    bcc,
    phones,
    emails,
    attachments = [],
    sms_text: smsText,
    template_id: templateId,
    email_custom_message: customBody = '',
    email_subject: customSubject = 'Untitled',
    template_body: templateBody = '',
  } = requestPayload;

  const notificationService= new NotificationService();
  try {
    if (type === NotificationType.SMS && !smsText) {
      throw new InvalidPayloadError('SMS body is required');
    }

    if (
      type === NotificationType.EMAIL && !templateId && !customBody
    ) {
      throw new InvalidPayloadError('Template or custom message is required');
    }

    if (type === NotificationType.SMS && smsText && phones) {
      if (Array.isArray(phones)) {
        await Promise.all(
          phones.map((phoneNumber) =>
            notificationService.sendSMS(phoneNumber, smsText),
          ),
        );
      } else {
        await notificationService.sendSMS(phones.toString(), smsText);
      }
    } else if (type === NotificationType.EMAIL) {
      let baseOptions: TEmailOptionPayload = {
        attachments,
      }

      if (cc) {
        baseOptions = { ...baseOptions, cc }
      }

      if (bcc) {
        baseOptions = { ...baseOptions, bcc }
      }

      let result = null;
      if (templateId) {
        result = await notificationService.sendEmail(emails, {
          data: JSON.parse(templateBody) || {},
          template_id: templateId,
          ...baseOptions,
        });
      } else if (customBody) {
        const args = {
          subject: customSubject,
          body: customBody,
          ...baseOptions,
        };
        result = await notificationService.sendCustomEmail(Array.isArray(emails) ? emails : [emails], args);
      }
    }

    (<FunctionContext>context.status(200)).succeed({isSent: true});
  } catch (e) {
    return ErrorHandler(e as Error, context);
  }
}
