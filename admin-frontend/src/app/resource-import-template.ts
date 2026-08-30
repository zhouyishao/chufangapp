import * as XLSX from 'xlsx';

export type ResourceImportTemplateType = 'RECIPE' | 'INGREDIENT' | 'FRUIT' | 'SEASONING' | 'BEVERAGE';

type TemplateField = {
  name: string;
  required?: boolean;
  description: string;
  example: string | number;
};

type TemplateDefinition = {
  label: string;
  fields: TemplateField[];
};

const sharedProduceFields: TemplateField[] = [
  { name: '名称', required: true, description: '资源名称，不能留空', example: '小油菜' },
  { name: '分类', description: '分类名称；分类不存在时会在对应资源类型下创建', example: '绿叶蔬菜' },
  { name: '图片', description: 'http(s) 图片地址或系统 /uploads/ 地址', example: 'https://example.com/item.jpg' },
  { name: '营养成分', description: '营养信息，建议使用简短中文描述', example: '富含维生素和膳食纤维' },
  { name: '挑选技巧', description: '购买和挑选建议', example: '选择色泽鲜亮、叶片挺拔的' },
  { name: '储存方法', description: '保存方式和建议保存时间', example: '冷藏保鲜，尽快食用' },
  { name: '食用禁忌', description: '没有特殊禁忌时可留空', example: '无特殊食用禁忌' },
  { name: '价格', description: '仅填写数字，不带货币符号', example: 4.5 },
  { name: '计价单位', description: '例如斤、500g、瓶', example: '斤' },
  { name: '价格来源', description: '价格采集渠道或来源说明', example: '农贸市场平均价' },
  { name: '价格时间', description: '日期格式 YYYY-MM-DD', example: '2026-08-27' }
];

const templateDefinitions: Record<ResourceImportTemplateType, TemplateDefinition> = {
  RECIPE: {
    label: '菜谱',
    fields: [
      { name: '名称', required: true, description: '菜谱名称，不能留空', example: '西红柿炒鸡蛋' },
      { name: '分类', description: '菜谱分类名称', example: '家常菜' },
      { name: '菜系', description: '所属菜系', example: '鲁菜' },
      { name: '封面', description: 'http(s) 图片地址或系统 /uploads/ 地址', example: 'https://example.com/recipe.jpg' },
      { name: '副标题', description: '菜谱的一句话介绍', example: '经典下饭菜，酸甜适口' },
      { name: '描述', description: '菜谱详细介绍', example: '营养丰富的经典家常菜' },
      { name: '耗时', description: '分钟数，仅填写数字', example: 15 },
      { name: '难度', description: '例如简单、中等、困难', example: '简单' },
      { name: '份量', description: '用餐人数，仅填写数字', example: 2 },
      { name: '卡路里', description: '每份热量，仅填写数字', example: 200 },
      { name: '口味', description: '口味描述', example: '酸甜' },
      { name: '场景', description: '多个场景可用逗号分隔', example: '午餐,晚餐' },
      { name: '技巧', description: '制作技巧', example: '鸡蛋液里加少量水会更嫩' },
      { name: '用料', required: true, description: '多个用料用逗号或换行分隔，名称和用量写在同一项', example: '西红柿 2个, 鸡蛋 3个' },
      { name: '调料', description: '多个调料用逗号或换行分隔', example: '盐 适量, 糖 5克' },
      { name: '步骤', required: true, description: '多个步骤用换行分隔，可带 1.、2. 等序号', example: '西红柿切块，鸡蛋打散。\n鸡蛋炒熟后加入西红柿翻炒。' }
    ]
  },
  INGREDIENT: {
    label: '食材',
    fields: [
      ...sharedProduceFields.slice(0, 3),
      { name: '时令月份', description: '1-12 的月份，多个值用逗号分隔', example: '3,4,5' },
      ...sharedProduceFields.slice(3)
    ]
  },
  FRUIT: {
    label: '水果',
    fields: [
      { ...sharedProduceFields[0], example: '红富士苹果' },
      { ...sharedProduceFields[1], example: '温带水果' },
      sharedProduceFields[2],
      { name: '时令月份', description: '1-12 的月份，多个值用逗号分隔', example: '9,10,11' },
      ...sharedProduceFields.slice(3)
    ]
  },
  SEASONING: {
    label: '调料',
    fields: [
      { ...sharedProduceFields[0], example: '酿造生抽' },
      { ...sharedProduceFields[1], example: '酱油调味' },
      ...sharedProduceFields.slice(2)
    ]
  },
  BEVERAGE: {
    label: '酒水',
    fields: [
      { name: '名称', required: true, description: '酒水名称，不能留空', example: '莫吉托' },
      { name: '分类', description: '酒水分类名称', example: '鸡尾酒' },
      { name: '图片', description: 'http(s) 图片地址或系统 /uploads/ 地址', example: 'https://example.com/mojito.jpg' },
      { name: '酒水类型', description: '例如鸡尾酒、葡萄酒、无酒精饮品', example: '鸡尾酒' },
      { name: '是否含酒精', description: '填写“是”或“否”', example: '是' },
      { name: '酒精浓度', description: '酒精度数，仅填写数字', example: 12 },
      { name: '描述', description: '酒水介绍，不作为调制步骤使用', example: '薄荷与青柠风味清爽' },
      { name: '用料', description: '多个用料用逗号或换行分隔', example: '白朗姆酒 45ml, 青柠汁 20ml' },
      { name: '调制步骤', description: '多个步骤用换行分隔', example: '加入冰块。\n摇匀后倒入杯中。' },
      { name: '杯型', description: '盛装使用的杯型', example: '高球杯' },
      { name: '基酒', description: '主要基酒；无酒精饮品可留空', example: '白朗姆酒' },
      { name: '调制方式', description: '例如摇和、搅拌、直调', example: '摇和' },
      { name: '装饰', description: '杯饰或点缀', example: '薄荷叶' },
      { name: '风味标签', description: '多个标签用逗号分隔', example: '清爽,柑橘' },
      { name: '场景标签', description: '多个标签用逗号分隔', example: '夏日,聚会' }
    ]
  }
};

export const getResourceImportTemplate = (type: ResourceImportTemplateType) => templateDefinitions[type];

export const buildResourceImportWorkbook = (type: ResourceImportTemplateType) => {
  const definition = getResourceImportTemplate(type);
  const headers = definition.fields.map((field) => field.name);
  const dataSheet = XLSX.utils.aoa_to_sheet([headers]);
  dataSheet['!cols'] = definition.fields.map((field) => ({ wch: Math.max(12, Math.min(24, field.description.length + 4)) }));

  const instructionRows = definition.fields.map((field) => ({
    字段: field.name,
    必填: field.required ? '是' : '否',
    填写说明: field.description,
    示例: field.example
  }));
  const instructionSheet = XLSX.utils.json_to_sheet(instructionRows, {
    header: ['字段', '必填', '填写说明', '示例']
  });
  instructionSheet['!cols'] = [{ wch: 14 }, { wch: 8 }, { wch: 48 }, { wch: 36 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, dataSheet, '填写模板');
  XLSX.utils.book_append_sheet(workbook, instructionSheet, '填写说明');

  return {
    workbook,
    fileName: `${definition.label}导入模板.xlsx`
  };
};
