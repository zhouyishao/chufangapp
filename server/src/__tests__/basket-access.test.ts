import assert from 'node:assert/strict';
import test from 'node:test';

type BasketAccessModule = typeof import('../services/basket-access');

async function loadBasketAccessModule(): Promise<BasketAccessModule> {
  try {
    return await import('../services/basket-access');
  } catch {
    assert.fail('家庭共享菜篮访问规则尚未实现');
  }
}

test('家庭菜篮列表按家庭查询而不是按创建人查询', async () => {
  const { buildBasketListWhere } = await loadBasketAccessModule();

  assert.deepEqual(buildBasketListWhere({ requesterUserId: 12, familyId: 8 }), {
    familyId: 8,
    deletedAt: null
  });
});

test('个人菜篮只返回个人范围条目', async () => {
  const { buildBasketListWhere } = await loadBasketAccessModule();

  assert.deepEqual(buildBasketListWhere({ requesterUserId: 12 }), {
    userId: 12,
    familyId: null,
    deletedAt: null
  });
});

test('家庭成员可以修改同一家庭其他成员创建的条目', async () => {
  const { canAccessBasketItem } = await loadBasketAccessModule();

  assert.equal(canAccessBasketItem({
    requesterUserId: 22,
    itemOwnerUserId: 12,
    itemFamilyId: 8,
    isActiveFamilyMember: true
  }), true);
});

test('非家庭成员不能修改家庭条目', async () => {
  const { canAccessBasketItem } = await loadBasketAccessModule();

  assert.equal(canAccessBasketItem({
    requesterUserId: 22,
    itemOwnerUserId: 12,
    itemFamilyId: 8,
    isActiveFamilyMember: false
  }), false);
});

test('个人菜篮条目只能由创建人修改', async () => {
  const { canAccessBasketItem } = await loadBasketAccessModule();

  assert.equal(canAccessBasketItem({
    requesterUserId: 22,
    itemOwnerUserId: 12,
    itemFamilyId: null,
    isActiveFamilyMember: false
  }), false);
});
