## FYP 2 Project

### GOO HAN CONG 0133677 (UEIS)

#### System Introduction

WoodChain, a blockchain supply chain system, aims to enhance and improve supply chain management in customization furniture industry. Besides that, the information of order and order status will be recorded to blockchain to ensure the transparency of transactioon on this system.
The functions provided and accessibility roles including as following:

- Accessibility Roles: User and Supplier

- USER:
- Sign Up (F001)
- Log In (F002)
- Select Supplier (F003)
- Place Order (F005)
- Check Order Status (F006)
- Check Invoice (F007)
- Check Order Details (F011)
- Upload Profile Photo (F013)
- Search Supplier (F014)
- Search Order (F015)
- Sign Out (F017)

- SUPPLIER:
- Sign Up (F001)
- Log In (F002)
- Check Order Status (F006)
- Check Invoice (F007)
- Confirm Order (F008)
- Edit Product (F009)
- Add Product (F010)
- Check Order Details (F011)
- Add Company Description (F012)
- Upload Profile Photo (F013)
- Search Order (F015)
- Search Product (F016)
- Sign Out (F017)

#### Installation Requirements

- NodeJS
  - follow the install instructions at https://nodejs.org/en/
  - recommend using the latest LTS version
- Sqlite3
  - follow the instructions at https://www.tutorialspoint.com/sqlite/sqlite_installation.htm
  - Note that the latest versions of the Mac OS and Linux come with SQLite pre-installed

#### Using this Template

To get started, you should run the syntax as following:

- Run `npm install` from the project directory to install all the node packages.
- Run 'npm run start-ganache' to execute the blockchain.
- Run 'npm index.js' to start serving the web app (Access via http://localhost:3000).

Test the app by browsing to the following routes:

- http://localhost:3000
- http://localhost:3000/login

To duplicate the project, please ensure the ganache-db, WoodChain.db and node_modules are not exist in the directory structure.
To reset the system (Reset everything to default):
Delete the directories 'ganache-db' and 'WoodChain.db' (delete database and blockchain)

#### Langauges, Framework, Tools

- System Architecture: MVC
- Langauges: HTML, CSS, JavaScript, Solidity,
- Frameworks: BootStrap (CSS, JavaScript), Truffle (Smart Contract)
- Tools: EJS, NodeJS, Express, Web3

#### Database Manipulation

For displaying the databasse in terminal

- Run 'sqlite WoodChain.db' to access the WoodChain database
- Run '.header on' to open the header of table when retrieve data
- Run '.mode column' to ensure the data can be displayed in tabular form
- Run 'SELECT \* FROM TABLE NAME' to retrieve and display the table in terminal

#### Default account credential

- Default Supplier
  Email: supplier@example.com
  Password:supplierpassword

- Default User
  Email: user@example.com
  Password: adminpassword
