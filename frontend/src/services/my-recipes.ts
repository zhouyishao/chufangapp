import { loadAuthUser, syncAuthUserWithBackend } from './auth';
import {
  createMobileMyRecipe,
  deleteMobileMyRecipe,
  getMobileMyRecipe,
  listMobileMyRecipes,
  resolveAssetUrl,
  updateMobileMyRecipe,
  type MobileMyRecipeUpsertPayload,
  type ApiMyRecipe
} from './public-api';

export type MyRecipeStatus = 'draft' | 'published';

export interface MyRecipeIngredient {
  name: string;
  amount: string;
}

export interface MyRecipeStep {
  title: string;
  description: string;
  image: string;
  video: string;
  mediaFileId: number | null;
  mediaKind: 'IMAGE' | 'VIDEO' | null;
}

export interface MyRecipe {
  id: string;
  name: string;
  description: string;
  image: string;
  coverSource: string;
  coverFileId: number | null;
  video: string;
  videoFileId: number | null;
  duration: string;
  flavor: string;
  updatedAt: string;
  status: MyRecipeStatus;
  difficulty: string;
  category: string;
  visibility: string;
  ingredients: MyRecipeIngredient[];
  steps: MyRecipeStep[];
  note: string;
}

const mapApiMyRecipe = (recipe: ApiMyRecipe): MyRecipe => ({
  id: recipe.publicId || String(recipe.id),
  name: recipe.name,
  description: recipe.description,
  image: resolveAssetUrl(recipe.image),
  coverSource: resolveAssetUrl(recipe.image, ''),
  coverFileId: recipe.coverFileId,
  video: resolveAssetUrl(recipe.video, ''),
  videoFileId: recipe.videoFileId,
  duration: recipe.duration || '未填',
  flavor: recipe.flavor || '未填',
  updatedAt: recipe.updatedAt,
  status: recipe.status,
  difficulty: recipe.difficulty || '未填',
  category: recipe.category || '私房菜',
  visibility: recipe.visibility || '仅自己可见',
  ingredients: recipe.ingredients.map((item) => ({ name: item.name, amount: item.amount })),
  steps: recipe.steps.map((item) => ({
    title: item.title,
    description: item.description,
    image: resolveAssetUrl(item.image, ''),
    video: resolveAssetUrl(item.video, ''),
    mediaFileId: item.mediaFileId,
    mediaKind: item.mediaKind
  })),
  note: recipe.note || ''
});

const requireUser = async () => {
  const user = await syncAuthUserWithBackend(loadAuthUser());
  if (!user?.id) throw new Error('请先登录');
  return { ...user, id: user.id };
};

export const loadMyRecipes = async (): Promise<MyRecipe[]> => {
  const user = await requireUser();
  const result = await listMobileMyRecipes({ userId: user.id, page: 1, pageSize: 50 });
  return result.list.map(mapApiMyRecipe);
};

export const findMyRecipeById = async (id: string): Promise<MyRecipe | null> => {
  const user = await requireUser();
  const recipe = await getMobileMyRecipe(id, user.id);
  return recipe ? mapApiMyRecipe(recipe) : null;
};

export const saveMyRecipe = async (payload: MobileMyRecipeUpsertPayload) => {
  const user = await requireUser();
  return mapApiMyRecipe(
    await createMobileMyRecipe({
      ...payload,
      userId: user.id
    })
  );
};

export const updateMyRecipe = async (id: string, payload: MobileMyRecipeUpsertPayload) => {
  await requireUser();
  return mapApiMyRecipe(await updateMobileMyRecipe(id, payload));
};

export const deleteMyRecipe = async (id: string) => {
  await requireUser();
  await deleteMobileMyRecipe(id);
};
