/*********************************************************************************
*  WEB322 – Assignment 06
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part of this
*  assignment has been copied manually or electronically from any other source (including web sites) or 
*  distributed to other students.
* 
*  Name: Abhijeet Singh Hundal_ Student ID: 169721214 Date: 10-08-2023
*
*  Cyclic Web App URL: https://long-gazelle.cyclic.app/
*
*  GitHub Repository URL: https://github.com/Ashsatsan/Assignment6.git
*
********************************************************************************/ 


const exphbs = require("express-handlebars");
const express = require("express");
const storeService = require("./store-service");
const clientSessions = require("client-sessions");
const authData = require("./auth-service");

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

const app = express();
const port = process.env.PORT || 8080;

// cloudinary
cloudinary.config({
  cloud_name: "didxl7ofi",
  api_key: "375123431761518",
  api_secret: "Y2AuE1fw7Zy1SJa4ehFmNTpOh_g",
  secure: true,
});

const upload = multer();

// Set up session handling middleware
app.use(
  clientSessions({
    cookieName: "session",                  // Name of the cookie to store session data
    secret: "NdklRhBT8b",                   // Secret key used for encrypting session data
    duration: 24 * 5 * 60 * 60 * 1000,     // Session duration: 5 days in milliseconds
    activeDuration: 1000 * 60 * 3,         // Active session duration: 3 minutes in milliseconds
  })
);

// Middleware to make session data available in the response locals
app.use(function (req, res, next) {
  res.locals.session = req.session;         // Making session data available in response locals
  next();                                   // Move on to the next middleware or route handler
});

// Middleware to ensure that a user is logged in before accessing certain routes
function ensureLogin(req, res, next) {
  if (req.session && req.session.user) {
    // Check if a session exists and if the user is logged in
    return next(); // Continue to the next middleware or route handler
  } else {
    res.redirect("/login"); // Redirect to the login page if the user is not logged in
  }
}

// Middleware to serve static files
app.use(express.static("public"));

app.set("view engine", "hbs");
// Middleware function to set active route and viewing category
app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

// Custom Handlebars helper for navLink
const hbs = exphbs.create({
  extname: ".hbs",
  helpers: {
    navLink: function (url, options) {
      return (
        '<li class="nav-item"><a' +
        (url == app.locals.activeRoute
          ? ' class="nav-link active"'
          : ' class="nav-link"') +
        ' href="' +
        url +
        '">' +
        options.fn(this) +
        "</a></li>"
      );
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    },
    // to format date
    formatDate: function (dateObj) {
      let year = dateObj.getFullYear();
      let month = (dateObj.getMonth() + 1).toString();
      let day = dateObj.getDate().toString();
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    },
  },
});

app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");

// processing form submission in json
app.use(express.urlencoded({ extended: true }));

// Create a route for the app
app.get("/", (req, res) => {
  res.redirect("/shop");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/shop", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "post" objects
    let items = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      items = await storeService.getPublishedItemsByCategory(
        req.query.category
      );
    } else {
      // Obtain the published "items"
      items = await storeService.getPublishedItems();
    }

    // sort the published items by postDate
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest post from the front of the list (element 0)
    let item = items[0];

    // store the "items" and "post" data in the viewData object (to be passed to the view)
    viewData.items = items;
    viewData.item = item;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await storeService.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", { data: viewData });
});

app.get("/shop/:id", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "item" objects
    let items = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      items = await storeService.getPublishedItemsByCategory(
        req.query.category
      );
    } else {
      // Obtain the published "posts"
      items = await storeService.getPublishedItems();
    }

    // sort the published items by postDate
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // store the "items" and "item" data in the viewData object (to be passed to the view)
    viewData.items = items;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the item by "id"
    viewData.item = await storeService.getItemById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await storeService.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", { data: viewData });
});

