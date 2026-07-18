export type BasketListScope = {
  requesterUserId: number;
  familyId?: number | null;
};

export type BasketItemAccess = {
  requesterUserId: number;
  itemOwnerUserId: number;
  itemFamilyId: number | null;
  isActiveFamilyMember: boolean;
};

export const buildBasketListWhere = ({ requesterUserId, familyId }: BasketListScope) => (
  familyId
    ? { familyId, deletedAt: null }
    : { userId: requesterUserId, familyId: null, deletedAt: null }
);

export const canAccessBasketItem = ({
  requesterUserId,
  itemOwnerUserId,
  itemFamilyId,
  isActiveFamilyMember
}: BasketItemAccess) => (
  itemFamilyId === null
    ? requesterUserId === itemOwnerUserId
    : isActiveFamilyMember
);
