# Contribution Guide for VMS

This guide contains all you need to setup and send a change to the project.

## Assumptions

We assume you have a basic knowledge of web development and `git`. But if you need help setting up, please contact one of the contributors so we can help getting things running.

## Prerequisites and tools

Here is a list of the tools used to develop the project, followed by details on each tool:

- **Required:** [`node.js`](https://nodejs.org/en/download/prebuilt-installer) (Preferably managed by [`volta`](https://docs.volta.sh/guide/getting-started))
- **Required:** [Commit signing configured](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits), without it, the pull requests **WILL NOT BE ACCEPTED!**
- **Required:** [SendGrid account](https://sendgrid.com) (Used for sending emails)
- _Recommended:_ [VS Code](https://code.visualstudio.com/Download)

### `node.js` and `volta`

Most of the tools used are based on `node.js`, so you should have it installed on your machine. It may be installed from an installer, or a version manager for node.

Our recommendation is using `volta` for managing the node versions, it is already configured for the project, so you only need to install `volta` on your machine and it will take care of downloading the correct version of node when you first try installing the dependencies.

If you already have `nvm` installed we recommend you uninstall since it may conflict with `volta`.

To install `volta` with bash, run the following command:

```shell
curl https://get.volta.sh | bash
source ~/.bashrc
```

### Commit signing

In order to improve the trust and security of the code contributed we require that all commits are signed. A tutorial from GitHub on how to configure commit signing is linked above.

### VS Code

Our editor of choice is Visual Studio Code (VS Code), it is not required for working with the code, but is recommended for sharing code and contributing with others.

### SendGrid

1. Go to [SendGrid](https://sendgrid.com/) and create an account and complete your email verification.
2. Once you have created your account, log in
3. Send Grid may show a 3-step process when you first log in which you can skip. There will be a button on the top-right corner to "Skip to dashboard". Click on it.
4. Click on "Settings" dropdown on the left sidebar and click "API Keys".
5. Generate a new API key with "Full Access" and click "Create & View".
6. Keep the API key handy, you will need it later.

## Setting up the project

1. Clone the repository

   ```shell
   git clone https://github.com/torontojs/vms.git
   cd vms
   ```
2. Install the dependencies
   ```shell
   npm install
   ```

3. Copy the `.dev.vars.example` file to `.dev.vars` for providing environment secrets during development.
   ```shell
   cp .dev.vars.example .dev.vars
   ```
4. Set up SendGrid secrets

- Copy the API Key and paste it in the `.dev.vars` file under the `SENDGRID_API_KEY` variable.
- Also, in the `.dev.vars` file, update the `SENDER_EMAIL` variable to be the email you used for your SendGrid account.

5. Run migrations to create your tables and seed the database with some initial data.

   ```shell
   npm run db:setup
   npm run db:seed
   ```

## Starting the project

To test if the project is okay and start developing, run the command:

```shell
npm run dev
```

the project will start in development mode and watch for code changes.

## Resetting the database

From time to time, you may want to reset the database. To do so, you'll need to delete the `.wrangler` folder and run the `db:setup` and `db:seed` scripts again.

## Coding standards and guidelines

The code will be formatted before every commit and checked for linting errors before pushing.

If you want to manually do any of those things, you can run the following commands:

```shell
# Run all linters
npm run lint

# Run only the typescript type checker
npm run typecheck

# Run only the js/ts linter
npm run lint:js

# Format the code
npm run format
```

### Typescript is set to strict mode

The objective is to reduce potential errors and force to write defensive code that handles edge cases and weirdness from JavaScript.

### Rely on inference when possible

The reasoning is that manually casting types often obscure bugs that will only be cached at runtime where that can usually be avoided when writing the code.

Here is an example of code showing where types can and can't be inferred:

```typescript
// The parameter cannot be inferred, but the return type can.
// So no need to type the return type
function test(param: string) {
	return `The parameter is: ${param}`;
}

// When initializing variables like arrays, we need to pass the type.
// This is because without telling typescript it will infer the wrong type.
const arrayOfNumbers: number[] = [];

// We also want to type objects as it will lead to better suggestions for the properties.
const objectWithDefinedProperties: TypeOrInterfaceWithProperties = {
	// ...
};
```

### Use meaningful names

Code is meant to be read as much as it is to be written and we are writing code for others. These "others" include yourself in the future.

So to make everyone life easier, when naming things, use names that are descriptive and meaningful for the thing you are describing. Here are some questions to ask:

- Does the name make sense in this context?
- Is it too short?
- Is it too long?
- Is this abbreviation something common or is it a niche use?
- How generic is this name?
- Can this name be read as part of a sentence?

Some _suggestions_ to improve readability are:

- Functions and methods benefit from being named like verbs because they usually _act_ upon the parameters and execute an _action_. E.g. `initializeDatabase()`, `BlogPost.loadRelatedPosts()`, or `downloadFile()`.
- Variables, constants, and parameters usually represent _things_ so it makes sense to name them like so. E.g.: `userProfile`, `blogPosts`, or `databaseConfiguration`.
- Booleans are more readable if we add a prefix like `is`, `should`, or `has` before the name. E.g.: `human` vs `isHuman`; `driversLicense` vs `hasDriversLicence`.
- Numbers representing a _unit of measurement_ should include the unit in the variable name to remove ambiguity of the unit in question. E.g.: `timeout` vs `timeoutInSeconds`.
- Flags should be timestamps, more often than not when we search for some information we not only want to know if the data meets a condition but also _when_ that condition was met. E.g.: `verifiedEmail` benefits from having a timestamp for filtering everyone who verified their emails before a certain date.
- List of things should be pluralized to convey it is a _list_ and not a single thing.

### Avoid spaghetti code

When code is too indirect, that means, you have to jump around multiple functions to find the actual code that does something it adds a lot of mental overload for the person reading the code, avoid that.

Most of the time if the code is used only in one place you can simplify this code and remove the extra function.

### Avoid premature DRY-ness

As much as we like to keep our code tidy and DRY, sometimes mushing things together only gets in the way. So think if it makes sense to actually keep things separate or wait a little bit before combining things.

### Code structure

Formatting is configured to not get in the way and yet lead to legible code. It takes care of things like spaces between items on an array or making consistent formatting of multiline lists. but you still retain control over the code structure.

You have autonomy to write the code as you like, but think about making it readable by others.
Here are some _suggestions_ to help in formatting the code:

- Use blank lines to split "chunks" of code that make sense together, this will make easier to read where a block of code starts and where it ends.
- If a line is getting too long, think about breaking it into intermediate steps.
- If you have a lot of parameters in a function, move them to a "configuration" object.
- If you are doing multiple operations over a single piece of data, think if it makes sense to restructure the data or to break the operations in smaller steps.

### Avoid clever tricks

Like English where using _hermetic_ words (pun intended) makes us sound fancier, if our code has clever tricks without any reason or explanation, it makes hard for everyone to understand.

### Comments and self-documenting code

Comments exist and are useful to help understand the code, it is not a hard rule to either _"comment everything"_ or _"not comment anything"_. So add them when it helps to understand the code.

As general _suggestions_:

- The code should be readable by itself, that means a person reading it should be able to follow the code without much problem.
- When you are writing a piece of code that is complex, does something obscure, or does a very specific thing, write a comment.
- When adding context to a function or variable will help, add a comment.

Typescript and VS Code provide good tooling for JSDoc comments, here is an example of how to document things:

```typescript
/**
 * Fetched the user avatar from [Gravatar](https://gravatar.com/).
 *
 * The user id is used to get the email first, as gravatar images are fetched using the email.
 *
 * @param userId The user UUID in the database.
 */
function fetchUserAvatar(userId: string) {
	// ...
}

/**
 * The default timeout used by all fetch requests.
 */
const DEFAULT_TIMEOUT_IN_SECONDS = 5;
```

## Branches and forks

When you are working in a feature it is better to work on a separate branch, that makes the code contained and easier to test by others. If you have access to directly create branches from the repository, do it, if you don't create a fork and then create a new branch.

We don't enforce a naming convention for branches, but we encourage it to be meaningful names that quickly describe what you are working on. It is okay to use prefixes like `fix/`, `feat/`, or `chore/` to represent a bug fix, a feature, or some housekeeping task, respectively.

## Committing

We don't enforce a committing standard, but below are some guidelines for commit messages:

- We don't enforce it but highly suggest using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary)
- Be descriptive, a commit message tells what happened to that code.
- Commit messages should aim to "fit in a Tweet". That adds conciseness.
- The first line of the commit is the summary, use it!
- If more context is needed for the changes, write a summary, leave a blank line, then add a longer message as needed.
- Commit often so you don't have a lot to commit about.
- The changed files are part of the commit, so no need to be redundant in the message.

## Creating a Pull Request

When you are ready to submit your changes please create a pull request targeting the main repository. The maintainers will be notified and review your Pull Request, please visit it frequently for comments and request for changes.

Here is a good tutorial to check if you need help with contribution tasks: https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github
