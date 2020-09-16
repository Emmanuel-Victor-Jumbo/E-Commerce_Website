/*  ----------------------------Contentful Setup---------------------------- */

const client = contentful.createClient({
    // This is the space ID. A space is like a project folder in Contentful terms
    space: "0tsrx9q6p94e",
    // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
    accessToken: "5N2J6dGMj06DLbTELLWLs2RU7vHyMByAzIhJF2Clw_s"
});



/*  ------------------------------Variables------------------------------ */

const cartBtn = document.querySelector(".cart");                     //Cart icon in navbar (AKA cart-btn)
const closeCartBtn = document.querySelector(".close-cart");          //Close cart window
const clearCartBtn = document.querySelector(".clear-cart");          //Clear all cart items
const cartDOM = document.querySelector(".realcart");                 //Layer on the right holding all Cart stuff
const cartOverlay = document.querySelector(".cart-overlay");         //Layer Covering entire Screen when cart is in use
const cartItems = document.querySelector(".cart-items");             //Cart ITEM Counter (Number icon connected to the rightside of the shopping cart Icon)
const cartTotal = document.querySelector(".cart-total");             //Cart Total in Footer of cart wind
const cartContent = document.querySelector(".cart-content");         //Holds all Individual Cart Items(image, name, price, remove button, increase/decrease buttons and counter)
const productsDOM = document.querySelector(".products-center");      //Div where all products are





// Cart(For placing information, getting it from the local storage etc) 
let cart = [];

// Buttons
let buttonsDOM = [];



/*  ------------------------------Classes(Objects)------------------------------ */
// Gets & Restructures raw data from the "product.json" file (<<NOTE>> Result can only be seen on chrome's console)
class Products{
    /*  --------Method-------- */
    async getProducts() {
        try{                                                            // Run code in "try" block. Only run "catch" block if something fails
            //----------  Contentful Setup   -------------
            let contenful = await client.getEntries({
                content_type: 'eStoreProducts'
            });



            //----------  JSON FILE Switch  -------------
            // let result = await fetch("./js/products.json");             // Get raw(unreadable) data from json file
            // let data = await result.json();                             // To return contents of above "result" variable in 'json' file format
            // let products = data.items;                                  // "products" now holds json file's "item" array
            
            //----------  Contentful Switch  -------------
            let products = contenful.items; 

            

            products = products.map(item =>{                            // Method for organising/ mapping currently unorganised "json data" 
                const { title, price } = item.fields;                   // <<<<TAKE>>> const { "property to retrive" } = "Location in json file where property can be found";
                const { id } = item.sys;
                const image = item.fields.image.fields.file.url;
                return { title, price, id, image };                     // sort
            });
            return products;
        } catch (error) {                                               // Display info on error (if any) caused in "try block"
            console.log(error);
        }
    }
}

/*  ------------------------------Classes(Objects)------------------------------ */
// Holds everything being diplayed on screen (Using items returned from above "products")
class UI{
    /*  --------Method-------- */
    //Displays all products at bottom of screen
    displayProducts(products){                                                                  // "products" is a modified array from "getProducts" method in "Products" class above
        let result = "";
        products.forEach(product => {                                                        // Looping over array
            result += `                                                                      
                <article class="product">
                    <div class="img-container">
                        <img 
                            src=${product.image} 
                            alt="product" 
                            class="product-img"
                        />
                        <button class="bag-btn" data-id=${product.id}>
                            <i class="fas fa-shopping-cart p-2"></i>
                            Add To Cart
                        </button>
                    </div>
                    <h3>${product.title}</h3>
                    <h4>$${product.price}</h4>
                </article>
            `;
        });                                                                                // Continously adding product from array to "result" variable
        productsDOM.innerHTML = result;                                                    // Display/Move "result" contents to "productsDOM" position in HTML file
    }

