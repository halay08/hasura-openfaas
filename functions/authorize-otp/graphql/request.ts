const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
import { query } from '@halay08/hasura-common/dist/graphql';
import { NotFoundError } from '@halay08/hasura-common/dist/exceptions';
import { Otps, Users } from '@halay08/hasura-common/dist/shared/generated';
import { GET_USERS_BY_OTP } from './queries';

export async function getUsersByOtp(otp: string): Promise<any> {
  const { data } = await query<{ otps: Otps[] }>({
    query: GET_USERS_BY_OTP,
    variables: { expiresAt: new Date().toISOString() }
  });

  if (data?.otps.length === 0) {
    throw new NotFoundError('OTP not found');
  }

  const otpUsers: Users[] = [];
  if(data.otps.length > 0){
    data.otps.forEach(otpObj => {
      if(bcrypt.compareSync(otp, otpObj.otp_hash)){
        otpUsers.push(otpObj.user);
      }
    })
  }

  const [otpUser] = otpUsers || [];

  if (!otpUser) {
    throw new NotFoundError('OTP user not found');
  }

  return otpUser;
}
