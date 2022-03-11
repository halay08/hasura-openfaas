import { gql } from '@apollo/client/core';

export const GET_USER = gql`
  query GetUser($id: Int!) {
    users_by_pk(id: $id) {
      id
      email
      organization {
        id
        name
      }
    }
  }
`;
