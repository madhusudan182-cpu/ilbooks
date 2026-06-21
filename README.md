# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## How to Run Locally

To run this web application on your computer, you'll need to have a couple of pieces of software installed first. Then, you can follow the steps to start the app.

### Prerequisites (Software you need)

1.  **Node.js:** This is the most important requirement. It includes `npm` (Node Package Manager), which you'll use to install the project's dependencies.
    *   You can download it from the official Node.js website: [https://nodejs.org/](https://nodejs.org/)
    *   We recommend installing the **LTS** (Long-Term Support) version.

2.  **A Code Editor (Recommended):** While not strictly required to *run* the app, a code editor is essential for viewing or changing the code.
    *   **Visual Studio Code (VS Code)** is a popular free choice: [https://code.visualstudio.com/](https://code.visualstudio.com/)

3.  **A Terminal / Command Prompt:**
    *   On Windows, you can use Command Prompt or PowerShell.
    *   On macOS or Linux, you can use the built-in Terminal.

### Running the Application

1.  **Unzip the File:** First, find the `.zip` file you downloaded and extract it to a location on your computer (like your Desktop or a "Projects" folder).

2.  **Open a Terminal:** Open your terminal or command prompt.

3.  **Navigate to the Project Directory:** Use the `cd` (change directory) command to move into the folder you just unzipped. For example:
    ```bash
    cd path/to/your/unzipped-folder
    ```

4.  **Install Dependencies:** Once you are inside the project folder, run the following command. This will read the `package.json` file and download all the necessary libraries the project needs to run.
    ```bash
    npm install
    ```

5.  **Start the Development Server:** After the installation is complete, run this command to start the application:
    ```bash
    npm run dev
    ```

6.  **View in Browser:** You will see some output in your terminal. Look for a line that says something like `✓ Ready in ...ms` and provides a local URL. Open your web browser (like Chrome, Firefox, or Edge) and go to:
    **[http://localhost:9002](http://localhost:9002)**

That's it! Your application should now be running locally on your computer.
