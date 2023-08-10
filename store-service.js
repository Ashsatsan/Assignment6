const Sequelize = require("sequelize");

var sequelize = new Sequelize(
  "ctdkytyb", // db name
  "ctdkytyb", // username
  "9NoiY0LdzLla7LeEwOf3Lm5Xr7xXzUml", // pass
  {
    host: "stampy.db.elephantsql.com", // host
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
  }
);

// Creating Models

const Item = sequelize.define("Item", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE,
});

const Category = sequelize.define("Category", {
  category: Sequelize.STRING,
});

//belongsTo Relationship
Item.belongsTo(Category, { foreignKey: "category" });

// Function to initialize the database connection
function initialize() {
  return new Promise((resolve, reject) => {
    sequelize
      .sync() // Create tables if they don't exist
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject("unable to sync the database");
      });
  });
}

// Function to get all items from the database
function getAllItems() {
  return new Promise((resolve, reject) => {
    Item.findAll()
      .then((items) => {
        resolve(items);
      })
      .catch((err) => {
        reject("no results returned");
      });
  });
}
// Function to get all published items from the database
function getPublishedItems() {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { published: true } })
      .then((publishedItems) => {
        resolve(publishedItems);
      })
      .catch((err) => {
        reject("no results returned");
      });
  });
}
// Function to get all categories from the database
function getCategories() {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then((categories) => {
        resolve(categories);
      })
      .catch((err) => {
        reject("no results returned");
      });
  });
}
// Function to add a new item to the database
function addItem(itemData) {
  return new Promise((resolve, reject) => {
    itemData.published = itemData.published ? true : false; // set published to boolean

    // set "" to null
    for (const prop in itemData) {
      if (itemData[prop] === "") {
        itemData[prop] = null;
      }
    }
    // set date
    itemData.postDate = new Date();

    Item.create(itemData)
      .then((newItem) => {
        resolve(newItem);
      })
      .catch((err) => {
        reject("unable to create post");
      });
  });
}
// Function to get items by a specific category from the database
function getItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { category: category } })
      .then((matchedItems) => {
        resolve(matchedItems);
      })
      .catch((err) => {
        reject("no results returned");
      });
  });
}
// Function to get items with post dates greater than or equal to a specified date
function getItemsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    let { gte } = Sequelize.Op;
    let minDate = new Date(minDateStr);
    Item.findAll({
      where: { postDate: { [gte]: minDate } },
    })
      .then((matchedItems) => {
        resolve(matchedItems);
      })
      .catch((err) => {
        reject("no results returned");
      });
  });
}
// Function to get an item by its ID from the database
function getItemById(id) {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { id: id } })
      .then((matchedItems) => {
        resolve(matchedItems[0]);
      })
      .catch((err) => {
        reject("no results returned");
      });
  });
}
// Function to get all published items by a specific category from the database
function getPublishedItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { published: true, category: category } })
      .then((matchedItems) => {
        resolve(matchedItems);
      })
      .catch((err) => {
        reject("no results returned");
      });
  });
}
// Function to add a new category to the database
function addCategory(categoryData) {
  return new Promise((resolve, reject) => {
    // set "" to null
    for (const prop in categoryData) {
      if (categoryData[prop] === "") {
        categoryData[prop] = null;
      }
    }

    Category.create(categoryData)
      .then((newCategory) => {
        resolve(newCategory);
      })
      .catch((err) => {
        console.log(err);
        reject("unable to create category");
      });
  });
}
// Function to delete a category by its ID from the database
function deleteCategoryById(id) {
  return new Promise((resolve, reject) => {
    Category.destroy({ where: { id: id } })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        console.log(err);
        reject("unable to delete category");
      });
  });
}
// Function to delete an item by its ID from the database
function deletePostById(id) {
  return new Promise((resolve, reject) => {
    Item.destroy({ where: { id } })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        console.log(err);
        reject("unable to delete item");
      });
  });
}

// Exporting all the functions as a module
module.exports = {
  initialize,
  getAllItems,
  getPublishedItems,
  getCategories,
  addItem,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  getPublishedItemsByCategory,
  addCategory,
  deleteCategoryById,
  deletePostById,
};
