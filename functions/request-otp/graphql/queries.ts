import { gql } from '@apollo/client/core';

export const GET_USER_BY_EMAIL = gql`
  query GetUserByEmail($email: String!) {
    users(where: { email: { _eq: $email } }) {
      id
    }
  }
`;

export const CREATE_NEW_OTP = gql`
  mutation CreateNewOtp(
    $otp_hash: String!
    $user_id: Int!
    $expires_at: timestamp!
  ) {
    delete_otps(where: { user: { id: { _eq: $user_id } } }) {
      affected_rows
    }
    insert_otps_one(
      object: {
        otp_hash: $otp_hash
        user_id: $user_id
        expires_at: $expires_at
      }
    ) {
      id
    }
  }
`;

export const GET_OTP_BY_USER = gql`
  query GetOtpByUser($user_id: Int!) {
    otps(where: { user_id: { _eq: $user_id } }, limit: 1) {
      created_at
    }
  }
`;

export const SEND_OTP_EMAIL = gql`
  mutation Notifications(
    $template_id: String!
    $template_body: json!
    $emails: [String!]
  ) {
    sendNotifications(
      type: EMAIL
      template_id: $template_id
      template_body: $template_body
      emails: $emails
    ) {
      isSent
    }
  }
`;
