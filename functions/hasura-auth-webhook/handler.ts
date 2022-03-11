const jwt = require('jsonwebtoken');
import { FunctionContext } from '@halay08/hasura-common/dist/middleware';
import { getUser } from './graphql/request';

export async function handler(req: Request, context: FunctionContext) {
  if (req.headers['authorization']) {
    try {
      const token = req.headers['authorization'].split(' ')[1];
      if (token !== null) {
        const { HASURA_JWT_SECRET } = process.env;
        const decoded = jwt.verify(token, HASURA_JWT_SECRET);
        const user = await getUser(
          parseInt(decoded['https://hasura.io/jwt/claims']['x-hasura-user-id'])
        );
        const organizationId = user?.organization?.id;

        if (organizationId) {
          return (<FunctionContext>context.status(200)).succeed({
            'X-Hasura-Role':
              decoded['https://hasura.io/jwt/claims']['x-hasura-default-role'],
            'X-Hasura-User-Id':
              decoded['https://hasura.io/jwt/claims']['x-hasura-user-id'],
            'X-Hasura-Organization-Id': organizationId.toString(),
          });
        } else {
          return (<FunctionContext>context.status(200)).succeed({
            'X-Hasura-Role':
              decoded['https://hasura.io/jwt/claims']['x-hasura-default-role'],
            'X-Hasura-User-Id':
              decoded['https://hasura.io/jwt/claims']['x-hasura-user-id'],
          });
        }
      }
    } catch (e) {
      return (<FunctionContext>context.status(401)).succeed({});
    }
  }
  return (<FunctionContext>context.status(200)).succeed({
    'X-Hasura-Role': 'anonymous',
  });
}
