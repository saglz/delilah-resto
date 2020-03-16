const {
  sequelize,
  insertQuery,
  selectQuery,
  updateQuery,
  deleteQuery
} = require("../../db");

async function getProducts(req, res, next) {
  try {
    req.productList = await productsList();
    next();
  } catch (err) {
    next(new Error(err));
  }
}

async function productsList() {
  const query = selectQuery("products");
  const [dbProducts] = await sequelize.query(query, { raw: true });
  return dbProducts;
}

async function createProduct(req, res, next) {
  const { name, photoUrls, price } = req.body;
  if (name && photoUrls && price >= 0) {
    try {
      const createdProduct = await newProduct(name, photoUrls, price);
      req.addedProduct = createdProduct;
      next();
    } catch (err) {
      next(new Error(err));
    }
  } else {
    res.status(405).json("Missing Arguments");
  }
}

async function newProduct(product_name, product_photo, product_price) {
  return async () => {
    const query = insertQuery(
      "products",
      "product_name, product_photo, product_price",
      [product_name, product_photo, product_price]
    );
    const [addedProduct] = await sequelize.query(query, { raw: true });
    return addedProduct;
  };
}

async function findProductById(id) {
  const existingProduct = async () => {
    const query = selectQuery("products", "*", `idproducts = ${id}`);

    const [dbProduct] = await sequelize.query(query, { raw: true });

    const foundProduct = await dbProduct.find(
      element => element.idproducts === id
    );
    return foundProduct;
  };

  return await existingProduct();
}

async function applyProductChanges(productToUpdate, updatedProperties) {
  const properties = Object.keys(updatedProperties).filter(
    property =>
      updatedProperties[property] &&
      updatedProperties[property] !== " " &&
      updatedProperties[property] !== "null" &&
      updatedProperties[property] !== "undefined" &&
      !updatedProperties[property].toString().includes("  ")
  );
  newProperties = properties.reduce((obj, property) => {
    obj[property] = updatedProperties[property];
    return obj;
  }, {});
  const updatedProduct = { ...productToUpdate, ...newProperties };
  return updatedProduct;
}

async function updateProductInDb(id, product) {
  const { product_name, product_photo, product_price } = product;
  updatedProduct = async () => {
    const query = updateQuery(
      "products",
      `product_name = '${product_name}', product_photo = '${product_photo}', product_price = '${product_price}'`,
      `idProducts = ${id}`
    );
    await sequelize.query(query, { raw: true });
    const dbProduct = await findProductById(id);
    return dbProduct;
  };
  return await updatedProduct();
}

async function updateProduct(req, res, next) {
  const id = +req.params.productId;
  const updatedProperties = req.body;
  try {
    const productToUpdate = await findProductById(id);
    if (productToUpdate) {
      const updatedProduct = await applyProductChanges(
        productToUpdate,
        updatedProperties
      );
      const savedProduct = await updateProductInDb(id, updatedProduct);
      req.updatedProduct = savedProduct;
      next();
    } else {
      res.status(404).json("Product not found");
    }
  } catch (err) {
    next(new Error(err));
  }
}

async function deleteProduct(req, res, next) {
  const id = +req.params.productId;
  try {
    const productToDelete = await findProductById(id);
    if (productToDelete) {
      const isDeleted = async () => {
        const query = deleteQuery("products", `idproducts = ${id}`);
        await sequelize.query(query, { raw: true });
        return true;
      };
      req.isDeleted = await isDeleted();
      next();
    } else {
      res.status(404).json("Product not found");
    }
  } catch (err) {
    next(new Error(err));
  }
}

module.exports = {
  getProducts,
  createProduct,
  newProduct,
  findProductById,
  applyProductChanges,
  updateProductInDb,
  updateProduct,
  deleteProduct
};