    /*  --------Method-------- */
    // Cart Operations (Mostly buttons)
    getBagButtons(){
        const buttons = [...document.querySelectorAll(".bag-btn")];                           // Array of "add to cart" buttons (without array brackets it would be a nodelist)   
        buttonsDOM = buttons;                       //
        
        buttons.forEach(button => {                                                           // Loop through button Array ("button" is the loop variable created after above forEach intruction it represents individual elements in the "buttons" array at the top)
            //-----Item In Cart-----
            let id = button.dataset.id;                                                       // Get id of individual products buttons which is already linked to does buttons <& product> in HTML section    ("button" is the loop variable created after above forEach intruction it represents individual elements in the "buttons" array at the top)
            let inCart = cart.find(item => item.id === id);                                   // checking if the id(s) of items in the "cart" array match the items in the product section (P.S  id(s) are in product purchase buttons) <<< "item.id" is just being created and is coming from id in individual items saved in "cart"(local storage) | "id" is coming from above variable >>>
            if(inCart){                                                                       // If matching "id" found
                button.innerText = "In Cart";                                                 // Change button text on related product
                button.disable = true;                                                        // Disable "add to cart" button on related product
            }
            // <<<<<<<<<<<<<<           Occur on Button click (AKA Main Method)     >>>>>>>>>>>>>>>
            //-----Item NOT In Cart -----
            button.addEventListener("click",event => {
                event.target.innerText = "In Cart";                                           // event= what occured | target=who did it(specific button) {Change button text}
                event.target.disabled = true;                                                 // event= what occured | target=who did it(specific button) {Disable "add to cart" button}
                // Method to get specific product from Products(local storage)
                let cartItem = {...Storage.getProduct(id), amount: 1 };                       // Actives and sends argument("id" from above "inCart" varible) to "getProduct" method in "Storage" class (<<<< "amount: 1" will be used as the number of units of any given product in cart >>>>)
                cart = [...cart, cartItem];                                                   // Current items in cart ARRAY & Add specific product from last line to Cart ARRAY
                Storage.saveCart(cart);                                                       // Actives and sends argument("cart" from above array) to "saveCart" method in "Storage" (Saves above "cart" ARRAY and its items to local storage)
                // Set ALL Cart Values
                this.setCartValues(cart);                                                     // Actives and sends argument("cart" from above array) to "setCartValue" method in this class (calculates number of products in cart (navbar cart icon), cost total of all products & update HTML) 
                // Display Items In Cart
                this.addCartItem(cartItem);                                                   // Actives and sends argument("item" from above "cartItem" varible) to "addCartItem" method in this class (Displays all Items In Cart )
                this.showCart();                                                              // Actives the "showCart" method in this class (opens cart Window)
            });
        });   
    }

    /*  --------Method-------- */
    // Calculate ALL Cart Values & update HTML
    setCartValues(cart){
        //Instances
        let tempTotal = 0;                                                                       // Total Cost of all products in cart based (Accounting for both individual products costs, as well as total number of units of any specific product )
        let itemsTotal = 0;                                                                      // Total number of specific products (and their units) in the cart
        cart.map(item => {                                                                       // "item" is just a made up variable name, to use in the mapping element of the cart array
            //Calculation
            tempTotal += item.price * item.amount;
            itemsTotal += item.amount;
        });
            // Update HTML text
        cartTotal.innerText = parseFloat(tempTotal.toFixed(2));                                  // {parseFloat() | .toFixed()} To get current float values
        cartItems.innerText = itemsTotal; 
    }

    /*  --------Method-------- */
    // Display Items In Cart
    addCartItem(item){                                                                           // Parameter can be anyname here. Parameter is coming from "cartItem" varible at top
        const div = document.createElement("div");                                               // Create & Add div (name: "cart-item") this is to hold the parts of a cart item (eg name, price) and its already been styled in css
        div.classList.add("cart-item");                                                          // Add div
        //added "data-id=${item.id}" to Remove, Increase, Decrease buttons so its specific functionallity can be coded in
        div.innerHTML = `
        <img src="${item.image}">
        <div>
            <h4>${item.title}</h4>
            <h5>$${item.price}</h5>
            <span class="remove-item" data-id=${item.id}>remove</span>
        </div>
        <div>
            <i class="fas fa-chevron-up" data-id=${item.id}></i>
            <p class="item-amount">${item.amount}</p>
            <i class="fas fa-chevron-down" data-id=${item.id}></i>
        </div>`;
        cartContent.appendChild(div);                                                           // Display and update HTML with above changes
    }
    
