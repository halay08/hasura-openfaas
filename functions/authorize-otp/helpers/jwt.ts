const jwt = require('jsonwebtoken');

const HASURA_JWT_SECRET = process.env.HASURA_JWT_SECRET

export function createToken(user): string {
  const userRole = user.role && user.role.toUpperCase();
  const payload = {
    "https://hasura.io/jwt/claims": {
      "x-hasura-allowed-roles": [userRole],
      "x-hasura-default-role": userRole,
      "x-hasura-user-id": user.id.toString(),
    }
  }
  return jwt.sign(payload, HASURA_JWT_SECRET);
}