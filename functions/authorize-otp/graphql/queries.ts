import { gql } from '@apollo/client/core';

export const GET_USERS_BY_OTP = gql`
  query GetUsersByOtp($expiresAt: timestamp!) {
    otps(where: { expires_at: { _gt: $expiresAt } }) {
      otp_hash
      user {
        id
        role
      }
    }
  }
`;