    /*  --------Method-------- */
    // Resposible for openning cart Window
    showCart(){
        cartOverlay.classList.add("transparentBcg");                                            // Make layer covering the entire screen visible (Put inactive css method ".transparentBcg" into css/HTML method ".cart-overlay")
        cartDOM.classList.add("showCart")                                                       // Make layer holding cart items & stuff visible (Put inactive css method ".showCart" into css/HTML method ".realcart")
    }

    /*  --------Method-------- */
    // Restores cart's contents after user Reloads site
    setupAPP(){
        cart= Storage.getCart();                                                                 // Actives "getCart" method in "Storage" class (Assigns already selected products from local storage("cart") to the actual cart {Occurs when application is loaded})
        this.setCartValues(cart);                                                                // Update cart values by running above "setCartValues" method (passing parameter <local storage("cart")>)
        this.populateCart(cart);                                                                 // Builds individual products in cart using data from local storage("cart") & "addCartItem" method
        // On Button click
        cartBtn.addEventListener("click", this.showCart);                                        // OPENs cart whenever cart icon in navbar is clicked (by running above "showCart" method)
        closeCartBtn.addEventListener("click", this.hideCart);                                   // CLOSEs cart whenever "X" icon in cart window is clicked (by running below "hideCart" method)
    }

    /*  --------Method-------- */
    // Just a forLoop for building individual products in cart using data from local storage("cart")
    populateCart(cart){
        cart.forEach(item => this.addCartItem(item));                                            // For each product in local storage("cart") array, build its element in cart  (Done with the aid of parameter: <local storage("cart")>     &       "addCartItem" method)
    }

    /*  --------Method-------- */
    // Resposible for Closing cart Window
    hideCart(){
        cartOverlay.classList.remove("transparentBcg");                                         // Make layer covering the entire screen Invisible (Remove active css method ".transparentBcg" into css/HTML method ".cart-overlay")
        cartDOM.classList.remove("showCart");                                                   // Make layer holding cart items & stuff Invisible (Remove active css method ".showCart" into css/HTML method ".realcart")
    }

