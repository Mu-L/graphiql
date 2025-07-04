'use no memo';
import type { GraphQLNamedType, GraphQLType } from 'graphql';

export function unwrapType(type: GraphQLType): GraphQLNamedType {
  return 'ofType' in type ? unwrapType(type.ofType) : type;
}
