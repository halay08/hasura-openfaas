import { Maybe, Otps, Scalars } from '@halay08/hasura-common/dist/shared/generated';
import { createNewOtp } from '../graphql';
const bcrypt = require('bcrypt');
const otpGenerator = require('otp-generator');

export const getExpiresAt = (): string => new Date(Date.now() + 1000 * 60 * 10).toISOString();

export const getNextRetryTime = (time: Maybe<Scalars['timestamptz']>) => new Date(`${time}Z`).getTime() + 60 * 1000;

export const generateOTP = async (userId: number): Promise<string>  => {
  const otp = otpGenerator.generate(6, {
    upperCase: false,
    alphabets: false,
    specialChars: false,
  });

  console.log(`OTP code before encrypting is ${otp}`)

  const otpHash = await bcrypt.hash(otp, 10);
  
  await createNewOtp({ otp_hash: otpHash, user_id: userId })

  return otp;
}