    /*  --------Method-------- */
    // EventListener for "clear cart" button and Bubble EventListener for buttons(increase, decrease, remove) of individual cart items currently in the cart.
    cartLogic(){
        // <<<<<<<<<<<<<<           Occur on Button click (AKA Main Method)     >>>>>>>>>>>>>>>
        // EventListener for "clear cart" button
        clearCartBtn.addEventListener("click", ()=>{                                            // clear entire cart and make needed update when the "clear cart button" is clicked
            this.clearCart();                                                                   // Calls below "clearCart" method on click of clear cart botton
        });

        // <<<<<<<<<<<<<<           Occur on Button click (AKA Main Method)     >>>>>>>>>>>>>>>
        // "Bubble EventListener" for buttons(increase, decrease, remove) of individual cart items currently in the cart.
        cartContent.addEventListener("click", event => {                                        // Targets all buttons with the "cart-content" HTML tag
            //Remove
            if (event.target.classList.contains("remove-item")){                                // If "remove-item" class/ button gets clicked do the below. "event" "target" and "classList" all aid in pin pointing the exact class(a tag's attribute) of the button clicked/ triggered by the user
                let removeItem = event.target;                                                  // Saves info of button clicked, into new "removeItem" variable.
                let id = removeItem.dataset.id;                                                 // Gets the "id" of butten clicked and saves it into new "id" variable.
                cartContent.removeChild(removeItem.parentElement.parentElement);                // Removes cart Item from "Dom"(AKA HTML display). Done in an inside div to Outside div manner, starting for the "remove-item" and then it's two parent divs which are currently holding it. {parent divs are: "div" & "cart-item"}
                this.removeItem(id);                                                            // Removes cart Item from "local storage" and updates totals. Done by calling the "removeItem" method in class and passing the above specific "id" to the method.
            }
            //Increase
            else if(event.target.classList.contains("fa-chevron-up")){                          // If "fa-chevron-up" class/ button gets clicked do the below. "event" "target" and "classList" all aid in pin pointing the exact class(a tag's attribute) of the button clicked/ triggered by the user
                let addAmount = event.target;                                                   // Saves info of butten clicked, into new "addAmount" variable.
                let id = addAmount.dataset.id;                                                  // Gets the "id" of button clicked and saves it into new "id" variable.
                let tempItem = cart.find(item => item.id === id);                               // sync above "id" to it's "id" in cart
                tempItem.amount = tempItem.amount + 1;                                          // Update(Increases) the amount attribute of that particular item in the "cart" array (in local storage)
                Storage.saveCart(cart);                                                         // Saves above "cart" array update to local storage to ensure data isn't lost when the page is refreshed (Done by passing updated "cart" array into the "saveCart" method of the "Storage" class)
                this.setCartValues(cart);                                                       // Updates cart totals {price & Cart icon in nav bar} (Done by passing updated "cart" array into the "setCartValues" method of this class)
                addAmount.nextElementSibling.innerText = tempItem.amount;                       // Updates HTML display of amount. "nextElementSibling" -> Triverses to the next sub tag within the main tag (starts from "fas fa-chevron-up"{aka "addAmount"} tag & stops at "item-amount" tag ) || "innerText" -> changes HTML text || tempItem.amount-> holds updated amount's value
            }
            //Decrease
            else if(event.target.classList.contains("fa-chevron-down")){                        // If "fa-chevron-down" class/ button gets clicked do the below. "event" "target" and "classList" all aid in pin pointing the exact class(a tag's attribute) of the button clicked/ triggered by the user
                let lowerAmount = event.target;                                                 // Saves info of butten clicked, into new "lowerAmount" variable.
                let id = lowerAmount.dataset.id;                                                // Gets the "id" of button clicked and saves it into new "id" variable.
                let tempItem = cart.find(item => item.id === id);                               // sync above "id" to it's "id" in cart
                tempItem.amount = tempItem.amount - 1;                                          // Update(Decrease) the amount attribute of that particular item in the "cart" array (in local storage)
                if (tempItem.amount > 0){                                                       // While Amount is more than 0 do the below 
                    Storage.saveCart(cart);                                                     // Saves above "cart" array updates to local storage. This ensure data isn't lost when the page is refreshed (Done by passing updated "cart" array into the "saveCart" method of the "Storage" class)
                    this.setCartValues(cart);                                                   // Updates cart totals {price & Cart icon in nav bar} (Done by passing updated "cart" array into the "setCartValues" method of this class)
                    lowerAmount.previousElementSibling.innerText = tempItem.amount;             // Updates HTML display of "amount". "nextElementSibling" -> Triverses to the next sub tag within the main tag (starts from "fas fa-chevron-up"{aka "addAmount"} tag & stops at "item-amount" tag ) || "innerText" -> changes HTML text || tempItem.amount-> holds updated amount's value
                } else {                                                                        // When Amount is reduced to 0 do the below
                    cartContent.removeChild(lowerAmount.parentElement.parentElement);           // Removes cart Item from "Dom"(AKA HTML display). Done in an inside div to Outside div manner, starting for the "remove-item" and then it's two parent divs which are currently holding it. {parent divs are: "div" & "cart-item"}
                    this.removeItem(id);                                                        // Removes cart Item from "local storage" and updates totals. Done by calling the "removeItem" method in class and passing the above specific "id" to the method.
                }
            }
        });
    }

    /*  --------Method-------- */
    // Get id(s) of items in cart to be removed and pass them to "removeItem" method and hides cart window after cart has been emptied
    clearCart(){
        let cartItems = cart.map(item => item.id);                                              // Getting id(s) of items in cart. Accessing "cart" Array(local storage), retrieving individual id of cart items and store that in "cartItems" variable/ array
        cartItems.forEach(id => this.removeItem(id));                                           // Pass id(s) to a method that removes items in cart. loop over "id"(s) in "cartItems"(above variable) and run "removeItem()" method {& pass "id"(s)} {Using For loop to allow for both specific item removal from array as well as completely emptying out entire array at once}
        // Removes all Cart items (HTML displayed) from Cart
        while(cartContent.children.length > 0){                                                 // Just checks if "cartContent" (AKA "cart-content" in html, div holding Cart items) has any elements in it
            cartContent.removeChild(cartContent.children[0]);                                   // Continously removes the first element in  "cartContent" (AKA "cart-content" in html, div holding Cart items) until nothing is left
        }
        this.hideCart();                                                                        // Hide cart. By running "hideCart" method in this class
    }

