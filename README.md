
# Online Voting Platform

This project is an Online Voting Platform that allows administrators to manage elections and voters. It includes features for creating elections, adding questions with options, managing voters, and resetting passwords. The project is built using Node.js and Express.js and uses PostgreSQL as the database.

## Deployment

The project is deployed and accessible at: [https://online-election-manager.onrender.com](https://online-election-manager.onrender.com)

## Installation

1. Clone the repository to your local machine.

```bash
git clone https://github.com/Indrani200/Online_Election
```

2. Install the required dependencies.

```bash
npm install
```

3. Set up the database configuration.

Update the `config.json` file with your PostgreSQL database credentials for the desired environment (development, test, or production).

4. Run the database migrations.

```bash
npx sequelize-cli db:migrate
```

5. Start the application.

```bash
npm start
```

The application will be accessible at `http://localhost:3000` by default.

## Usage

Once the application is up and running, you can access the following endpoints:

- `/`: Landing page for the Online Voting Platform. If logged in, it redirects to the elections page; otherwise, it displays the login/signup page.
- `/signup`: Sign up page for creating an administrator account.
- `/login`: Login page for administrators.
- `/elections`: Home page for managing elections. Requires administrator authentication.
- `/elections/:id`: Manage specific election with ID `:id`. Requires administrator authentication.
- `/elections/:id/questions`: View and manage questions for the election with ID `:id`. Requires administrator authentication.
- `/elections/:id/questions/create`: Create a new question for the election with ID `:id`. Requires administrator authentication.
- `/elections/:electionID/questions/:questionID/edit`: Edit the question with ID `:questionID` for the election with ID `:electionID`. Requires administrator authentication.
- `/elections/:id/voters`: View and manage voters for the election with ID `:id`. Requires administrator authentication.
- `/elections/:electionID/voters/create`: Add a new voter to the election with ID `:electionID`. Requires administrator authentication.
- `/elections/:electionID/voters/:VoterId/edit`: Reset the password for the voter with ID `:VoterId` in the election with ID `:electionID`. Requires administrator authentication.

## Contributing

Contributions to this project are welcome. To contribute, follow these steps:

1. Fork the repository.
2. Create a new branch for your feature/bug fix.
3. Make your changes and commit them.
4. Push the changes to your forked repository.
5. Create a pull request to the original repository.

## Contact

For any inquiries or issues, please contact indupasumarthy02@gmail.com.

## Acknowledgments

This project uses various open-source libraries and modules. Special thanks to their creators and maintainers for their contributions.
