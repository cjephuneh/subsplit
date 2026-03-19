# Deploying Subsplit AI to Azure App Service (Linux)

Deploying a Next.js application with a local SQLite database to Azure App Service is very straightforward when using a **Linux App Service Plan**. 

By default, Azure App Service mounts a persistent `/home` directory for your application files `/home/site/wwwroot`. This means your SQLite database will persist across app restarts as long as it's stored in your project directory.

Here is the step-by-step guide to deploying Subsplit.

## Step 1: Create the Azure Web App
1. Go to the Azure Portal and click **Create a resource** -> **Web App**.
2. **Basics Tab:**
   - **Publish:** Code
   - **Runtime stack:** Node 20 LTS
   - **Operating System:** Linux
   - **Region:** (Choose closest to your users)
   - **Pricing Plan:** Basic B1 or higher is recommended to ensure you have enough memory to build the Next.js app.

## Step 2: Configure Environment Variables in Azure
Before pushing your code, you need to set up your environment variables exactly as they are in your `.env` file.
1. In your Web App, go to **Settings** -> **Environment variables**.
2. Add all the keys from your local `.env`, for example:
   - `DATABASE_URL` = `file:./prod.db`
   - `NEXT_PUBLIC_BASE_URL` = `https://your-app-name.azurewebsites.net`
   - `AZURE_OPENAI_API_KEY`, etc.
   - `MPESA_CONSUMER_KEY`, etc.

## Step 3: Setup Deployment Center (GitHub Actions)
The easiest way to deploy is to link your GitHub repository. Azure will automatically create a GitHub Action workflow to build and deploy your app.

1. Go to **Deployment Center** in the Azure Portal for your Web App.
2. Under **Source**, select **GitHub**.
3. Authorize Azure and select your Subsplit repository and branch.
4. Click **Save**. This will automatically generate a `.github/workflows` YAML file in your repository and trigger the first build.

## Step 4: Add Prisma Setup to package.json
By default, Azure Oryx (the build system) will run `npm install` and `npm run build`. However, because Next.js needs the Prisma Client generated, and you need to push the DB schema, we should update your `package.json` to handle this automatically during deployment.

Inside your `package.json`, update your build script to:
```json
"scripts": {
  "build": "prisma generate && prisma db push && next build",
  "start": "next start"
}
```
*Note: Make sure your `DATABASE_URL` is configured in Azure before the build runs, otherwise `prisma db push` might fail.*

## Step 5: Start the App
Azure runs the `npm start` command automatically for Node.js apps. Once the GitHub Action completes successfully, your site will be live at `https://your-app-name.azurewebsites.net`!

### Important Notes about SQLite on Azure App Service
- **Scale Out:** Do not "Scale Out" your App Service to multiple instances. SQLite expects a single machine to read/write the file. If you need multiple scale-out instances later, you will need to migrate your database to Azure Database for PostgreSQL and update Prisma to use the `postgresql` provider instead.
- **Production Performance:** `better-sqlite3` runs very fast on single-node instances, making it perfectly stable for Azure App Service as long as you stay on a single instance.
- **Backups:** Azure App Service provides automatic backups, which will capture your `prod.db` file along with the rest of your app!