// Route to get items based on query parameters (category or minDate)
app.get("/items", async (req, res) => {
  try {
    let itemsFunctions;

    if (req.query.category) {
      // category exists
      itemsFunctions = storeService.getItemsByCategory(req.query.category);
    } else if (req.query.minDate) {
      // minDate exists
      itemsFunctions = storeService.getItemsByMinDate(req.query.minDate);
    } else {
      // no category or minDate
      itemsFunctions = storeService.getAllItems();
    }

    const data = await itemsFunctions;

    if (data.length > 0) {
      res.render("items", { items: data });
    } else {
      // no items returned
      res.render("items", { message: "no items results" });
    }
  } catch (err) {
    res.render("items", { message: "no items results" });
  }
});
// Route to get all categories
app.get("/categories", (req, res) => {
  storeService
    .getCategories()
    .then((data) => {
      if (data.length > 0) {
        res.render("categories", { categories: data });
      } else {
        // no categories
        res.render("categories", { message: "No categories found." });
      }
    })
    .catch((err) => {
      res.render("categories", { message: "No categories found." });
    });
});
// Route to render the "Add Item" page
app.get("/items/add", (req, res) => {
  storeService
    .getCategories()
    .then((data) => {
      res.render("addItem", { categories: data });
    })
    .catch((err) => {
      res.render("addItem", { categories: [] });
    });
});
// Route to handle the form submission for adding an item
app.post("/items/add", upload.single("featureImage"), function (req, res) {
  if (req.file) {
    // Upload item image
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
    }

    upload(req).then((uploaded) => {
      processItem(uploaded.url);
    });
  } else {
    processItem("");
  }

  function processItem(imageUrl) {
    req.body.featureImage = imageUrl;

    const itemData = req.body;

    storeService
      .addItem(itemData)

      .then(() => res.redirect("/items"))
      .catch((err) => {
        res.status(500).json({ message: err });
      });
  }
});
// Route to get an item by its ID
app.get("/item/:itemId", (req, res) => {
  storeService
    .getItemById(req.params.itemId)
    .then((item) => {
      res.json(item);
    })
    .catch((err) => {
      res.status(500).json({ message: err });
    });
});

// Route to render the "Add Category" page
app.get("/categories/add", (req, res) => {
  res.render("addCategory");
});

// Route to handle the form submission for adding a category
app.post("/categories/add", (req, res) => {
  storeService
    .addCategory(req.body)
    .then(() => {
      res.redirect("/categories");
    })
    .catch(() => {
      res.status(500).send("Unable to add category");
    });
});

// Route to delete category by its ID
app.get("/categories/delete/:id", (req, res) => {
  storeService
    .deleteCategoryById(req.params.id)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((err) => {
      res.status(500).send("Unable to remove category / Category not found");
    });
});

// Route to delete an item by its ID
app.get("/items/delete/:id", (req, res) => {
  storeService
    .deletePostById(req.params.id)
    .then(() => {
      res.redirect("/items");
    })
    .catch(() => {
      res.status(500).send("Unable to remove Post / Post not found");
    });
});

// Route to display the login form
app.get("/login", (req, res) => {
  res.render("login", {}); // Render the login form view
});

// Route to process the submitted login form
app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent"); // Store the User-Agent from request headers

  const userData = req.body; // Extract user data from the request body

  authData
    .checkUser(userData) // Call function to check user authentication
    .then((user) => {
      // If authentication is successful
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      }; // Store user data in the session
      res.redirect("/items"); // Redirect to the "items" page
    })
    .catch((err) => {
      // If authentication fails
      res.render("login", { errorMessage: err, userName: req.body.userName }); // Render login form with error message
    });
});

// Route to display the registration form
app.get("/register", (req, res) => {
  res.render("register", {}); // Render the registration form view
});

// Route to process the submitted registration form
app.post("/register", (req, res) => {
  const userData = req.body; // Extract user data from the request body

  authData
    .registerUser(userData) // Call function to register user
    .then(() => {
      res.render("register", { successMessage: "User created" }); // Render registration form with success message
    })
    .catch((err) => {
      res.render("register", {
        errorMessage: err,
        userName: userData.userName,
      }); // Render registration form with error message
    });
});
// Route to display the user's login history
app.get("/userHistory", ensureLogin, function (req, res) {
  res.render("userHistory"); // Render the user's login history page
});

// Route to log out the user
app.get("/logout", function (req, res) {
  req.session.reset(); // Reset the session, effectively logging the user out
  res.redirect("/"); // Redirect to the home page
});

//no matching route
app.use((req, res) => {
  res.status(404).render("404");
});

// Initialize the server and start listening on the specified port
storeService
  .initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(port, () => {
      console.log("Express http server listening on " + port);
    });
  })
  .catch((err) => {
    console.log(err);
  });
