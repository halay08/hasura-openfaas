'use strict';

import {
  FunctionEvent,
  FunctionContext,
  ErrorHandler,
} from '@halay08/hasura-common/dist/middleware';
import { getOtpByUser, getUserId, sendOtpEmail } from './graphql';
import { generateOTP, getNextRetryTime } from './helpers';

export async function handler(event: FunctionEvent, context: FunctionContext) {
  const email = event.body.input.email;
  try {
    const user = await getUserId(email);
    const userId = user.id;

    // Get OTP by user
    const otp = await getOtpByUser(userId);
    if (otp) {
      const nextRetryTime = getNextRetryTime(otp.created_at);
      if (nextRetryTime > Date.now()) {
        throw Error('Cannot create new OTP, wait for 60 seconds');
      }
    }

    const templateId = process.env.OTP_EMAIL_TEMPLATE_ID || '';
    const variables = {
      template_id: templateId,
      template_body: JSON.stringify({
        OTP_CODE: await generateOTP(userId),
      }),
      emails: [email],
    };

    await sendOtpEmail(variables);
    (<FunctionContext>context.status(200)).succeed({ isSent: true });
  } catch (e) {
    return ErrorHandler(e as Error, context);
  }
}
