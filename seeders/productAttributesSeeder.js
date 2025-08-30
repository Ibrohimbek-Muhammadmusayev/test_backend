// seeders/productAttributesSeeder.js
const { 
  ProductAttribute, 
  AttributeValue, 
  Product, 
  ProductVariant, 
  ProductVariantAttribute 
} = require('../models');

const seedProductAttributes = async () => {
  try {
    console.log('🌱 Seeding Product Attributes...');

    // 1. Attributelarni yaratish
    const colorAttribute = await ProductAttribute.create({
      name: 'color',
      displayName: 'Rang',
      type: 'color',
      isRequired: true,
      isFilterable: true,
      sortOrder: 1
    });

    const sizeAttribute = await ProductAttribute.create({
      name: 'size',
      displayName: 'O\'lcham',
      type: 'size',
      isRequired: true,
      isFilterable: true,
      sortOrder: 2
    });

    const materialAttribute = await ProductAttribute.create({
      name: 'material',
      displayName: 'Material',
      type: 'select',
      isRequired: false,
      isFilterable: true,
      sortOrder: 3
    });

    const weightAttribute = await ProductAttribute.create({
      name: 'weight',
      displayName: 'Og\'irlik',
      type: 'number',
      unit: 'kg',
      isRequired: false,
      isFilterable: false,
      sortOrder: 4
    });

    console.log('✅ Attributes created');

    // 2. Rang qiymatlari
    const colorValues = [
      { value: 'red', displayValue: 'Qizil', colorCode: '#FF0000' },
      { value: 'blue', displayValue: 'Ko\'k', colorCode: '#0000FF' },
      { value: 'green', displayValue: 'Yashil', colorCode: '#00FF00' },
      { value: 'black', displayValue: 'Qora', colorCode: '#000000' },
      { value: 'white', displayValue: 'Oq', colorCode: '#FFFFFF' },
      { value: 'yellow', displayValue: 'Sariq', colorCode: '#FFFF00' },
      { value: 'purple', displayValue: 'Binafsha', colorCode: '#800080' },
      { value: 'orange', displayValue: 'To\'q sariq', colorCode: '#FFA500' }
    ];

    for (const color of colorValues) {
      await AttributeValue.create({
        attributeId: colorAttribute.id,
        ...color,
        sortOrder: colorValues.indexOf(color)
      });
    }

    // 3. O'lcham qiymatlari
    const sizeValues = [
      { value: 'XS', displayValue: 'XS' },
      { value: 'S', displayValue: 'S (Kichik)' },
      { value: 'M', displayValue: 'M (O\'rta)' },
      { value: 'L', displayValue: 'L (Katta)' },
      { value: 'XL', displayValue: 'XL' },
      { value: 'XXL', displayValue: 'XXL' },
      { value: '38', displayValue: '38' },
      { value: '39', displayValue: '39' },
      { value: '40', displayValue: '40' },
      { value: '41', displayValue: '41' },
      { value: '42', displayValue: '42' },
      { value: '43', displayValue: '43' },
      { value: '44', displayValue: '44' }
    ];

    for (const size of sizeValues) {
      await AttributeValue.create({
        attributeId: sizeAttribute.id,
        ...size,
        sortOrder: sizeValues.indexOf(size)
      });
    }

    // 4. Material qiymatlari
    const materialValues = [
      { value: 'cotton', displayValue: 'Paxta' },
      { value: 'polyester', displayValue: 'Polyester' },
      { value: 'wool', displayValue: 'Jun' },
      { value: 'silk', displayValue: 'Ipak' },
      { value: 'leather', displayValue: 'Teri' },
      { value: 'denim', displayValue: 'Denim' },
      { value: 'linen', displayValue: 'Zig\'ir' },
      { value: 'synthetic', displayValue: 'Sintetik' }
    ];

    for (const material of materialValues) {
      await AttributeValue.create({
        attributeId: materialAttribute.id,
        ...material,
        sortOrder: materialValues.indexOf(material)
      });
    }

    console.log('✅ Attribute values created');
    console.log('🎉 Product attributes seeding completed!');

    return {
      colorAttribute,
      sizeAttribute,
      materialAttribute,
      weightAttribute
    };

  } catch (error) {
    console.error('❌ Error seeding product attributes:', error);
    throw error;
  }
};

// Mavjud mahsulotlarga variant attributelarini qo'shish
const addAttributesToExistingProducts = async () => {
  try {
    console.log('🔄 Adding attributes to existing products...');

    // Birinchi mahsulotni olish
    const product = await Product.findOne({
      include: [{
        model: ProductVariant,
        as: 'variants'
      }]
    });

    if (!product || !product.variants || product.variants.length === 0) {
      console.log('⚠️ No products with variants found');
      return;
    }

    // Attributelarni olish
    const colorAttribute = await ProductAttribute.findOne({ where: { name: 'color' } });
    const sizeAttribute = await ProductAttribute.findOne({ where: { name: 'size' } });
    const materialAttribute = await ProductAttribute.findOne({ where: { name: 'material' } });

    // Rang qiymatlarini olish
    const redColor = await AttributeValue.findOne({ 
      where: { attributeId: colorAttribute.id, value: 'red' } 
    });
    const blueColor = await AttributeValue.findOne({ 
      where: { attributeId: colorAttribute.id, value: 'blue' } 
    });

    // O'lcham qiymatlarini olish
    const sizeM = await AttributeValue.findOne({ 
      where: { attributeId: sizeAttribute.id, value: 'M' } 
    });
    const sizeL = await AttributeValue.findOne({ 
      where: { attributeId: sizeAttribute.id, value: 'L' } 
    });

    // Material qiymatini olish
    const cottonMaterial = await AttributeValue.findOne({ 
      where: { attributeId: materialAttribute.id, value: 'cotton' } 
    });

    // Birinchi variantga attributelar qo'shish
    if (product.variants[0]) {
      await ProductVariantAttribute.create({
        variantId: product.variants[0].id,
        attributeId: colorAttribute.id,
        attributeValueId: redColor.id
      });

      await ProductVariantAttribute.create({
        variantId: product.variants[0].id,
        attributeId: sizeAttribute.id,
        attributeValueId: sizeM.id
      });

      await ProductVariantAttribute.create({
        variantId: product.variants[0].id,
        attributeId: materialAttribute.id,
        attributeValueId: cottonMaterial.id
      });
    }

    // Ikkinchi variantga attributelar qo'shish (agar mavjud bo'lsa)
    if (product.variants[1]) {
      await ProductVariantAttribute.create({
        variantId: product.variants[1].id,
        attributeId: colorAttribute.id,
        attributeValueId: blueColor.id
      });

      await ProductVariantAttribute.create({
        variantId: product.variants[1].id,
        attributeId: sizeAttribute.id,
        attributeValueId: sizeL.id
      });

      await ProductVariantAttribute.create({
        variantId: product.variants[1].id,
        attributeId: materialAttribute.id,
        attributeValueId: cottonMaterial.id
      });
    }

    console.log('✅ Attributes added to existing products');

  } catch (error) {
    console.error('❌ Error adding attributes to products:', error);
    throw error;
  }
};

module.exports = {
  seedProductAttributes,
  addAttributesToExistingProducts
};

// Agar to'g'ridan-to'g'ri ishga tushirilsa
if (require.main === module) {
  (async () => {
    try {
      await seedProductAttributes();
      await addAttributesToExistingProducts();
      process.exit(0);
    } catch (error) {
      console.error('Seeding failed:', error);
      process.exit(1);
    }
  })();
}