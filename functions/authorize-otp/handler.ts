import { ErrorHandler, FunctionContext, FunctionEvent } from '@halay08/hasura-common/dist/middleware';
import { getUsersByOtp } from './graphql';
import { createToken } from './helpers';

export async function handler(event: FunctionEvent, context: FunctionContext) {
  const otp = event.body.input.otp;
  try {
    const user = await getUsersByOtp(otp);
    const token = createToken(user);
    (<FunctionContext>context.status(200)).succeed({ token: token });
  } catch (e) {
    return ErrorHandler(e as Error, context);
  }
}
