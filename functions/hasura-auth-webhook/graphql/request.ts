import { query } from '@halay08/hasura-common/dist/graphql';
import { Users } from '@halay08/hasura-common/dist/shared/generated';
import { GET_USER } from './queries';

export const getUser = async (id: number): Promise<Users> => {
  const { data } = await query<{ users_by_pk: Users }>({
    query: GET_USER,
    variables: { id },
  });

  return data?.users_by_pk;
};
