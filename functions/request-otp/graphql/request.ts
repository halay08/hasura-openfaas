import { query, mutate } from '@halay08/hasura-common/dist/graphql';
import {
  OtpsMutationResponse,
  Maybe,
  Users,
  Otps,
  NotificationResponse,
} from '@halay08/hasura-common/dist/shared/generated';
import {
  GET_USER_BY_EMAIL,
  CREATE_NEW_OTP,
  GET_OTP_BY_USER,
  SEND_OTP_EMAIL,
} from './queries';
import { NotFoundError } from '@halay08/hasura-common/dist/exceptions';
import { getExpiresAt } from '../helpers';

export async function getUserId(email: string): Promise<Users> {
  const { data } = await query<{ users: Users[] }>({
    query: GET_USER_BY_EMAIL,
    variables: { email },
  });

  const [user] = data?.users || [];

  if (!user) {
    throw new NotFoundError(`User with email ${email} not found`);
  }

  return user;
}

export async function getOtpByUser(userId: number): Promise<Otps> {
  const { data } = await query<{ otps: Otps[] }>({
    query: GET_OTP_BY_USER,
    variables: { user_id: userId },
  });

  const [otp] = data?.otps || [];

  return otp;
}

export async function createNewOtp(variables: {
  otp_hash: string;
  user_id: number;
}) {
  // Delete previous OTP before creating new one
  return mutate<{
    delete_otps: Maybe<OtpsMutationResponse>;
    insert_otps_one: Maybe<Otps>;
  }>({
    mutation: CREATE_NEW_OTP,
    variables: {
      ...variables,
      expires_at: getExpiresAt(),
    },
  });
}

export async function sendOtpEmail(variables: {
  template_id: string;
  template_body: string;
  emails: string[];
}) {
  return mutate<{ sendNotifications: NotificationResponse }>({
    mutation: SEND_OTP_EMAIL,
    variables,
  });
}