    /*  --------Method-------- */
    // Some of the stuff that occurs when an item is removed from cart
    removeItem(id){
        cart = cart.filter(item => item.id !== id);                                             // This returns an array consisting of id(s) in the cart which were NOT sent from the "clearCart" method
        //console.log(cart); 
        this.setCartValues(cart);                                                               // Updates cart values (price and item counter). Done by passing the new "cart" array into the "setCartValues" method in this class
        Storage.saveCart(cart);                                                                 // Updates/Overrides the contents of "cart" array in local storage with our new "cart" array. Done by passing the new "cart" array into the "saveCart" method of the "Storage" class
        let button = this.getSingleButton(id);                                                  // Get a particular Button based on its item id. Done by passing item "id" into the "getSingleButton" method in this class
        //  "button" variable is now holding individual product button into, thanks to above line
        button.disabled = false;                                                                //  Enables individual product button (was disabled when item was added to cart)
        button.innerHTML = `<i class="fas fa-shopping-cart p-2"></i>Add To Cart`;               //  Updates HTML on individual product button (text was change and icon removed when item was added to cart)
    }

    /*  --------Method-------- */
    // Search "buttonsDOM" array for id(s) matching buttons in product section with id(s) of items in cart
    getSingleButton(id){
        return buttonsDOM.find(button => button.dataset.id === id);                             // Search "buttonsDOM" array for id(s) matching buttons in product section with id(s) of items in cart
    }
}



/*  ------------------------------Classes(Objects)------------------------------ */
// local storage (No instance for this class cause will be using static methods)
class Storage{

    /* --------Static Method-------- */
    // Store "products" array as a string in local storage
    static saveProducts(products){
        localStorage .setItem("products", JSON.stringify(products) );                                                               //Accessing local storage. store(localStorage.setItem) "products" array as a string
    }

    /* --------Static Method-------- */
    // Get Data with matching "id" from localStorage
    static getProduct(id){                                                                                                         // id parameter from "getBagButtons" method in "UI" class?
        let products =JSON.parse(localStorage.getItem('products'));                                                                // Returns array already in local storage as JS object after converting it to string
        return products.find(product => product.id === id);                                                                        // Get specific product info based on matching "IDs"
    }

    /* --------Static Method-------- */
    // Saves "cart" ARRAY and its items to local storage
    static saveCart(cart){
        localStorage.setItem("cart", JSON.stringify(cart));                                                                        // Saves "cart" ARRAY and its items to local storage
    }

    /* --------Static Method-------- */
    // Assigns Already selected products from local storage("cart") to the actual cart (Occurs when application is loaded)
    static getCart(){
        return localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : []                                         // If "cart" exist in local storage(meaning user selected items before reloading page), Convert data(string) to JS object and return that BUT IF NOT then return an empty array.
    }
}


/*  ------------------------------Event listener------------------------------ */ 
// Holds function calls(AKA Main Method)
document.addEventListener("DOMContentLoaded", () => {               // when content is loaded

    // Instances of above classes
    const ui = new UI();
    const products = new Products();

    // Must occur while Site loads (Restores cart's contents after user Reloads site)
    ui.setupAPP();                                                  // Setup "setupAPP" method in the "ui" class. (Restores cart's contents after user Reloads site)

    // Get all product & buttons
    products.getProducts()
    .then(products => {
        ui.displayProducts(products);                               // Get and Display all products using the "displayProducts" method in the "ui" class.        |OR|       For only data in chrome console "then(products => console.log(products));"
        Storage.saveProducts(products);                             // Store products array as string on browser's local storage using the "saveProducts" static method in the "Storage" class. (info displayed in dev tool 	<dev tools, application, local storage>        )
    })
    .then(()=>{                                                     // chain of ".then()" to control execution cause buttons can only be gotten after everything else is loaded
        ui.getBagButtons();                                         // Activates the "getBagButtons" method in the "UI" class to retrieve an array of product "add to cart" butttons
        ui.cartLogic();                                             // Activates the "cartLogic" method in the "UI" class to 
    });                                                              
    
});